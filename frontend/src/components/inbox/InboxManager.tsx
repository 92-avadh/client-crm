import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AppNotification } from '../../types';

type FilterTab = 'all' | 'unread' | 'alerts';

function getNotificationIcon(type: AppNotification['type']) {
  const iconStyle = { width: 18, height: 18 };
  switch (type) {
    case 'payment':      return <DollarSign style={iconStyle} />;
    case 'invoice':      return <FileText style={iconStyle} />;
    case 'assignment':   return <Users style={iconStyle} />;
    case 'retention':    return <AlertTriangle style={iconStyle} />;
    case 'task':         return <CheckSquare style={iconStyle} />;
    case 'meeting':      return <Calendar style={iconStyle} />;
    case 'lead':         return <Tag style={iconStyle} />;
    case 'subscription': return <Mail style={iconStyle} />;
    default:             return <Bell style={iconStyle} />;
  }
}

function getIconBg(type: AppNotification['type']): string {
  switch (type) {
    case 'payment':      return 'var(--success-bg)';
    case 'invoice':      return 'var(--info-bg)';
    case 'assignment':   return 'var(--accent-bg)';
    case 'retention':    return 'var(--warn-bg)';
    case 'task':         return 'var(--success-bg)';
    case 'meeting':      return 'var(--info-bg)';
    case 'lead':         return 'var(--danger-bg)';
    case 'subscription': return 'var(--success-bg)';
    default:             return 'var(--bg-raised)';
  }
}

function getIconColor(type: AppNotification['type']): string {
  switch (type) {
    case 'payment':      return 'var(--success-text)';
    case 'invoice':      return 'var(--info-text)';
    case 'assignment':   return 'var(--accent-text)';
    case 'retention':    return 'var(--warn-text)';
    case 'task':         return 'var(--success-text)';
    case 'meeting':      return 'var(--info-text)';
    case 'lead':         return 'var(--danger-text)';
    case 'subscription': return 'var(--success-text)';
    default:             return 'var(--text-secondary)';
  }
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
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
  const date = new Date(timestamp);
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

const EmptyState: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      gap: 16,
    }}
  >
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: 'var(--bg-raised)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Bell style={{ width: 32, height: 32, color: 'var(--text-muted)' }} />
    </div>
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
        All caught up!
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, margin: '6px 0 0' }}>
        You have no updates or alerts right now.
      </p>
    </div>
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
  const [hoveredNotifId, setHoveredNotifId] = useState<string | null>(null);

  // Role-filtered notifications
  const roleFilteredNotifications = notifications.filter((n) => {
    if (!n.recipientRoles || n.recipientRoles.length === 0) return true;
    return n.recipientRoles.includes(currentUser.role);
  });

  const unreadCount = roleFilteredNotifications.filter((n) => !n.isRead).length;
  const highPriorityAlerts = roleFilteredNotifications.filter((n) =>
    ['retention', 'payment', 'assignment'].includes(n.type)
  );
  const alertsCount = highPriorityAlerts.filter((n) => !n.isRead).length;
  const totalToday = roleFilteredNotifications.filter((n) => isToday(n.timestamp)).length;

  // Filtered notifications
  const visibleNotifications = roleFilteredNotifications.filter((n) => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'alerts') return ['retention', 'payment', 'assignment'].includes(n.type);
    return true;
  });

  const hasContent = visibleNotifications.length > 0;

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.linkModule) setActiveTab(notif.linkModule);
  };

  // ── Styles ──────────────────────────────────────────────────────────────────

  const tabStyle = (tab: FilterTab): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: activeFilter === tab ? 700 : 500,
    background: activeFilter === tab ? 'var(--solid-btn-bg)' : 'transparent',
    color: activeFilter === tab ? 'var(--solid-btn-text)' : 'var(--text-secondary)',
    transition: 'all 0.15s ease',
  });

  const badgeStyle = (count: number, active: boolean): React.CSSProperties => ({
    display: count > 0 ? 'inline-flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    fontSize: 10,
    fontWeight: 700,
    padding: '0 5px',
    background: active ? 'rgba(255,255,255,0.25)' : 'var(--solid-btn-bg)',
    color: active ? 'var(--solid-btn-text)' : 'var(--solid-btn-text)',
  });

  const cardStyle = (isRead: boolean, hovered: boolean): React.CSSProperties => ({
    display: 'flex',
    gap: 14,
    padding: '14px 16px',
    borderRadius: 10,
    background: hovered ? 'var(--bg-subtle)' : isRead ? 'var(--bg-card)' : 'var(--bg-subtle)',
    border: `1px solid ${hovered ? 'var(--border)' : isRead ? 'var(--border)' : 'var(--accent-bg)'}`,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    position: 'relative',
  });

  return (
    <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 760 }}>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Inbox & Alerts
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Keep track of client updates, invoices, and urgent notices.
          </p>
        </div>

        <button
          onClick={markAllNotificationsAsRead}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-raised)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)';
          }}
        >
          <CheckSquare style={{ width: 14, height: 14 }} />
          Mark all read
        </button>
      </div>

      {/* ── Stats Bar ────────────────────────────────────────────────────────── */}
      <div className="rg-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Unread Notes', value: unreadCount, icon: <Bell style={{ width: 16, height: 16, color: 'var(--warn-text)' }} />, accent: 'var(--warn-bg)' },
          { label: 'Important Alerts', value: alertsCount, icon: <AlertTriangle style={{ width: 16, height: 16, color: 'var(--danger-text)' }} />, accent: 'var(--danger-bg)' },
          { label: "Today's Updates", value: totalToday, icon: <Calendar style={{ width: 16, height: 16, color: 'var(--info-text)' }} />, accent: 'var(--info-bg)' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: stat.accent,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {stat.icon}
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>
                {stat.value}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0', fontWeight: 500 }}>
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Tabs ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '4px',
          background: 'var(--bg-raised)',
          borderRadius: 10,
          width: 'fit-content',
        }}
      >
        {(
          [
            { id: 'all' as FilterTab, label: 'All', count: roleFilteredNotifications.length },
            { id: 'unread' as FilterTab, label: 'Unread', count: unreadCount },
            { id: 'alerts' as FilterTab, label: 'Important', count: alertsCount },
          ] as { id: FilterTab; label: string; count: number }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            style={tabStyle(tab.id)}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={badgeStyle(tab.count, activeFilter === tab.id)}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── List ─────────────────────────────────────────────────────────────── */}
      {!hasContent ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-live="polite">
          {visibleNotifications.map((notif) => (
            <div
              key={notif.id}
              style={cardStyle(notif.isRead, hoveredNotifId === notif.id)}
              onClick={() => handleNotificationClick(notif)}
              onMouseEnter={() => setHoveredNotifId(notif.id)}
              onMouseLeave={() => setHoveredNotifId(null)}
            >
              {/* Icon */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: getIconBg(notif.type),
                  color: getIconColor(notif.type),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {getNotificationIcon(notif.type)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: notif.isRead ? 500 : 700,
                      color: 'var(--text-primary)',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {notif.title}
                  </p>
                  {!notif.isRead && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--info-text)',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {notif.message}
                </p>
              </div>

              {/* Timestamp & Quick Mark */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {formatTime(notif.timestamp)}
                </span>
                {hoveredNotifId === notif.id && !notif.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotificationAsRead(notif.id);
                    }}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 5,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-secondary)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InboxManager;
