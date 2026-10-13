import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  CheckCheck,
  Building2,
  Users,
  FileText,
  Loader2
} from 'lucide-react';

export const ChatManager: React.FC = () => {
  const {
    currentUser,
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    sendMessage,
    loadMessages
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [searchConv, setSearchConv] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      setIsLoadingMessages(true);
      loadMessages(activeConversationId).finally(() => setIsLoadingMessages(false));
    }
  }, [activeConversationId]);

  const activeConv = conversations.find((c) => c.id === activeConversationId) || conversations[0];
  const currentMessages = activeConv ? messages[activeConv.id] || [] : [];

  const visibleConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchConv.toLowerCase())
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;
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
        type: 'application/pdf'
      }
    ]);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1, minHeight: 0 }}>
      {/* ── Page Header ────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 20, borderBottom: '1px solid var(--border)', flexShrink: 0 }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Agency & Client Messaging
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Real-time chat channels, direct team communications, and client updates.
          </p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-card)' }}>
        <div className="grid grid-cols-12 h-full w-full">
          {/* Left Conversation List */}
          <div className="col-span-12 sm:col-span-4 flex flex-col h-full" style={{ background: 'var(--bg-subtle)', borderRight: '1px solid var(--border)' }}>
            {/* Header & Search */}
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageSquare style={{ width: 15, height: 15, color: 'var(--text-primary)' }} />
                  <span>Channels & Direct Messages</span>
                </h2>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'var(--bg-raised)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Real-time
                </span>
              </div>

              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search conversations..."
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

            {/* Conversations */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {visibleConversations.map((conv) => {
                const isActive = conv.id === activeConv?.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      cursor: 'pointer',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      borderLeft: isActive ? '3px solid var(--border-focus)' : '3px solid transparent',
                      background: isActive ? 'var(--bg-raised)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'var(--bg-raised)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 12,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {conv.type === 'brand' ? <Building2 style={{ width: 16, height: 16 }} /> : <Users style={{ width: 16, height: 16 }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.title}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {conv.lastMessageTime || 'Today'}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    {(conv.unreadCount || 0) > 0 && (
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          background: 'var(--solid-btn-bg)',
                          color: 'var(--solid-btn-text)',
                          borderRadius: '50%',
                          fontSize: 9,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Active Chat Pane */}
          <div className="col-span-12 sm:col-span-8 flex flex-col h-full" style={{ background: 'var(--bg-card)' }}>
            {activeConv ? (
              <>
                {/* Chat Header */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-raised)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                      #
                    </div>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{activeConv.title}</h3>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        End-to-end audit trail • Linked to Client Profile
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={handleSimulateAttachment}
                      style={{ padding:'0 10px', background: 'var(--bg-raised)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius:10, fontSize:11, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, height:30 }}
                      title="Simulate sending PDF Statement"
                    >
                      <Paperclip style={{ width: 12, height: 12 }} />
                      <span>Attach PDF</span>
                    </button>
                  </div>
                </div>

                {/* Messages Scroll Area */}
                <div
                  aria-live="polite"
                  aria-busy={isLoadingMessages}
                  style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>
                            {isMe ? 'You' : msg.senderName} ({msg.senderRole.toUpperCase()})
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{msg.timestamp}</span>
                        </div>

                        <div
                          style={{
                            maxWidth: 440,
                            padding: '10px 14px',
                            borderRadius: 12,
                            fontSize: 12,
                            lineHeight: 1.5,
                            background: isMe ? 'var(--solid-btn-bg)' : 'var(--bg-subtle)',
                            color: isMe ? 'var(--solid-btn-text)' : 'var(--text-primary)',
                            border: isMe ? '1px solid var(--border-focus)' : '1px solid var(--border)',
                            borderTopRightRadius: isMe ? 2 : 12,
                            borderTopLeftRadius: !isMe ? 2 : 12,
                          }}
                        >
                          {msg.text}

                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                                  <FileText style={{ width: 13, height: 13, color: isMe ? 'var(--solid-btn-text)' : 'var(--text-primary)' }} />
                                  <span style={{ fontWeight: 600, textDecoration: 'underline' }}>{att.name}</span>
                                  <span style={{ fontSize: 10, opacity: 0.8 }}>({att.size})</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          {isMe && <CheckCheck style={{ width: 12, height: 12, color: 'var(--text-muted)' }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Message Input Bar */}
                <form
                  onSubmit={handleSend}
                  style={{
                    padding: 12,
                    borderTop: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <input
                    type="text"
                    placeholder={`Message in ${activeConv.title}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    style={{
                      flex: 1,
                      height: 38,
                      paddingLeft: 14,
                      paddingRight: 14,
                      fontSize: 12,
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      outline: 'none',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button type="submit" style={{ padding:'0 14px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, height:38 }}>
                    <Send style={{ width: 14, height: 14 }} />
                    <span>Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                Select a conversation to start chatting.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
