import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { api, getToken, setToken, clearToken } from './services/api';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { LoginScreen } from './components/auth/LoginScreen';
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
  const { toasts, apiError } = useApp();

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
        <main className="flex-1 w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
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
      <div className="fixed bottom-6 right-6 z-[2000] flex flex-col gap-2 pointer-events-none items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 pl-4 pr-3 py-3 rounded-xl border text-xs font-semibold animate-fade-in ${
              t.type === 'error'
                ? 'bg-white text-red-700 border-red-200'
                : t.type === 'info'
                ? 'bg-white text-gray-700 border-gray-200'
                : 'bg-white text-green-700 border-green-200'
            }`}
            style={{ maxWidth: 340, boxShadow: '0 8px 24px rgba(0,0,0,.1)' }}
          >
            {t.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            ) : t.type === 'info' ? (
              <Info className="w-4 h-4 text-gray-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            )}
            <span className="flex-1">{t.message}</span>
            <X className="w-3.5 h-3.5 text-gray-400 hover:text-black cursor-pointer shrink-0" />
          </div>
        ))}
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

  // Restore authenticated session from token & saved user on mount
  React.useEffect(() => {
    const token = getToken();
    const savedUser = localStorage.getItem('retentio_user');
    if (token && savedUser) {
      try {
        setLoginUser(JSON.parse(savedUser));
        setIsLoggedIn(true);
      } catch (_) {
        clearToken();
        localStorage.removeItem('retentio_user');
      }
    }
    setAuthChecked(true);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    if (!email || !password) {
      setLoginError('Email and password are required');
      return;
    }
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await api.auth.login(email.trim().toLowerCase(), password);
      setToken(res.token);
      if (res.user) {
        localStorage.setItem('retentio_user', JSON.stringify(res.user));
        setLoginUser(res.user);
      }
      setIsLoggedIn(true);
    } catch (e: any) {
      setLoginError(e.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
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
    </BrowserRouter>
  );
};

export default App;
