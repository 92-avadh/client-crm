import React, { useState } from 'react';
import {
  Bell,
  DollarSign,
  FileText,
  Users,
  AlertTriangle,
  CheckSquare,
  Calendar,
  MessageSquare,
  Mail,
  Tag,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AppNotification, Conversation } from '../../types';

type FilterTab = 'all' | 'alerts' | 'chats';

function getNotificationIcon(type: AppNotification['type']) {
  const iconStyle = { width: 18, height: 18 };
  switch (type) {
    case 'payment':      return <DollarSign style={iconStyle} />;
    case 'invoice':      return <FileText style={iconStyle} />;
    case 'assignment':   return <Users style={iconStyle} />;
    case 'retention':    return <AlertTriangle style={iconStyle} />;
    case 'task':         return <CheckSquare style={iconStyle} />;
    case 'meeting':      return <Calendar style={iconStyle} />;
    case 'chat':         return <MessageSquare style={iconStyle} />;
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
    case 'chat':         return 'var(--accent-bg)';
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
    case 'chat':         return 'var(--text-secondary)';
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

const EmptyState: React.FC<{ tab: FilterTab }> = ({ tab }) => (
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
      {tab === 'chats' ? (
        <MessageSquare style={{ width: 32, height: 32, color: 'var(--text-muted)' }} />
      ) : (
        <Bell style={{ width: 32, height: 32, color: 'var(--text-muted)' }} />
      )}
    </div>
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
        {tab === 'chats' ? 'No unread chats' : 'All caught up!'}
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, margin: '6px 0 0' }}>
        {tab === 'chats'
          ? 'No conversations with unread messages right now.'
          : 'You have no notifications in this category.'}
      </p>
    </div>
  </div>
);

