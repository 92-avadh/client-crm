import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  CheckSquare,
  Receipt,
  Wallet,
  Activity,
  MessageSquare,
  CalendarDays,
  Target,
  Settings,
  Zap,
  Globe,
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
    { id: 'clientPortal', label: 'Client Portal',       icon: Globe,           roles: ['brand','admin'] },
    { id: 'clients',      label: role === 'team' ? 'Assigned Clients' : 'Clients', icon: Building2, roles: ['admin','hr','team'] },
    { id: 'projects',     label: 'Projects',            icon: FolderKanban,    roles: ['admin','hr','team'] },
    { id: 'tasks',        label: 'Tasks',               icon: CheckSquare,     roles: ['admin','hr','team'],
      badge: pendingTaskCount || undefined, badgeVariant: 'warn' },
    { id: 'invoices',     label: 'Invoices & Billing',  icon: Receipt,         roles: ['admin','hr'],
      badge: unpaidCount || undefined, badgeVariant: 'warn' },
    { id: 'finance',      label: role === 'admin' ? 'Finance' : 'Payments', icon: Wallet, roles: ['admin','hr'] },
    { id: 'retention',    label: 'Retention Engine',    icon: Activity,        roles: ['admin','hr','team'],
      badge: retentionAlerts.length > 0 ? retentionAlerts.length : undefined, badgeVariant: 'danger' },
    { id: 'chat',         label: 'Inbox & Chat',        icon: MessageSquare,   roles: ['admin','hr','team','brand'],
      badge: unreadChat || undefined, badgeVariant: 'neutral' },
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
    const cls = item.badgeVariant === 'danger'
      ? 'badge badge-danger'
      : item.badgeVariant === 'warn'
      ? 'badge badge-warning'
      : 'badge badge-neutral';
    return <span className={cls}>{item.badge}</span>;
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
      style={{ width: 220, background: '#ffffff', borderRight: '1px solid #e2e2e2' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-4"
        style={{ height: 56, borderBottom: '1px solid #e2e2e2', flexShrink: 0 }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: '#0a0a0a' }}
        >
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-extrabold text-[15px] text-black tracking-tight">Retentio</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div className="section-label">Workspace</div>
        {coreItems.map(i => <NavButton key={i.id} item={i} />)}

        {commItems.length > 0 && (
          <>
            <div className="divider mx-1 my-1.5" />
            <div className="section-label">Communication</div>
            {commItems.map(i => <NavButton key={i.id} item={i} />)}
          </>
        )}

        {sysItems.length > 0 && (
          <>
            <div className="divider mx-1 my-1.5" />
            {sysItems.map(i => <NavButton key={i.id} item={i} />)}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-2.5" style={{ borderTop: '1px solid #e2e2e2' }}>
        <div
          className="px-3 py-2.5 rounded-lg"
          style={{ background: '#f7f7f7', border: '1px solid #e2e2e2' }}
        >
          <div className="text-[11px] font-bold text-black">Agency Pro</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Renews Nov 1, 2026</div>
        </div>
      </div>
    </aside>
  );
};
