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
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    retentionAlerts,
    invoices,
    tasks,
    conversations,
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
      <button onClick={() => setActiveTab(item.id)} className={`nav-item ${isActive ? 'active' : ''}`}>
        <span className="flex items-center gap-2.5 min-w-0">
          <Icon className="w-[15px] h-[15px] shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
          <span className="truncate">{item.label}</span>
        </span>
        <BadgePill item={item} />
      </button>
    );
  };

  return (
    <aside
      className="shrink-0 flex flex-col h-screen sticky top-0 select-none"
      style={{ width: 220, background: '#ffffff', borderRight: '1px solid #D0E0EF' }}
    >
      {/* Logo */}
      <div
        className="flex items-center px-4"
        style={{ height: 56, borderBottom: '1px solid #D0E0EF', flexShrink: 0 }}
      >
        <img
          src="/retentio-logo-horizontal.png"
          alt="Retentio"
          style={{ height: 26, width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div className="section-label" style={{ color: '#50667F' }}>Workspace</div>
        {coreItems.map(i => <NavButton key={i.id} item={i} />)}

        {commItems.length > 0 && (
          <>
            <div className="divider mx-1 my-1.5" style={{ background: '#D0E0EF' }} />
            <div className="section-label" style={{ color: '#50667F' }}>Communication</div>
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

      {/* Footer */}
      <div className="p-2.5" style={{ borderTop: '1px solid #D0E0EF' }}>
        <div
          className="px-3 py-2.5 rounded-lg"
          style={{ background: 'linear-gradient(135deg, #F0F5FA 0%, #ECFDF5 100%)', border: '1px solid #D0E0EF' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 750, color: '#0A2540' }}>Agency Pro</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D05E' }} />
          </div>
          <div style={{ fontSize: 10, color: '#50667F', marginTop: 2 }}>Renews Nov 1, 2026</div>
        </div>
      </div>
    </aside>
  );
};
