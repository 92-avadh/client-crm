import React, { Suspense, lazy, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { api, getToken, setToken, clearToken, DEV_BYPASS_TOKEN } from './services/api';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { LoginScreen } from './components/auth/LoginScreen';
import { OnboardingWizard } from './components/auth/OnboardingWizard';
import { StarParticles } from './components/layout/StarParticles';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ROUTES, DEFAULT_ROUTE } from './routes';

/* ------------------------------------------------------------------ */
/*  Lazy-loaded route components — code splitting for smaller bundle    */
/* ------------------------------------------------------------------ */
const Dashboard = lazy(() => import('./components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const ClientsManager = lazy(() => import('./components/clients/ClientsManager').then(m => ({ default: m.ClientsManager })));
const InvoicesManager = lazy(() => import('./components/invoices/InvoicesManager').then(m => ({ default: m.InvoicesManager })));
const FinanceManager = lazy(() => import('./components/finance/FinanceManager').then(m => ({ default: m.FinanceManager })));
const ExpensesManager = lazy(() => import('./components/expenses/ExpensesManager').then(m => ({ default: m.ExpensesManager })));
const RetentionEngine = lazy(() => import('./components/retention/RetentionEngine').then(m => ({ default: m.RetentionEngine })));
const ChatManager = lazy(() => import('./components/chat/ChatManager').then(m => ({ default: m.ChatManager })));
const ProjectsAndTasks = lazy(() => import('./components/projects/ProjectsAndTasks').then(m => ({ default: m.ProjectsAndTasks })));
const MeetingsCalendar = lazy(() => import('./components/calendar/MeetingsCalendar').then(m => ({ default: m.MeetingsCalendar })));
const LeadsPipeline = lazy(() => import('./components/leads/LeadsPipeline').then(m => ({ default: m.LeadsPipeline })));
const SettingsManager = lazy(() => import('./components/settings/SettingsManager').then(m => ({ default: m.SettingsManager })));
const TeamManager = lazy(() => import('./components/team/TeamManager').then(m => ({ default: m.TeamManager })));
const InboxManager = lazy(() => import('./components/inbox/InboxManager').then(m => ({ default: m.InboxManager })));

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

  return (
    <div
      className="flex min-h-screen transition-colors duration-200 relative"
      style={{
        background: 'var(--bg, #ffffff)',
        color: 'var(--text-primary, #0a0a0a)'
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
      <div className="fixed bottom-6 right-6 z-[2000] flex flex-col gap-3 pointer-events-none items-end">
        {toasts.map((t) => {
          const isError = t.type === 'error';
          const isInfo = t.type === 'info';
          const accentColor = isError ? '#EF4444' : isInfo ? '#6B7280' : '#059639';
          const bgColor = isError ? 'rgba(254, 242, 242, 0.85)' : isInfo ? 'rgba(249, 250, 251, 0.85)' : 'rgba(236, 253, 245, 0.85)';
          const borderColor = isError ? 'rgba(254, 202, 202, 0.5)' : isInfo ? 'rgba(229, 231, 235, 0.5)' : 'rgba(134, 239, 172, 0.5)';
          const textColor = isError ? '#991B1B' : isInfo ? '#374151' : '#065F46';
          const iconBg = isError ? 'rgba(239, 68, 68, 0.12)' : isInfo ? 'rgba(107, 114, 128, 0.12)' : 'rgba(5, 150, 57, 0.12)';

          return (
            <div
              key={t.id}
              className="pointer-events-auto toast-slide-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px 14px 12px',
                borderRadius: 14,
                background: bgColor,
                backdropFilter: 'blur(16px) saturate(180%)',
                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                border: `1px solid ${borderColor}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
                maxWidth: 360,
                minWidth: 280,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Accent bar */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                background: accentColor,
                borderRadius: '14px 0 0 14px',
              }} />

              {/* Progress bar */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: 3,
                background: accentColor,
                opacity: 0.4,
                animation: 'toastProgress 4s linear forwards',
                borderRadius: '0 0 14px 14px',
              }} />

              {/* Icon */}
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {isError ? (
                  <AlertCircle size={18} style={{ color: accentColor }} />
                ) : isInfo ? (
                  <Info size={18} style={{ color: accentColor }} />
                ) : (
                  <CheckCircle2 size={18} style={{ color: accentColor }} />
                )}
              </div>

              {/* Message */}
              <span style={{
                flex: 1,
                fontSize: 13,
                fontWeight: 600,
                color: textColor,
                lineHeight: 1.4,
              }}>
                {t.message}
              </span>

              {/* Close button */}
              <button
                onClick={() => dismissToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: textColor,
                  opacity: 0.4,
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                  flexShrink: 0,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
              >
                <X size={14} />
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

const AppRoutes: React.FC<AppRoutesProps> = ({
  isLoggedIn, loginUser, loginError, loginLoading, onLogin, onLogout,
}) => {
  const location = useLocation();

  // Where the user was headed before being bounced to /login, so a deep
  // link survives the login round-trip.
  const intendedPath = (location.state as any)?.from?.pathname || DEFAULT_ROUTE;

  return (
    <Routes>
      {/* Public route */}
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

      {/* Protected routes — wrapped in AppProvider */}
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
        <Route path={ROUTES.dashboard} element={<Dashboard />} />
        <Route path={ROUTES.clients} element={<ClientsManager />} />
        <Route path={ROUTES.projects} element={<ProjectsAndTasks />} />
        <Route path={ROUTES.tasks} element={<ProjectsAndTasks />} />
        <Route path={ROUTES.invoices} element={<InvoicesManager />} />
        <Route path={ROUTES.finance} element={<FinanceManager />} />
        <Route path={ROUTES.expenses} element={<ExpensesManager />} />
        <Route path={ROUTES.retention} element={<RetentionEngine />} />
        <Route path={ROUTES.chat} element={<ChatManager />} />
        <Route path={ROUTES.meetings} element={<MeetingsCalendar />} />
        <Route path={ROUTES.leads} element={<LeadsPipeline />} />
        <Route path={ROUTES.team} element={<TeamManager />} />
        <Route path={ROUTES.inbox} element={<InboxManager />} />
        <Route path={ROUTES.settings} element={<SettingsManager />} />
        {/* 404 — proper Not Found page */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Fallback for any other top-level path */}
      <Route path="*" element={<Navigate to={DEFAULT_ROUTE} replace />} />
    </Routes>
  );
};

// ── DEV LOGIN BYPASS FLAG ──────────────────────────────────────────
// Set to true to skip the login screen during development & testing.
// Flip to false before pushing to production to re-enable login.
const DEV_BYPASS_AUTH = false;

const DEV_BYPASS_USER = {
  id: 'usr_2e1cfeb769f379ea',
  name: 'Avadh Dhameliya',
  email: 'dhameliyaavadh592@gmail.com',
  phone: '+91 9999999999',
  role: 'admin' as const,
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
  designation: 'Founder, korav',
  assignedBrandIds: [],
};

/* ------------------------------------------------------------------ */
/*  App — root with auth gate + React Router                           */
/* ------------------------------------------------------------------ */
export const App: React.FC = () => {
  // authChecked guards against redirecting before we know whether a saved
  // session exists. Without it, a refresh on any deep link renders the
  // logged-out branch for one frame, gets bounced to /login, and then the
  // restore effect flips isLoggedIn — sending the user to /dashboard and
  // losing the URL they actually opened.
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState<any>(null);
  const [loginError, setLoginError] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState(false);

  // ── Onboarding state ──────────────────────────────────────
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Restore authenticated session from token & saved user on mount
  React.useEffect(() => {
    if (DEV_BYPASS_AUTH) {
      setToken(DEV_BYPASS_TOKEN);
      localStorage.setItem('retentio_user', JSON.stringify(DEV_BYPASS_USER));
      setLoginUser(DEV_BYPASS_USER);
      setIsLoggedIn(true);
      setAuthChecked(true);
      return;
    }

    const token = getToken();
    const savedUser = localStorage.getItem('retentio_user');
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setLoginUser(user);
        setIsLoggedIn(true);
        // Show onboarding if not completed
        const onboardingDone = localStorage.getItem('retentio_onboarding_completed');
        if (!onboardingDone) {
          setShowOnboarding(true);
        }
      } catch (_) {
        clearToken();
        localStorage.removeItem('retentio_user');
      }
    }
    setAuthChecked(true);
  }, []);

  const handleOnboardingComplete = useCallback((data: any) => {
    localStorage.setItem('retentio_onboarding_completed', 'true');
    localStorage.setItem('retentio_onboarding_data', JSON.stringify(data));

    // 1. Synchronize Theme
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

    // 2. Synchronize Dashboard Layout & Focus
    if (data.dashboardLayout) {
      localStorage.setItem('retentio_dashboard_layout', data.dashboardLayout);
    }
    if (data.dashboardFocus) {
      localStorage.setItem('retentio_dashboard_focus', data.dashboardFocus);
    }

    // 3. Synchronize User Role & Company/Industry in User State
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

    // 4. Dispatch site-wide event so all components adapt immediately
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

    const enteredEmail = (email || 'aryanhirapara@gmail.com').trim().toLowerCase();
    const rawName = enteredEmail.includes('@') ? enteredEmail.split('@')[0] : 'Aryan Hirapara';
    const cleanName = rawName
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    const activeUser = {
      ...DEV_BYPASS_USER,
      name: cleanName || DEV_BYPASS_USER.name,
      email: enteredEmail,
      designation: 'Agency Founder',
    };

    try {
      if (email && password) {
        const res = await api.auth.login(enteredEmail, password);
        setToken(res.token);
        const resolvedUser = res.user || activeUser;
        localStorage.setItem('retentio_user', JSON.stringify(resolvedUser));
        setLoginUser(resolvedUser);
        setIsLoggedIn(true);
        return;
      }
    } catch (_err) {
      // DEV BYPASS: Allow any email and password to log in without displaying errors
      console.log('⚡ Auth bypass triggered for entered credentials:', enteredEmail);
    } finally {
      setLoginLoading(false);
    }

    // Dev bypass: authenticate with the persistent session so any email/password works!
    setToken(DEV_BYPASS_TOKEN);
    localStorage.setItem('retentio_user', JSON.stringify(activeUser));
    setLoginUser(activeUser);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem('retentio_user');
    setLoginUser(null);
    setIsLoggedIn(false);
  };

  // Hold the splash until the saved session has been read. No routes are
  // mounted here, so the URL the user opened cannot be replaced by a redirect.
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

      {/* Onboarding Wizard — shown after first login */}
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
