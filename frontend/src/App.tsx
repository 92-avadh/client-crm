import React, { Suspense, lazy, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { api, clearToken, setToken } from './services/api';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { LoginScreen } from './components/auth/LoginScreen';
import { OnboardingWizard } from './components/auth/OnboardingWizard';
import { StarParticles } from './components/layout/StarParticles';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { Check, AlertCircle, Info, X } from 'lucide-react';
import { ROUTES, DEFAULT_ROUTE } from './routes';
import { getDefaultPermissionsForRole } from './components/team/permissionsConfig';

/* ------------------------------------------------------------------ */
/*  Lazy-loaded route components — code splitting for smaller bundle    */
/* ------------------------------------------------------------------ */
const importDashboard = () => import('./components/dashboard/Dashboard').then(m => ({ default: m.Dashboard }));
const importClients = () => import('./components/clients/ClientsManager').then(m => ({ default: m.ClientsManager }));
const importInvoices = () => import('./components/invoices/InvoicesManager').then(m => ({ default: m.InvoicesManager }));
const importFinance = () => import('./components/finance/FinanceManager').then(m => ({ default: m.FinanceManager }));
const importExpenses = () => import('./components/expenses/ExpensesManager').then(m => ({ default: m.ExpensesManager }));
const importRetention = () => import('./components/retention/RetentionEngine').then(m => ({ default: m.RetentionEngine }));
const importChat = () => import('./components/chat/ChatManager').then(m => ({ default: m.ChatManager }));
const importProjectsAndTasks = () => import('./components/projects/ProjectsAndTasks').then(m => ({ default: m.ProjectsAndTasks }));
const importMeetings = () => import('./components/calendar/MeetingsCalendar').then(m => ({ default: m.MeetingsCalendar }));
const importLeads = () => import('./components/leads/LeadsPipeline').then(m => ({ default: m.LeadsPipeline }));
const importSettings = () => import('./components/settings/SettingsManager').then(m => ({ default: m.SettingsManager }));
const importTeam = () => import('./components/team/TeamManager').then(m => ({ default: m.TeamManager }));
const importInbox = () => import('./components/inbox/InboxManager').then(m => ({ default: m.InboxManager }));
const importPortal = () => import('./components/portal/ClientPortal').then(m => ({ default: m.ClientPortal }));

const Dashboard = lazy(importDashboard);
const ClientsManager = lazy(importClients);
const InvoicesManager = lazy(importInvoices);
const FinanceManager = lazy(importFinance);
const ExpensesManager = lazy(importExpenses);
const RetentionEngine = lazy(importRetention);
const ChatManager = lazy(importChat);
const ProjectsAndTasks = lazy(importProjectsAndTasks);
const MeetingsCalendar = lazy(importMeetings);
const LeadsPipeline = lazy(importLeads);
const SettingsManager = lazy(importSettings);
const TeamManager = lazy(importTeam);
const InboxManager = lazy(importInbox);
const ClientPortal = lazy(importPortal);

export const prefetchRoute = (tab: string) => {
  switch (tab) {
    case 'dashboard': importDashboard(); break;
    case 'clients': importClients(); break;
    case 'invoices': importInvoices(); break;
    case 'finance': importFinance(); break;
    case 'expenses': importExpenses(); break;
    case 'retention': importRetention(); break;
    case 'chat': importChat(); break;
    case 'projects':
    case 'tasks': importProjectsAndTasks(); break;
    case 'meetings': importMeetings(); break;
    case 'leads': importLeads(); break;
    case 'settings': importSettings(); break;
    case 'team': importTeam(); break;
    case 'inbox': importInbox(); break;
    default: break;
  }
};

/* ------------------------------------------------------------------ */
/*  404 Not Found page                                                 */
/* ------------------------------------------------------------------ */
const NotFound: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '24px',
    }}>
      <div style={{
        fontSize: 72,
        fontWeight: 900,
        color: 'var(--text-primary, #0a0a0a)',
        lineHeight: 1,
        marginBottom: 8,
      }}>
        404
      </div>
      <h2 style={{
        fontSize: 20,
        fontWeight: 700,
        color: 'var(--text-primary, #0a0a0a)',
        margin: '0 0 8px',
      }}>
        Page not found
      </h2>
      <p style={{
        fontSize: 14,
        color: 'var(--text-secondary, #666)',
        margin: '0 0 24px',
        maxWidth: 360,
      }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a
        href={DEFAULT_ROUTE}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 20px',
          background: 'var(--text-primary, #0a0a0a)',
          color: 'var(--solid-btn-text)',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Go to Dashboard
      </a>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Scroll restoration — scroll to top on route change                 */
/* ------------------------------------------------------------------ */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

/* ------------------------------------------------------------------ */
/*  Page loading fallback for lazy components                          */
/* ------------------------------------------------------------------ */
const PageLoader: React.FC = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '40vh',
  }}>
    <div style={{
      width: 32,
      height: 32,
      border: '3px solid var(--border, #e2e2e2)',
      borderTopColor: 'var(--text-primary, #0a0a0a)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Splash — shown while the saved session is being restored.          */
/*  Critical: while this renders, NO route is mounted, so nothing can  */
/*  redirect away from the URL the user actually opened.               */
/* ------------------------------------------------------------------ */
const Splash: React.FC = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'var(--bg, #ffffff)',
  }}>
    <div style={{
      width: 34,
      height: 34,
      border: '3px solid var(--border, #e2e2e2)',
      borderTopColor: 'var(--text-primary, #0a0a0a)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

/* ------------------------------------------------------------------ */
/*  MainLayout — renders sidebar + topbar + <Outlet /> for child routes */
/* ------------------------------------------------------------------ */
const MainLayout: React.FC = () => {
  const { toasts, apiError, dismissToast } = useApp();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      [
        'clients', 'projects', 'tasks', 'invoices', 'finance', 'expenses',
        'retention', 'chat', 'meetings', 'leads', 'team', 'inbox', 'settings'
      ].forEach(prefetchRoute);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="flex min-h-screen transition-colors duration-200 relative"
      style={{
        background: 'var(--bg, #ffffff)',
        color: 'var(--text-primary, #0a0a0a)',
        gap: 16,
      }}
    >
      <StarParticles />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Topbar />
        <main className="flex-1 w-full px-5 sm:px-7 lg:px-10 py-4 sm:py-6">
          {apiError && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger-text)',
                borderRadius: 10,
                padding: '11px 14px',
                marginBottom: 16,
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{apiError}</span>
            </div>
          )}
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-[2000] flex flex-col gap-2.5 pointer-events-none items-end">
        {toasts.map((t) => {
          const isError = t.type === 'error';
          const isInfo = t.type === 'info';
          const borderColor = isError ? '#fecaca' : isInfo ? '#bfdbfe' : '#bbf7d0';
          const textColor = isError ? '#991b1b' : isInfo ? '#1e40af' : '#065f46';
          const iconBg = isError ? '#fef2f2' : isInfo ? '#eff6ff' : '#e6f7ef';
          const iconColor = isError ? '#dc2626' : isInfo ? '#2563eb' : '#047857';

          return (
            <div
              key={t.id}
              className="pointer-events-auto toast-slide-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 13,
                padding: '11px 20px 11px 12px',
                borderRadius: 22,
                background: '#ffffff',
                border: `1px solid ${borderColor}`,
                boxShadow: '0 10px 25px -4px rgba(0, 0, 0, 0.06), 0 4px 10px -2px rgba(0, 0, 0, 0.02)',
                maxWidth: 420,
                minWidth: 260,
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isError ? (
                  <AlertCircle size={18} strokeWidth={2.4} style={{ color: iconColor }} />
                ) : isInfo ? (
                  <Info size={18} strokeWidth={2.4} style={{ color: iconColor }} />
                ) : (
                  <Check size={18} strokeWidth={2.5} style={{ color: iconColor }} />
                )}
              </div>
              <span
                style={{
                  flex: 1,
                  fontSize: 14.5,
                  fontWeight: 500,
                  color: textColor,
                  lineHeight: 1.4,
                  letterSpacing: '-0.01em',
                }}
              >
                {t.message}
              </span>
              <button
                onClick={() => dismissToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: textColor,
                  opacity: 0.35,
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  flexShrink: 0,
                  marginLeft: 4,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                  e.currentTarget.style.backgroundColor = iconBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.35';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Dismiss"
                aria-label="Dismiss notification"
              >
                <X size={14} strokeWidth={2.2} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  AppRoutes — lives INSIDE <BrowserRouter> so it can read the        */
/*  current location for post-login redirect-back.                     */
/* ------------------------------------------------------------------ */
interface AppRoutesProps {
  isLoggedIn: boolean;
  loginUser: any;
  loginError: string;
  loginLoading: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onLogout: () => void;
}

/* ------------------------------------------------------------------ */
/*  PermissionGate — restricts child route access based on permissions */
/* ------------------------------------------------------------------ */
const PermissionGate: React.FC<{ module: string; children: React.ReactNode }> = ({ module, children }) => {
  const { currentUser } = useApp();
  const role = currentUser.role;

  // Admins have unrestricted access to all features
  if (role === 'admin') return <>{children}</>;

  // Fallback to role default permissions if custom permissions list is not explicitly populated
  const permissions = (currentUser.permissions && currentUser.permissions.length > 0)
    ? currentUser.permissions
    : getDefaultPermissionsForRole(role);

  if (permissions && permissions.includes(module)) {
    return <>{children}</>;
  }

  const firstAllowed = permissions && permissions[0];
  const redirectPath = firstAllowed && ROUTES[firstAllowed as keyof typeof ROUTES]
    ? ROUTES[firstAllowed as keyof typeof ROUTES]
    : DEFAULT_ROUTE;
  return <Navigate to={redirectPath} replace />;
};

const AppRoutes: React.FC<AppRoutesProps> = ({
  isLoggedIn, loginUser, loginError, loginLoading, onLogin, onLogout,
}) => {
  const location = useLocation();
  const intendedPath = (location.state as any)?.from?.pathname || DEFAULT_ROUTE;

  return (
    <Routes>
      <Route
        path="/portal/:token"
        element={
          <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-app)' }} />}>
            <ClientPortal />
          </Suspense>
        }
      />
      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate to={intendedPath} replace />
          ) : (
            <LoginScreen onLogin={onLogin} loginError={loginError} loginLoading={loginLoading} />
          )
        }
      />
      <Route
        path="/"
        element={
          isLoggedIn ? (
            <AppProvider initialUser={loginUser} initialUserId={loginUser?.id} onLogout={onLogout}>
              <MainLayout />
            </AppProvider>
          ) : (
            <Navigate to="/login" replace state={{ from: location }} />
          )
        }
      >
        <Route index element={<Navigate to={ROUTES.dashboard} replace />} />
        <Route path={ROUTES.dashboard} element={<PermissionGate module="dashboard"><Dashboard /></PermissionGate>} />
        <Route path={ROUTES.clients} element={<PermissionGate module="clients"><ClientsManager /></PermissionGate>} />
        <Route path={ROUTES.projects} element={<PermissionGate module="projects"><ProjectsAndTasks /></PermissionGate>} />
        <Route path={ROUTES.tasks} element={<PermissionGate module="tasks"><ProjectsAndTasks /></PermissionGate>} />
        <Route path={ROUTES.invoices} element={<PermissionGate module="invoices"><InvoicesManager /></PermissionGate>} />
        <Route path={ROUTES.finance} element={<PermissionGate module="finance"><FinanceManager /></PermissionGate>} />
        <Route path={ROUTES.expenses} element={<PermissionGate module="expenses"><ExpensesManager /></PermissionGate>} />
        <Route path={ROUTES.retention} element={<PermissionGate module="retention"><RetentionEngine /></PermissionGate>} />
        <Route path={ROUTES.chat} element={<PermissionGate module="chat"><ChatManager /></PermissionGate>} />
        <Route path={ROUTES.meetings} element={<PermissionGate module="meetings"><MeetingsCalendar /></PermissionGate>} />
        <Route path={ROUTES.leads} element={<PermissionGate module="leads"><LeadsPipeline /></PermissionGate>} />
        <Route path={ROUTES.team} element={<PermissionGate module="team"><TeamManager /></PermissionGate>} />
        <Route path={ROUTES.inbox} element={<PermissionGate module="inbox"><InboxManager /></PermissionGate>} />
        <Route path={ROUTES.settings} element={<PermissionGate module="settings"><SettingsManager /></PermissionGate>} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="*" element={<Navigate to={DEFAULT_ROUTE} replace />} />
    </Routes>
  );
};

/* ------------------------------------------------------------------ */
/*  App — root with auth gate + React Router                           */
/* ------------------------------------------------------------------ */
export const App: React.FC = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState<any>(null);
  const [loginError, setLoginError] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);

  const purgeAllWorkspaceCache = useCallback(() => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('retentio_local_') || key === 'retentio_active_user_id' || key === 'retentio_bypass_mode')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }, []);

  const handleForceLogout = useCallback((msg: string = 'Your session has expired. Please sign in again.') => {
    const isBypass = typeof localStorage !== 'undefined' && localStorage.getItem('retentio_bypass_mode') === 'true';
    if (isBypass) return;
    api.auth.logout().catch(() => {});
    clearToken();
    try {
      localStorage.removeItem('retentio_user');
      localStorage.removeItem('retentio_bypass_mode');
    } catch {}
    purgeAllWorkspaceCache();
    setLoginUser(null);
    setIsLoggedIn(false);
    setLoginError(msg);
  }, [purgeAllWorkspaceCache]);

  // Listen for session expiry event from API calls
  React.useEffect(() => {
    const handleExpiredEvent = (e: any) => {
      const msg = e.detail?.message || 'Your session has expired. Please sign in again.';
      handleForceLogout(msg);
    };
    window.addEventListener('retentio_session_expired', handleExpiredEvent);
    return () => {
      window.removeEventListener('retentio_session_expired', handleExpiredEvent);
    };
  }, [handleForceLogout]);

  // Restore authenticated session from saved user on mount
  React.useEffect(() => {
    const savedUser = localStorage.getItem('retentio_user');
    const isBypass = localStorage.getItem('retentio_bypass_mode') === 'true';
    if (savedUser) {
      try {
        const token = localStorage.getItem('retentio_token');
        if (!isBypass && !token) {
          // No valid auth token found — clear stale user state and prompt clean login
          localStorage.removeItem('retentio_user');
          setLoginUser(null);
          setIsLoggedIn(false);
          setAuthChecked(true);
          return;
        }

        const user = JSON.parse(savedUser);
        setLoginUser(user);
        setIsLoggedIn(true);

        if (!isBypass) {
          // Verify session validity with backend /auth/me
          api.auth.me()
            .then((res) => {
              if (res?.user) {
                setLoginUser(res.user);
                try {
                  localStorage.setItem('retentio_user', JSON.stringify(res.user));
                } catch {}
              }
            })
            .catch((err: any) => {
              const msg = err?.message || '';
              if (/session has expired|unauthorized|invalid token/i.test(msg) || err?.status === 401) {
                handleForceLogout('Your session has expired. Please sign in again.');
              }
            });
        }

        const onboardingDone = localStorage.getItem('retentio_onboarding_completed');
        if (!onboardingDone) {
          setShowOnboarding(true);
        }
      } catch (_) {
        clearToken();
        localStorage.removeItem('retentio_user');
        localStorage.removeItem('retentio_bypass_mode');
        setLoginUser(null);
        setIsLoggedIn(false);
      }
    }
    setAuthChecked(true);
  }, [handleForceLogout]);

  const handleOnboardingComplete = useCallback((data: any) => {
    localStorage.setItem('retentio_onboarding_completed', 'true');
    localStorage.setItem('retentio_onboarding_data', JSON.stringify(data));

    if (data.theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('retentio_theme', 'dark');
    } else if (data.theme === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('retentio_theme', 'light');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
      localStorage.removeItem('retentio_theme');
    }

    if (data.dashboardLayout) {
      localStorage.setItem('retentio_dashboard_layout', data.dashboardLayout);
    }
    if (data.dashboardFocus) {
      localStorage.setItem('retentio_dashboard_focus', data.dashboardFocus);
    }

    if (data.currency) {
      localStorage.setItem('retentio_currency', data.currency);
      localStorage.setItem('retentio_currency_symbol', data.currencySymbol || '₹');
    }

    // Sync onboarding selections to backend platform settings
    api.settings.update({
      currency: data.currency,
      currencySymbol: data.currencySymbol,
      industry: data.industry,
      teamSize: data.teamSize,
      goals: data.goals,
      dashboardLayout: data.dashboardLayout,
      dashboardFocus: data.dashboardFocus,
    }).catch(() => {});

    if (data.role || data.industry) {
      setLoginUser((prev: any) => {
        if (!prev) return prev;
        const roleLabel = data.roleLabel || (data.role === 'owner' ? 'Agency Owner' : data.role);
        const updated = {
          ...prev,
          designation: `${roleLabel}${data.industry ? ` · ${data.industry}` : ''}`,
          industry: data.industry || prev.industry,
        };
        localStorage.setItem('retentio_user', JSON.stringify(updated));
        return updated;
      });
    }

    window.dispatchEvent(new CustomEvent('retentio_preferences_updated', { detail: data }));
    setShowOnboarding(false);
  }, []);

  const handleOnboardingSkip = useCallback(() => {
    localStorage.setItem('retentio_onboarding_completed', 'true');
    setShowOnboarding(false);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await api.auth.login(email.trim().toLowerCase(), password);
      if (res && res.user) {
        if (res.token) {
          setToken(res.token);
        }
        localStorage.setItem('retentio_user', JSON.stringify(res.user));
        localStorage.removeItem('retentio_bypass_mode');
        setLoginUser(res.user);
        setIsLoggedIn(true);
        return;
      }
    } catch (_err: any) {
      // Backend rejected or network unavailable -> Bypass login kicks in with ANY credentials!
    } finally {
      setLoginLoading(false);
    }

    // Bypass login: Allow access with ANY credentials entered
    const emailNorm = email.trim().toLowerCase();
    const namePart = emailNorm.split('@')[0] || 'Agency Admin';
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const bypassUser = {
      id: 'usr_bypass_' + Math.random().toString(36).slice(2, 9),
      name: formattedName,
      email: emailNorm,
      phone: '+91 98765 43210',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      company: 'Agency Workspace',
      designation: 'Agency Owner & Managing Director',
      status: 'active',
    };
    try {
      localStorage.setItem('retentio_user', JSON.stringify(bypassUser));
      localStorage.setItem('retentio_bypass_mode', 'true');
    } catch {}
    setLoginUser(bypassUser);
    setIsLoggedIn(true);
  };

  const handleLogout = useCallback(() => {
    api.auth.logout().catch(() => {});
    clearToken();
    try {
      localStorage.removeItem('retentio_user');
      localStorage.removeItem('retentio_bypass_mode');
      localStorage.removeItem('retentio_token');
    } catch {}
    purgeAllWorkspaceCache();
    setLoginUser(null);
    setIsLoggedIn(false);
    setLoginError('');
  }, [purgeAllWorkspaceCache]);

  if (!authChecked) return <Splash />;

  return (
    <BrowserRouter>
      <ScrollToTop />
      <ErrorBoundary>
        <AppRoutes
          isLoggedIn={isLoggedIn}
          loginUser={loginUser}
          loginError={loginError}
          loginLoading={loginLoading}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
      </ErrorBoundary>

      {showOnboarding && loginUser && (
        <OnboardingWizard
          userName={loginUser.name || 'there'}
          userCompany={loginUser.company || loginUser.email || 'your workspace'}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </BrowserRouter>
  );
};

export default App;
