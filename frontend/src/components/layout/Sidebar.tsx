import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  CheckSquare,
  Receipt,
  Wallet,
  CreditCard,
  Activity,
  MessageSquare,
  CalendarDays,
  Target,
  Settings,
  Users,
  Inbox,
  LogOut,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    currentUser,
    logout,
    activeTab,
    setActiveTab,
    retentionAlerts,
    invoices,
    tasks,
    conversations,
    sidebarCollapsed,
    toggleSidebar
  } = useApp();

  const role = currentUser.role;

  const unpaidCount = invoices.filter(i => i.status === 'Sent' || i.status === 'Overdue').length;
  const pendingTaskCount = tasks.filter(
    t => (role === 'admin' || role === 'hr' || t.assigneeId === currentUser.id) && t.status !== 'Completed'
  ).length;
  const unreadChat = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeVariant?: 'danger' | 'warn' | 'neutral';
    roles: ('admin' | 'hr' | 'team' | 'brand')[];
  }

  const allItems: NavItem[] = [
    { id: 'dashboard',    label: 'Dashboard',          icon: LayoutDashboard, roles: ['admin','hr','team'] },
    { id: 'clients',      label: role === 'team' ? 'Assigned Clients' : 'Clients', icon: Building2, roles: ['admin','hr','team'] },
    { id: 'projects',     label: 'Projects',            icon: FolderKanban,    roles: ['admin','hr','team'] },
    { id: 'tasks',        label: 'Tasks',               icon: CheckSquare,     roles: ['admin','hr','team'],
      badge: pendingTaskCount || undefined, badgeVariant: 'warn' },
    { id: 'invoices',     label: 'Invoices & Billing',  icon: Receipt,         roles: ['admin','hr'],
      badge: unpaidCount || undefined, badgeVariant: 'warn' },
    { id: 'finance',      label: role === 'admin' ? 'Finance' : 'Payments', icon: Wallet, roles: ['admin','hr'] },
    { id: 'expenses',     label: 'Expenses',            icon: CreditCard,      roles: ['admin','hr'] },
    { id: 'retention',    label: 'Retention Engine',    icon: Activity,        roles: ['admin','hr','team'],
      badge: retentionAlerts.length > 0 ? retentionAlerts.length : undefined, badgeVariant: 'danger' },
    { id: 'team',         label: 'Team',                icon: Users,           roles: ['admin','hr'] },
    { id: 'inbox',        label: 'Inbox',               icon: Inbox,           roles: ['admin','hr','team','brand'],
      badge: unreadChat || undefined, badgeVariant: 'neutral' },
    { id: 'chat',         label: 'Chat',                icon: MessageSquare,   roles: ['admin','hr','team','brand'] },
    { id: 'meetings',     label: 'Meetings',            icon: CalendarDays,    roles: ['admin','hr','team','brand'] },
    { id: 'leads',        label: 'Leads Pipeline',      icon: Target,          roles: ['admin','hr'] },
    { id: 'settings',     label: 'Settings',            icon: Settings,        roles: ['admin','hr','team','brand'] },
  ];

  const items = allItems.filter(i => i.roles.includes(role));
  const coreItems = items.filter(i => !['chat','meetings','leads','settings'].includes(i.id));
  const commItems = items.filter(i => ['chat','meetings','leads'].includes(i.id));
  const sysItems  = items.filter(i => i.id === 'settings');

  const BadgePill = ({ item }: { item: NavItem }) => {
    if (!item.badge) return null;
    const style = item.badgeVariant === 'danger'
      ? { background: '#fce8e6', color: '#d93025' }
      : item.badgeVariant === 'warn'
      ? { background: '#fef3c7', color: '#92400e' }
      : { background: '#f5f5f5', color: '#525252' };
    return (
      <span style={{ display: 'inline-flex', padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700, ...style }}>
        {item.badge}
      </span>
    );
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        onClick={() => setActiveTab(item.id)}
        className={`nav-item ${isActive ? 'active' : ''}`}
        title={sidebarCollapsed ? item.label : undefined}
        style={{
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          padding: sidebarCollapsed ? '9px 0' : '8px 10px',
          width: '100%',
          position: 'relative',
        }}
      >
        <span
          className="flex items-center min-w-0"
          style={{
            gap: sidebarCollapsed ? 0 : 10,
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            width: sidebarCollapsed ? '100%' : 'auto',
          }}
        >
          <Icon className="w-[15px] h-[15px] shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
          {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
        </span>
        {!sidebarCollapsed && <BadgePill item={item} />}
        {sidebarCollapsed && item.badge && (
          <span
            style={{
              position: 'absolute',
              top: 7,
              right: 12,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: item.badgeVariant === 'danger' ? '#d93025' : '#f59e0b',
            }}
          />
        )}
      </button>
    );
  };

  return (
    <aside
      className="shrink-0 flex flex-col h-screen sticky top-0 select-none"
      style={{
        width: sidebarCollapsed ? 68 : 220,
        background: '#ffffff',
        borderRight: '1px solid #D0E0EF',
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 40,
      }}
    >
      {/* Header & Logo with 1-click collapse/expand */}
      <div
        className="flex items-center"
        style={{
          height: 56,
          borderBottom: '1px solid #D0E0EF',
          flexShrink: 0,
          padding: sidebarCollapsed ? '0 10px' : '0 12px 0 16px',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
        }}
      >
        {sidebarCollapsed ? (
          <button
            onClick={toggleSidebar}
            title="Expand sidebar (Ctrl+B)"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F0F5FA')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <img
              src="/retentio-icon.png"
              alt="Expand sidebar"
              style={{ height: 26, width: 26, objectFit: 'contain' }}
            />
          </button>
        ) : (
          <>
            <img
              src="/retentio-logo-horizontal.png"
              alt="Retentio"
              style={{ height: 26, width: 'auto', maxWidth: 136, objectFit: 'contain' }}
            />
            <button
              onClick={toggleSidebar}
              title="Collapse sidebar (Ctrl+B)"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: 6,
                color: '#50667F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#F0F5FA';
                e.currentTarget.style.color = '#0A2540';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#50667F';
              }}
            >
              <PanelLeftClose size={16} />
            </button>
          </>
        )}
      </div>

      {/* Navigation list */}
      <nav
        className="flex-1 overflow-y-auto"
        style={{
          padding: sidebarCollapsed ? '8px 6px' : '8px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {!sidebarCollapsed && <div className="section-label" style={{ color: '#50667F' }}>Workspace</div>}
        {coreItems.map(i => <NavButton key={i.id} item={i} />)}

        {commItems.length > 0 && (
          <>
            <div className="divider mx-1 my-1.5" style={{ background: '#D0E0EF' }} />
            {!sidebarCollapsed && <div className="section-label" style={{ color: '#50667F' }}>Communication</div>}
            {commItems.map(i => <NavButton key={i.id} item={i} />)}
          </>
        )}

        {sysItems.length > 0 && (
          <>
            <div className="divider mx-1 my-1.5" style={{ background: '#D0E0EF' }} />
            {sysItems.map(i => <NavButton key={i.id} item={i} />)}
          </>
        )}
      </nav>

      {/* Footer (Agency Pro badge removed as requested) */}
      <div
        style={{
          borderTop: '1px solid #D0E0EF',
          padding: sidebarCollapsed ? '8px 6px' : '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          flexShrink: 0,
        }}
      >
        <button
          onClick={logout}
          title={sidebarCollapsed ? 'Log Out' : undefined}
          style={{
            width: '100%',
            padding: sidebarCollapsed ? '8px 0' : '7px 10px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            gap: 8,
            fontSize: 12,
            fontWeight: 600,
            color: '#dc2626',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <LogOut style={{ width: 14, height: 14, flexShrink: 0 }} />
          {!sidebarCollapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
};
