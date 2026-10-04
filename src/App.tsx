import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { Dashboard } from './components/dashboard/Dashboard';
import { ClientsManager } from './components/clients/ClientsManager';
import { InvoicesManager } from './components/invoices/InvoicesManager';
import { FinanceManager } from './components/finance/FinanceManager';
import { RetentionEngine } from './components/retention/RetentionEngine';
import { ChatManager } from './components/chat/ChatManager';
import { ProjectsAndTasks } from './components/projects/ProjectsAndTasks';
import { MeetingsCalendar } from './components/calendar/MeetingsCalendar';
import { LeadsPipeline } from './components/leads/LeadsPipeline';
import { ClientPortal } from './components/clientPortal/ClientPortal';
import { SettingsManager } from './components/settings/SettingsManager';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const MainLayout: React.FC = () => {
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
      case 'retention':
        return <RetentionEngine />;
      case 'chat':
        return <ChatManager />;
      case 'meetings':
        return <MeetingsCalendar />;
      case 'leads':
        return <LeadsPipeline />;
      case 'clientPortal':
        return <ClientPortal />;
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
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
