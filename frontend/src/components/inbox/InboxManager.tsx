import React, { useState, useMemo } from 'react';
import {
  Bell,
  DollarSign,
  FileText,
  Users,
  AlertTriangle,
  CheckSquare,
  Calendar,
  Tag,
  Mail,
  Search,
  CheckCircle2,
  ArrowRight,
  Inbox,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AppNotification } from '../../types';

type FilterTab = 'all' | 'unread' | 'alerts' | 'today';

function getNotificationIcon(type: AppNotification['type']) {
  const iconStyle = { width: 18, height: 18 };
  switch (type) {
    case 'payment':
      return <DollarSign style={iconStyle} />;
    case 'invoice':
      return <FileText style={iconStyle} />;
    case 'assignment':
      return <Users style={iconStyle} />;
    case 'retention':
      return <AlertTriangle style={iconStyle} />;
    case 'task':
      return <CheckSquare style={iconStyle} />;
    case 'meeting':
      return <Calendar style={iconStyle} />;
    case 'lead':
      return <Tag style={iconStyle} />;
    case 'subscription':
      return <Mail style={iconStyle} />;
    default:
      return <Bell style={iconStyle} />;
  }
}

function getTypeLabel(type: AppNotification['type']): string {
  switch (type) {
    case 'payment':
      return 'Payment';
    case 'invoice':
      return 'Invoice';
    case 'assignment':
      return 'Client';
    case 'retention':
      return 'Health Alert';
    case 'task':
      return 'Task';
    case 'meeting':
      return 'Meeting';
    case 'lead':
      return 'Lead';
    case 'subscription':
      return 'Plan';
    default:
      return 'Update';
  }
}

function getIconBg(type: AppNotification['type']): string {
  switch (type) {
    case 'payment':
      return 'rgba(16, 185, 129, 0.12)';
    case 'invoice':
      return 'rgba(2, 132, 199, 0.12)';
    case 'assignment':
      return 'rgba(99, 102, 241, 0.12)';
    case 'retention':
      return 'rgba(245, 158, 11, 0.14)';
    case 'task':
      return 'rgba(16, 185, 129, 0.12)';
    case 'meeting':
      return 'rgba(139, 92, 246, 0.12)';
    case 'lead':
      return 'rgba(236, 72, 153, 0.12)';
    case 'subscription':
      return 'rgba(16, 185, 129, 0.12)';
    default:
      return 'var(--bg-raised)';
  }
}

function getIconColor(type: AppNotification['type']): string {
  switch (type) {
    case 'payment':
      return '#10b981';
    case 'invoice':
      return '#0284c7';
    case 'assignment':
      return '#6366f1';
    case 'retention':
      return '#f59e0b';
    case 'task':
      return '#10b981';
    case 'meeting':
      return '#8b5cf6';
    case 'lead':
      return '#ec4899';
    case 'subscription':
      return '#10b981';
    default:
      return 'var(--text-secondary)';
  }
}

function formatTime(timestamp: string): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return String(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function isToday(timestamp: string): boolean {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

const EmptyState: React.FC<{ hasSearch?: boolean; onReset?: () => void }> = ({ hasSearch, onReset }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      gap: 14,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16,
    }}
  >
    <div
      style={{
        width: 68,
        height: 68,
        borderRadius: 18,
        background: 'rgba(16, 185, 129, 0.1)',
        color: '#10b981',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Sparkles style={{ width: 30, height: 30 }} />
    </div>
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
        {hasSearch ? 'No matching updates' : 'All caught up!'}
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '6px 0 0' }}>
        {hasSearch
          ? 'Try a different keyword or clear your filters.'
          : 'You have no unread updates or alerts right now.'}
      </p>
    </div>
    {hasSearch && onReset && (
      <button
        type="button"
        onClick={onReset}
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
          color: 'var(--text-primary)',
          fontSize: 12.5,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Reset Filters
      </button>
    )}
  </div>
);

