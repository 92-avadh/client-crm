import React, { useState } from 'react';
import { api, getToken, setToken, clearToken } from './services/api';
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

  // Restore authenticated session from token & saved user on mount
  React.useEffect(() => {
    const token = getToken();
    const savedUser = localStorage.getItem('retentio_user');
    if (token && token !== 'demo_offline_token' && savedUser) {
      try {
        setLoginUser(JSON.parse(savedUser));
        setIsLoggedIn(true);
      } catch (_) {
        clearToken();
        localStorage.removeItem('retentio_user');
      }
    }
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
    localStorage.removeItem('retentio_custom_demo_user');
    setLoginUser(null);
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} loginError={loginError} loginLoading={loginLoading} />;
  }

  return (
    <AppProvider initialUser={loginUser} initialUserId={loginUser?.id} onLogout={handleLogout}>
      <MainLayout onLogout={handleLogout} />
    </AppProvider>
  );
};

export default App;
