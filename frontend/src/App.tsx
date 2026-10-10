import React, { useState } from 'react';
import { api, setToken, clearToken } from './services/api';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { Dashboard } from './components/dashboard/Dashboard';
import { ClientsManager } from './components/clients/ClientsManager';
import { InvoicesManager } from './components/invoices/InvoicesManager';
import { FinanceManager } from './components/finance/FinanceManager';
import { ExpensesManager } from './components/expenses/ExpensesManager';
import { RetentionEngine } from './components/retention/RetentionEngine';
import { ChatManager } from './components/chat/ChatManager';
import { ProjectsAndTasks } from './components/projects/ProjectsAndTasks';
import { MeetingsCalendar } from './components/calendar/MeetingsCalendar';
import { LeadsPipeline } from './components/leads/LeadsPipeline';
import { SettingsManager } from './components/settings/SettingsManager';
import { TeamManager } from './components/team/TeamManager';
import { InboxManager } from './components/inbox/InboxManager';
import { LoginScreen } from './components/auth/LoginScreen';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const MainLayout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { activeTab, toasts } = useApp();

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <ClientsManager />;
      case 'projects':
      case 'tasks':
        return <ProjectsAndTasks />;
      case 'invoices':
        return <InvoicesManager />;
      case 'finance':
        return <FinanceManager />;
      case 'expenses':
        return <ExpensesManager />;
      case 'retention':
        return <RetentionEngine />;
      case 'chat':
        return <ChatManager />;
      case 'meetings':
        return <MeetingsCalendar />;
      case 'leads':
        return <LeadsPipeline />;
      case 'team':
        return <TeamManager />;
      case 'inbox':
        return <InboxManager />;
      case 'settings':
        return <SettingsManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen text-black" style={{ background: '#ffffff' }}>
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="flex-1 w-full px-8 py-8">
          {renderActiveModule()}
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

export const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState<any>(null);
  const [loginError, setLoginError] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (userId: string, email?: string, password?: string) => {
    setLoginError('');
    setLoginLoading(true);
    try {
      let resolvedEmail = email;
      let resolvedPassword = password;

      // Quick-login button passes userId without creds — resolve from known list
      if (!resolvedEmail || !resolvedPassword) {
        const demoCredentials: Record<string, { email: string; password: string }> = {
          'user_admin':      { email: 'alex@retentio.co',     password: 'Admin@1234' },
          'usr_admin':       { email: 'alex@retentio.co',     password: 'Admin@1234' },
          'user_hr':         { email: 'sarah.j@retentio.co',  password: 'Admin@1234' },
          'usr_hr':          { email: 'sarah.j@retentio.co',  password: 'Admin@1234' },
          'user_team1':      { email: 'rahul.v@retentio.co',  password: 'Admin@1234' },
          'usr_team_rahul':  { email: 'rahul.v@retentio.co',  password: 'Admin@1234' },
          'user_team2':      { email: 'priya.s@retentio.co',  password: 'Admin@1234' },
          'usr_team_priya':  { email: 'priya.s@retentio.co',  password: 'Admin@1234' },
          'user_brand_apex': { email: 'vikram@apexmedia.in',  password: 'Admin@1234' },
          'usr_brand_vikram':{ email: 'vikram@apexmedia.in',  password: 'Admin@1234' },
        };
        const creds = demoCredentials[userId];
        if (creds) { resolvedEmail = creds.email; resolvedPassword = creds.password; }
      }

      if (resolvedEmail && resolvedPassword) {
        try {
          const res = await api.auth.login(resolvedEmail, resolvedPassword);
          setToken(res.token);
          setLoginUser(res.user);
        } catch (apiErr: any) {
          // If backend is unreachable (network error / not running), allow demo login
          const isNetworkError = apiErr.message === 'Failed to fetch' || apiErr.message?.includes('NetworkError') || apiErr.message?.includes('fetch');
          if (isNetworkError) {
            // Fall back to local demo user — find by email in INITIAL_USERS
            const { INITIAL_USERS } = await import('./data/mockData');
            const fallbackUser = INITIAL_USERS.find(u => u.email === resolvedEmail);
            if (fallbackUser) {
              // Store a fake token so context doesn't try to reload
              setToken('demo_offline_token');
              setLoginUser(fallbackUser);
            } else {
              throw new Error('Backend is not running. Start the server and try again.');
            }
          } else {
            throw apiErr;
          }
        }
      } else {
        throw new Error('Email and password are required');
      }
      setIsLoggedIn(true);
    } catch (e: any) {
      setLoginError(e.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    setLoginUser(null);
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} loginError={loginError} loginLoading={loginLoading} />;
  }

  return (
    <AppProvider initialUser={loginUser} initialUserId={loginUser?.id}>
      <MainLayout onLogout={handleLogout} />
    </AppProvider>
  );
};

export default App;
