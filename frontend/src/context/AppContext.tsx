import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, fetchAll, fetchAllAuditLogs } from '../services/api';
import { getNaturalErrorMessage } from '../services/errors';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  joinConversationRoom,
  leaveConversationRoom,
  emitMarkRead,
  emitDeleteMessage,
} from '../services/socket';
import type {
  User,
  Brand,
  Project,
  Task,
  Invoice,
  Payment,
  Expense,
  Meeting,
  Lead,
  AppNotification,
  Conversation,
  ChatMessage,
  AppSettings,
  Holiday,
  AuditLogItem
} from '../types';
import { DEFAULT_SETTINGS } from '../data/defaults';
import { formatCurrency as formatCurrencyUtil, getCurrencyConfig } from '../utils/currency';
// No demo data is imported. Every record must come from the database.
import { ROUTES, PATH_TO_TAB, DEFAULT_ROUTE } from '../routes';
import { getDefaultPermissionsForRole } from '../components/team/permissionsConfig';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  switchUser: (userId: string) => void;
  allUsers: User[];

  activeTab: string;
  setActiveTab: (tab: string) => void;

  brands: Brand[];
  selectedBrandId: string | null;
  setSelectedBrandId: (id: string | null) => void;
  addBrand: (brandData: Omit<Brand, 'id' | 'onboardingDate' | 'status' | 'assignedMemberIds' | 'lastActivityDate' | 'lastPaymentDate' | 'documents'>) => Promise<Brand>;
  updateBrand: (id: string, updates: Partial<Brand>) => Promise<void>;
  assignMembersToBrand: (brandId: string, memberIds: string[]) => Promise<void>;

  projects: Project[];
  tasks: Task[];
  addTask: (taskData: Omit<Task, 'id'>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  addProject: (projData: Omit<Project, 'id' | 'progress'>) => Promise<void>;

  invoices: Invoice[];
  payments: Payment[];
  selectedInvoiceId: string | null;
  setSelectedInvoiceId: (id: string | null) => void;
  createInvoice: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'paidAmount' | 'status'>) => Promise<Invoice>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  deleteInvoices: (ids: string[]) => Promise<void>;
  recordPayment: (paymentData: Omit<Payment, 'id' | 'status'>) => Promise<void>;
  updatePaymentStatus: (id: string, status: 'Success' | 'Pending') => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  deletePayments: (ids: string[]) => Promise<void>;
  simulateRazorpayPayment: (invoiceId: string) => Promise<boolean>;

  expenses: Expense[];
  addExpense: (expenseData: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  deleteExpenses: (ids: string[]) => Promise<void>;

  meetings: Meeting[];
  addMeeting: (meetingData: Omit<Meeting, 'id'>) => Promise<void>;
  updateMeeting: (id: string, data: Partial<Meeting>) => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;

  leads: Lead[];
  addLead: (leadData: Omit<Lead, 'id'>) => Promise<void>;
  updateLeadStage: (id: string, stage: Lead['stage']) => Promise<void>;
  convertLeadToBrand: (leadId: string) => Promise<void>;

  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  conversations: Conversation[];
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  messages: Record<string, ChatMessage[]>;
  sendMessage: (conversationId: string, text: string, attachments?: any[]) => Promise<void>;
  loadMessages: (convId: string) => Promise<void>;
  startDirectChat: (targetUserId: string) => Promise<string>;
  markConversationRead: (convId: string) => Promise<void>;
  deleteMessage: (conversationId: string, messageId: string, deleteType: 'forEveryone' | 'forMe') => Promise<void>;
  deleteConversation: (convId: string) => Promise<void>;
  clearConversation: (convId: string) => Promise<void>;
  onlineUserIds: Set<string>;
  isUserOnline: (userId: string) => boolean;

  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  currency: string;
  currencySymbol: string;
  formatCurrency: (amount: number | string | undefined | null, options?: { hideDecimals?: boolean; space?: boolean }) => string;
  holidays: Holiday[];
  addHoliday: (data: Omit<Holiday, 'id'>) => Promise<void>;
  deleteHoliday: (id: string) => Promise<void>;
  auditLogs: AuditLogItem[];

  retentionAlerts: { brand: Brand; daysInactive: number; isUrgent: boolean }[];
  snoozeBrandRetention: (brandId: string) => Promise<void>;
  markBrandChurned: (brandId: string) => Promise<void>;
  logBrandActivity: (brandId: string, actionName: string) => Promise<void>;

  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;

  isLoading: boolean;
  apiError: string | null;
  addTeamMember: (data: any) => Promise<any>;
  updateTeamMember: (id: string, data: any) => Promise<any>;
  deactivateTeamMember: (id: string) => Promise<void>;
  reloadAll: () => Promise<void>;
  loadDomain: (domain: string) => Promise<void>;
  logout: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  theme: 'light' | 'dark';
  toggleTheme: (eventOrTarget?: React.MouseEvent | MouseEvent | { clientX: number; clientY: number } | HTMLElement) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  resetWorkspaceData: (mode?: 'empty') => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Whether a user sees the whole workspace.
 *
 * Admins see everything. The reserved `usr_admin` id is retained only for
 * legacy rows created before user seeding was removed — no account is created
 * with that id any more.
 */
const WORKSPACE_OWNER_ID = 'usr_admin';
const isWorkspaceOwner = (user: User | null | undefined): boolean =>
  !!user && (user.role === 'admin' || (user as any).id === WORKSPACE_OWNER_ID);

export const normalizeBrandsList = (payload: any): Brand[] | null => {
  if (!payload) return null;
  const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : null);
  if (!list) return null;
  return list.filter(Boolean).map((b: any) => ({
    ...b,
    assignedMemberIds: Array.isArray(b?.assignedMemberIds) ? b.assignedMemberIds : [],
    monthlyFee: typeof b?.monthlyFee === 'number' ? b.monthlyFee : (parseFloat(b?.monthlyFee || 0) || 0),
    documents: Array.isArray(b?.documents) ? b.documents : [],
    name: b?.name || 'Unnamed Client',
    ownerName: b?.ownerName || '',
    serviceDetails: b?.serviceDetails || '',
    paymentStatus: b?.paymentStatus || 'Paid',
    status: b?.status || 'Active',
    lastActivityDate: b?.lastActivityDate || '',
  }));
};

