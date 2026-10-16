import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Building2,
  Users,
  FileText,
  Loader2,
  UserPlus,
  X,
  User as UserIcon,
  Sparkles,
  Shield,
  Briefcase,
  Trash2,
} from 'lucide-react';
import { getSocket, emitTypingStatus } from '../../services/socket';
import type { User, Conversation } from '../../types';

export const ChatManager: React.FC = () => {
  const {
    currentUser,
    allUsers,
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    sendMessage,
    loadMessages,
    startDirectChat,
    markConversationRead,
    deleteMessage,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [searchConv, setSearchConv] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  const [isStartingChat, setIsStartingChat] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // userId -> userName

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Active conversation resolution
  const activeConv: Conversation | undefined =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];
  const currentMessages = activeConv ? messages[activeConv.id] || [] : [];

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (activeConv?.id) {
      setIsLoadingMessages(true);
      loadMessages(activeConv.id)
        .then(() => markConversationRead(activeConv.id))
        .finally(() => setIsLoadingMessages(false));
    }
  }, [activeConv?.id]);

  // Smooth scroll to bottom on new messages or typing state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length, typingUsers, activeConv?.id]);

  // Listen for socket user_typing events in the active conversation
  useEffect(() => {
    const s = getSocket();
    const handleUserTyping = (data: {
      conversationId: string;
      userId: string;
      userName: string;
      isTyping: boolean;
    }) => {
      if (data.conversationId !== activeConv?.id) return;
      if (data.userId === currentUser.id) return;

      setTypingUsers((prev) => {
        const next = { ...prev };
        if (data.isTyping) {
          next[data.userId] = data.userName;
        } else {
          delete next[data.userId];
        }
        return next;
      });
    };

    s.on('user_typing', handleUserTyping);
    return () => {
      s.off('user_typing', handleUserTyping);
    };
  }, [activeConv?.id, currentUser.id]);

  // Handle typing status broadcast with auto-clear debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (activeConv) {
      emitTypingStatus(activeConv.id, currentUser.id, currentUser.name, true);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (activeConv) {
          emitTypingStatus(activeConv.id, currentUser.id, currentUser.name, false);
        }
      }, 2200);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emitTypingStatus(activeConv.id, currentUser.id, currentUser.name, false);

    sendMessage(activeConv.id, inputText.trim());
    setInputText('');
  };

  const handleSimulateAttachment = () => {
    if (!activeConv) return;
    sendMessage(activeConv.id, 'Attached latest reconciliation statement for review.', [
      {
        name: 'GSTR2B_Reconciliation_Q3.pdf',
        size: '1.2 MB',
        url: '#',
        type: 'application/pdf',
      },
    ]);
  };

  const handleLaunchDirectChat = async (targetUserId: string) => {
    setIsStartingChat(targetUserId);
    try {
      await startDirectChat(targetUserId);
      setShowNewChatModal(false);
      setTeamSearch('');
    } finally {
      setIsStartingChat(null);
    }
  };

  // Filter conversations
  const visibleConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchConv.toLowerCase())
  );

  // Discover active agency team members for direct 1-on-1 chat
  const availableTeamMembers = (allUsers || []).filter(
    (u) =>
      u.role !== 'brand' &&
      u.id !== currentUser.id &&
      (u as any).isActive !== false &&
      (u.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(teamSearch.toLowerCase()) ||
        (u.designation || '').toLowerCase().includes(teamSearch.toLowerCase()) ||
        u.role.toLowerCase().includes(teamSearch.toLowerCase()))
  );

  return (
    <div
      className="animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, minHeight: 0 }}
    >
      {/* ── Page Header ────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)', flexShrink: 0 }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              Agency & Client Messaging
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 20,
                background: 'rgba(34, 197, 94, 0.12)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 6px #22c55e',
                }}
              />
              Live Sync
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            WhatsApp-style real-time delivery ticks, instant synchronization, and 1-on-1 team discovery.
          </p>
        </div>

        <button
          onClick={() => setShowNewChatModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 700,
            borderRadius: 9,
            background: 'var(--solid-btn-bg)',
            color: 'var(--solid-btn-text)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'opacity 0.15s ease',
          }}
        >
          <UserPlus style={{ width: 15, height: 15 }} />
          <span>New Direct Chat</span>
        </button>
      </div>

      {/* ── Main Chat Layout Card ───────────────────────────── */}
      <div
        className="flex-1 flex overflow-hidden"
        style={{
          minHeight: 0,
          border: '1px solid var(--border)',
          borderRadius: 14,
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="grid grid-cols-12 h-full w-full">
          {/* Left: Conversations Directory */}
          <div
            className="col-span-12 sm:col-span-4 flex flex-col h-full"
            style={{ background: 'var(--bg-subtle)', borderRight: '1px solid var(--border)' }}
          >
            {/* Header & Search */}
            <div
              style={{
                padding: 14,
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <MessageSquare style={{ width: 15, height: 15, color: 'var(--text-primary)' }} />
                  <span>Chats & Channels</span>
                </h2>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: 'var(--bg-raised)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="Direct 1-on-1 Chat with Colleague"
                >
                  <UserPlus style={{ width: 12, height: 12 }} />
                  <span>+ Team</span>
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <Search
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 14,
                    height: 14,
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchConv}
                  onChange={(e) => setSearchConv(e.target.value)}
                  style={{
                    width: '100%',
                    height: 34,
                    paddingLeft: 30,
                    paddingRight: 10,
                    fontSize: 12,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    outline: 'none',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            {/* Conversations List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {visibleConversations.length === 0 ? (
                <div
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 12,
                  }}
                >
                  No conversations match your search.
                </div>
              ) : (
                visibleConversations.map((conv) => {
                  const isActive = conv.id === activeConv?.id;
                  const isDirect = conv.type === 'direct';
                  const other = conv.otherMember;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversationId(conv.id)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 11,
                        cursor: 'pointer',
                        border: 'none',
                        borderBottom: '1px solid var(--border)',
                        borderLeft: isActive
                          ? '3px solid var(--border-focus)'
                          : '3px solid transparent',
                        background: isActive ? 'var(--bg-raised)' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Avatar / Icon */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: isDirect ? '50%' : 9,
                          background: isDirect ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-raised)',
                          color: isDirect ? '#0284c7' : 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 13,
                          flexShrink: 0,
                          overflow: 'hidden',
                          border: isDirect
                            ? '1px solid rgba(56, 189, 248, 0.25)'
                            : '1px solid var(--border)',
                        }}
                      >
                        {isDirect && other?.avatar ? (
                          <img
                            src={other.avatar}
                            alt={other.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : isDirect ? (
                          <span>{(other?.name || conv.title).charAt(0).toUpperCase()}</span>
                        ) : conv.type === 'brand' ? (
                          <Building2 style={{ width: 17, height: 17 }} />
                        ) : (
                          <Users style={{ width: 17, height: 17 }} />
                        )}
                      </div>

                      {/* Info & Last snippet */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {isDirect && other ? other.name : conv.title}
                            </span>
                            {isDirect && other?.designation && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  background: 'var(--bg-raised)',
                                  color: 'var(--text-muted)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {other.designation}
                              </span>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            {conv.lastMessageTime || ''}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            marginTop: 3,
                          }}
                        >
                          <p
                            style={{
                              fontSize: 11,
                              color: 'var(--text-secondary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              margin: 0,
                              flex: 1,
                            }}
                          >
                            {conv.lastMessage || 'No messages yet'}
                          </p>

                          {(conv.unreadCount || 0) > 0 && (
                            <span
                              style={{
                                minWidth: 18,
                                height: 18,
                                padding: '0 5px',
                                background: '#22c55e',
                                color: '#ffffff',
                                borderRadius: 9,
                                fontSize: 10,
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Active Chat Conversation */}
          <div
            className="col-span-12 sm:col-span-8 flex flex-col h-full"
            style={{ background: 'var(--bg-card)' }}
          >
            {activeConv ? (
              <>
                {/* Active Chat Header */}
                <div
                  style={{
                    padding: '12px 18px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: activeConv.type === 'direct' ? '50%' : 10,
                        background:
                          activeConv.type === 'direct'
                            ? 'rgba(56, 189, 248, 0.12)'
                            : 'var(--bg-raised)',
                        color: activeConv.type === 'direct' ? '#0284c7' : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 14,
                        overflow: 'hidden',
                        border:
                          activeConv.type === 'direct'
                            ? '1px solid rgba(56, 189, 248, 0.25)'
                            : '1px solid var(--border)',
                      }}
                    >
                      {activeConv.type === 'direct' && activeConv.otherMember?.avatar ? (
                        <img
                          src={activeConv.otherMember.avatar}
                          alt={activeConv.otherMember.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : activeConv.type === 'direct' ? (
                        <span>
                          {(activeConv.otherMember?.name || activeConv.title)
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      ) : (
                        <span>#</span>
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h3
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            margin: 0,
                          }}
                        >
                          {activeConv.type === 'direct' && activeConv.otherMember
                            ? activeConv.otherMember.name
                            : activeConv.title}
                        </h3>
                        {activeConv.type === 'direct' && activeConv.otherMember && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: 'var(--bg-raised)',
                              color: 'var(--text-primary)',
                              textTransform: 'capitalize',
                            }}
                          >
                            {activeConv.otherMember.designation || activeConv.otherMember.role}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          marginTop: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {activeConv.type === 'direct' ? (
                          <>
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: '#22c55e',
                                display: 'inline-block',
                              }}
                            />
                            <span>
                              Direct Colleague Chat • {activeConv.otherMember?.email || 'Agency Team'}
                            </span>
                          </>
                        ) : (
                          <span>End-to-end audit trail • Client & Team Channel</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={handleSimulateAttachment}
                      style={{
                        padding: '0 10px',
                        background: 'var(--bg-raised)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        height: 30,
                      }}
                      title="Attach statement or PDF document"
                    >
                      <Paperclip style={{ width: 13, height: 13 }} />
                      <span>Attach PDF</span>
                    </button>
                  </div>
                </div>

                {/* Messages Stream */}
                <div
                  aria-live="polite"
                  aria-busy={isLoadingMessages}
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  {isLoadingMessages && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                      <Loader2
                        size={22}
                        className="animate-spin"
                        style={{ color: 'var(--text-muted, #888888)' }}
                      />
                    </div>
                  )}

                  {currentMessages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;

                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {/* Sender header (only shown for incoming messages or team channels) */}
                        {!isMe && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginBottom: 3,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                              }}
                            >
                              {msg.senderName}
                            </span>
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                padding: '1px 4px',
                                borderRadius: 3,
                                background: 'var(--bg-raised)',
                              }}
                            >
                              {msg.senderRole}
                            </span>
                          </div>
                        )}

                        {/* WhatsApp-Style Message Bubble */}
                        <div
                          style={{
                            maxWidth: '75%',
                            padding: '9px 13px',
                            borderRadius: 12,
                            fontSize: 12.5,
                            lineHeight: 1.45,
                            background: isMe ? 'var(--solid-btn-bg)' : 'var(--bg-subtle)',
                            color: isMe ? 'var(--solid-btn-text)' : 'var(--text-primary)',
                            border: isMe ? '1px solid var(--border-focus)' : '1px solid var(--border)',
                            borderTopRightRadius: isMe ? 2 : 12,
                            borderTopLeftRadius: !isMe ? 2 : 12,
                            boxShadow: 'var(--shadow-xs)',
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap',
                              fontStyle: msg.isDeletedForEveryone ? 'italic' : 'normal',
                              opacity: msg.isDeletedForEveryone ? 0.75 : 1,
                            }}
                          >
                            {msg.isDeletedForEveryone ? '🚫 This message was deleted' : msg.text}
                          </div>

                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div
                              style={{
                                marginTop: 8,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                              }}
                            >
                              {msg.attachments.map((att, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: 6,
                                    background: isMe ? 'rgba(255,255,255,0.1)' : 'var(--bg-card)',
                                    border: isMe ? 'none' : '1px solid var(--border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 11,
                                  }}
                                >
                                  <FileText
                                    style={{
                                      width: 13,
                                      height: 13,
                                      color: isMe ? 'var(--solid-btn-text)' : 'var(--text-primary)',
                                    }}
                                  />
                                  <span style={{ fontWeight: 600, textDecoration: 'underline' }}>
                                    {att.name}
                                  </span>
                                  <span style={{ fontSize: 10, opacity: 0.8 }}>({att.size})</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Footer with Timestamp and WhatsApp Delivery Ticks */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: 4,
                              marginTop: 4,
                              fontSize: 10,
                              color: isMe ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
                            }}
                          >
                            <span>{msg.timestamp}</span>

                            {isMe && !msg.isDeletedForEveryone && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Delete this message for everyone?')) {
                                    deleteMessage(activeConv.id, msg.id, 'forEveryone');
                                  }
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '1px 3px',
                                  color: 'rgba(255,255,255,0.7)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  marginLeft: 2,
                                }}
                                title="Delete message"
                              >
                                <Trash2 style={{ width: 10, height: 10 }} />
                              </button>
                            )}

                            {isMe && (
                              <span
                                style={{ display: 'inline-flex', alignItems: 'center' }}
                                title={
                                  msg.isRead
                                    ? 'Delivered & Read (✓✓)'
                                    : 'Sent to Server (✓)'
                                }
                              >
                                {msg.isRead ? (
                                  <CheckCheck
                                    style={{
                                      width: 14,
                                      height: 14,
                                      color: '#38bdf8', // WhatsApp cyan/blue double check
                                    }}
                                  />
                                ) : (
                                  <Check
                                    style={{
                                      width: 13,
                                      height: 13,
                                      color: 'rgba(255,255,255,0.7)', // Single tick
                                    }}
                                  />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {Object.keys(typingUsers).length > 0 && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 12px',
                        borderRadius: 12,
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        fontSize: 11,
                        alignSelf: 'flex-start',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            background: '#38bdf8',
                            animation: 'bounce 1s infinite',
                          }}
                        />
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            background: '#38bdf8',
                            animation: 'bounce 1s infinite 0.2s',
                          }}
                        />
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            background: '#38bdf8',
                            animation: 'bounce 1s infinite 0.4s',
                          }}
                        />
                      </div>
                      <span style={{ fontStyle: 'italic' }}>
                        {Object.values(typingUsers).join(', ')}{' '}
                        {Object.values(typingUsers).length === 1 ? 'is' : 'are'} typing...
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Bar */}
                <form
                  onSubmit={handleSend}
                  style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <input
                    type="text"
                    placeholder={`Message in ${
                      activeConv.type === 'direct' && activeConv.otherMember
                        ? activeConv.otherMember.name
                        : activeConv.title
                    }...`}
                    value={inputText}
                    onChange={handleInputChange}
                    style={{
                      flex: 1,
                      height: 40,
                      paddingLeft: 14,
                      paddingRight: 14,
                      fontSize: 13,
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      outline: 'none',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    style={{
                      padding: '0 16px',
                      background: inputText.trim() ? 'var(--solid-btn-bg)' : 'var(--bg-raised)',
                      color: inputText.trim() ? 'var(--solid-btn-text)' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: inputText.trim() ? 'pointer' : 'default',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      height: 40,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Send style={{ width: 14, height: 14 }} />
                    <span>Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  gap: 12,
                }}
              >
                <MessageSquare style={{ width: 36, height: 36, opacity: 0.4 }} />
                <span>Select a conversation or start a new direct chat with a team member.</span>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 8,
                    background: 'var(--solid-btn-bg)',
                    color: 'var(--solid-btn-text)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <UserPlus style={{ width: 14, height: 14 }} />
                  <span>Choose Team Member</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Direct Chat Team Discovery Modal ───────────────── */}
      {showNewChatModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewChatModal(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '80vh',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  Direct 1-on-1 Chat
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Select an active agency member to launch real-time messaging.
                </p>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Modal Search */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  style={{
                    position: 'absolute',
                    left: 11,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 14,
                    height: 14,
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search colleagues by name, designation, or role..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    height: 38,
                    paddingLeft: 34,
                    paddingRight: 12,
                    fontSize: 13,
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    outline: 'none',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            {/* Modal Colleague List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
              {availableTeamMembers.length === 0 ? (
                <div
                  style={{
                    padding: '30px 16px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                  }}
                >
                  No colleagues found in directory matching "{teamSearch}".
                </div>
              ) : (
                availableTeamMembers.map((member) => {
                  const isStartingThis = isStartingChat === member.id;

                  return (
                    <div
                      key={member.id}
                      onClick={() => !isStartingThis && handleLaunchDirectChat(member.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        cursor: isStartingThis ? 'wait' : 'pointer',
                        transition: 'background 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-raised)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: 'rgba(56, 189, 248, 0.12)',
                            color: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 14,
                            flexShrink: 0,
                            overflow: 'hidden',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                          }}
                        >
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span>{member.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                              }}
                            >
                              {member.name}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: 4,
                                background: 'var(--bg-raised)',
                                color: 'var(--text-primary)',
                                textTransform: 'capitalize',
                              }}
                            >
                              {member.designation || member.role}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--text-muted)',
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginTop: 1,
                            }}
                          >
                            {member.email}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLaunchDirectChat(member.id);
                        }}
                        disabled={isStartingThis}
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 700,
                          borderRadius: 7,
                          background: 'var(--solid-btn-bg)',
                          color: 'var(--solid-btn-text)',
                          border: 'none',
                          cursor: isStartingThis ? 'wait' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          flexShrink: 0,
                        }}
                      >
                        {isStartingThis ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <MessageSquare style={{ width: 12, height: 12 }} />
                        )}
                        <span>{isStartingThis ? 'Connecting...' : 'Chat'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
