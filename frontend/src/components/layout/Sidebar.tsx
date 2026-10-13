import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { prefetchRoute } from '../../App';
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
  PanelLeft,
  X
} from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';

export const Sidebar: React.FC = () => {
  const { confirm, element: confirmDialog } = useConfirm();
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
    toggleSidebar,
    mobileSidebarOpen,
    setMobileSidebarOpen
  } = useApp();

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Log out of Retentio?',
      description: 'You will need to sign in again to access your clients and invoices.',
      confirmText: 'Log Out',
      icon: 'logout',
    });
    if (ok) logout();
  };

  const [hoverLogo, setHoverLogo] = React.useState(false);

  const role = currentUser.role;

  const unpaidCount = useMemo(
    () => invoices.filter(i => i.status === 'Sent' || i.status === 'Overdue').length,
    [invoices]
  );
  const pendingTaskCount = useMemo(
    () => tasks.filter(
      t => (role === 'admin' || role === 'hr' || t.assigneeId === currentUser.id) && t.status !== 'Completed'
    ).length,
    [tasks, role, currentUser.id]
  );
  const unreadChat = useMemo(
    () => conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0),
    [conversations]
  );

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

  const BadgePill = ({ item, isSelected }: { item: NavItem; isSelected?: boolean }) => {
    if (!item.badge) return null;
    const style = item.badgeVariant === 'danger'
      ? { background: 'var(--danger-bg)', color: 'var(--danger-text)', border: '1px solid var(--danger-border)' }
      : item.badgeVariant === 'warn'
      ? isSelected
        ? { background: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0' }
        : { background: 'var(--warn-bg)', color: 'var(--warn-text)', border: '1px solid var(--warn-border)' }
      : { background: 'var(--bg-raised, #f5f5f5)', color: 'var(--text-secondary, #525252)', border: '1px solid var(--border)' };
    return (
      <span style={{ display: 'inline-flex', padding: '1.5px 7px', borderRadius: 20, fontSize: 11, fontWeight: 700, ...style }}>
        {item.badge}
      </span>
    );
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isSelected = activeTab === item.id;
    return (
      <button
        type="button"
        onMouseEnter={() => prefetchRoute(item.id)}
        onFocus={() => prefetchRoute(item.id)}
        onClick={() => {
          setActiveTab(item.id);
          setMobileSidebarOpen(false);
        }}
        className={`nav-item ${isSelected ? 'active' : ''}`}
        title={sidebarCollapsed ? item.label : undefined}
        style={{
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          padding: sidebarCollapsed ? '10px 0' : '9px 12px',
          width: '100%',
          position: 'relative',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        <span
          className="flex items-center min-w-0"
          style={{
            gap: sidebarCollapsed ? 0 : 12,
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            width: sidebarCollapsed ? '100%' : 'auto',
          }}
        >
          <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={isSelected ? 2.1 : 1.8} />
          {!sidebarCollapsed && <span className="truncate" style={{ fontSize: '0.9375rem', fontWeight: isSelected ? 650 : 500 }}>{item.label}</span>}
        </span>
        {!sidebarCollapsed && <BadgePill item={item} isSelected={isSelected} />}
        {sidebarCollapsed && item.badge && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 12,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: item.badgeVariant === 'danger' ? 'var(--danger-text)' : 'var(--warn-text)',
            }}
          />
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Drawer Backdrop — sits below the drawer (z-40 vs z-50) */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          top-0 h-screen select-none flex flex-col shrink-0
          transition-transform duration-200 ease-out
          md:sticky md:translate-x-0 md:z-40
          ${mobileSidebarOpen
            ? 'fixed inset-y-0 left-0 z-50 translate-x-0 shadow-2xl'
            : 'fixed inset-y-0 left-0 z-50 -translate-x-full md:flex'}
        `}
        style={{
          width: sidebarCollapsed ? 70 : 245,
          background: 'var(--bg, #ffffff)',
          borderRight: '1px solid var(--border, #D0E0EF)',
        }}
      >
        {/* Header & Logo with hover-to-toggle when collapsed */}
        <div
          className="flex items-center"
          style={{
            height: 62,
            borderBottom: '1px solid var(--border, #D0E0EF)',
            flexShrink: 0,
            padding: sidebarCollapsed ? '0 10px' : '0 14px 0 16px',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          }}
        >
          {sidebarCollapsed ? (
            <div
              onMouseEnter={() => setHoverLogo(true)}
              onMouseLeave={() => setHoverLogo(false)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: 44,
              }}
            >
              {hoverLogo ? (
                <button
                  onClick={toggleSidebar}
                  title="Expand sidebar (Ctrl+B)"
                  style={{
                    background: 'var(--brand-navy-subtle, #F0F5FA)',
                    border: '1px solid var(--border, #D0E0EF)',
                    cursor: 'pointer',
                    padding: 7,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-navy, #0A2540)',
                    transition: 'all 0.15s ease',
                    boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06))',
                  }}
                >
                  <PanelLeft size={20} />
                </button>
              ) : (
                <button
                  onClick={toggleSidebar}
                  title="Hover to show expand button (Ctrl+B)"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  <img
                    src="/retentio-icon.png"
                    alt="Client-crm"
                    style={{ height: 28, width: 28, objectFit: 'contain' }}
                  />
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src="/retentio-icon.png"
                  alt="Retentio"
                  style={{ height: 28, width: 28, objectFit: 'contain', flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}
                >
                  Retentio
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={toggleSidebar}
                  title="Collapse sidebar (Ctrl+B)"
                  className="hidden md:flex"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '7px',
                    borderRadius: 8,
                    color: 'var(--text-secondary, #50667F)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--bg-raised, #F0F5FA)';
                    e.currentTarget.style.color = 'var(--text-primary, #0A2540)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.color = 'var(--text-secondary, #50667F)';
                  }}
                >
                  <PanelLeftClose size={18} />
                </button>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  title="Close sidebar"
                  className="flex md:hidden"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '7px',
                    borderRadius: 8,
                    color: 'var(--text-secondary, #50667F)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </>
          )}
        </div>

      {/* Navigation list */}
      <nav
        className="flex-1 overflow-y-auto"
        style={{
          padding: sidebarCollapsed ? '10px 6px' : '10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {!sidebarCollapsed && <div className="section-label" style={{ color: 'var(--text-muted, #50667F)' }}>Workspace</div>}
        {coreItems.map(i => <NavButton key={i.id} item={i} />)}

        {commItems.length > 0 && (
          <>
            <div className="divider mx-1 my-1.5" style={{ background: 'var(--border, #D0E0EF)' }} />
            {!sidebarCollapsed && <div className="section-label" style={{ color: 'var(--text-muted, #50667F)' }}>Communication</div>}
            {commItems.map(i => <NavButton key={i.id} item={i} />)}
          </>
        )}

        {sysItems.length > 0 && (
          <>
            <div className="divider mx-1 my-1.5" style={{ background: 'var(--border, #D0E0EF)' }} />
            {sysItems.map(i => <NavButton key={i.id} item={i} />)}
          </>
        )}
      </nav>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid var(--border, #D0E0EF)',
          padding: sidebarCollapsed ? '10px 6px' : '10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleLogout}
          title={sidebarCollapsed ? 'Log Out' : undefined}
          style={{
            width: '100%',
            padding: sidebarCollapsed ? '10px 0' : '9px 12px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            gap: 10,
            fontSize: 13.5,
            fontWeight: 650,
            color: 'var(--danger-text)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <LogOut style={{ width: 16, height: 16, flexShrink: 0 }} />
          {!sidebarCollapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
    {confirmDialog}
  </>
);
};