export const InboxManager: React.FC = () => {
  const {
    currentUser,
    notifications,
    conversations,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setActiveTab,
    setActiveConversationId,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [hoveredNotifId, setHoveredNotifId] = useState<string | null>(null);
  const [hoveredConvId, setHoveredConvId] = useState<string | null>(null);

  // Role-filtered notifications
  const roleFilteredNotifications = notifications.filter((n) => {
    if (!n.recipientRoles || n.recipientRoles.length === 0) return true;
    return n.recipientRoles.includes(currentUser.role);
  });

  const alertNotifications = roleFilteredNotifications.filter((n) => n.type !== 'chat');
  const chatNotifications = roleFilteredNotifications.filter((n) => n.type === 'chat');
  const unreadConversations = conversations.filter((c) => (c.unreadCount ?? 0) > 0);

  const unreadAlerts = alertNotifications.filter((n) => !n.isRead).length;
  const unreadChats =
    chatNotifications.filter((n) => !n.isRead).length +
    unreadConversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
  const totalToday = roleFilteredNotifications.filter((n) => isToday(n.timestamp)).length;

  // Tab counts
  const allCount = roleFilteredNotifications.filter((n) => !n.isRead).length + unreadConversations.length;
  const alertsCount = unreadAlerts;
  const chatsCount = unreadChats;

  // Items to render
  const visibleAlerts =
    activeFilter === 'all' || activeFilter === 'alerts' ? alertNotifications : [];
  const visibleChatNotifs =
    activeFilter === 'all' || activeFilter === 'chats' ? chatNotifications : [];
  const visibleConvs =
    activeFilter === 'all' || activeFilter === 'chats' ? unreadConversations : [];

  const hasContent =
    visibleAlerts.length > 0 || visibleChatNotifs.length > 0 || visibleConvs.length > 0;

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.linkModule) setActiveTab(notif.linkModule);
  };

  const handleConversationClick = (conv: Conversation) => {
    setActiveTab('chat');
    setActiveConversationId(conv.id);
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

  const convCardStyle = (hovered: boolean): React.CSSProperties => ({
    display: 'flex',
    gap: 14,
    padding: '14px 16px',
    borderRadius: 10,
    background: hovered ? 'var(--bg-subtle)' : 'var(--bg-card)',
    border: `1px solid ${hovered ? 'var(--border)' : 'var(--border)'}`,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 760 }}>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          paddingBottom: 20,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Inbox
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            All your messages and alerts in one place
          </p>
        </div>
        <button
          onClick={markAllNotificationsAsRead}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
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
          { label: 'Unread Alerts', value: unreadAlerts, icon: <Bell style={{ width: 16, height: 16, color: 'var(--warn-text)' }} />, accent: 'var(--warn-bg)' },
          { label: 'Unread Chats', value: unreadChats, icon: <MessageSquare style={{ width: 16, height: 16, color: 'var(--text-secondary)' }} />, accent: 'var(--accent-bg)' },
          { label: "Today's Notifications", value: totalToday, icon: <Calendar style={{ width: 16, height: 16, color: 'var(--info-text)' }} />, accent: 'var(--info-bg)' },
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
            { id: 'all' as FilterTab, label: 'All', count: allCount },
            { id: 'alerts' as FilterTab, label: 'Alerts', count: alertsCount },
            { id: 'chats' as FilterTab, label: 'Chats', count: chatsCount },
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
        <EmptyState tab={activeFilter} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Alert Notifications */}
          {visibleAlerts.length > 0 && (
            <section>
              {activeFilter === 'all' && (
                <h3
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    margin: '0 0 10px',
                  }}
                >
                  Alerts
                </h3>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {visibleAlerts.map((notif) => (
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
                          color: 'var(--text-muted)',
                          margin: 0,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {notif.message}
                      </p>
                    </div>

                    {/* Right side */}
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
            </section>
          )}

          {/* Chat Notifications */}
          {visibleChatNotifs.length > 0 && (
            <section>
              {activeFilter === 'all' && (
                <h3
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    margin: '0 0 10px',
                  }}
                >
                  Chat Notifications
                </h3>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {visibleChatNotifs.map((notif) => (
                  <div
                    key={notif.id}
                    style={cardStyle(notif.isRead, hoveredNotifId === `cn-${notif.id}`)}
                    onClick={() => handleNotificationClick(notif)}
                    onMouseEnter={() => setHoveredNotifId(`cn-${notif.id}`)}
                    onMouseLeave={() => setHoveredNotifId(null)}
                  >
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: notif.isRead ? 500 : 700,
                            color: 'var(--text-primary)',
                            margin: 0,
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
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{notif.message}</p>
                    </div>
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
                      {hoveredNotifId === `cn-${notif.id}` && !notif.isRead && (
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
                          }}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Conversations with unread messages */}
          {visibleConvs.length > 0 && (
            <section>
              <h3
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  margin: '0 0 10px',
                }}
              >
                Conversations
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {visibleConvs.map((conv) => (
                  <div
                    key={conv.id}
                    style={convCardStyle(hoveredConvId === conv.id)}
                    onClick={() => handleConversationClick(conv)}
                    onMouseEnter={() => setHoveredConvId(conv.id)}
                    onMouseLeave={() => setHoveredConvId(null)}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: 'var(--accent-bg)',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {conv.title.charAt(0).toUpperCase()}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          margin: 0,
                          marginBottom: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {conv.title}
                      </p>
                      {conv.lastMessage && (
                        <p
                          style={{
                            fontSize: 12,
                            color: 'var(--text-muted)',
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {conv.lastMessage}
                        </p>
                      )}
                    </div>

                    {/* Right side */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 6,
                        flexShrink: 0,
                      }}
                    >
                      {conv.lastMessageTime && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {formatTime(conv.lastMessageTime)}
                        </span>
                      )}
                      {(conv.unreadCount ?? 0) > 0 && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 20,
                            height: 20,
                            borderRadius: 10,
                            background: 'var(--solid-btn-bg)',
                            color: 'var(--solid-btn-text)',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '0 5px',
                          }}
                        >
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default InboxManager;