export const AppProvider: React.FC<{
  children: React.ReactNode;
  initialUserId?: string;
  initialUser?: User;
  onLogout?: () => void;
}> = ({
  children,
  initialUserId,
  initialUser,
  onLogout
}) => {
  const logout = useCallback(() => {
    try {
      localStorage.removeItem('retentio_token');
      localStorage.removeItem('retentio_user');
      localStorage.removeItem('retentio_active_user_id');
      localStorage.removeItem('retentio_bypass_mode');
    } catch {}
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  }, [onLogout]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('retentio_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('retentio_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const toggleMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(prev => !prev);
  }, []);

  const isThemeTransitioningRef = useRef(false);

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('retentio_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {}
    return 'light';
  });

  // Listen for OS system theme changes when no manual preference is saved
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        const saved = localStorage.getItem('retentio_theme');
        if (!saved) {
          const sysTheme = e.matches ? 'dark' : 'light';
          setThemeState(sysTheme);
          if (sysTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      };
      mq.addEventListener('change', handleSystemThemeChange);
      return () => mq.removeEventListener('change', handleSystemThemeChange);
    } catch {}
  }, []);

  // Synchronize documentElement class whenever theme changes
  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  }, [theme]);

  const toggleTheme = useCallback((targetOrEvent?: React.MouseEvent | MouseEvent | { clientX: number; clientY: number } | HTMLElement) => {
    if (isThemeTransitioningRef.current) return;
    const nextTheme: 'light' | 'dark' = theme === 'light' ? 'dark' : 'light';

    // Calculate origin (x, y) coordinates from click event or theme toggle button
    let x = window.innerWidth - 80;
    let y = 30;

    if (targetOrEvent) {
      if ('clientX' in targetOrEvent && typeof targetOrEvent.clientX === 'number') {
        x = targetOrEvent.clientX;
        y = targetOrEvent.clientY;
      } else if ('getBoundingClientRect' in targetOrEvent) {
        const rect = (targetOrEvent as HTMLElement).getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    } else {
      const toggleEl = document.querySelector('[data-theme-toggle]');
      if (toggleEl) {
        const rect = toggleEl.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }

    // Radius to cover the entire viewport from (x, y)
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // @ts-ignore
    const supportsViewTransition = typeof document.startViewTransition === 'function' && !prefersReducedMotion;

    if (!supportsViewTransition) {
      if (prefersReducedMotion) {
        setThemeState(nextTheme);
        try {
          localStorage.setItem('retentio_theme', nextTheme);
        } catch {}
        return;
      }

      // Smooth circular reveal fallback for browsers without View Transition API
      isThemeTransitioningRef.current = true;
      const overlay = document.createElement('div');
      overlay.className = 'theme-circular-reveal-fallback';
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.zIndex = '999999';
      overlay.style.pointerEvents = 'none';
      overlay.style.background = nextTheme === 'dark' ? 'var(--solid-btn-bg)' : 'var(--bg-card)';
      overlay.style.clipPath = `circle(0px at ${x}px ${y}px)`;
      overlay.style.transition = 'clip-path 950ms cubic-bezier(0.4, 0, 0.2, 1)';
      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        overlay.style.clipPath = `circle(${endRadius}px at ${x}px ${y}px)`;
      });

      setTimeout(() => {
        setThemeState(nextTheme);
        try {
          localStorage.setItem('retentio_theme', nextTheme);
        } catch {}
      }, 350);

      setTimeout(() => {
        overlay.style.transition = 'opacity 200ms ease';
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.remove();
          isThemeTransitioningRef.current = false;
        }, 220);
      }, 950);
      return;
    }

    // Modern View Transition API with CSS clip-path: circle()
    isThemeTransitioningRef.current = true;
    document.documentElement.style.setProperty('--reveal-x', `${x}px`);
    document.documentElement.style.setProperty('--reveal-y', `${y}px`);
    document.documentElement.style.setProperty('--reveal-radius', `${endRadius}px`);

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setThemeState(nextTheme);
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        try {
          localStorage.setItem('retentio_theme', nextTheme);
        } catch {}
      });
    });

    transition.ready.then(() => {
      const anim = document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 950,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );

      anim.onfinish = () => {
        isThemeTransitioningRef.current = false;
      };
    }).catch(() => {
      isThemeTransitioningRef.current = false;
    });
  }, [theme]);

  const setTheme = useCallback((t: 'light' | 'dark') => {
    setThemeState(t);
    try {
      localStorage.setItem('retentio_theme', t);
    } catch {}
  }, []);

  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (initialUser) return initialUser;
    // AppProvider is only mounted behind the auth gate with a resolved user.
    // Reaching this point means the session was torn down mid-render; fail
    // loudly rather than falling back to a hardcoded privileged account.
    throw new Error('AppProvider mounted without an authenticated user.');
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('retentio_local_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    // Only the signed-in user is known at mount. The real roster arrives from
    // GET /users. Previously this concatenated DEMO_USERS, which injected four
    // accounts that exist nowhere in the database — and re-appeared on every
    // reload, undoing any deactivation.
    if (initialUser) return [initialUser];
    return [];
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Initial tab from URL path
  const getInitialTab = (): string => {
    const path = window.location.pathname;
    const tab = PATH_TO_TAB[path];
    if (tab) return tab;
    if (initialUser && initialUser.role !== 'admin' && initialUser.permissions && initialUser.permissions.length > 0) {
      if (!initialUser.permissions.includes('dashboard')) {
        return initialUser.permissions[0];
      }
    }
    return 'dashboard';
  };
  const [activeTab, setActiveTabRaw] = useState<string>(getInitialTab);
  const setActiveTab = useCallback((tab: string) => {
    setActiveTabRaw(tab);
    setMobileSidebarOpen(false);
    const targetPath = ROUTES[tab as keyof typeof ROUTES] || DEFAULT_ROUTE;
    navigate(targetPath);
  }, [navigate]);

  // Sync activeTab when URL changes (browser back/forward, direct URL visit)
  useEffect(() => {
    const pathTab = PATH_TO_TAB[location.pathname];
    if (pathTab && pathTab !== activeTab) {
      setActiveTabRaw(pathTab);
    }
    // Unknown paths are intentionally NOT redirected here — the router's
    // catch-all renders the 404 page. Redirecting from this effect made
    // <NotFound /> unreachable and masked broken links.
  }, [location.pathname, activeTab]);

  // One-time auto-purge to wipe out stale mock/cached data across all browser sessions
  if (typeof localStorage !== 'undefined' && localStorage.getItem('retentio_data_state_cleared_v1') !== 'true') {
    try {
      localStorage.setItem('retentio_data_state_cleared_v1', 'true');
      localStorage.setItem('retentio_clean_testing', 'true');
      const emptyArr = JSON.stringify([]);
      localStorage.setItem('retentio_local_brands', emptyArr);
      localStorage.setItem('retentio_local_projects', emptyArr);
      localStorage.setItem('retentio_local_tasks', emptyArr);
      localStorage.setItem('retentio_local_invoices', emptyArr);
      localStorage.setItem('retentio_local_payments', emptyArr);
      localStorage.setItem('retentio_local_expenses', emptyArr);
      localStorage.setItem('retentio_local_meetings', emptyArr);
      localStorage.setItem('retentio_local_leads', emptyArr);
      localStorage.removeItem('retentio_onboarding_completed');
      localStorage.removeItem('retentio_onboarding_data');
      // Clear stale mock roster entries left by earlier builds. Never write
      // DEMO_USERS here — that re-injected phantom members on every load.
      localStorage.removeItem('retentio_local_users');
    } catch {}
  }

  const activeUserId = initialUser?.id || initialUserId || '';

  // User boundary preservation: when activeUserId is set, preserve and migrate any un-scoped local data
  if (typeof localStorage !== 'undefined' && activeUserId) {
    const entities = ['brands', 'projects', 'tasks', 'invoices', 'payments', 'expenses', 'meetings', 'leads'];
    entities.forEach((ent) => {
      const scopedKey = `retentio_local_${ent}_${activeUserId}`;
      const unscopedKey = `retentio_local_${ent}`;
      const scopedData = localStorage.getItem(scopedKey);
      const unscopedData = localStorage.getItem(unscopedKey);
      if ((!scopedData || scopedData === '[]' || scopedData === 'null') && unscopedData && unscopedData !== '[]' && unscopedData !== 'null') {
        try {
          localStorage.setItem(scopedKey, unscopedData);
        } catch {}
      }
    });
    localStorage.setItem('retentio_active_user_id', activeUserId);
  }

  const isCleanTesting = typeof localStorage !== 'undefined' && localStorage.getItem('retentio_clean_testing') === 'true';

  const safeParseArray = <T,>(raw: string | null): T[] | null => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is T => item != null && typeof item === 'object');
      }
    } catch {}
    return null;
  };

  /**
   * Safely unpacks both raw array payloads and paginated { data: T[] } objects,
   * stripping out any nullish or malformed entries.
   */
  const extractDataArray = <T,>(res: any): T[] | null => {
    if (!res) return null;
    if (Array.isArray(res)) return res.filter((item): item is T => item != null && typeof item === 'object');
    if (typeof res === 'object' && Array.isArray(res.data)) {
      return res.data.filter((item: any): item is T => item != null && typeof item === 'object');
    }
    return null;
  };

  const userKey = useCallback((base: string) => activeUserId ? `${base}_${activeUserId}` : base, [activeUserId]);

  const [brands, setBrands] = useState<Brand[]>(() => {
    try {
      if (activeUserId) {
        const userSaved = localStorage.getItem(`retentio_local_brands_${activeUserId}`);
        if (userSaved) {
          const normalized = normalizeBrandsList(JSON.parse(userSaved));
          if (normalized && normalized.length > 0) return normalized;
        }
      }
      const saved = localStorage.getItem('retentio_local_brands');
      if (saved) {
        const normalized = normalizeBrandsList(JSON.parse(saved));
        if (normalized && normalized.length > 0) {
          if (activeUserId) {
            try { localStorage.setItem(`retentio_local_brands_${activeUserId}`, JSON.stringify(normalized)); } catch {}
          }
          return normalized;
        }
      }
    } catch {}
    return [];
  });
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      if (activeUserId) {
        const userSaved = safeParseArray<Project>(localStorage.getItem(`retentio_local_projects_${activeUserId}`));
        if (userSaved && userSaved.length > 0) return userSaved;
      }
      const saved = safeParseArray<Project>(localStorage.getItem('retentio_local_projects'));
      if (saved && saved.length > 0) {
        if (activeUserId) {
          try { localStorage.setItem(`retentio_local_projects_${activeUserId}`, JSON.stringify(saved)); } catch {}
        }
        return saved;
      }
    } catch {}
    return [];
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      if (activeUserId) {
        const userSaved = safeParseArray<Task>(localStorage.getItem(`retentio_local_tasks_${activeUserId}`));
        if (userSaved && userSaved.length > 0) return userSaved;
      }
      const saved = safeParseArray<Task>(localStorage.getItem('retentio_local_tasks'));
      if (saved && saved.length > 0) {
        if (activeUserId) {
          try { localStorage.setItem(`retentio_local_tasks_${activeUserId}`, JSON.stringify(saved)); } catch {}
        }
        return saved;
      }
    } catch {}
    return [];
  });
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      if (activeUserId) {
        const userSaved = safeParseArray<Invoice>(localStorage.getItem(`retentio_local_invoices_${activeUserId}`));
        if (userSaved && userSaved.length > 0) return userSaved;
      }
      const saved = safeParseArray<Invoice>(localStorage.getItem('retentio_local_invoices'));
      if (saved && saved.length > 0) {
        if (activeUserId) {
          try { localStorage.setItem(`retentio_local_invoices_${activeUserId}`, JSON.stringify(saved)); } catch {}
        }
        return saved;
      }
    } catch {}
    return [];
  });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>(() => {
    try {
      if (activeUserId) {
        const userSaved = safeParseArray<Payment>(localStorage.getItem(`retentio_local_payments_${activeUserId}`));
        if (userSaved && userSaved.length > 0) return userSaved;
      }
      const saved = safeParseArray<Payment>(localStorage.getItem('retentio_local_payments'));
      if (saved && saved.length > 0) {
        if (activeUserId) {
          try { localStorage.setItem(`retentio_local_payments_${activeUserId}`, JSON.stringify(saved)); } catch {}
        }
        return saved;
      }
    } catch {}
    return [];
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      if (activeUserId) {
        const userSaved = safeParseArray<Expense>(localStorage.getItem(`retentio_local_expenses_${activeUserId}`));
        if (userSaved && userSaved.length > 0) return userSaved;
      }
      const saved = safeParseArray<Expense>(localStorage.getItem('retentio_local_expenses'));
      if (saved && saved.length > 0) {
        if (activeUserId) {
          try { localStorage.setItem(`retentio_local_expenses_${activeUserId}`, JSON.stringify(saved)); } catch {}
        }
        return saved;
      }
    } catch {}
    return [];
  });
  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    try {
      if (activeUserId) {
        const userSaved = safeParseArray<Meeting>(localStorage.getItem(`retentio_local_meetings_${activeUserId}`));
        if (userSaved && userSaved.length > 0) return userSaved;
      }
      const saved = safeParseArray<Meeting>(localStorage.getItem('retentio_local_meetings'));
      if (saved && saved.length > 0) {
        if (activeUserId) {
          try { localStorage.setItem(`retentio_local_meetings_${activeUserId}`, JSON.stringify(saved)); } catch {}
        }
        return saved;
      }
    } catch {}
    return [];
  });
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      if (activeUserId) {
        const userSaved = safeParseArray<Lead>(localStorage.getItem(`retentio_local_leads_${activeUserId}`));
        if (userSaved && userSaved.length > 0) return userSaved;
      }
      const saved = safeParseArray<Lead>(localStorage.getItem('retentio_local_leads'));
      if (saved && saved.length > 0) {
        if (activeUserId) {
          try { localStorage.setItem(`retentio_local_leads_${activeUserId}`, JSON.stringify(saved)); } catch {}
        }
        return saved;
      }
    } catch {}
    return [];
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<AppSettings>(() => {
    const localCurr = localStorage.getItem('retentio_currency') || 'INR';
    const localSymbol = localStorage.getItem('retentio_currency_symbol') || '₹';
    return {
      ...DEFAULT_SETTINGS,
      currency: localCurr,
      currencySymbol: localSymbol,
    };
  });

  // Fetch server settings on startup to ensure latest currency & agency config
  useEffect(() => {
    api.settings.get().then((res) => {
      if (res) {
        setSettings((prev) => ({ ...prev, ...res }));
        if (res.currency) localStorage.setItem('retentio_currency', res.currency);
        if (res.currencySymbol) localStorage.setItem('retentio_currency_symbol', res.currencySymbol);
      }
    }).catch(() => {});
  }, []);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  const activeCurrency = settings.currency || localStorage.getItem('retentio_currency') || 'INR';
  const activeCurrencySymbol = settings.currencySymbol || localStorage.getItem('retentio_currency_symbol') || '₹';

  const formatCurrency = useCallback((amount: number | string | undefined | null, options?: { hideDecimals?: boolean; space?: boolean }) => {
    return formatCurrencyUtil(amount, activeCurrencySymbol, options);
  }, [activeCurrencySymbol]);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const today = new Date().toISOString().split('T')[0];

  /* ------------------------------------------------------------------
     Domain-scoped loading.

     Previously a single `reloadAll()` fired 14 requests on every page
     load, regardless of which page the user opened. Each domain now
     loads only when the route that needs it is first visited, and the
     result is cached (`loadedRef`) so revisiting a page is instant.
     `reloadAll()` is kept for an explicit manual refresh.
     ------------------------------------------------------------------ */

  const loadedRef = useRef<Set<string>>(new Set());
  const failedRef = useRef<Set<string>>(new Set());
  const inflightRef = useRef<Map<string, Promise<void>>>(new Map());

  /** Which domain is currently loading, so `req` can tag failures to it. */
  const domainLabelRef = useRef<string>('');
  /** Per-endpoint failures for the in-flight load, grouped by message. */
  const loadFailuresRef = useRef<Map<string, string[]>>(new Map());

  /**
   * Awaits one collection request and records a failure instead of hiding it.
   *
   * The loaders deliberately keep going when a single endpoint fails, so one
   * bad request cannot blank a whole page. But that only helps if the failure
   * is reported: previously every call was `.catch(() => null)`, which turned a
   * server error into an empty list with no indication anything went wrong —
   * the page simply looked empty. This returns `null` on failure *and* notes
   * the module so the load can surface a real message.
   */
  const req = useCallback(async <T,>(label: string, p: Promise<T>): Promise<T | null> => {
    try {
      return await p;
    } catch (err) {
      const domain = domainLabelRef.current;
      if (domain) failedRef.current.add(domain);
      const msg = getNaturalErrorMessage(err);
      const prev = loadFailuresRef.current;
      const next = new Map(prev);
      const existing = next.get(msg);
      next.set(msg, existing ? Array.from(new Set([...existing, label])) : [label]);
      loadFailuresRef.current = next;
      return null;
    }
  }, []);

  /** Turns the recorded per-endpoint failures into one readable banner line. */
  const flushLoadFailures = useCallback(() => {
    const failures = loadFailuresRef.current;
    if (failures.size === 0) return;
    const parts: string[] = [];
    failures.forEach((modules, msg) => {
      parts.push(modules.length > 1 ? `${msg} (${modules.join(', ')})` : msg);
    });
    setApiError(`${parts.join(' · ')}. Your other data is unaffected — retry from the reload button.`);
    loadFailuresRef.current = new Map();
  }, []);

  const loadDomain = useCallback(async (domain: string) => {
    if (!currentUser) return;
    // Only skip if successfully loaded before; failed domains are retried on revisit
    if (loadedRef.current.has(domain)) return;
    const inflight = inflightRef.current.get(domain);
    if (inflight) return inflight;

    // Clear any previous failure record for this domain before retrying
    failedRef.current.delete(domain);

    const task = (async () => {
      try {
        domainLabelRef.current = domain;
        loadFailuresRef.current = new Map();
        setApiError(null);
        switch (domain) {
          case 'clients': {
            const [brandsData, usersData] = await Promise.all([
              req('clients', api.brands.listAll()),
              req('team', api.users.listAll()),
            ]);
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands) {
              setBrands(prev => {
                if (normalizedBrands.length > 0) {
                  const unsynced = prev.filter(p => String(p.id).startsWith('brand_') && !normalizedBrands.some(r => r.id === p.id));
                  const combined = [...normalizedBrands, ...unsynced];
                  try { localStorage.setItem(userKey('retentio_local_brands'), JSON.stringify(combined)); } catch {}
                  return combined;
                } else if (prev.length > 0) {
                  try { localStorage.setItem(userKey('retentio_local_brands'), JSON.stringify(prev)); } catch {}
                  return prev;
                }
                return [];
              });
            }
            const usersList = extractDataArray<User>(usersData);
            if (usersList && usersList.length > 0) {
              setAllUsers(usersList);
              try {
                localStorage.setItem('retentio_local_users', JSON.stringify(usersList));
                localStorage.setItem(userKey('retentio_local_users'), JSON.stringify(usersList));
              } catch {}
            }
            break;
          }
          case 'projects':
          case 'tasks': {
            const [projectsData, tasksData, brandsData, usersData] = await Promise.all([
              req('projects', api.projects.listAll()),
              req('tasks', api.tasks.listAll()),
              req('clients', api.brands.listAll()),
              req('team', api.users.listAll()),
            ]);
            const projectsList = extractDataArray<Project>(projectsData);
            if (projectsList) {
              setProjects(prev => {
                if (projectsList.length > 0) {
                  const unsynced = prev.filter(p => String(p.id).startsWith('proj_') && !projectsList.some(r => r.id === p.id));
                  const combined = [...projectsList, ...unsynced];
                  try { localStorage.setItem(userKey('retentio_local_projects'), JSON.stringify(combined)); } catch {}
                  return combined;
                } else if (prev.length > 0) {
                  try { localStorage.setItem(userKey('retentio_local_projects'), JSON.stringify(prev)); } catch {}
                  return prev;
                }
                return [];
              });
            }
            const tasksList = extractDataArray<Task>(tasksData);
            if (tasksList) {
              setTasks(prev => {
                if (tasksList.length > 0) {
                  const unsynced = prev.filter(p => String(p.id).startsWith('task_') && !tasksList.some(r => r.id === p.id));
                  const combined = [...tasksList, ...unsynced];
                  try { localStorage.setItem(userKey('retentio_local_tasks'), JSON.stringify(combined)); } catch {}
                  return combined;
                } else if (prev.length > 0) {
                  try { localStorage.setItem(userKey('retentio_local_tasks'), JSON.stringify(prev)); } catch {}
                  return prev;
                }
                return [];
              });
            }
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands && normalizedBrands.length > 0) setBrands(normalizedBrands);
            const usersList = extractDataArray<User>(usersData);
            if (usersList && usersList.length > 0) setAllUsers(usersList);
            break;
          }
          case 'invoices': {
            const [invoicesData, paymentsData, brandsData] = await Promise.all([
              req('invoices', api.invoices.listAll()),
              req('payments', api.payments.listAll()),
              req('clients', api.brands.listAll()),
            ]);
            const invoicesList = extractDataArray<Invoice>(invoicesData);
            if (invoicesList) {
              setInvoices(prev => {
                if (invoicesList.length > 0) {
                  const unsynced = prev.filter(p => String(p.id).startsWith('inv_') && !invoicesList.some(r => r.id === p.id));
                  const combined = [...invoicesList, ...unsynced];
                  try { localStorage.setItem(userKey('retentio_local_invoices'), JSON.stringify(combined)); } catch {}
                  return combined;
                } else if (prev.length > 0) {
                  try { localStorage.setItem(userKey('retentio_local_invoices'), JSON.stringify(prev)); } catch {}
                  return prev;
                }
                return [];
              });
            }
            const paymentsList = extractDataArray<Payment>(paymentsData);
            if (paymentsList) {
              setPayments(prev => {
                if (paymentsList.length > 0) {
                  const unsynced = prev.filter(p => String(p.id).startsWith('pay_') && !paymentsList.some(r => r.id === p.id));
                  const combined = [...paymentsList, ...unsynced];
                  try { localStorage.setItem(userKey('retentio_local_payments'), JSON.stringify(combined)); } catch {}
                  return combined;
                } else if (prev.length > 0) {
                  try { localStorage.setItem(userKey('retentio_local_payments'), JSON.stringify(prev)); } catch {}
                  return prev;
                }
                return [];
              });
            }
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands && normalizedBrands.length > 0) setBrands(normalizedBrands);
            break;
          }
          case 'finance': {
            const [paymentsData, expensesData, invoicesData, brandsData] = await Promise.all([
              req('payments', api.payments.listAll()),
              req('expenses', api.expenses.listAll()),
              req('invoices', api.invoices.listAll()),
              req('clients', api.brands.listAll()),
            ]);
            const paymentsList = extractDataArray<Payment>(paymentsData);
            if (paymentsList && paymentsList.length > 0) setPayments(paymentsList);
            const expensesList = extractDataArray<Expense>(expensesData);
            if (expensesList && expensesList.length > 0) setExpenses(expensesList);
            const invoicesList = extractDataArray<Invoice>(invoicesData);
            if (invoicesList && invoicesList.length > 0) setInvoices(invoicesList);
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands && normalizedBrands.length > 0) setBrands(normalizedBrands);
            break;
          }
          case 'expenses': {
            const [expensesData, brandsData, usersData] = await Promise.all([
              req('expenses', api.expenses.listAll()),
              req('clients', api.brands.listAll()),
              req('team', api.users.listAll()),
            ]);
            const expensesList = extractDataArray<Expense>(expensesData);
            if (expensesList) {
              setExpenses(prev => {
                if (expensesList.length > 0) {
                  const unsynced = prev.filter(p => String(p.id).startsWith('exp_') && !expensesList.some(r => r.id === p.id));
                  const combined = [...expensesList, ...unsynced];
                  try { localStorage.setItem(userKey('retentio_local_expenses'), JSON.stringify(combined)); } catch {}
                  return combined;
                } else if (prev.length > 0) {
                  try { localStorage.setItem(userKey('retentio_local_expenses'), JSON.stringify(prev)); } catch {}
                  return prev;
                }
                return [];
              });
            }
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands && normalizedBrands.length > 0) setBrands(normalizedBrands);
            const usersList = extractDataArray<User>(usersData);
            if (usersList && usersList.length > 0) setAllUsers(usersList);
            break;
          }
          case 'retention': {
            const [brandsData, settingsData] = await Promise.all([
              req('clients', api.brands.listAll()),
              req('settings', api.settings.get()),
            ]);
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands && normalizedBrands.length > 0) setBrands(normalizedBrands);
            if (settingsData) setSettings(settingsData);
            break;
          }
          case 'leads': {
            const [leadsData, brandsData] = await Promise.all([
              req('leads', api.leads.listAll()),
              req('clients', api.brands.listAll()),
            ]);
            const leadsList = extractDataArray<Lead>(leadsData);
            if (leadsList) {
              setLeads(prev => {
                if (leadsList.length > 0) {
                  const unsynced = prev.filter(p => String(p.id).startsWith('lead_') && !leadsList.some(r => r.id === p.id));
                  const combined = [...leadsList, ...unsynced];
                  try { localStorage.setItem(userKey('retentio_local_leads'), JSON.stringify(combined)); } catch {}
                  return combined;
                } else if (prev.length > 0) {
                  try { localStorage.setItem(userKey('retentio_local_leads'), JSON.stringify(prev)); } catch {}
                  return prev;
                }
                return [];
              });
            }
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands && normalizedBrands.length > 0) setBrands(normalizedBrands);
            break;
          }
          case 'meetings': {
            const [meetingsData, brandsData, usersData, holidaysData] = await Promise.all([
              req('meetings', api.meetings.listAll()),
              req('clients', api.brands.listAll()),
              req('team', api.users.listAll()),
              req('holidays', api.holidays.list()),
            ]);
            const meetingsList = extractDataArray<Meeting>(meetingsData);
            if (meetingsList) {
              setMeetings(prev => {
                if (meetingsList.length > 0) {
                  const unsynced = prev.filter(p => String(p.id).startsWith('meet_') && !meetingsList.some(r => r.id === p.id));
                  const combined = [...meetingsList, ...unsynced];
                  try { localStorage.setItem(userKey('retentio_local_meetings'), JSON.stringify(combined)); } catch {}
                  return combined;
                } else if (prev.length > 0) {
                  try { localStorage.setItem(userKey('retentio_local_meetings'), JSON.stringify(prev)); } catch {}
                  return prev;
                }
                return [];
              });
            }
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands && normalizedBrands.length > 0) setBrands(normalizedBrands);
            const usersList = extractDataArray<User>(usersData);
            if (usersList && usersList.length > 0) setAllUsers(usersList);
            const holidaysList = extractDataArray<Holiday>(holidaysData);
            if (holidaysList && holidaysList.length > 0) setHolidays(holidaysList);
            break;
          }
          case 'team': {
            const [usersData, brandsData] = await Promise.all([
              req('team', api.users.listAll()),
              req('clients', api.brands.listAll()),
            ]);
            const usersList = extractDataArray<User>(usersData);
            if (usersList && usersList.length > 0) setAllUsers(usersList);
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands) setBrands(normalizedBrands);
            break;
          }
          case 'inbox': {
            const notifData = await req('notifications', api.notifications.list());
            const notifList = extractDataArray<AppNotification>(notifData);
            if (notifList) setNotifications(notifList);
            break;
          }
          case 'chat': {
            const [convsData, usersData] = await Promise.all([
              req('chat', api.chat.conversations()),
              req('team', api.users.listAll()),
            ]);
            const usersList = extractDataArray<User>(usersData);
            if (usersList && usersList.length > 0) setAllUsers(usersList);
            const allU = usersList && usersList.length > 0 ? usersList : allUsers;

            const baseConvs = extractDataArray<any>(convsData) || [];
            const enriched = baseConvs.map((c: any) => {
              if (c.type === 'direct') {
                const otherId = c.participantIds?.find((id: any) => String(id) !== String(currentUser.id));
                const foundUser = allU.find((u: any) => String(u.id) === String(otherId) || (u.name && u.name === c.title && u.name !== 'Direct Chat'));

                if (foundUser) {
                  return {
                    ...c,
                    title: foundUser.name,
                    otherMember: {
                      id: foundUser.id,
                      name: foundUser.name,
                      avatar: foundUser.avatar,
                      role: foundUser.role,
                      designation: foundUser.designation || foundUser.role,
                      email: foundUser.email,
                    },
                  };
                }
              }
              return c;
            });

            // Ensure every active agency colleague has a visible direct chat channel without manual addition
            if (currentUser && currentUser.role !== 'brand') {
              const colleagues = (allU || []).filter((u: any) => u && currentUser && u.id !== currentUser.id && u.role !== 'brand' && u?.status !== 'inactive');
              for (const col of colleagues) {
                const exists = enriched.some((c: any) =>
                  c.type === 'direct' && (
                    (c.participantIds && c.participantIds.includes(col.id)) ||
                    (c.otherMember && c.otherMember.id === col.id) ||
                    c.title === col.name
                  )
                );
                if (!exists) {
                  const autoConvId = `conv_dm_${[currentUser.id, col.id].sort().join('_')}`;
                  enriched.push({
                    id: autoConvId,
                    type: 'direct',
                    title: col.name,
                    participantIds: [currentUser.id, col.id],
                    lastMessage: 'Direct conversation ready',
                    lastMessageTime: 'Just now',
                    unreadCount: 0,
                    otherMember: {
                      id: col.id,
                      name: col.name,
                      avatar: col.avatar,
                      role: col.role,
                      designation: col.designation || col.role,
                      email: col.email,
                    },
                  });
                }
              }
            }

            setConversations(enriched);
            if (enriched.length > 0) setActiveConversationId((prev) => prev || enriched[0].id);
            break;
          }
          case 'settings': {
            const [settingsData, holidaysData] = await Promise.all([
              req('settings', api.settings.get()),
              req('holidays', api.holidays.list()),
            ]);
            if (settingsData) setSettings(settingsData);
            const holidaysList = extractDataArray<Holiday>(holidaysData);
            if (holidaysList) setHolidays(holidaysList);
            break;
          }
          case 'audit': {
            // /audit-logs is capped at 200 rows per call, so drain the whole
            // trail instead of truncating the history view.
            const auditList = await req('audit log', fetchAllAuditLogs());
            if (auditList && auditList.length > 0) setAuditLogs(auditList);
            break;
          }
          case 'dashboard': {
            const [brandsData, invoicesData, tasksData, meetingsData, paymentsData, expensesData] = await Promise.all([
              req('clients', api.brands.listAll()),
              req('invoices', api.invoices.listAll()),
              req('tasks', api.tasks.listAll()),
              req('meetings', api.meetings.listAll()),
              req('payments', api.payments.listAll()),
              req('expenses', api.expenses.listAll()),
            ]);
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands) setBrands(normalizedBrands);
            const invoicesList = extractDataArray<Invoice>(invoicesData);
            if (invoicesList) setInvoices(invoicesList);
            const tasksList = extractDataArray<Task>(tasksData);
            if (tasksList) setTasks(tasksList);
            const meetingsList = extractDataArray<Meeting>(meetingsData);
            if (meetingsList) setMeetings(meetingsList);
            const paymentsList = extractDataArray<Payment>(paymentsData);
            if (paymentsList) setPayments(paymentsList);
            const expensesList = extractDataArray<Expense>(expensesData);
            if (expensesList) setExpenses(expensesList);
            break;
          }
          default:
            break;
        }
        // Surface any per-endpoint failures that did not throw. The page still
        // renders with whatever loaded, but the user is told what is missing.
        flushLoadFailures();
        loadedRef.current.add(domain);
      } catch (e: any) {
        failedRef.current.add(domain);
        const msg = getNaturalErrorMessage(e);
        setApiError(msg);
        if (!/unauthorized|expired|session/i.test(msg)) {
          showToast(msg, 'error');
        }
      } finally {
        inflightRef.current.delete(domain);
        domainLabelRef.current = '';
      }
    })();

    inflightRef.current.set(domain, task);
    return task;
  }, [currentUser, flushLoadFailures, req]);

  /** Explicit full refresh — used by the manual "reload" affordance. */
  const reloadAll = useCallback(async () => {
    if (!currentUser) return;
    loadedRef.current.clear();
    inflightRef.current.clear();
    try {
      setIsLoading(true);
      setApiError(null);
      const domains = [
        'dashboard', 'clients', 'projects', 'tasks', 'invoices', 'finance', 'expenses',
        'retention', 'leads', 'meetings', 'team', 'inbox', 'chat', 'settings',
      ];
      await Promise.all(domains.map((d) => loadDomain(d)));
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, loadDomain]);

  // Notifications are lightweight and drive the Topbar badge on every page,
  // so they load once up-front; everything else waits for its route.
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const notifData = await api.notifications.list();
        const notifList = extractDataArray<AppNotification>(notifData);
        if (notifList && notifList.length > 0) setNotifications(notifList);
      } catch {
        /* badge is non-critical — stay silent */
      }
    })();
  }, [currentUser]);

  // Baseline clients & team roster preload on mount.
  // Ensures refreshing directly on sub-routes (/chat, /tasks, /projects, /invoices)
  // always has client names and team member details without mismatch or empty placeholders.
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const [brandsData, usersData] = await Promise.all([
          api.brands.listAll().catch(() => null),
          api.users.listAll().catch(() => null),
        ]);
        const normalizedBrands = normalizeBrandsList(brandsData);
        if (normalizedBrands && normalizedBrands.length > 0) {
          setBrands((prev) => (prev.length === 0 ? normalizedBrands : prev));
        }
        const usersList = extractDataArray<User>(usersData);
        if (usersList && usersList.length > 0) {
          setAllUsers((prev) => (prev.length === 0 ? usersList : prev));
        }
      } catch {
        /* Non-blocking baseline preload */
      }
    })();
  }, [currentUser]);

  // Load only the data the current route needs (see loadDomain).
  // Failed domains are retried on every revisit because loadDomain
  // only short-circuits on success (loadedRef), not on failure.
  useEffect(() => {
    const pathTab = PATH_TO_TAB[location.pathname];
    if (pathTab) loadDomain(pathTab);
  }, [location.pathname, loadDomain]);

  const retentionAlerts = (brands || [])
    .filter(Boolean)
    .map(brand => {
      const last = new Date(brand?.lastActivityDate || Date.now());
      const now = new Date(today);
      const daysInactive = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      return { brand, daysInactive, isUrgent: daysInactive >= (settings?.retentionThresholdDays ?? 14) };
    })
    .filter(item => item.isUrgent && item.brand && item.brand?.status !== 'Churned');

  const switchUser = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      try {
        localStorage.setItem('retentio_user', JSON.stringify(user));
      } catch {}

      const userPerms = Array.isArray(user.permissions) && user.permissions.length > 0
        ? user.permissions
        : getDefaultPermissionsForRole(user.role);

      if (user.role !== 'admin' && !userPerms.includes(activeTab)) {
        const firstTab = userPerms[0] || 'tasks';
        setActiveTab(firstTab);
      } else if (user.role === 'brand') {
        setActiveTab('inbox');
      }

      showToast(`Switched persona to ${user.name} (${user.role.toUpperCase()})`, 'info');
    }
  };

  // ---- Brand CRUD ----
  const addBrand = async (brandData: any): Promise<Brand> => {
    const selectedStatus = brandData.status || 'Active';
    const payStatus = brandData.paymentStatus === 'Paid' ? 'Paid' : 'Pending';
    const fee = Number(brandData.monthlyFee) || 0;

    let created: Brand;
    try {
      created = await api.brands.create({ ...brandData, status: selectedStatus, paymentStatus: payStatus });
    } catch (_apiErr: any) {
      // Local fallback in bypass mode or API error
      created = {
        id: 'brand_' + Date.now(),
        name: brandData.name,
        ownerName: brandData.ownerName,
        mobile: brandData.mobile,
        email: brandData.email,
        billingAddress: brandData.billingAddress || '',
        city: brandData.city || '',
        state: brandData.state || '',
        pincode: brandData.pincode || '',
        gstNumber: brandData.gstNumber || '',
        pan: brandData.pan || '',
        serviceDetails: brandData.serviceDetails || '',
        monthlyFee: fee,
        billingCycleDay: Number(brandData.billingCycleDay) || 1,
        onboardingDate: today,
        status: selectedStatus,
        paymentStatus: payStatus,
        lastActivityDate: today,
        lastPaymentDate: payStatus === 'Paid' ? today : '',
        assignedMemberIds: brandData.assignedMemberIds || [],
        documents: []
      };
    }

    setBrands(prev => {
      const next = [created, ...prev];
      try { localStorage.setItem(userKey('retentio_local_brands'), JSON.stringify(next)); } catch {}
      return next;
    });

    // Only add an initial payment to the ledger if explicitly verified as Paid upfront!
    if (fee > 0 && payStatus === 'Paid') {
      const initialPayment: Payment = {
        id: 'pay_' + Date.now(),
        brandId: created.id,
        brandName: created.name,
        amount: fee,
        paymentDate: today,
        mode: 'Bank Transfer',
        referenceNo: 'RET-' + created.id.replace('brand_', '').toUpperCase(),
        status: 'Success'
      };
      setPayments(prev => {
        const next = [initialPayment, ...prev];
        try { localStorage.setItem(userKey('retentio_local_payments'), JSON.stringify(next)); } catch {}
        return next;
      });
    }

    showToast(`Client "${created.name}" onboarded successfully!`, 'success');
    return created;
  };

  const updateBrand = async (id: string, updates: Partial<Brand>) => {
    try {
      await api.brands.update(id, updates);
    } catch (_err: any) {
      // Local fallback
    }

    setBrands(prev => {
      const next = prev.map(b => (b.id === id ? { ...b, ...updates } : b));
      try { localStorage.setItem(userKey('retentio_local_brands'), JSON.stringify(next)); } catch {}
      return next;
    });

    if (updates.paymentStatus || updates.monthlyFee !== undefined) {
      const targetPayStatus = updates.paymentStatus === 'Paid' ? 'Success' : 'Pending';
      const fee = updates.monthlyFee !== undefined ? Number(updates.monthlyFee) : 0;

      setPayments(prev => {
        const hasExisting = prev.some(p => p.brandId === id);
        let next: Payment[];
        if (hasExisting) {
          next = prev.map(p => p.brandId === id ? {
            ...p,
            ...(updates.paymentStatus ? { status: targetPayStatus } : {}),
            ...(fee > 0 ? { amount: fee } : {}),
            brandName: updates.name || p.brandName,
          } : p);
        } else if (fee > 0) {
          const newPayment: Payment = {
            id: 'pay_' + Date.now(),
            brandId: id,
            brandName: updates.name || 'Client Retainer',
            amount: fee,
            paymentDate: today,
            mode: 'Bank Transfer',
            referenceNo: 'RET-' + id.replace('brand_', '').toUpperCase(),
            status: targetPayStatus,
          };
          next = [newPayment, ...prev];
        } else {
          next = prev;
        }
        try { localStorage.setItem(userKey('retentio_local_payments'), JSON.stringify(next)); } catch {}
        return next;
      });
    }

    showToast('Client details and payment status updated successfully', 'success');
  };

  const assignMembersToBrand = async (brandId: string, memberIds: string[]) => {
    try {
      await api.brands.assignMembers(brandId, memberIds);
    } catch (_err) {
      // Local fallback
    }
    setBrands(prev => {
      const next = prev.map(b => (b.id === brandId ? { ...b, assignedMemberIds: memberIds } : b));
      try { localStorage.setItem(userKey('retentio_local_brands'), JSON.stringify(next)); } catch {}
      return next;
    });
    const brand = brands.find(b => b.id === brandId);
    showToast(`Team assignments updated for ${brand?.name || 'client'}`, 'success');
  };

  const logBrandActivity = async (brandId: string, actionName: string) => {
    try {
      await api.brands.logActivity(brandId, actionName);
    } catch (_err) {}
    setBrands(prev => {
      const next = prev.map(b => (b.id === brandId ? { ...b, lastActivityDate: today } : b));
      try { localStorage.setItem(userKey('retentio_local_brands'), JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const snoozeBrandRetention = async (brandId: string) => {
    try {
      await api.brands.snoozeRetention(brandId);
    } catch (_err) {}
    await logBrandActivity(brandId, 'Retention Alert Snoozed');
    const brand = brands.find(b => b.id === brandId);
    showToast(`Retention reminder for ${brand?.name} snoozed`, 'info');
  };

  const markBrandChurned = async (brandId: string) => {
    try {
      await api.brands.churn(brandId);
    } catch (_err) {}
    setBrands(prev => {
      const next = prev.map(b => (b.id === brandId ? { ...b, status: 'Churned' as const } : b));
      try { localStorage.setItem(userKey('retentio_local_brands'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast('Client marked as Lost / Inactive', 'info');
  };

  // ---- Projects & Tasks ----
  const addProject = async (projData: any) => {
    let created: Project;
    try {
      created = await api.projects.create(projData);
    } catch {
      created = {
        id: 'proj_' + Date.now(),
        progress: 0,
        ...projData,
      };
    }
    setProjects(prev => {
      const next = [created, ...prev];
      try { localStorage.setItem(userKey('retentio_local_projects'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast(`Project "${created.name}" created`, 'success');
  };

  const addTask = async (taskData: any) => {
    let created: Task;
    try {
      created = await api.tasks.create(taskData);
    } catch {
      created = {
        id: 'task_' + Date.now(),
        ...taskData,
      };
    }
    setTasks(prev => {
      const next = [created, ...prev];
      try { localStorage.setItem(userKey('retentio_local_tasks'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast('Task added', 'success');
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const updated = await api.tasks.updateStatus(taskId, status);
      setTasks(prev => {
        const next = prev.map(t => (t.id === taskId ? { ...t, ...updated } : t));
        try { localStorage.setItem(userKey('retentio_local_tasks'), JSON.stringify(next)); } catch {}
        return next;
      });
    } catch {
      setTasks(prev => {
        const next = prev.map(t => (t.id === taskId ? { ...t, status } : t));
        try { localStorage.setItem(userKey('retentio_local_tasks'), JSON.stringify(next)); } catch {}
        return next;
      });
    }
  };

  // ---- Invoices & Payments ----
  const createInvoice = async (invoiceData: any): Promise<Invoice> => {
    let created: Invoice;
    try {
      const res = await api.invoices.create(invoiceData);
      if (res && typeof res === 'object' && res.id) {
        created = res;
      } else {
        throw new Error('Fallback to local');
      }
    } catch {
      const subtotal = (invoiceData.items || []).reduce((acc: number, it: any) => acc + (Number(it?.amount) || 0), 0);
      const gst = invoiceData.hasGst ? Math.round(subtotal * 0.18) : 0;
      created = {
        id: 'inv_' + Date.now(),
        invoiceNumber: 'INV-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 900) + 100),
        paidAmount: 0,
        status: 'Draft',
        subtotal,
        cgstAmount: invoiceData.hasGst ? Math.round(gst / 2) : 0,
        sgstAmount: invoiceData.hasGst ? Math.round(gst / 2) : 0,
        igstAmount: 0,
        totalAmount: subtotal + gst,
        ...invoiceData,
      };
    }
    setInvoices(prev => {
      const next = [created, ...(prev || []).filter(Boolean)];
      try { localStorage.setItem(userKey('retentio_local_invoices'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast(`Invoice ${created.invoiceNumber || 'Record'} generated for ${created.brandName || 'Client'}`, 'success');
    return created;
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    try { await api.invoices.updateStatus(id, status); } catch {}
    setInvoices(prev => {
      const next = prev.map(inv => (inv.id === id ? { ...inv, status } : inv));
      try { localStorage.setItem(userKey('retentio_local_invoices'), JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const deleteInvoice = async (id: string) => {
    const isAllowed = ['admin', 'manager', 'hr'].includes(currentUser.role) || currentUser.permissions?.includes('invoices');
    if (!isAllowed) {
      showToast('Unauthorized: Admin or Manager access required to delete invoices', 'error');
      return;
    }
    try {
      await api.invoices.delete(id);
    } catch (err: any) {
      console.warn('Backend delete invoice failed, removing locally:', err);
    }
    setInvoices(prev => {
      const next = prev.filter(inv => inv.id !== id);
      try { localStorage.setItem(userKey('retentio_local_invoices'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast('Invoice deleted successfully', 'success');
  };

  const deleteInvoices = async (ids: string[]) => {
    const isAllowed = ['admin', 'manager', 'hr'].includes(currentUser.role) || currentUser.permissions?.includes('invoices');
    if (!isAllowed) {
      showToast('Unauthorized: Admin or Manager access required to delete invoices', 'error');
      return;
    }
    if (!ids || ids.length === 0) return;
    try { await api.invoices.bulkDelete(ids); } catch {}
    const idSet = new Set(ids);
    setInvoices(prev => {
      const next = prev.filter(inv => !idSet.has(inv.id));
      try { localStorage.setItem(userKey('retentio_local_invoices'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast(`${ids.length} invoice${ids.length > 1 ? 's' : ''} deleted successfully`, 'success');
  };

  const recordPayment = async (paymentData: Omit<Payment, 'id' | 'status'>) => {
    let created: Payment;
    try {
      const res = await api.payments.record(paymentData);
      const payObj = res?.payment || (res && res.id ? res : null);
      if (payObj && payObj.id) {
        created = payObj;
      } else {
        throw new Error('Fallback to local');
      }
    } catch {
      created = {
        id: 'pay_' + Date.now(),
        status: 'Success',
        ...paymentData,
        amount: Number(paymentData.amount) || 0,
      };
    }
    setPayments(prev => {
      const next = [created, ...(prev || []).filter(Boolean)];
      try { localStorage.setItem(userKey('retentio_local_payments'), JSON.stringify(next)); } catch {}
      return next;
    });
    // Update invoice if linked
    if (paymentData.invoiceId) {
      setInvoices(prev => {
        const next = prev.map(inv => {
          if (inv.id === paymentData.invoiceId) {
            const newPaid = (inv.paidAmount || 0) + paymentData.amount;
            const newStatus: Invoice['status'] = newPaid >= inv.totalAmount ? 'Paid' : 'Partially Paid';
            return { ...inv, paidAmount: newPaid, status: newStatus };
          }
          return inv;
        });
        try { localStorage.setItem(userKey('retentio_local_invoices'), JSON.stringify(next)); } catch {}
        return next;
      });
    }
    setBrands(prev => {
      const next = prev.map(b =>
        b.id === paymentData.brandId
          ? { ...b, lastPaymentDate: paymentData.paymentDate, lastActivityDate: today, paymentStatus: 'Paid' as const }
          : b
      );
      try { localStorage.setItem(userKey('retentio_local_brands'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast(`Payment of ${formatCurrency(paymentData.amount)} successfully recorded!`, 'success');
  };

  const updatePaymentStatus = async (id: string, status: 'Success' | 'Pending') => {
    try {
      await api.payments.update(id, { status });
    } catch (_err) {}
    setPayments(prev => {
      const next = prev.map(p => (p.id === id ? { ...p, status } : p));
      try { localStorage.setItem(userKey('retentio_local_payments'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast(
      status === 'Success'
        ? `Payment marked as Received & Settled!`
        : `Payment marked as Pending Clearance`,
      'success'
    );
  };

  const deletePayment = async (id: string) => {
    const isAllowed = ['admin', 'manager', 'hr'].includes(currentUser.role) || currentUser.permissions?.includes('finance');
    if (!isAllowed) {
      showToast('Unauthorized: Admin or Manager access required to delete payments', 'error');
      return;
    }
    try {
      await api.payments.delete(id);
    } catch (_err) {}
    setPayments(prev => {
      const next = prev.filter(p => p.id !== id);
      try { localStorage.setItem(userKey('retentio_local_payments'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast('Payment record deleted', 'success');
  };

  const deletePayments = async (ids: string[]) => {
    const isAllowed = ['admin', 'manager', 'hr'].includes(currentUser.role) || currentUser.permissions?.includes('finance');
    if (!isAllowed) {
      showToast('Unauthorized: Admin or Manager access required to delete payments', 'error');
      return;
    }
    if (!ids || ids.length === 0) return;
    try { await api.payments.bulkDelete(ids); } catch {}
    const idSet = new Set(ids);
    setPayments(prev => {
      const next = prev.filter(p => !idSet.has(p.id));
      try { localStorage.setItem(userKey('retentio_local_payments'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast(`${ids.length} payment record${ids.length > 1 ? 's' : ''} deleted`, 'info');
  };

  const simulateRazorpayPayment = async (invoiceId: string): Promise<boolean> => {
    const targetInvoice = invoices.find(inv => inv.id === invoiceId);
    if (!targetInvoice) return false;
    try { await api.payments.razorpayInitiate(invoiceId); } catch { /* Razorpay not configured */ }
    await new Promise(res => setTimeout(res, 1200));
    const rzpId = `pay_rzp_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    await recordPayment({
      invoiceId: targetInvoice.id,
      brandId: targetInvoice.brandId,
      brandName: targetInvoice.brandName,
      amount: targetInvoice.totalAmount - targetInvoice.paidAmount,
      paymentDate: today,
      mode: 'Razorpay UPI',
      referenceNo: rzpId
    });
    return true;
  };

  // ---- Expenses ----
  const addExpense = async (expenseData: any) => {
    const isAllowed = ['admin', 'manager', 'hr'].includes(currentUser.role) || currentUser.permissions?.includes('expenses');
    if (!isAllowed) {
      showToast('Unauthorized: Admin or HR access required to manage expenses', 'error');
      return;
    }
    let created: Expense;
    try {
      const res = await api.expenses.create(expenseData);
      const expObj = res && typeof res === 'object' && ('id' in res ? res : res.data);
      if (expObj && expObj.id) {
        created = expObj;
      } else {
        throw new Error('Fallback to local');
      }
    } catch {
      created = {
        id: 'exp_' + Date.now(),
        ...expenseData,
        amount: Number(expenseData.amount) || 0,
      };
    }
    setExpenses(prev => {
      const next = [created, ...(prev || []).filter(Boolean)];
      try { localStorage.setItem(userKey('retentio_local_expenses'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast(`Expense of ${formatCurrency(created.amount || 0)} added`, 'success');
  };

  const updateExpense = async (id: string, data: Partial<Expense>) => {
    const isAllowed = ['admin', 'manager', 'hr'].includes(currentUser.role) || currentUser.permissions?.includes('expenses');
    if (!isAllowed) {
      showToast('Unauthorized: Admin or HR access required to manage expenses', 'error');
      return;
    }
    try {
      await api.expenses.update(id, data);
    } catch (_err) {}
    setExpenses(prev => {
      const next = prev.map(e => (e.id === id ? { ...e, ...data } : e));
      try { localStorage.setItem(userKey('retentio_local_expenses'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast('Expense updated successfully', 'success');
  };

  const deleteExpense = async (id: string) => {
    const isAllowed = ['admin', 'manager', 'hr'].includes(currentUser.role) || currentUser.permissions?.includes('expenses');
    if (!isAllowed) {
      showToast('Unauthorized: Admin or HR access required to manage expenses', 'error');
      return;
    }
    try { await api.expenses.delete(id); } catch {}
    setExpenses(prev => {
      const next = prev.filter(e => e.id !== id);
      try { localStorage.setItem(userKey('retentio_local_expenses'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast('Expense deleted', 'info');
  };

  const deleteExpenses = async (ids: string[]) => {
    const isAllowed = ['admin', 'manager', 'hr'].includes(currentUser.role) || currentUser.permissions?.includes('expenses');
    if (!isAllowed) {
      showToast('Unauthorized: Admin or HR access required to manage expenses', 'error');
      return;
    }
    if (!ids || ids.length === 0) return;
    try { await api.expenses.bulkDelete(ids); } catch {}
    const idSet = new Set(ids);
    setExpenses(prev => {
      const next = prev.filter(e => !idSet.has(e.id));
      try { localStorage.setItem(userKey('retentio_local_expenses'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast(`${ids.length} expense record${ids.length > 1 ? 's' : ''} deleted`, 'info');
  };

  // ---- Meetings ----
  const addMeeting = async (meetingData: any) => {
    let created: Meeting;
    try {
      created = await api.meetings.create(meetingData);
    } catch {
      created = {
        id: 'meet_' + Date.now(),
        ...meetingData,
      };
    }
    setMeetings(prev => {
      const next = [created, ...prev];
      try { localStorage.setItem(userKey('retentio_local_meetings'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast(`Meeting "${created.title}" scheduled`, 'success');
  };

  const updateMeeting = async (id: string, data: Partial<Meeting>) => {
    try { await api.meetings.update(id, data); } catch {}
    setMeetings(prev => {
      const next = prev.map(m => (m.id === id ? { ...m, ...data } : m));
      try { localStorage.setItem(userKey('retentio_local_meetings'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast('Meeting updated', 'success');
  };

  const deleteMeeting = async (id: string) => {
    try { await api.meetings.delete(id); } catch {}
    setMeetings(prev => {
      const next = prev.filter(m => m.id !== id);
      try { localStorage.setItem(userKey('retentio_local_meetings'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast('Meeting deleted', 'info');
  };

  // ---- Leads ----
  const addLead = async (leadData: any) => {
    let created: Lead;
    try {
      created = await api.leads.create(leadData);
    } catch {
      created = {
        id: 'lead_' + Date.now(),
        ...leadData,
      };
    }
    setLeads(prev => {
      const next = [created, ...prev];
      try { localStorage.setItem(userKey('retentio_local_leads'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast(`Lead "${created.company}" added to pipeline`, 'success');
  };

  const updateLeadStage = async (id: string, stage: Lead['stage']) => {
    try { await api.leads.updateStage(id, stage); } catch {}
    setLeads(prev => {
      const next = prev.map(l => (l.id === id ? { ...l, stage } : l));
      try { localStorage.setItem(userKey('retentio_local_leads'), JSON.stringify(next)); } catch {}
      return next;
    });
    showToast(`Lead moved to ${stage}`, 'info');
  };

  const convertLeadToBrand = async (leadId: string) => {
    let result: any = null;
    try {
      result = await api.leads.convert(leadId);
    } catch (_err) {
      // Local fallback for offline / bypass mode
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        const newBrand: Brand = {
          id: 'brand_' + Date.now(),
          name: lead.company,
          ownerName: lead.name || lead.contact,
          mobile: lead.phone || '',
          email: lead.email || '',
          billingAddress: '',
          state: '',
          pincode: '',
          gstNumber: '',
          pan: '',
          serviceDetails: lead.notes || 'Retainer Services',
          monthlyFee: lead.value || 0,
          billingCycleDay: 1,
          onboardingDate: today,
          status: 'Active',
          paymentStatus: 'Paid',
          lastActivityDate: today,
          lastPaymentDate: today,
          assignedMemberIds: currentUser?.id ? [currentUser.id] : [],
          documents: [],
        };
        result = { brand: newBrand };
        setBrands(prev => {
          const next = [newBrand, ...prev];
          try { localStorage.setItem(userKey('retentio_local_brands'), JSON.stringify(next)); } catch {}
          return next;
        });
        setLeads(prev => {
          const next = prev.filter(l => l.id !== leadId);
          try { localStorage.setItem(userKey('retentio_local_leads'), JSON.stringify(next)); } catch {}
          return next;
        });
      }
    }
    // Reload from API if backend is connected
    const [newBrands, newLeads] = await Promise.all([
      api.brands.listAll().catch(() => null),
      api.leads.listAll().catch(() => null),
    ]);
    const normalizedNewBrands = normalizeBrandsList(newBrands);
    if (normalizedNewBrands) setBrands(normalizedNewBrands);
    if (Array.isArray(newLeads)) setLeads(newLeads);
    if (result?.brand?.id) setSelectedBrandId(result.brand.id);
    setActiveTab('clients');
    showToast('🎉 Lead converted into an active Client profile!', 'success');
  };

  // ---- Notifications ----
  const markNotificationAsRead = async (id: string) => {
    await api.notifications.markRead(id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = async () => {
    await api.notifications.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    showToast('All notifications marked as read', 'info');
  };

  // ---- Socket.io Real-Time Synchronization ----
  const activeConversationIdRef = useRef(activeConversationId);
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    if (!currentUser) {
      disconnectSocket();
      return;
    }

    connectSocket(currentUser.id);
    const s = getSocket();

    const handleNewMessage = ({ conversationId, message }: { conversationId: string; message: ChatMessage }) => {
      setMessages(prev => {
        const existing = prev[conversationId] || [];
        // 1. If already in list by exact ID, ignore
        if (existing.some(m => m.id === message.id)) return prev;

        // 2. If sent by current user, replace matching optimistic message to avoid duplicate
        if (message.senderId === currentUser.id) {
          const optimisticIdx = existing.findIndex(
            m => m.id.startsWith('msg-') && m.text === message.text
          );
          if (optimisticIdx !== -1) {
            const next = [...existing];
            next[optimisticIdx] = message;
            return {
              ...prev,
              [conversationId]: next,
            };
          }
        }

        return {
          ...prev,
          [conversationId]: [...existing, message],
        };
      });

      setConversations(prev =>
        prev.map(c => {
          if (c.id === conversationId) {
            const isCurrentlyActive = activeConversationIdRef.current === conversationId;
            const newUnread = isCurrentlyActive || message.senderId === currentUser.id
              ? 0
              : (c.unreadCount || 0) + 1;
            return {
              ...c,
              lastMessage: message.text || (message.attachments?.length ? 'Attachment' : ''),
              lastMessageTime: 'Just now',
              unreadCount: newUnread,
            };
          }
          return c;
        })
      );

      // If active in this conversation, automatically acknowledge receipt
      if (activeConversationIdRef.current === conversationId && message.senderId !== currentUser.id) {
        emitMarkRead(conversationId, currentUser.id);
      }
    };

    const handleMessagesRead = ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      setMessages(prev => {
        const list = prev[conversationId];
        if (!list) return prev;
        return {
          ...prev,
          [conversationId]: list.map(m => {
            if (m.senderId !== userId) {
              const newReadBy = m.readBy?.includes(userId) ? m.readBy : [...(m.readBy || []), userId];
              return { ...m, readBy: newReadBy, isRead: true };
            }
            return m;
          }),
        };
      });
    };

    const handleConversationUpdated = ({ conversationId, lastMessage, lastMessageTime }: any) => {
      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId ? { ...c, lastMessage, lastMessageTime } : c
        )
      );
    };

    const handleNewConversation = (conv: Conversation) => {
      setConversations(prev => {
        if (prev.some(c => c.id === conv.id)) return prev;
        return [conv, ...prev];
      });
    };

    const handleMessageDeleted = ({ conversationId, messageId, deleteType, userId }: any) => {
      setMessages(prev => {
        const list = prev[conversationId];
        if (!list) return prev;
        if (deleteType === 'forEveryone') {
          return {
            ...prev,
            [conversationId]: list.map(m =>
              m.id === messageId ? { ...m, isDeletedForEveryone: true, text: 'This message was deleted' } : m
            ),
          };
        } else if (userId === currentUser.id) {
          return {
            ...prev,
            [conversationId]: list.filter(m => m.id !== messageId),
          };
        }
        return prev;
      });
    };

    const handleOnlineUsersList = (ids: string[]) => {
      if (Array.isArray(ids)) {
        setOnlineUserIds(new Set(ids));
      }
    };

    const handleUserOnline = ({ userId }: { userId: string }) => {
      if (userId) {
        setOnlineUserIds(prev => new Set(prev).add(userId));
      }
    };

    const handleUserOffline = ({ userId }: { userId: string }) => {
      if (userId) {
        setOnlineUserIds(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    };

    s.on('new_message', handleNewMessage);
    s.on('messages_read', handleMessagesRead);
    s.on('conversation_updated', handleConversationUpdated);
    s.on('new_conversation', handleNewConversation);
    s.on('message_deleted', handleMessageDeleted);
    s.on('online_users_list', handleOnlineUsersList);
    s.on('user_online', handleUserOnline);
    s.on('user_offline', handleUserOffline);

    return () => {
      s.off('new_message', handleNewMessage);
      s.off('messages_read', handleMessagesRead);
      s.off('conversation_updated', handleConversationUpdated);
      s.off('new_conversation', handleNewConversation);
      s.off('message_deleted', handleMessageDeleted);
      s.off('online_users_list', handleOnlineUsersList);
      s.off('user_online', handleUserOnline);
      s.off('user_offline', handleUserOffline);
    };
  }, [currentUser?.id]);

  const isUserOnline = useCallback((userId: string) => {
    if (!userId) return false;
    if (onlineUserIds.has(userId)) return true;
    const target = (allUsers || []).find(u => u && u.id === userId);
    return target ? (target as any)?.status !== 'inactive' && (target as any)?.isActive !== false : false;
  }, [onlineUserIds, allUsers]);

  // Join/leave conversation room when active conversation changes
  useEffect(() => {
    if (!currentUser || !activeConversationId) return;

    joinConversationRoom(activeConversationId, currentUser.id);
    emitMarkRead(activeConversationId, currentUser.id);
    api.chat.markRead(activeConversationId).catch(() => {});
    setConversations(prev =>
      prev.map(c => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
    );

    return () => {
      leaveConversationRoom(activeConversationId);
    };
  }, [activeConversationId, currentUser?.id]);

  // ---- Chat ----
  // ---- Chat ----
  const loadMessages = async (convId: string) => {
    try {
      // Drains every page of the thread. A single call only returns the newest
      // 100 messages, so a longer conversation was silently truncated.
      const msgs = await fetchAll<any>(`/chat/conversations/${convId}/messages`, 100);
      if (msgs && msgs.length > 0) {
        setMessages(prev => ({ ...prev, [convId]: msgs }));
      }
    } catch (err: any) {
      console.warn('API chat.messages failed, preserving local messages:', err);
    }
    if (currentUser) {
      try {
        emitMarkRead(convId, currentUser.id);
        api.chat.markRead(convId).catch(() => {});
        setConversations(prev =>
          prev.map(c => (c.id === convId ? { ...c, unreadCount: 0 } : c))
        );
      } catch {}
    }
  };

  const startDirectChat = async (targetUserId: string): Promise<string> => {
    try {
      const conv = await api.chat.direct(targetUserId);
      if (conv && conv.id) {
        setConversations(prev => {
          if (prev.some(c => c.id === conv.id)) {
            return prev.map(c => (c.id === conv.id ? { ...c, ...conv } : c));
          }
          return [conv, ...prev];
        });
        setActiveConversationId(conv.id);
        setActiveTab('chat');
        return conv.id;
      }
    } catch (err: any) {
      console.warn('API chat.direct failed, creating local direct conversation:', err);
    }

    // Local-first fallback for direct chat
    const targetUser = allUsers.find(u => u.id === targetUserId);
    const existing = conversations.find(
      c => c.type === 'direct' && c.participantIds?.includes(targetUserId)
    );
    if (existing) {
      setActiveConversationId(existing.id);
      setActiveTab('chat');
      return existing.id;
    }

    const localConvId = `conv-dm-${targetUserId}-${Date.now()}`;
    const newConv: Conversation = {
      id: localConvId,
      title: targetUser?.name || 'Direct Chat',
      type: 'direct',
      participantIds: [currentUser.id, ...(targetUser ? [targetUser.id] : [])],
      lastMessage: 'Conversation started',
      lastMessageTime: 'Just now',
      unreadCount: 0,
      otherMember: targetUser ? {
        id: targetUser.id,
        name: targetUser.name,
        avatar: targetUser.avatar,
        role: targetUser.role
      } : undefined
    };

    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(localConvId);
    setActiveTab('chat');
    return localConvId;
  };

  const markConversationRead = async (convId: string) => {
    if (!convId || !currentUser) return;
    try {
      emitMarkRead(convId, currentUser.id);
      await api.chat.markRead(convId).catch(() => {});
      setConversations(prev =>
        prev.map(c => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
    } catch {}
  };

  const sendMessage = async (conversationId: string, text: string, attachments: any[] = []) => {
    if (!text.trim() && (!attachments || attachments.length === 0)) return;
    const optimisticMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      readBy: [currentUser.id],
      isRead: true,
      attachments: attachments || []
    };
    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), optimisticMsg]
    }));
    setConversations(prev =>
      prev.map(c => (c.id === conversationId ? { ...c, lastMessage: text, lastMessageTime: 'Just now' } : c))
    );

    try {
      const created = await api.chat.sendMessage(conversationId, { text, attachments });
      if (created && created.id) {
        setMessages(prev => {
          const list = prev[conversationId] || [];
          // If socket already added this message by real ID, remove the optimistic one to prevent duplicate
          if (list.some(m => m.id === created.id)) {
            return {
              ...prev,
              [conversationId]: list.filter(m => m.id !== optimisticMsg.id)
            };
          }
          return {
            ...prev,
            [conversationId]: list.map(m => m.id === optimisticMsg.id ? created : m)
          };
        });
      }
    } catch (err: any) {
      // The message was never persisted. Keep the bubble but flag it as failed
      // so it is visibly not a confirmed send, and tell the user.
      console.warn('API chat.sendMessage failed, marking optimistic message as unsent:', err);
      setMessages(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(m =>
          m.id === optimisticMsg.id ? { ...m, failed: true } : m
        )
      }));
      showToast('Message could not be sent. Check your connection.', 'error');
    }
  };

  const deleteMessage = async (conversationId: string, messageId: string, deleteType: 'forEveryone' | 'forMe') => {
    if (!currentUser) return;
    // Apply the local update only after the server confirms it. Swallowing the
    // error made a failed delete look successful and the message "disappeared"
    // only until the next reload.
    await api.chat.deleteMessage(conversationId, messageId, deleteType);
    emitDeleteMessage(conversationId, messageId, deleteType, currentUser.id);
    setMessages(prev => {
      const list = prev[conversationId] || [];
      if (deleteType === 'forEveryone') {
        return {
          ...prev,
          [conversationId]: list.map(m =>
            m.id === messageId ? { ...m, isDeletedForEveryone: true, text: 'This message was deleted' } : m
          ),
        };
      } else {
        return {
          ...prev,
          [conversationId]: list.filter(m => m.id !== messageId),
        };
      }
    });
  };

  const deleteConversation = async (convId: string) => {
    // Await the delete so a failure does not silently drop the conversation
    // from local state while it still exists on the server.
    await api.chat.deleteConversation(convId);
    setConversations(prev => prev.filter(c => c.id !== convId));
    setMessages(prev => {
      const next = { ...prev };
      delete next[convId];
      return next;
    });
    if (activeConversationId === convId) {
      const remaining = conversations.filter(c => c.id !== convId);
      setActiveConversationId(remaining[0]?.id || '');
    }
  };

  const clearConversation = async (convId: string) => {
    // Await the clear so a failure does not wipe the local view of a
    // conversation whose messages are still on the server.
    await api.chat.clearConversation(convId);
    setMessages(prev => ({ ...prev, [convId]: [] }));
    setConversations(prev =>
      prev.map(c =>
        c.id === convId ? { ...c, lastMessage: '', lastMessageTime: '', unreadCount: 0 } : c
      )
    );
  };

  // ---- Settings ----
  const updateSettings = async (updates: Partial<AppSettings>) => {
    try {
      const updated = await api.settings.update(updates);
      setSettings(prev => ({ ...prev, ...updated }));
      if (updated.currency) {
        localStorage.setItem('retentio_currency', updated.currency);
      }
      if (updated.currencySymbol) {
        localStorage.setItem('retentio_currency_symbol', updated.currencySymbol);
      }
    } catch (err) {
      setSettings(prev => ({ ...prev, ...updates }));
      if (updates.currency) {
        localStorage.setItem('retentio_currency', updates.currency);
      }
      if (updates.currencySymbol) {
        localStorage.setItem('retentio_currency_symbol', updates.currencySymbol);
      }
    }
    showToast('Settings saved successfully', 'success');
  };

  // ---- Holidays ----
  const addHoliday = async (data: Omit<Holiday, 'id'>) => {
    let created: Holiday;
    try {
      created = await api.holidays.create(data);
    } catch {
      created = {
        id: `hol-${Date.now()}`,
        ...data,
      };
    }
    setHolidays(prev => [...prev, created]);
    showToast('Holiday added', 'success');
  };

  const deleteHoliday = async (id: string) => {
    try {
      await api.holidays.delete(id);
    } catch {}
    setHolidays(prev => prev.filter(h => h.id !== id));
    showToast('Holiday removed', 'info');
  };

  // ---- Team ----
  const addTeamMember = async (data: any) => {
    // Never fall back to a locally-fabricated user. Doing so created records
    // that looked real in the UI but existed only in the browser, so the member
    // could not sign in and vanished on reload.
    const created = await api.users.create({ ...data, createdBy: currentUser?.id });
    setAllUsers(prev => {
      const next = [...prev.filter(u => u.id !== created.id), created];
      try {
        localStorage.setItem('retentio_local_users', JSON.stringify(next));
        if (activeUserId) {
          localStorage.setItem(`retentio_local_users_${activeUserId}`, JSON.stringify(next));
        }
      } catch {}
      return next;
    });
    return created;
  };

  const updateTeamMember = async (id: string, data: any) => {
    // Never swallow this error. Swallowing it let the caller show a success
    // toast while the change was silently discarded, so a profile photo looked
    // saved until the next reload. A failed save must reach the caller.
    const updated = await api.users.update(id, data);
    setAllUsers(prev => {
      const exists = prev.some(u => u.id === id);
      const next = exists
        ? prev.map(u => (u.id === id ? { ...u, ...updated } : u))
        : (currentUser && currentUser.id === id ? [...prev, { ...currentUser, ...updated }] : prev);
      try {
        localStorage.setItem('retentio_local_users', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (currentUser && currentUser.id === id) {
      setCurrentUser(prev => {
        const next = { ...prev, ...updated };
        try {
          localStorage.setItem('retentio_user', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
    return updated;
  };

  const deactivateTeamMember = async (id: string) => {
    // Propagate the failure. Swallowing it marked the member inactive in the UI
    // while the database row stayed active, so they could still sign in after a
    // refresh.
    await api.users.deactivate(id);
    setAllUsers(prev => {
      const next = prev.map(u => (u.id === id ? { ...u, status: 'inactive' as const, isActive: false } : u));
      try {
        localStorage.setItem('retentio_local_users', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const resetWorkspaceData = useCallback(async (mode: 'empty' = 'empty') => {
    setIsLoading(true);
    try {
      if (mode === 'empty') {
        if (currentUser?.role === 'admin') {
          await api.settings.resetData().catch(() => {});
        }

        const emptyArr = JSON.stringify([]);
        localStorage.setItem('retentio_clean_testing', 'true');
        localStorage.setItem('retentio_local_brands', emptyArr);
        localStorage.setItem(userKey('retentio_local_brands'), emptyArr);
        localStorage.setItem('retentio_local_projects', emptyArr);
        localStorage.setItem(userKey('retentio_local_projects'), emptyArr);
        localStorage.setItem('retentio_local_tasks', emptyArr);
        localStorage.setItem(userKey('retentio_local_tasks'), emptyArr);
        localStorage.setItem('retentio_local_invoices', emptyArr);
        localStorage.setItem(userKey('retentio_local_invoices'), emptyArr);
        localStorage.setItem('retentio_local_payments', emptyArr);
        localStorage.setItem(userKey('retentio_local_payments'), emptyArr);
        localStorage.setItem('retentio_local_expenses', emptyArr);
        localStorage.setItem(userKey('retentio_local_expenses'), emptyArr);
        localStorage.setItem('retentio_local_meetings', emptyArr);
        localStorage.setItem(userKey('retentio_local_meetings'), emptyArr);
        localStorage.setItem('retentio_local_leads', emptyArr);
        localStorage.setItem(userKey('retentio_local_leads'), emptyArr);
        localStorage.removeItem('retentio_onboarding_completed');
        localStorage.removeItem('retentio_onboarding_data');

        setBrands([]);
        setProjects([]);
        setTasks([]);
        setInvoices([]);
        setPayments([]);
        setExpenses([]);
        setMeetings([]);
        setLeads([]);
        setNotifications([]);
        setConversations([]);
        setSelectedBrandId(null);
        setSelectedInvoiceId(null);

        loadedRef.current.clear();
        failedRef.current.clear();

        showToast('All current data removed! Clean testing state ready.', 'success');
      } else {
        // The 'demo' branch was removed. It loaded DEMO_USERS and empty DEMO_*
        // arrays into state, which put accounts that exist only in the browser
        // into the workspace and broke the zero-mock-data rule. There is no
        // in-app demo dataset — test against real database records.
        localStorage.removeItem('retentio_clean_testing');

        loadedRef.current.clear();
        failedRef.current.clear();

        showToast('No demo dataset is available. Use real records.', 'info');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Strict user association & access control filtering
  const visibleBrands = useMemo((): Brand[] => {
    if (!currentUser || isWorkspaceOwner(currentUser)) {
      return brands;
    }
    // Team members only access clients explicitly assigned to them
    return brands.filter((b: Brand) => Array.isArray(b.assignedMemberIds) && b.assignedMemberIds.includes(currentUser.id));
  }, [brands, currentUser]);

  const visibleTasks = useMemo((): Task[] => {
    if (!currentUser || isWorkspaceOwner(currentUser)) {
      return tasks;
    }
    const myBrandIds = new Set(visibleBrands.map((b: Brand) => b.id));
    return tasks.filter((t: Task) => t.assigneeId === currentUser.id || (t.brandId && myBrandIds.has(t.brandId)));
  }, [tasks, visibleBrands, currentUser]);

  const visibleProjects = useMemo((): Project[] => {
    if (!currentUser || isWorkspaceOwner(currentUser)) {
      return projects;
    }
    const myBrandIds = new Set(visibleBrands.map((b: Brand) => b.id));
    return projects.filter((p: Project) => (p.brandId && myBrandIds.has(p.brandId)) || (Array.isArray(p.assignedMemberIds) && p.assignedMemberIds.includes(currentUser.id)));
  }, [projects, visibleBrands, currentUser]);

  const visibleInvoices = useMemo((): Invoice[] => {
    if (!currentUser || isWorkspaceOwner(currentUser)) {
      return invoices;
    }
    const perms = Array.isArray(currentUser.permissions) ? currentUser.permissions : [];
    if (!perms.includes('invoices') && !perms.includes('finance')) return [];
    const myBrandIds = new Set(visibleBrands.map((b: Brand) => b.id));
    return invoices.filter((i: Invoice) => Boolean(i.brandId && myBrandIds.has(i.brandId)));
  }, [invoices, visibleBrands, currentUser]);

  const visiblePayments = useMemo((): Payment[] => {
    if (!currentUser || isWorkspaceOwner(currentUser)) {
      return payments;
    }
    const perms = Array.isArray(currentUser.permissions) ? currentUser.permissions : [];
    if (!perms.includes('finance') && !perms.includes('invoices')) return [];
    const myBrandIds = new Set(visibleBrands.map((b: Brand) => b.id));
    return payments.filter((p: Payment) => Boolean(p.brandId && myBrandIds.has(p.brandId)));
  }, [payments, visibleBrands, currentUser]);

  const visibleExpenses = useMemo((): Expense[] => {
    if (!currentUser || isWorkspaceOwner(currentUser)) {
      return expenses;
    }
    const perms = Array.isArray(currentUser.permissions) ? currentUser.permissions : [];
    if (!perms.includes('expenses') && !perms.includes('finance')) return [];
    const myBrandIds = new Set(visibleBrands.map((b: Brand) => b.id));
    return expenses.filter((e: Expense) => Boolean((e.brandId && myBrandIds.has(e.brandId)) || (e.employeeId === currentUser.id)));
  }, [expenses, visibleBrands, currentUser]);

  const visibleMeetings = useMemo((): Meeting[] => {
    if (!currentUser || isWorkspaceOwner(currentUser)) {
      return meetings;
    }
    const myBrandIds = new Set(visibleBrands.map((b: Brand) => b.id));
    return meetings.filter((m: Meeting) => Boolean((Array.isArray(m.attendeeIds) && m.attendeeIds.includes(currentUser.id)) || (m.brandId && myBrandIds.has(m.brandId))));
  }, [meetings, visibleBrands, currentUser]);

  const visibleLeads = useMemo((): Lead[] => {
    if (!currentUser || isWorkspaceOwner(currentUser)) {
      return leads;
    }
    const perms = Array.isArray(currentUser.permissions) ? currentUser.permissions : [];
    if (!perms.includes('leads')) return [];
    return leads;
  }, [leads, currentUser]);

  const visibleUsers = useMemo((): User[] => {
    if (!currentUser) return allUsers;
    if (isWorkspaceOwner(currentUser)) {
      return allUsers.filter((u: User) => u && (u.id === currentUser.id || (u as any).createdBy === currentUser.id || !(u as any).createdBy));
    }
    const myAdminId = (currentUser as any).createdBy;
    return allUsers.filter((u: User) => u && (
      u.id === currentUser.id ||
      u.id === myAdminId ||
      (myAdminId && (u as any).createdBy === myAdminId) ||
      (!myAdminId && !(u as any).createdBy)
    ));
  }, [allUsers, currentUser]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchUser,
        allUsers: visibleUsers,
        activeTab,
        setActiveTab,
        brands: visibleBrands,
        selectedBrandId,
        setSelectedBrandId,
        addBrand,
        updateBrand,
        assignMembersToBrand,
        projects: visibleProjects,
        tasks: visibleTasks,
        addTask,
        updateTaskStatus,
        addProject,
        invoices: visibleInvoices,
        payments: visiblePayments,
        selectedInvoiceId,
        setSelectedInvoiceId,
        createInvoice,
        updateInvoiceStatus,
        deleteInvoice,
        deleteInvoices,
        recordPayment,
        updatePaymentStatus,
        deletePayment,
        deletePayments,
        simulateRazorpayPayment,
        expenses: visibleExpenses,
        addExpense,
        updateExpense,
        deleteExpense,
        deleteExpenses,
        meetings: visibleMeetings,
        addMeeting,
        updateMeeting,
        deleteMeeting,
        leads: visibleLeads,
        addLead,
        updateLeadStage,
        convertLeadToBrand,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        conversations,
        activeConversationId,
        setActiveConversationId,
        messages,
        sendMessage,
        loadMessages,
        startDirectChat,
        markConversationRead,
        deleteMessage,
        deleteConversation,
        clearConversation,
        onlineUserIds,
        isUserOnline,
        settings,
        updateSettings,
        currency: activeCurrency,
        currencySymbol: activeCurrencySymbol,
        formatCurrency,
        holidays,
        addHoliday,
        deleteHoliday,
        auditLogs,
        retentionAlerts,
        snoozeBrandRetention,
        markBrandChurned,
        logBrandActivity,
        toasts,
        showToast,
        dismissToast,
        isLoading,
        apiError,
        addTeamMember,
        updateTeamMember,
        deactivateTeamMember,
        reloadAll,
        loadDomain,
        logout,
        sidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        toggleMobileSidebar,
        theme,
        toggleTheme,
        setTheme,
        resetWorkspaceData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