export const InboxManager: React.FC = () => {
  const {
    currentUser,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setActiveTab,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [hoveredNotifId, setHoveredNotifId] = useState<string | null>(null);

  const roleFilteredNotifications = useMemo(
    () =>
      notifications.filter((n) => {
        if (!n.recipientRoles || n.recipientRoles.length === 0) return true;
        if (n.targetUserId && n.targetUserId === currentUser.id) return true;
        return (
          n.recipientRoles.includes(currentUser.role) ||
          (currentUser.role !== 'brand' && n.recipientRoles.includes('team'))
        );
      }),
    [notifications, currentUser.id, currentUser.role]
  );

  const unreadCount = useMemo(
    () => roleFilteredNotifications.filter((n) => !n.isRead).length,
    [roleFilteredNotifications]
  );
  const alertsCount = useMemo(
    () =>
      roleFilteredNotifications.filter(
        (n) => !n.isRead && ['retention', 'payment', 'assignment'].includes(n.type)
      ).length,
    [roleFilteredNotifications]
  );
  const totalToday = useMemo(
    () => roleFilteredNotifications.filter((n) => isToday(n.timestamp)).length,
    [roleFilteredNotifications]
  );

  const visibleNotifications = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roleFilteredNotifications.filter((n) => {
      if (activeFilter === 'unread' && n.isRead) return false;
      if (activeFilter === 'alerts' && !['retention', 'payment', 'assignment'].includes(n.type)) return false;
      if (activeFilter === 'today' && !isToday(n.timestamp)) return false;
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      if (q) {
        const hay = `${n.title || ''} ${n.message || ''} ${getTypeLabel(n.type)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [roleFilteredNotifications, activeFilter, typeFilter, search]);

  const todayList = useMemo(
    () => visibleNotifications.filter((n) => isToday(n.timestamp)),
    [visibleNotifications]
  );
  const earlierList = useMemo(
    () => visibleNotifications.filter((n) => !isToday(n.timestamp)),
    [visibleNotifications]
  );

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.isRead) markNotificationAsRead(notif.id);
    if (notif.linkModule) setActiveTab(notif.linkModule);
  };

  const renderCard = (notif: AppNotification) => {
    const hovered = hoveredNotifId === notif.id;
    const iconColor = getIconColor(notif.type);
    const iconBg = getIconBg(notif.type);

    return (
      <div
        key={notif.id}
        onClick={() => handleNotificationClick(notif)}
        onMouseEnter={() => setHoveredNotifId(notif.id)}
        onMouseLeave={() => setHoveredNotifId(null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 20px',
          borderRadius: 14,
          background: hovered
            ? 'var(--bg-raised)'
            : notif.isRead
            ? 'var(--bg-card)'
            : 'var(--bg-subtle)',
          border: `1px solid ${
            hovered
              ? 'var(--border-strong, var(--border))'
              : notif.isRead
              ? 'var(--border)'
              : 'rgba(2, 132, 199, 0.35)'
          }`,
          cursor: 'pointer',
          transition: 'all 0.16s ease',
          transform: hovered ? 'translateY(-1px)' : 'none',
          boxShadow: hovered ? '0 8px 22px rgba(0, 0, 0, 0.06)' : 'none',
        }}
      >
        {/* Colored Category Icon */}
        <div
          data-tip={`${getTypeLabel(notif.type)} notification`}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {getNotificationIcon(notif.type)}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 999,
                background: iconBg,
                color: iconColor,
              }}
            >
              {getTypeLabel(notif.type)}
            </span>
            <p
              style={{
                fontSize: 14,
                fontWeight: notif.isRead ? 600 : 800,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {notif.title}
            </p>
            {!notif.isRead && (
              <span
                data-tip="Unread"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#0284c7',
                  flexShrink: 0,
                }}
              />
            )}
          </div>
          <p
            style={{
              fontSize: 12.5,
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {notif.message}
          </p>
        </div>

        {/* Right: Timestamp & Interactive Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {formatTime(notif.timestamp)}
          </span>

          {!notif.isRead && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                markNotificationAsRead(notif.id);
              }}
              data-tip="Mark this alert as read"
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap',
              }}
            >
              <CheckCircle2 size={13} style={{ color: '#10b981' }} />
              <span className="hidden sm:inline">Mark Read</span>
            </button>
          )}

          {notif.linkModule && (
            <span
              data-tip={`Open ${notif.linkModule}`}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: hovered ? 'var(--solid-btn-bg)' : 'var(--bg-subtle)',
                color: hovered ? 'var(--solid-btn-text)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <ArrowRight size={14} />
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* ── Full-Width Header ──────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          paddingBottom: 18,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            data-tip="Your workspace activity & alerts inbox"
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'rgba(2, 132, 199, 0.12)',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Inbox size={21} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Inbox &amp; Alerts
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '3px 0 0' }}>
              All client feedback, payment updates, invoices, and urgent notices in one full-width view.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={markAllNotificationsAsRead}
          disabled={unreadCount === 0}
          data-tip="Clear all unread dots at once"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 16px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: unreadCount > 0 ? 'var(--solid-btn-bg)' : 'var(--bg-card)',
            color: unreadCount > 0 ? 'var(--solid-btn-text)' : 'var(--text-muted)',
            fontSize: 13,
            fontWeight: 700,
            cursor: unreadCount > 0 ? 'pointer' : 'not-allowed',
            opacity: unreadCount > 0 ? 1 : 0.6,
          }}
        >
          <CheckCircle2 style={{ width: 15, height: 15 }} />
          <span>Mark all read ({unreadCount})</span>
        </button>
      </div>

      {/* ── Interactive Click-to-Filter Stat Cards ────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        {[
          {
            id: 'unread' as FilterTab,
            label: 'Unread Updates',
            sub: 'Needs your review',
            value: unreadCount,
            icon: <Bell style={{ width: 18, height: 18, color: '#f59e0b' }} />,
            bg: 'rgba(245, 158, 11, 0.12)',
            ring: '#f59e0b',
          },
          {
            id: 'alerts' as FilterTab,
            label: 'Important Alerts',
            sub: 'Payments, clients & health',
            value: alertsCount,
            icon: <AlertTriangle style={{ width: 18, height: 18, color: '#ef4444' }} />,
            bg: 'rgba(239, 68, 68, 0.12)',
            ring: '#ef4444',
          },
          {
            id: 'today' as FilterTab,
            label: "Today's Activity",
            sub: 'Updates received today',
            value: totalToday,
            icon: <Calendar style={{ width: 18, height: 18, color: '#0284c7' }} />,
            bg: 'rgba(2, 132, 199, 0.12)',
            ring: '#0284c7',
          },
        ].map((stat) => {
          const isSelected = activeFilter === stat.id;
          return (
            <button
              key={stat.id}
              type="button"
              onClick={() => setActiveFilter(isSelected ? 'all' : stat.id)}
              data-tip={`Click to filter by ${stat.label}`}
              style={{
                textAlign: 'left',
                padding: '16px 18px',
                borderRadius: 14,
                background: 'var(--bg-card)',
                border: isSelected ? `2px solid ${stat.ring}` : '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  background: stat.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stat.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Search & Filter Bar ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {(
            [
              { id: 'all', label: 'All', count: roleFilteredNotifications.length },
              { id: 'unread', label: 'Unread', count: unreadCount },
              { id: 'alerts', label: 'Important', count: alertsCount },
              { id: 'today', label: 'Today', count: totalToday },
            ] as { id: FilterTab; label: string; count: number }[]
          ).map((tab) => {
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 9,
                  border: active ? 'none' : '1px solid var(--border)',
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontWeight: active ? 700 : 600,
                  background: active ? 'var(--solid-btn-bg)' : 'var(--bg-card)',
                  color: active ? 'var(--solid-btn-text)' : 'var(--text-secondary)',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '1px 7px',
                    borderRadius: 999,
                    background: active ? 'rgba(255,255,255,0.2)' : 'var(--bg-subtle)',
                    color: active ? 'inherit' : 'var(--text-muted)',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by category"
            title="Filter updates by category"
            style={{
              padding: '8px 12px',
              borderRadius: 9,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="all">All Categories</option>
            <option value="payment">Payments</option>
            <option value="invoice">Invoices</option>
            <option value="retention">Health Alerts</option>
            <option value="task">Tasks</option>
            <option value="assignment">Clients</option>
            <option value="meeting">Meetings</option>
          </select>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: 240, flex: '1 1 260px', maxWidth: 360 }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search updates, clients, or invoices..."
            style={{
              width: '100%',
              padding: '9px 34px 9px 36px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              title="Clear search"
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Full-Width Notification Feed ───────────────────────────────── */}
      {visibleNotifications.length === 0 ? (
        <EmptyState
          hasSearch={Boolean(search || activeFilter !== 'all' || typeFilter !== 'all')}
          onReset={() => {
            setSearch('');
            setActiveFilter('all');
            setTypeFilter('all');
          }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} aria-live="polite">
          {todayList.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                Today ({todayList.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {todayList.map(renderCard)}
              </div>
            </div>
          )}

          {earlierList.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                Earlier ({earlierList.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {earlierList.map(renderCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InboxManager;
