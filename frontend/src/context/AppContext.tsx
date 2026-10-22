import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
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
import {
  DEMO_USERS,
  DEMO_BRANDS,
  DEMO_PROJECTS,
  DEMO_TASKS,
  DEMO_INVOICES,
  DEMO_PAYMENTS,
  DEMO_EXPENSES,
  DEMO_MEETINGS,
  DEMO_LEADS,
} from '../data/demoData';
import { ROUTES, PATH_TO_TAB, DEFAULT_ROUTE } from '../routes';

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
  resetWorkspaceData: (mode?: 'empty' | 'demo') => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('retentio_local_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
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
    if (initialUser) return [initialUser, ...DEMO_USERS.filter(u => u.id !== initialUser.id && u.email !== initialUser.email)];
    return DEMO_USERS;
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
      localStorage.setItem('retentio_local_users', JSON.stringify(DEMO_USERS));
      localStorage.removeItem('retentio_onboarding_completed');
      localStorage.removeItem('retentio_onboarding_data');
    } catch {}
  }

  const activeUserId = initialUser?.id || initialUserId || '';

  // User boundary isolation: if a different user/ID is detected, clear un-scoped cache
  if (typeof localStorage !== 'undefined' && activeUserId) {
    const prevUserId = localStorage.getItem('retentio_active_user_id');
    if (prevUserId && prevUserId !== activeUserId) {
      // Switching to a different user: clear previous user's un-scoped workspace cache!
      const emptyArr = JSON.stringify([]);
      localStorage.setItem('retentio_local_brands', emptyArr);
      localStorage.setItem('retentio_local_projects', emptyArr);
      localStorage.setItem('retentio_local_tasks', emptyArr);
      localStorage.setItem('retentio_local_invoices', emptyArr);
      localStorage.setItem('retentio_local_payments', emptyArr);
      localStorage.setItem('retentio_local_expenses', emptyArr);
      localStorage.setItem('retentio_local_meetings', emptyArr);
      localStorage.setItem('retentio_local_leads', emptyArr);
    }
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

  const [brands, setBrands] = useState<Brand[]>(() => {
    try {
      const userSaved = activeUserId ? localStorage.getItem(`retentio_local_brands_${activeUserId}`) : null;
      if (userSaved) {
        const normalized = normalizeBrandsList(JSON.parse(userSaved));
        if (normalized) return normalized;
      }
      const saved = localStorage.getItem('retentio_local_brands');
      if (saved) {
        const normalized = normalizeBrandsList(JSON.parse(saved));
        if (normalized) return normalized;
      }
    } catch {}
    return isCleanTesting ? [] : (normalizeBrandsList(DEMO_BRANDS) || []);
  });
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const userSaved = activeUserId ? safeParseArray<Project>(localStorage.getItem(`retentio_local_projects_${activeUserId}`)) : null;
      if (userSaved) return userSaved;
      const saved = safeParseArray<Project>(localStorage.getItem('retentio_local_projects'));
      if (saved) return saved;
    } catch {}
    return isCleanTesting ? [] : (DEMO_PROJECTS || []).filter(Boolean);
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const userSaved = activeUserId ? safeParseArray<Task>(localStorage.getItem(`retentio_local_tasks_${activeUserId}`)) : null;
      if (userSaved) return userSaved;
      const saved = safeParseArray<Task>(localStorage.getItem('retentio_local_tasks'));
      if (saved) return saved;
    } catch {}
    return isCleanTesting ? [] : (DEMO_TASKS || []).filter(Boolean);
  });
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const userSaved = activeUserId ? safeParseArray<Invoice>(localStorage.getItem(`retentio_local_invoices_${activeUserId}`)) : null;
      if (userSaved) return userSaved;
      const saved = safeParseArray<Invoice>(localStorage.getItem('retentio_local_invoices'));
      if (saved) return saved;
    } catch {}
    return isCleanTesting ? [] : (DEMO_INVOICES || []).filter(Boolean);
  });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>(() => {
    try {
      const userSaved = activeUserId ? safeParseArray<Payment>(localStorage.getItem(`retentio_local_payments_${activeUserId}`)) : null;
      if (userSaved) return userSaved;
      const saved = safeParseArray<Payment>(localStorage.getItem('retentio_local_payments'));
      if (saved) return saved;
    } catch {}
    return isCleanTesting ? [] : (DEMO_PAYMENTS || []).filter(Boolean);
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const userSaved = activeUserId ? safeParseArray<Expense>(localStorage.getItem(`retentio_local_expenses_${activeUserId}`)) : null;
      if (userSaved) return userSaved;
      const saved = safeParseArray<Expense>(localStorage.getItem('retentio_local_expenses'));
      if (saved) return saved;
    } catch {}
    return isCleanTesting ? [] : (DEMO_EXPENSES || []).filter(Boolean);
  });
  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    try {
      const userSaved = activeUserId ? safeParseArray<Meeting>(localStorage.getItem(`retentio_local_meetings_${activeUserId}`)) : null;
      if (userSaved) return userSaved;
      const saved = safeParseArray<Meeting>(localStorage.getItem('retentio_local_meetings'));
      if (saved) return saved;
    } catch {}
    return isCleanTesting ? [] : (DEMO_MEETINGS || []).filter(Boolean);
  });
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const userSaved = activeUserId ? safeParseArray<Lead>(localStorage.getItem(`retentio_local_leads_${activeUserId}`)) : null;
      if (userSaved) return userSaved;
      const saved = safeParseArray<Lead>(localStorage.getItem('retentio_local_leads'));
      if (saved) return saved;
    } catch {}
    return isCleanTesting ? [] : (DEMO_LEADS || []).filter(Boolean);
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
        setApiError(null);
        switch (domain) {
          case 'clients': {
            const [brandsData, usersData] = await Promise.all([
              api.brands.list().catch(() => null),
              api.users.list().catch(() => null),
            ]);
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands) {
              setBrands(normalizedBrands);
              try { localStorage.setItem('retentio_local_brands', JSON.stringify(normalizedBrands)); } catch {}
            }
            if (Array.isArray(usersData) && usersData.length > 0) {
              setAllUsers(usersData);
              try { localStorage.setItem('retentio_local_users', JSON.stringify(usersData)); } catch {}
            }
            break;
          }
          case 'projects':
          case 'tasks': {
            const [projectsData, tasksData, brandsData, usersData] = await Promise.all([
              api.projects.list().catch(() => null),
              api.tasks.list().catch(() => null),
              api.brands.list().catch(() => null),
              api.users.list().catch(() => null),
            ]);
            if (Array.isArray(projectsData)) {
              const clean = projectsData.filter(Boolean);
              setProjects(clean);
              try { localStorage.setItem('retentio_local_projects', JSON.stringify(clean)); } catch {}
            }
            if (Array.isArray(tasksData)) {
              const clean = tasksData.filter(Boolean);
              setTasks(clean);
              try { localStorage.setItem('retentio_local_tasks', JSON.stringify(clean)); } catch {}
            }
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands) setBrands(normalizedBrands);
            if (Array.isArray(usersData) && usersData.length > 0) setAllUsers(usersData.filter(Boolean));
            break;
          }
          case 'invoices': {
            const [invoicesData, paymentsData, brandsData] = await Promise.all([
              api.invoices.list().catch(() => null),
              api.payments.list().catch(() => null),
              api.brands.list().catch(() => null),
            ]);
            if (Array.isArray(invoicesData)) {
              const clean = invoicesData.filter(Boolean);
              setInvoices(clean);
              try { localStorage.setItem('retentio_local_invoices', JSON.stringify(clean)); } catch {}
            }
            if (Array.isArray(paymentsData)) {
              const clean = paymentsData.filter(Boolean);
              setPayments(clean);
              try { localStorage.setItem('retentio_local_payments', JSON.stringify(clean)); } catch {}
            }
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands) setBrands(normalizedBrands);
            break;
          }
          case 'finance': {
            const [paymentsData, expensesData, invoicesData, brandsData] = await Promise.all([
              api.payments.list().catch(() => null),
              api.expenses.list().catch(() => null),
              api.invoices.list().catch(() => null),
              api.brands.list().catch(() => null),
            ]);
            if (Array.isArray(paymentsData)) setPayments(paymentsData.filter(Boolean));
            if (Array.isArray(expensesData)) setExpenses(expensesData.filter(Boolean));
            if (Array.isArray(invoicesData)) setInvoices(invoicesData.filter(Boolean));
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands) setBrands(normalizedBrands);
            break;
          }
          case 'expenses': {
            const [expensesData, brandsData, usersData] = await Promise.all([
              api.expenses.list().catch(() => null),
              api.brands.list().catch(() => null),
              api.users.list().catch(() => null),
            ]);
            if (Array.isArray(expensesData)) {
              setExpenses(expensesData);
              try { localStorage.setItem('retentio_local_expenses', JSON.stringify(expensesData)); } catch {}
            }
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands) setBrands(normalizedBrands);
            if (Array.isArray(usersData) && usersData.length > 0) setAllUsers(usersData);
            break;
          }
          case 'retention': {
            const [brandsData, settingsData] = await Promise.all([
              api.brands.list().catch(() => null),
              api.settings.get().catch(() => null),
            ]);
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands) setBrands(normalizedBrands);
            if (settingsData) setSettings(settingsData);
            break;
          }
          case 'leads': {
            const [leadsData, brandsData] = await Promise.all([
              api.leads.list().catch(() => null),
              api.brands.list().catch(() => null),
            ]);
            if (Array.isArray(leadsData)) {
              setLeads(leadsData);
              try { localStorage.setItem('retentio_local_leads', JSON.stringify(leadsData)); } catch {}
            }
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands) setBrands(normalizedBrands);
            break;
          }
          case 'meetings': {
            const [meetingsData, brandsData, usersData, holidaysData] = await Promise.all([
              api.meetings.list().catch(() => null),
              api.brands.list().catch(() => null),
              api.users.list().catch(() => null),
              api.holidays.list().catch(() => null),
            ]);
            if (Array.isArray(meetingsData)) {
              setMeetings(meetingsData);
              try { localStorage.setItem('retentio_local_meetings', JSON.stringify(meetingsData)); } catch {}
            }
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands) setBrands(normalizedBrands);
            if (Array.isArray(usersData) && usersData.length > 0) setAllUsers(usersData);
            if (Array.isArray(holidaysData)) setHolidays(holidaysData);
            break;
          }
          case 'team': {
            const [usersData, brandsData] = await Promise.all([
              api.users.list().catch(() => null),
              api.brands.list().catch(() => null),
            ]);
            if (Array.isArray(usersData) && usersData.length > 0) setAllUsers(usersData);
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands) setBrands(normalizedBrands);
            break;
          }
          case 'inbox': {
            const notifData = await api.notifications.list().catch(() => null);
            if (Array.isArray(notifData)) setNotifications(notifData);
            break;
          }
          case 'chat': {
            const [convsData, usersData] = await Promise.all([
              api.chat.conversations().catch(() => null),
              api.users.list().catch(() => null),
            ]);
            const allU = usersData && usersData.length > 0 ? usersData : allUsers;
            if (Array.isArray(usersData) && usersData.length > 0) setAllUsers(usersData);

            const baseConvs = Array.isArray(convsData) ? convsData : [];
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
              api.settings.get().catch(() => null),
              api.holidays.list().catch(() => null),
            ]);
            if (settingsData) setSettings(settingsData);
            if (Array.isArray(holidaysData)) setHolidays(holidaysData);
            break;
          }
          case 'audit': {
            const auditData = await api.auditLogs.list().catch(() => null);
            if (Array.isArray(auditData)) setAuditLogs(auditData);
            break;
          }
          case 'dashboard': {
            const [brandsData, invoicesData, tasksData, meetingsData, paymentsData, expensesData] = await Promise.all([
              api.brands.list().catch(() => null),
              api.invoices.list().catch(() => null),
              api.tasks.list().catch(() => null),
              api.meetings.list().catch(() => null),
              api.payments.list().catch(() => null),
              api.expenses.list().catch(() => null),
            ]);
            const normalizedBrands = normalizeBrandsList(brandsData);
            if (normalizedBrands) setBrands(normalizedBrands);
            if (Array.isArray(invoicesData)) setInvoices(invoicesData.filter(Boolean));
            if (Array.isArray(tasksData)) setTasks(tasksData.filter(Boolean));
            if (Array.isArray(meetingsData)) setMeetings(meetingsData.filter(Boolean));
            if (Array.isArray(paymentsData)) setPayments(paymentsData.filter(Boolean));
            if (Array.isArray(expensesData)) setExpenses(expensesData.filter(Boolean));
            break;
          }
          default:
            break;
        }
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
      }
    })();

    inflightRef.current.set(domain, task);
    return task;
  }, [currentUser]);

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
        if (notifData && notifData.length > 0) setNotifications(notifData);
      } catch {
        /* badge is non-critical — stay silent */
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
      if (user.role === 'brand') setActiveTab('inbox');
      showToast(`Switched persona to ${user.name} (${user.role.toUpperCase()})`, 'info');
    }
  };

  // ---- Brand CRUD ----
  const addBrand = async (brandData: any): Promise<Brand> => {
    const selectedStatus = brandData.status || (['Active', 'Inactive', 'Paused', 'Churned'].includes(brandData.paymentStatus) ? brandData.paymentStatus : 'Active');
    const payStatus = brandData.paymentStatus === 'Pending' ? 'Pending' : (brandData.paymentStatus === 'Paid' ? 'Paid' : (['Inactive', 'Paused', 'Churned'].includes(selectedStatus) ? 'Pending' : 'Paid'));
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
      try { localStorage.setItem('retentio_local_brands', JSON.stringify(next)); } catch {}
      return next;
    });

    if (fee > 0) {
      const initialPayment: Payment = {
        id: 'pay_' + Date.now(),
        brandId: created.id,
        brandName: created.name,
        amount: fee,
        paymentDate: today,
        mode: 'Bank Transfer',
        referenceNo: 'RET-' + created.id.replace('brand_', '').toUpperCase(),
        status: payStatus === 'Paid' ? 'Success' : 'Pending'
      };
      setPayments(prev => {
        const next = [initialPayment, ...prev];
        try { localStorage.setItem('retentio_local_payments', JSON.stringify(next)); } catch {}
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
      try { localStorage.setItem('retentio_local_brands', JSON.stringify(next)); } catch {}
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
        try { localStorage.setItem('retentio_local_payments', JSON.stringify(next)); } catch {}
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
      try { localStorage.setItem('retentio_local_brands', JSON.stringify(next)); } catch {}
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
      try { localStorage.setItem('retentio_local_brands', JSON.stringify(next)); } catch {}
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
      try { localStorage.setItem('retentio_local_brands', JSON.stringify(next)); } catch {}
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
      try { localStorage.setItem('retentio_local_projects', JSON.stringify(next)); } catch {}
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
      try { localStorage.setItem('retentio_local_tasks', JSON.stringify(next)); } catch {}
      return next;
    });
    showToast('Task added', 'success');
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const updated = await api.tasks.updateStatus(taskId, status);
      setTasks(prev => {
        const next = prev.map(t => (t.id === taskId ? { ...t, ...updated } : t));
        try { localStorage.setItem('retentio_local_tasks', JSON.stringify(next)); } catch {}
        return next;
      });
    } catch {
      setTasks(prev => {
        const next = prev.map(t => (t.id === taskId ? { ...t, status } : t));
        try { localStorage.setItem('retentio_local_tasks', JSON.stringify(next)); } catch {}
        return next;
      });
    }
  };

  // ---- Invoices & Payments ----
  const createInvoice = async (invoiceData: any): Promise<Invoice> => {
    let created: Invoice;
    try {
      created = await api.invoices.create(invoiceData);
    } catch {
      const subtotal = (invoiceData.items || []).reduce((acc: number, it: any) => acc + (it.amount || 0), 0);
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
      const next = [created, ...prev];
      try { localStorage.setItem('retentio_local_invoices', JSON.stringify(next)); } catch {}
      return next;
    });
    showToast(`Invoice ${created.invoiceNumber} generated for ${created.brandName}`, 'success');
    return created;
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    try { await api.invoices.updateStatus(id, status); } catch {}
    setInvoices(prev => {
      const next = prev.map(inv => (inv.id === id ? { ...inv, status } : inv));
      try { localStorage.setItem('retentio_local_invoices', JSON.stringify(next)); } catch {}
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
      try { localStorage.setItem('retentio_local_invoices', JSON.stringify(next)); } catch {}
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
      try { localStorage.setItem('retentio_local_invoices', JSON.stringify(next)); } catch {}
      return next;
    });
    showToast(`${ids.length} invoice${ids.length > 1 ? 's' : ''} deleted successfully`, 'success');
  };

  const recordPayment = async (paymentData: Omit<Payment, 'id' | 'status'>) => {
    let created: Payment;
    try {
      created = await api.payments.record(paymentData);
    } catch {
      created = {
        id: 'pay_' + Date.now(),
        status: 'Success',
        ...paymentData,
      };
    }
    setPayments(prev => {
      const next = [created, ...prev];
      try { localStorage.setItem('retentio_local_payments', JSON.stringify(next)); } catch {}
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
        try { localStorage.setItem('retentio_local_invoices', JSON.stringify(next)); } catch {}
        return next;
      });
    }
    setBrands(prev => {
      const next = prev.map(b =>
        b.id === paymentData.brandId
          ? { ...b, lastPaymentDate: paymentData.paymentDate, lastActivityDate: today, paymentStatus: 'Paid' as const }
          : b
      );
      try { localStorage.setItem('retentio_local_brands', JSON.stringify(next)); } catch {}
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
      try { localStorage.setItem('retentio_local_payments', JSON.stringify(next)); } catch {}
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
      try { localStorage.setItem('retentio_local_payments', JSON.stringify(next)); } catch {}
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
      try { localStorage.setItem('retentio_local_payments', JSON.stringify(next)); } catch {}
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
      created = await api.expenses.create(expenseData);
    } catch {
      created = {
        id: 'exp_' + Date.now(),
        ...expenseData,
      };
    }
    setExpenses(prev => {
      const next = [created, ...prev];
      try { localStorage.setItem('retentio_local_expenses', JSON.stringify(next)); } catch {}
      return next;
    });
    showToast(`Expense of ${formatCurrency(created.amount)} added`, 'success');
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
      try { localStorage.setItem('retentio_local_expenses', JSON.stringify(next)); } catch {}
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
      try { localStorage.setItem('retentio_local_expenses', JSON.stringify(next)); } catch {}
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
      try { localStorage.setItem('retentio_local_expenses', JSON.stringify(next)); } catch {}
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
      try { localStorage.setItem('retentio_local_meetings', JSON.stringify(next)); } catch {}
      return next;
    });
    showToast(`Meeting "${created.title}" scheduled`, 'success');
  };

  const updateMeeting = async (id: string, data: Partial<Meeting>) => {
    try { await api.meetings.update(id, data); } catch {}
    setMeetings(prev => {
      const next = prev.map(m => (m.id === id ? { ...m, ...data } : m));
      try { localStorage.setItem('retentio_local_meetings', JSON.stringify(next)); } catch {}
      return next;
    });
    showToast('Meeting updated', 'success');
  };

  const deleteMeeting = async (id: string) => {
    try { await api.meetings.delete(id); } catch {}
    setMeetings(prev => {
      const next = prev.filter(m => m.id !== id);
      try { localStorage.setItem('retentio_local_meetings', JSON.stringify(next)); } catch {}
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
      try { localStorage.setItem('retentio_local_leads', JSON.stringify(next)); } catch {}
      return next;
    });
    showToast(`Lead "${created.company}" added to pipeline`, 'success');
  };

  const updateLeadStage = async (id: string, stage: Lead['stage']) => {
    try { await api.leads.updateStage(id, stage); } catch {}
    setLeads(prev => {
      const next = prev.map(l => (l.id === id ? { ...l, stage } : l));
      try { localStorage.setItem('retentio_local_leads', JSON.stringify(next)); } catch {}
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
          try { localStorage.setItem('retentio_local_brands', JSON.stringify(next)); } catch {}
          return next;
        });
        setLeads(prev => {
          const next = prev.filter(l => l.id !== leadId);
          try { localStorage.setItem('retentio_local_leads', JSON.stringify(next)); } catch {}
          return next;
        });
      }
    }
    // Reload from API if backend is connected
    const [newBrands, newLeads] = await Promise.all([
      api.brands.list().catch(() => null),
      api.leads.list().catch(() => null),
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
      const msgs = await api.chat.messages(convId);
      if (Array.isArray(msgs)) {
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
      console.warn('API chat.sendMessage failed, keeping optimistic message:', err);
    }
  };

  const deleteMessage = async (conversationId: string, messageId: string, deleteType: 'forEveryone' | 'forMe') => {
    if (!currentUser) return;
    try {
      emitDeleteMessage(conversationId, messageId, deleteType, currentUser.id);
      await api.chat.deleteMessage(conversationId, messageId, deleteType).catch(() => {});
    } catch (err) {
      console.warn('API chat.deleteMessage failed, applying local update:', err);
    }

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
    try {
      await api.chat.deleteConversation(convId).catch(() => {});
    } catch (err) {
      console.warn('API chat.deleteConversation failed, updating local state:', err);
    }
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
    try {
      await api.chat.clearConversation(convId).catch(() => {});
    } catch (err) {
      console.warn('API chat.clearConversation failed, updating local state:', err);
    }
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
    let created: any;
    try {
      created = await api.users.create(data);
    } catch (err: any) {
      console.warn('API users.create failed, falling back to local user:', err);
      created = {
        id: `user-${Date.now()}`,
        name: data.name || 'New Member',
        email: data.email || '',
        phone: data.phone || '',
        designation: data.designation || '',
        role: data.role || 'team',
        avatar: data.avatar || '',
        permissions: data.permissions || [],
        status: 'active',
        createdAt: new Date().toISOString(),
        ...data,
      };
    }
    setAllUsers(prev => {
      const next = [...prev, created];
      try {
        localStorage.setItem('retentio_local_users', JSON.stringify(next));
      } catch {}
      return next;
    });
    return created;
  };

  const updateTeamMember = async (id: string, data: any) => {
    let updated: any;
    try {
      updated = await api.users.update(id, data);
    } catch (err: any) {
      console.warn('API users.update failed, updating local user:', err);
      updated = data;
    }
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
    try {
      await api.users.deactivate(id);
    } catch (err: any) {
      console.warn('API users.deactivate failed, updating local state:', err);
    }
    setAllUsers(prev => {
      const next = prev.map(u => (u.id === id ? { ...u, status: 'inactive' as const, isActive: false } : u));
      try {
        localStorage.setItem('retentio_local_users', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const resetWorkspaceData = useCallback(async (mode: 'empty' | 'demo' = 'empty') => {
    setIsLoading(true);
    try {
      if (mode === 'empty') {
        if (currentUser?.role === 'admin') {
          await api.settings.resetData().catch(() => {});
        }

        const emptyArr = JSON.stringify([]);
        localStorage.setItem('retentio_clean_testing', 'true');
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
        localStorage.removeItem('retentio_clean_testing');
        localStorage.setItem('retentio_local_brands', JSON.stringify(DEMO_BRANDS));
        localStorage.setItem('retentio_local_projects', JSON.stringify(DEMO_PROJECTS));
        localStorage.setItem('retentio_local_tasks', JSON.stringify(DEMO_TASKS));
        localStorage.setItem('retentio_local_invoices', JSON.stringify(DEMO_INVOICES));
        localStorage.setItem('retentio_local_payments', JSON.stringify(DEMO_PAYMENTS));
        localStorage.setItem('retentio_local_expenses', JSON.stringify(DEMO_EXPENSES));
        localStorage.setItem('retentio_local_meetings', JSON.stringify(DEMO_MEETINGS));
        localStorage.setItem('retentio_local_leads', JSON.stringify(DEMO_LEADS));
        localStorage.setItem('retentio_local_users', JSON.stringify(DEMO_USERS));

        setBrands(DEMO_BRANDS);
        setProjects(DEMO_PROJECTS);
        setTasks(DEMO_TASKS);
        setInvoices(DEMO_INVOICES);
        setPayments(DEMO_PAYMENTS);
        setExpenses(DEMO_EXPENSES);
        setMeetings(DEMO_MEETINGS);
        setLeads(DEMO_LEADS);
        setAllUsers(DEMO_USERS);

        loadedRef.current.clear();
        failedRef.current.clear();

        showToast('Fresh demo test dataset loaded successfully!', 'success');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    (window as any).resetRetentioWorkspace = resetWorkspaceData;
  }, [resetWorkspaceData]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchUser,
        allUsers,
        activeTab,
        setActiveTab,
        brands,
        selectedBrandId,
        setSelectedBrandId,
        addBrand,
        updateBrand,
        assignMembersToBrand,
        projects,
        tasks,
        addTask,
        updateTaskStatus,
        addProject,
        invoices,
        payments,
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
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        deleteExpenses,
        meetings,
        addMeeting,
        updateMeeting,
        deleteMeeting,
        leads,
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
