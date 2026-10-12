import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, getToken } from '../services/api';
import { getNaturalErrorMessage } from '../services/errors';
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
import { ROUTES, PATH_TO_TAB, DEFAULT_ROUTE } from '../routes';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  currentUser: User;
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
  recordPayment: (paymentData: Omit<Payment, 'id' | 'status'>) => Promise<void>;
  updatePaymentStatus: (id: string, status: 'Success' | 'Pending') => Promise<void>;
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

  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
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
  addTeamMember: (data: any) => Promise<void>;
  updateTeamMember: (id: string, data: any) => Promise<any>;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('retentio_token');
      localStorage.removeItem('retentio_user');
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
    if (initialUser) return [initialUser];
    return [];
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Initial tab from URL path
  const getInitialTab = (): string => {
    const path = window.location.pathname;
    return PATH_TO_TAB[path] || 'dashboard';
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


  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

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
    if (!getToken()) return;
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
              api.brands.list(),
              api.users.list().catch(() => []),
            ]);
            if (brandsData) setBrands(brandsData);
            if (usersData) setAllUsers(usersData);
            break;
          }
          case 'projects': {
            const [projectsData, tasksData] = await Promise.all([
              api.projects.list(),
              api.tasks.list(),
            ]);
            if (projectsData) setProjects(projectsData);
            if (tasksData) setTasks(tasksData);
            break;
          }
          case 'invoices': {
            const [invoicesData, paymentsData] = await Promise.all([
              api.invoices.list(),
              api.payments.list(),
            ]);
            if (invoicesData) setInvoices(invoicesData);
            if (paymentsData) setPayments(paymentsData);
            break;
          }
          case 'finance': {
            const [paymentsData, expensesData, invoicesData] = await Promise.all([
              api.payments.list(),
              api.expenses.list().catch(() => []),
              api.invoices.list(),
            ]);
            if (paymentsData) setPayments(paymentsData);
            if (expensesData) setExpenses(expensesData);
            if (invoicesData) setInvoices(invoicesData);
            break;
          }
          case 'expenses': {
            const expensesData = await api.expenses.list();
            if (expensesData) setExpenses(expensesData);
            break;
          }
          case 'leads': {
            const leadsData = await api.leads.list();
            if (leadsData) setLeads(leadsData);
            break;
          }
          case 'meetings': {
            const meetingsData = await api.meetings.list();
            if (meetingsData) setMeetings(meetingsData);
            break;
          }
          case 'team': {
            const usersData = await api.users.list();
            if (usersData) setAllUsers(usersData);
            break;
          }
          case 'inbox': {
            const notifData = await api.notifications.list();
            if (notifData) setNotifications(notifData);
            break;
          }
          case 'chat': {
            const convsData = await api.chat.conversations();
            if (convsData) {
              setConversations(convsData);
              if (convsData.length > 0) setActiveConversationId((prev) => prev || convsData[0].id);
            }
            break;
          }
          case 'settings': {
            const [settingsData, holidaysData] = await Promise.all([
              api.settings.get().catch(() => null),
              api.holidays.list().catch(() => []),
            ]);
            if (settingsData) setSettings(settingsData);
            if (holidaysData) setHolidays(holidaysData);
            break;
          }
          case 'audit': {
            const auditData = await api.auditLogs.list().catch(() => []);
            if (auditData) setAuditLogs(auditData);
            break;
          }
          case 'dashboard': {
            const [brandsData, invoicesData, tasksData, meetingsData] = await Promise.all([
              api.brands.list(),
              api.invoices.list(),
              api.tasks.list(),
              api.meetings.list(),
            ]);
            if (brandsData) setBrands(brandsData);
            if (invoicesData) setInvoices(invoicesData);
            if (tasksData) setTasks(tasksData);
            if (meetingsData) setMeetings(meetingsData);
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
        showToast(msg, 'error');
      } finally {
        inflightRef.current.delete(domain);
      }
    })();

    inflightRef.current.set(domain, task);
    return task;
  }, []);

  /** Explicit full refresh — used by the manual "reload" affordance. */
  const reloadAll = useCallback(async () => {
    if (!getToken()) return;
    loadedRef.current.clear();
    inflightRef.current.clear();
    try {
      setIsLoading(true);
      setApiError(null);
      const domains = [
        'clients', 'projects', 'invoices', 'expenses',
        'leads', 'meetings', 'team', 'inbox', 'chat', 'settings',
      ];
      await Promise.all(domains.map((d) => loadDomain(d)));
    } finally {
      setIsLoading(false);
    }
  }, [loadDomain]);

  // Notifications are lightweight and drive the Topbar badge on every page,
  // so they load once up-front; everything else waits for its route.
  useEffect(() => {
    if (!getToken()) return;
    (async () => {
      try {
        const notifData = await api.notifications.list();
        if (notifData) setNotifications(notifData);
      } catch {
        /* badge is non-critical — stay silent */
      }
    })();
  }, []);

  // Load only the data the current route needs (see loadDomain).
  // Failed domains are retried on every revisit because loadDomain
  // only short-circuits on success (loadedRef), not on failure.
  useEffect(() => {
    const pathTab = PATH_TO_TAB[location.pathname];
    if (pathTab) loadDomain(pathTab);
  }, [location.pathname, loadDomain]);

  const retentionAlerts = brands
    .map(brand => {
      const last = new Date(brand.lastActivityDate);
      const now = new Date(today);
      const daysInactive = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      return { brand, daysInactive, isUrgent: daysInactive >= settings.retentionThresholdDays };
    })
    .filter(item => item.isUrgent && item.brand.status !== 'Churned');

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
    try {
      const payStatus = brandData.paymentStatus === 'Paid' ? 'Paid' : 'Pending';
      const created = await api.brands.create({ ...brandData, paymentStatus: payStatus });
      setBrands(prev => [created, ...prev]);

      const fee = Number(brandData.monthlyFee) || 0;
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
        setPayments(prev => [initialPayment, ...prev]);
      }

      showToast(`Client "${created.name}" onboarded successfully!`, 'success');
      return created;
    } catch (apiErr: any) {
      console.error('Backend create brand failed:', apiErr);
      showToast(getNaturalErrorMessage(apiErr), 'error');
      throw apiErr;
    }
  };

  const updateBrand = async (id: string, updates: Partial<Brand>) => {
    try {
      const updated = await api.brands.update(id, updates);
      setBrands(prev => prev.map(b => (b.id === id ? { ...b, ...updated } : b)));

      if (updates.paymentStatus || updates.monthlyFee !== undefined) {
        const targetPayStatus = (updates.paymentStatus || updated.paymentStatus) === 'Paid' ? 'Success' : 'Pending';
        const fee = updates.monthlyFee !== undefined ? Number(updates.monthlyFee) : Number(updated.monthlyFee || 0);

        setPayments(prev => {
          const hasExisting = prev.some(p => p.brandId === id);
          if (hasExisting) {
            return prev.map(p => p.brandId === id ? {
              ...p,
              status: targetPayStatus,
              amount: fee > 0 ? fee : p.amount,
              brandName: updates.name || updated.name || p.brandName,
            } : p);
          } else if (fee > 0) {
            const newPayment: Payment = {
              id: 'pay_' + Date.now(),
              brandId: id,
              brandName: updates.name || updated.name || 'Client Retainer',
              amount: fee,
              paymentDate: today,
              mode: 'Bank Transfer',
              referenceNo: 'RET-' + id.replace('brand_', '').toUpperCase(),
              status: targetPayStatus,
            };
            return [newPayment, ...prev];
          }
          return prev;
        });
      }

      showToast('Client details and payment status updated successfully', 'success');
    } catch (err: any) {
      console.error('Update brand failed:', err);
      showToast(getNaturalErrorMessage(err), 'error');
      throw err;
    }
  };

  const assignMembersToBrand = async (brandId: string, memberIds: string[]) => {
    await api.brands.assignMembers(brandId, memberIds);
    setBrands(prev => prev.map(b => (b.id === brandId ? { ...b, assignedMemberIds: memberIds } : b)));
    const brand = brands.find(b => b.id === brandId);
    showToast(`Team assignments updated for ${brand?.name || 'client'}`, 'success');
  };

  const logBrandActivity = async (brandId: string, actionName: string) => {
    await api.brands.logActivity(brandId, actionName);
    setBrands(prev => prev.map(b => (b.id === brandId ? { ...b, lastActivityDate: today } : b)));
  };

  const snoozeBrandRetention = async (brandId: string) => {
    await api.brands.snoozeRetention(brandId);
    await logBrandActivity(brandId, 'Retention Alert Snoozed');
    const brand = brands.find(b => b.id === brandId);
    showToast(`Retention reminder for ${brand?.name} snoozed`, 'info');
  };

  const markBrandChurned = async (brandId: string) => {
    await api.brands.churn(brandId);
    setBrands(prev => prev.map(b => (b.id === brandId ? { ...b, status: 'Churned' } : b)));
    showToast('Client marked as Churned', 'info');
  };

  // ---- Projects & Tasks ----
  const addProject = async (projData: any) => {
    const created = await api.projects.create(projData);
    setProjects(prev => [created, ...prev]);
    showToast(`Project "${created.name}" created`, 'success');
  };

  const addTask = async (taskData: any) => {
    const created = await api.tasks.create(taskData);
    setTasks(prev => [created, ...prev]);
    showToast('Task added', 'success');
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    const updated = await api.tasks.updateStatus(taskId, status);
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, ...updated } : t)));
  };

  // ---- Invoices & Payments ----
  const createInvoice = async (invoiceData: any): Promise<Invoice> => {
    const created = await api.invoices.create(invoiceData);
    setInvoices(prev => [created, ...prev]);
    showToast(`Invoice ${created.invoiceNumber} generated for ${created.brandName}`, 'success');
    return created;
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    await api.invoices.updateStatus(id, status);
    setInvoices(prev => prev.map(inv => (inv.id === id ? { ...inv, status } : inv)));
  };

  const recordPayment = async (paymentData: Omit<Payment, 'id' | 'status'>) => {
    const created = await api.payments.record(paymentData);
    setPayments(prev => [created, ...prev]);
    const updatedInvoices = await api.invoices.list();
    if (updatedInvoices) setInvoices(updatedInvoices);
    setBrands(prev =>
      prev.map(b =>
        b.id === paymentData.brandId
          ? { ...b, lastPaymentDate: paymentData.paymentDate, lastActivityDate: today }
          : b
      )
    );
    showToast(`Payment of ₹${paymentData.amount.toLocaleString('en-IN')} successfully recorded!`, 'success');
  };

  const updatePaymentStatus = async (id: string, status: 'Success' | 'Pending') => {
    try {
      const updated = await api.payments.update(id, { status });
      setPayments(prev => prev.map(p => (p.id === id ? { ...p, ...updated } : p)));
      if (updated.brandId) {
        setBrands(prev =>
          prev.map(b => (b.id === updated.brandId ? { ...b, paymentStatus: status === 'Success' ? 'Paid' : 'Pending' } : b))
        );
      }
      showToast(
        status === 'Success'
          ? `Payment of ₹${Number(updated.amount).toLocaleString('en-IN')} marked as Received & Settled!`
          : `Payment marked as Pending Clearance`,
        'success'
      );
    } catch (err: any) {
      console.error('Failed to update payment status:', err);
      setPayments(prev => prev.map(p => (p.id === id ? { ...p, status } : p)));
      showToast('Payment status updated', 'info');
    }
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
    if (!['admin', 'hr'].includes(currentUser.role)) {
      showToast('Unauthorized: Admin or HR access required to manage expenses', 'error');
      return;
    }
    const created = await api.expenses.create(expenseData);
    setExpenses(prev => [created, ...prev]);
    showToast(`Expense of ₹${Number(created.amount).toLocaleString('en-IN')} added`, 'success');
  };

  const updateExpense = async (id: string, data: Partial<Expense>) => {
    if (!['admin', 'hr'].includes(currentUser.role)) {
      showToast('Unauthorized: Admin or HR access required to manage expenses', 'error');
      return;
    }
    try {
      const updated = await api.expenses.update(id, data);
      setExpenses(prev => prev.map(e => (e.id === id ? { ...e, ...updated } : e)));
      const toastMsg = data.paymentStatus === 'Paid'
        ? 'Expense marked as Paid (now updated in Dashboard totals)'
        : data.paymentStatus === 'Pending'
        ? 'Expense marked as Pending (excluded from Dashboard totals)'
        : 'Expense updated successfully';
      showToast(toastMsg, 'success');
    } catch (err: any) {
      console.error('Update expense failed:', err);
      showToast(getNaturalErrorMessage(err), 'error');
      throw err;
    }
  };

  const deleteExpense = async (id: string) => {
    if (!['admin', 'hr'].includes(currentUser.role)) {
      showToast('Unauthorized: Admin or HR access required to manage expenses', 'error');
      return;
    }
    await api.expenses.delete(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('Expense deleted', 'info');
  };

  const deleteExpenses = async (ids: string[]) => {
    if (!['admin', 'hr'].includes(currentUser.role)) {
      showToast('Unauthorized: Admin or HR access required to manage expenses', 'error');
      return;
    }
    if (!ids || ids.length === 0) return;
    try {
      await api.expenses.bulkDelete(ids);
      const idSet = new Set(ids);
      setExpenses(prev => prev.filter(e => !idSet.has(e.id)));
      showToast(`${ids.length} expense record${ids.length > 1 ? 's' : ''} deleted`, 'info');
    } catch (err: any) {
      console.error('Bulk delete expenses failed:', err);
      showToast(getNaturalErrorMessage(err), 'error');
      throw err;
    }
  };

  // ---- Meetings ----
  const addMeeting = async (meetingData: any) => {
    const created = await api.meetings.create(meetingData);
    setMeetings(prev => [created, ...prev]);
    showToast(`Meeting "${created.title}" scheduled`, 'success');
  };

  const updateMeeting = async (id: string, data: Partial<Meeting>) => {
    const updated = await api.meetings.update(id, data);
    setMeetings(prev => prev.map(m => (m.id === id ? { ...m, ...updated } : m)));
    showToast('Meeting updated', 'success');
  };

  const deleteMeeting = async (id: string) => {
    await api.meetings.delete(id);
    setMeetings(prev => prev.filter(m => m.id !== id));
    showToast('Meeting deleted', 'info');
  };

  // ---- Leads ----
  const addLead = async (leadData: any) => {
    const created = await api.leads.create(leadData);
    setLeads(prev => [created, ...prev]);
    showToast(`Lead "${created.company}" added to pipeline`, 'success');
  };

  const updateLeadStage = async (id: string, stage: Lead['stage']) => {
    await api.leads.updateStage(id, stage);
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, stage } : l)));
    showToast(`Lead moved to ${stage}`, 'info');
  };

  const convertLeadToBrand = async (leadId: string) => {
    const result = await api.leads.convert(leadId);
    const [newBrands, newLeads] = await Promise.all([api.brands.list(), api.leads.list()]);
    if (newBrands) setBrands(newBrands);
    if (newLeads) setLeads(newLeads);
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

  // ---- Chat ----
  const loadMessages = async (convId: string) => {
    const msgs = await api.chat.messages(convId);
    setMessages(prev => ({ ...prev, [convId]: msgs }));
  };

  const sendMessage = async (conversationId: string, text: string, attachments: any[] = []) => {
    if (!text.trim() && (!attachments || attachments.length === 0)) return;
    const created = await api.chat.sendMessage(conversationId, { text, attachments });
    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), created]
    }));
    setConversations(prev =>
      prev.map(c => (c.id === conversationId ? { ...c, lastMessage: text, lastMessageTime: 'Just now' } : c))
    );
  };

  // ---- Settings ----
  const updateSettings = async (updates: Partial<AppSettings>) => {
    const updated = await api.settings.update(updates);
    setSettings(prev => ({ ...prev, ...updated }));
    showToast('Settings saved successfully', 'success');
  };

  // ---- Holidays ----
  const addHoliday = async (data: Omit<Holiday, 'id'>) => {
    const created = await api.holidays.create(data);
    setHolidays(prev => [...prev, created]);
    showToast('Holiday added', 'success');
  };

  const deleteHoliday = async (id: string) => {
    await api.holidays.delete(id);
    setHolidays(prev => prev.filter(h => h.id !== id));
    showToast('Holiday removed', 'info');
  };

  // ---- Team ----
  const addTeamMember = async (data: any) => {
    const created = await api.users.create(data);
    setAllUsers(prev => [...prev, created]);
    showToast('Team member added successfully', 'success');
  };

  const updateTeamMember = async (id: string, data: any) => {
    const updated = await api.users.update(id, data);
    setAllUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updated } : u)));
    if (currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updated }));
    }
    showToast('Team member updated successfully', 'success');
    return updated;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
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
        recordPayment,
        updatePaymentStatus,
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
        settings,
        updateSettings,
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
        setTheme
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
