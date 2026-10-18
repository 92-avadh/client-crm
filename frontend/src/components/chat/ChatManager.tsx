import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Phone,
  Video,
  MoreVertical,
  Smile,
  Mic,
  Pin,
  Star,
  VolumeX,
  Volume2,
  Reply,
  Copy,
  Trash2,
  Info,
  ChevronDown,
  Plus,
  Image as ImageIcon,
  ArrowLeft,
  Sparkles,
  Lock,
  Download,
} from 'lucide-react';
import { getSocket, emitTypingStatus } from '../../services/socket';
import type { User, Conversation, ChatMessage } from '../../types';
import { useConfirm } from '../../hooks/useConfirm';

// WhatsApp Brand Palette Tokens
const WA = {
  emerald: '#00a884',
  emeraldHover: '#06cf9c',
  tealTick: '#53bdeb',
  grayTick: '#8696a0',
  dark: {
    appBg: '#0c1317',
    sidebarBg: '#111b21',
    headerBg: '#202c33',
    itemHover: '#202c33',
    itemActive: '#2a3942',
    chatBg: '#0b141a',
    sentBubble: '#005c4b',
    sentText: '#e9edef',
    receivedBubble: '#202c33',
    receivedText: '#e9edef',
    inputBarBg: '#202c33',
    inputPillBg: '#2a3942',
    inputText: '#d1d7db',
    textPrimary: '#e9edef',
    textSecondary: '#8696a0',
    border: '#222d34',
    badgeBg: '#00a884',
    badgeText: '#ffffff',
    pillActiveBg: '#00a884',
    pillActiveText: '#ffffff',
    pillInactiveBg: '#202c33',
    pillInactiveText: '#8696a0',
    encryptionBg: '#182229',
    quoteBg: 'rgba(0, 0, 0, 0.22)',
  },
  light: {
    appBg: '#f0f2f5',
    sidebarBg: '#ffffff',
    headerBg: '#f0f2f5',
    itemHover: '#f5f6f6',
    itemActive: '#f0f2f5',
    chatBg: '#efeae2',
    sentBubble: '#d9fdd3',
    sentText: '#111b21',
    receivedBubble: '#ffffff',
    receivedText: '#111b21',
    inputBarBg: '#f0f2f5',
    inputPillBg: '#ffffff',
    inputText: '#111b21',
    textPrimary: '#111b21',
    textSecondary: '#667781',
    border: '#e9edef',
    badgeBg: '#25d366',
    badgeText: '#ffffff',
    pillActiveBg: '#00a884',
    pillActiveText: '#ffffff',
    pillInactiveBg: '#f0f2f5',
    pillInactiveText: '#54656f',
    encryptionBg: '#ffffff',
    quoteBg: 'rgba(0, 0, 0, 0.05)',
  },
};

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const EXTENDED_EMOJIS = ['😊', '😂', '❤️', '👍', '🔥', '🎉', '🚀', '🙏', '👏', '💡', '💯', '🤝', '🙌', '✨', '☕', '💪'];

export const ChatManager: React.FC = () => {
  const { confirm, element: confirmDialog } = useConfirm();
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
    showToast,
  } = useApp();

  // State management
  const [inputText, setInputText] = useState('');
  const [searchConv, setSearchConv] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  const [isStartingChat, setIsStartingChat] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // userId -> userName

  // Filter chips: All, Unread, Favourites, Groups
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'favourites' | 'groups'>('all');

  // WhatsApp interaction states
  const [pinnedConvIds, setPinnedConvIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('wa_pinned_chats');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [favouriteConvIds, setFavouriteConvIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('wa_fav_chats');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [mutedConvIds, setMutedConvIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('wa_muted_chats');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Message Reactions (persisted locally)
  const [reactions, setReactions] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('wa_message_reactions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // In-chat search state
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');

  // Context menus & modals
  const [chatContextMenu, setChatContextMenu] = useState<{ convId: string; x: number; y: number } | null>(null);
  const [messageContextMenu, setMessageContextMenu] = useState<{ message: ChatMessage; x: number; y: number } | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  // Quoted reply state
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Attach drawer and emoji drawer
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);

  // Sidebar mobile toggle
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Save pinned & favourites
  useEffect(() => {
    try {
      localStorage.setItem('wa_pinned_chats', JSON.stringify(Array.from(pinnedConvIds)));
    } catch {}
  }, [pinnedConvIds]);

  useEffect(() => {
    try {
      localStorage.setItem('wa_fav_chats', JSON.stringify(Array.from(favouriteConvIds)));
    } catch {}
  }, [favouriteConvIds]);

  useEffect(() => {
    try {
      localStorage.setItem('wa_muted_chats', JSON.stringify(Array.from(mutedConvIds)));
    } catch {}
  }, [mutedConvIds]);

  useEffect(() => {
    try {
      localStorage.setItem('wa_message_reactions', JSON.stringify(reactions));
    } catch {}
  }, [reactions]);

  // Active conversation resolution
  const activeConv: Conversation | undefined =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];
  const currentMessages = activeConv ? messages[activeConv.id] || [] : [];

  // Load messages on active conversation change
  useEffect(() => {
    if (activeConv?.id) {
      setIsLoadingMessages(true);
      setReplyingTo(null);
      setShowInChatSearch(false);
      setInChatSearchQuery('');
      loadMessages(activeConv.id)
        .then(() => markConversationRead(activeConv.id))
        .finally(() => setIsLoadingMessages(false));
    }
  }, [activeConv?.id]);

  // Scroll to bottom
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

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setChatContextMenu(null);
      setMessageContextMenu(null);
      setShowAttachMenu(false);
      setShowEmojiPicker(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Handle typing debounce
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
      }, 2000);
    }
  };

  // Play subtle WhatsApp-style audio tick
  const playSentSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emitTypingStatus(activeConv.id, currentUser.id, currentUser.name, false);

    let messageBody = inputText.trim();
    if (replyingTo) {
      messageBody = `> [Reply to ${replyingTo.senderName}: "${replyingTo.text.slice(0, 80)}"]\n\n${messageBody}`;
    }

    sendMessage(activeConv.id, messageBody);
    playSentSound();
    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  // Quick reaction trigger
  const handleToggleReaction = (messageId: string, emoji: string) => {
    setReactions((prev) => {
      const current = prev[messageId] || [];
      const updated = current.includes(emoji)
        ? current.filter((e) => e !== emoji)
        : [...current, emoji];
      return { ...prev, [messageId]: updated };
    });
    setMessageContextMenu(null);
  };

  // Pin / Unpin
  const togglePinChat = (id: string) => {
    setPinnedConvIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setChatContextMenu(null);
  };

  // Favourite / Unfavourite
  const toggleFavChat = (id: string) => {
    setFavouriteConvIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setChatContextMenu(null);
  };

  // Mute / Unmute
  const toggleMuteChat = (id: string) => {
    setMutedConvIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setChatContextMenu(null);
  };

  // Attachment dispatch
  const handleAttachDocument = (type: 'pdf' | 'image' | 'generic') => {
    if (!activeConv) return;
    setShowAttachMenu(false);

    if (type === 'pdf') {
      sendMessage(activeConv.id, 'Shared document: Retainer Agreement & Statement.pdf', [
        {
          name: 'Retainer_Agreement_Q4.pdf',
          size: '1.4 MB',
          url: '#',
          type: 'application/pdf',
        },
      ]);
      playSentSound();
      showToast('Document sent successfully', 'success');
    } else if (type === 'image') {
      sendMessage(activeConv.id, 'Shared campaign creatives & design previews.', [
        {
          name: 'Campaign_Banner_Preview.png',
          size: '3.1 MB',
          url: '#',
          type: 'image/png',
        },
      ]);
      playSentSound();
      showToast('Media sent successfully', 'success');
    }
  };

  const handleLaunchDirectChat = async (targetUserId: string) => {
    setIsStartingChat(targetUserId);
    try {
      await startDirectChat(targetUserId);
      setShowNewChatModal(false);
      setTeamSearch('');
      setShowMobileSidebar(false);
    } finally {
      setIsStartingChat(null);
    }
  };

  // Filter conversations based on search and active filter pill
  const filteredConversations = useMemo(() => {
    return conversations
      .filter((conv) => {
        const matchesSearch = conv.title.toLowerCase().includes(searchConv.toLowerCase());
        if (!matchesSearch) return false;

        if (activeFilter === 'unread') {
          return (conv.unreadCount || 0) > 0;
        }
        if (activeFilter === 'favourites') {
          return favouriteConvIds.has(conv.id);
        }
        if (activeFilter === 'groups') {
          return conv.type === 'brand' || conv.type === 'team';
        }
        return true;
      })
      .sort((a, b) => {
        // Pinned conversations always on top
        const aPinned = pinnedConvIds.has(a.id) ? 1 : 0;
        const bPinned = pinnedConvIds.has(b.id) ? 1 : 0;
        return bPinned - aPinned;
      });
  }, [conversations, searchConv, activeFilter, pinnedConvIds, favouriteConvIds]);

  // Filter messages in chat search
  const visibleMessages = useMemo(() => {
    if (!inChatSearchQuery.trim()) return currentMessages;
    return currentMessages.filter((m) =>
      m.text.toLowerCase().includes(inChatSearchQuery.toLowerCase())
    );
  }, [currentMessages, inChatSearchQuery]);

  // Discover team members for new direct chats
  const availableTeamMembers = useMemo(() => {
    return (allUsers || []).filter(
      (u) =>
        u.role !== 'brand' &&
        u.id !== currentUser.id &&
        (u as any).isActive !== false &&
        (u.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(teamSearch.toLowerCase()) ||
          (u.designation || '').toLowerCase().includes(teamSearch.toLowerCase()) ||
          u.role.toLowerCase().includes(teamSearch.toLowerCase()))
    );
  }, [allUsers, currentUser.id, teamSearch]);

  // Quick video meet launcher
  const handleStartGoogleMeet = () => {
    const room = 'meet-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 6);
    const url = `https://meet.google.com/new`;
    window.open(url, '_blank');
    if (activeConv) {
      sendMessage(activeConv.id, `📹 I've started an instant Google Meet room. Join here: ${url}`);
      showToast('Meeting room link shared in chat', 'success');
    }
  };

  return (
    <div
      className="whatsapp-container animate-fade-in"
      style={{
        display: 'flex',
        height: 'calc(100vh - 120px)',
        minHeight: '620px',
        maxHeight: 'calc(100vh - 110px)',
        width: '100%',
        background: '#111b21',
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid #222d34',
        boxShadow: '0 20px 45px rgba(0,0,0,0.3)',
        position: 'relative',
        color: '#e9edef',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* LEFT SIDEBAR: WHATSAPP CHATS DIRECTORY                             */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div
        className={`wa-sidebar ${showMobileSidebar ? 'flex' : 'hidden md:flex'}`}
        style={{
          width: '100%',
          maxWidth: '380px',
          height: '100%',
          background: '#111b21',
          borderRight: '1px solid #222d34',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            padding: '12px 16px',
            background: '#202c33',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #222d34',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#00a884',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 14,
                overflow: 'hidden',
                border: '1.5px solid rgba(255,255,255,0.1)',
              }}
              title={currentUser.name}
            >
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                currentUser.name.charAt(0).toUpperCase()
              )}
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: '#e9edef', margin: 0, letterSpacing: '-0.01em' }}>
              Chats
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* New Chat Button (Circular Green) */}
            <button
              onClick={() => setShowNewChatModal(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#00a884',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              title="Start a new direct chat"
            >
              <Plus style={{ width: 20, height: 20 }} strokeWidth={2.5} />
            </button>

            {/* Menu dots */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNewChatModal(true);
              }}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'transparent',
                color: '#8696a0',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Options"
            >
              <MoreVertical style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '8px 12px', background: '#111b21', borderBottom: '1px solid #222d34' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#202c33',
              borderRadius: 8,
              padding: '0 12px',
              height: 36,
            }}
          >
            <Search style={{ width: 15, height: 15, color: '#8696a0', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search or start a new chat"
              value={searchConv}
              onChange={(e) => setSearchConv(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#e9edef',
                fontSize: 13,
              }}
            />
            {searchConv && (
              <button
                onClick={() => setSearchConv('')}
                style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer', padding: 0 }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
        </div>

        {/* WhatsApp Filter Chips: All, Unread, Favourites, Groups */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            background: '#111b21',
            borderBottom: '1px solid #222d34',
            overflowX: 'auto',
          }}
        >
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'favourites', label: 'Favourites' },
              { id: 'groups', label: 'Clients & Teams' },
            ] as const
          ).map((chip) => {
            const isActive = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  whiteSpace: 'nowrap',
                  background: isActive ? '#00a884' : '#202c33',
                  color: isActive ? '#ffffff' : '#8696a0',
                  transition: 'all 0.15s ease',
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredConversations.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: '#8696a0', fontSize: 13 }}>
              <MessageSquare style={{ width: 32, height: 32, margin: '0 auto 8px', opacity: 0.4 }} />
              <div>No chats found</div>
              <p style={{ fontSize: 11, marginTop: 4 }}>Try clearing search or filters</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConv?.id;
              const isDirect = conv.type === 'direct';
              const other = conv.otherMember;
              const isPinned = pinnedConvIds.has(conv.id);
              const isMuted = mutedConvIds.has(conv.id);
              const isFav = favouriteConvIds.has(conv.id);

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    setShowMobileSidebar(false);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setChatContextMenu({ convId: conv.id, x: e.clientX, y: e.clientY });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: isActive ? '#2a3942' : 'transparent',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'background 0.12s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = '#202c33';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Avatar with Online indicator */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        background: isDirect ? 'rgba(0, 168, 132, 0.2)' : '#202c33',
                        color: isDirect ? '#00a884' : '#e9edef',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 16,
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {isDirect && other?.avatar ? (
                        <img src={other.avatar} alt={other.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : isDirect ? (
                        (other?.name || conv.title).charAt(0).toUpperCase()
                      ) : conv.type === 'brand' ? (
                        <Building2 style={{ width: 20, height: 20 }} />
                      ) : (
                        <Users style={{ width: 20, height: 20 }} />
                      )}
                    </div>
                    {/* Emerald Online dot */}
                    {isDirect && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 1,
                          right: 1,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: '#00a884',
                          border: '2px solid #111b21',
                        }}
                      />
                    )}
                  </div>

                  {/* Chat Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Top Row: Title & Time */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 14.5,
                          fontWeight: (conv.unreadCount || 0) > 0 ? 800 : 600,
                          color: '#e9edef',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isDirect && other ? other.name : conv.title}
                      </span>
                      <span style={{ fontSize: 11, color: (conv.unreadCount || 0) > 0 ? '#00a884' : '#8696a0', flexShrink: 0, fontWeight: (conv.unreadCount || 0) > 0 ? 700 : 400 }}>
                        {conv.lastMessageTime || ''}
                      </span>
                    </div>

                    {/* Bottom Row: Snippet + Ticks + Unread Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, flex: 1 }}>
                        {/* Delivery ticks */}
                        <CheckCheck style={{ width: 14, height: 14, color: '#53bdeb', flexShrink: 0 }} />
                        <span
                          style={{
                            fontSize: 12,
                            color: '#8696a0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {conv.lastMessage || 'No messages yet'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {isMuted && <VolumeX style={{ width: 13, height: 13, color: '#8696a0' }} />}
                        {isPinned && <Pin style={{ width: 13, height: 13, color: '#8696a0', transform: 'rotate(45deg)' }} />}
                        {(conv.unreadCount || 0) > 0 && (
                          <span
                            style={{
                              minWidth: 19,
                              height: 19,
                              padding: '0 5px',
                              borderRadius: 10,
                              background: '#00a884',
                              color: '#ffffff',
                              fontSize: 11,
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* RIGHT SIDE: ACTIVE WHATSAPP CHAT CONVERSATION                     */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div
        className={`wa-chat-window ${!showMobileSidebar ? 'flex' : 'hidden md:flex'}`}
        style={{
          flex: 1,
          flexDirection: 'column',
          height: '100%',
          background: '#0b141a',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {activeConv ? (
          <>
            {/* ── Active Header ───────────────────────────────────────── */}
            <div
              style={{
                height: 60,
                padding: '0 16px',
                background: '#202c33',
                borderBottom: '1px solid #222d34',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                zIndex: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Mobile back button */}
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="md:hidden"
                  style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer', padding: 4 }}
                >
                  <ArrowLeft style={{ width: 18, height: 18 }} />
                </button>

                {/* Avatar */}
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: activeConv.type === 'direct' ? 'rgba(0, 168, 132, 0.2)' : '#202c33',
                      color: activeConv.type === 'direct' ? '#00a884' : '#e9edef',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 15,
                      overflow: 'hidden',
                    }}
                  >
                    {activeConv.type === 'direct' && activeConv.otherMember?.avatar ? (
                      <img src={activeConv.otherMember.avatar} alt={activeConv.otherMember.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : activeConv.type === 'direct' ? (
                      (activeConv.otherMember?.name || activeConv.title).charAt(0).toUpperCase()
                    ) : (
                      <Users style={{ width: 18, height: 18 }} />
                    )}
                  </div>
                  {activeConv.type === 'direct' && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#00a884',
                        border: '2px solid #202c33',
                      }}
                    />
                  )}
                </div>

                {/* Contact Name & Status */}
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e9edef', margin: 0, lineHeight: 1.2 }}>
                    {activeConv.type === 'direct' && activeConv.otherMember ? activeConv.otherMember.name : activeConv.title}
                  </h3>
                  <div style={{ fontSize: 11, color: '#8696a0', marginTop: 2 }}>
                    {activeConv.type === 'direct' ? (
                      <span style={{ color: '#00a884', fontWeight: 600 }}>online</span>
                    ) : (
                      <span>tap here for group info</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Action Buttons (Video, Phone, Search, Options) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  onClick={handleStartGoogleMeet}
                  style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' }}
                  title="Start instant video call (Google Meet)"
                >
                  <Video style={{ width: 19, height: 19 }} />
                </button>
                <button
                  onClick={handleStartGoogleMeet}
                  style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' }}
                  title="Audio call"
                >
                  <Phone style={{ width: 18, height: 18 }} />
                </button>
                <button
                  onClick={() => setShowInChatSearch((prev) => !prev)}
                  style={{
                    background: showInChatSearch ? 'rgba(0, 168, 132, 0.15)' : 'transparent',
                    border: 'none',
                    color: showInChatSearch ? '#00a884' : '#8696a0',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Search in this chat"
                >
                  <Search style={{ width: 18, height: 18 }} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatContextMenu({ convId: activeConv.id, x: e.clientX, y: e.clientY });
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' }}
                  title="More options"
                >
                  <MoreVertical style={{ width: 18, height: 18 }} />
                </button>
              </div>
            </div>

            {/* In-chat search dropdown bar */}
            {showInChatSearch && (
              <div
                style={{
                  padding: '8px 16px',
                  background: '#202c33',
                  borderBottom: '1px solid #222d34',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  zIndex: 9,
                }}
              >
                <Search style={{ width: 15, height: 15, color: '#8696a0' }} />
                <input
                  type="text"
                  placeholder="Search in conversation..."
                  value={inChatSearchQuery}
                  onChange={(e) => setInChatSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    background: '#111b21',
                    border: '1px solid #222d34',
                    borderRadius: 6,
                    padding: '6px 12px',
                    color: '#e9edef',
                    fontSize: 12.5,
                    outline: 'none',
                  }}
                />
                {inChatSearchQuery && (
                  <span style={{ fontSize: 11, color: '#8696a0' }}>
                    {visibleMessages.length} match{visibleMessages.length === 1 ? '' : 'es'}
                  </span>
                )}
                <button
                  onClick={() => {
                    setShowInChatSearch(false);
                    setInChatSearchQuery('');
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>
            )}

            {/* ── Chat Messages Wall (with WhatsApp Doodle Wallpaper) ─── */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                position: 'relative',
                background: '#0b141a',
                backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), radial-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 12px 12px',
              }}
            >
              {/* Privacy Notice Pill */}
              <div
                style={{
                  alignSelf: 'center',
                  background: '#182229',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 11,
                  color: '#8696a0',
                  textAlign: 'center',
                  maxWidth: '85%',
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                <Lock style={{ width: 12, height: 12, color: '#e9edef', flexShrink: 0 }} />
                <span>Messages are end-to-end encrypted. No one outside of this chat can read or listen to them.</span>
              </div>

              {/* Date Capsule */}
              <div
                style={{
                  alignSelf: 'center',
                  background: '#182229',
                  borderRadius: 6,
                  padding: '4px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#8696a0',
                  marginBottom: 10,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              >
                TODAY
              </div>

              {isLoadingMessages && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                  <Loader2 size={24} className="animate-spin" style={{ color: '#00a884' }} />
                </div>
              )}

              {/* Messages Loop */}
              {visibleMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                const isHovered = hoveredMessageId === msg.id;
                const msgReactions = reactions[msg.id] || [];

                // Check if message is a quoted reply
                const hasQuote = msg.text.startsWith('> [Reply to');
                let quoteText = '';
                let actualText = msg.text;
                if (hasQuote) {
                  const parts = msg.text.split('\n\n');
                  quoteText = parts[0].replace('> ', '');
                  actualText = parts.slice(1).join('\n\n');
                }

                return (
                  <div
                    key={msg.id}
                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                      position: 'relative',
                      margin: '2px 0',
                    }}
                  >
                    {/* Message Bubble Container */}
                    <div style={{ position: 'relative', maxWidth: '72%' }}>
                      {/* Floating Emoji Reaction Bar on Hover (Screenshot 3) */}
                      {isHovered && !msg.isDeletedForEveryone && (
                        <div
                          style={{
                            position: 'absolute',
                            top: -38,
                            [isMe ? 'right' : 'left']: 0,
                            background: '#202c33',
                            borderRadius: 24,
                            padding: '3px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                            zIndex: 20,
                            border: '1px solid #222d34',
                          }}
                        >
                          {QUICK_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                fontSize: 15,
                                cursor: 'pointer',
                                padding: '2px 4px',
                                borderRadius: 4,
                                transition: 'transform 0.1s ease',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.25)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                              {emoji}
                            </button>
                          ))}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMessageContextMenu({ message: msg, x: e.clientX, y: e.clientY });
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#8696a0',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <ChevronDown style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      )}

                      {/* The WhatsApp Bubble */}
                      <div
                        style={{
                          background: isMe ? '#005c4b' : '#202c33',
                          color: '#e9edef',
                          padding: '6px 9px 8px 9px',
                          borderRadius: 8,
                          borderTopRightRadius: isMe ? 0 : 8,
                          borderTopLeftRadius: !isMe ? 0 : 8,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                          fontSize: 13.5,
                          lineHeight: 1.45,
                          position: 'relative',
                        }}
                      >
                        {/* Group Sender Name */}
                        {!isMe && (activeConv.type === 'brand' || activeConv.type === 'team') && (
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#00a884', marginBottom: 3 }}>
                            {msg.senderName}
                          </div>
                        )}

                        {/* Quoted Reply Preview */}
                        {hasQuote && (
                          <div
                            style={{
                              background: 'rgba(0, 0, 0, 0.2)',
                              borderLeft: '4px solid #00a884',
                              borderRadius: 4,
                              padding: '4px 8px',
                              fontSize: 12,
                              color: '#d1d7db',
                              marginBottom: 6,
                              fontStyle: 'italic',
                            }}
                          >
                            {quoteText}
                          </div>
                        )}

                        {/* Main Text Content */}
                        <div
                          style={{
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                            fontStyle: msg.isDeletedForEveryone ? 'italic' : 'normal',
                            opacity: msg.isDeletedForEveryone ? 0.75 : 1,
                            marginRight: 55, // space for inline timestamp
                          }}
                        >
                          {msg.isDeletedForEveryone ? '🚫 This message was deleted' : actualText}
                        </div>

                        {/* Document Attachment Preview Card */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {msg.attachments.map((att, idx) => (
                              <div
                                key={idx}
                                style={{
                                  background: 'rgba(0, 0, 0, 0.25)',
                                  borderRadius: 6,
                                  padding: '8px 10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 10,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: 4,
                                      background: '#dc2626',
                                      color: '#ffffff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 800,
                                      fontSize: 10,
                                    }}
                                  >
                                    PDF
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e9edef' }}>{att.name}</div>
                                    <div style={{ fontSize: 10, color: '#8696a0' }}>{att.size}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => showToast(`Downloading ${att.name}...`, 'info')}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#00a884',
                                    cursor: 'pointer',
                                    padding: 4,
                                  }}
                                  title="Download Document"
                                >
                                  <Download style={{ width: 16, height: 16 }} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline WhatsApp Timestamp & Read Ticks */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 4,
                            right: 7,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: 10,
                            color: '#8696a0',
                          }}
                        >
                          <span>{msg.timestamp || 'Just now'}</span>
                          {isMe && !msg.isDeletedForEveryone && (
                            <CheckCheck style={{ width: 14, height: 14, color: '#53bdeb' }} />
                          )}
                        </div>
                      </div>

                      {/* Displayed Emoji Reactions Badge */}
                      {msgReactions.length > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: -10,
                            [isMe ? 'right' : 'left']: 8,
                            background: '#202c33',
                            border: '1px solid #222d34',
                            borderRadius: 12,
                            padding: '1px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            fontSize: 12,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleToggleReaction(msg.id, msgReactions[0])}
                          title="Reactions"
                        >
                          {msgReactions.map((emoji, i) => (
                            <span key={i}>{emoji}</span>
                          ))}
                          {msgReactions.length > 1 && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#8696a0', marginLeft: 2 }}>
                              {msgReactions.length}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {Object.keys(typingUsers).length > 0 && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    background: '#202c33',
                    borderRadius: 14,
                    padding: '6px 12px',
                    fontSize: 12,
                    color: '#8696a0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontStyle: 'italic',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00a884', animation: 'pulse 1s infinite' }} />
                  <span>{Object.values(typingUsers).join(', ')} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Quoted Reply Preview Bar ────────────────────────────── */}
            {replyingTo && (
              <div
                style={{
                  padding: '8px 16px',
                  background: '#202c33',
                  borderTop: '1px solid #222d34',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  zIndex: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{ width: 4, height: 36, background: '#00a884', borderRadius: 2 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#00a884' }}>
                      Replying to {replyingTo.senderName}
                    </div>
                    <div style={{ fontSize: 11, color: '#8696a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {replyingTo.text}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer', padding: 4 }}
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>
            )}

            {/* ── Bottom Input Bar (Screenshot 2) ────────────────────── */}
            <form
              onSubmit={handleSend}
              style={{
                height: 62,
                padding: '0 16px',
                background: '#202c33',
                borderTop: '1px solid #222d34',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexShrink: 0,
                zIndex: 10,
                position: 'relative',
              }}
            >
              {/* Attach Dropdown Menu */}
              {showAttachMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    bottom: 68,
                    left: 16,
                    background: '#202c33',
                    border: '1px solid #222d34',
                    borderRadius: 12,
                    padding: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    zIndex: 50,
                    minWidth: 180,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleAttachDocument('pdf')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: '#e9edef',
                      fontSize: 13,
                      cursor: 'pointer',
                      borderRadius: 6,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#2a3942'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <FileText style={{ width: 16, height: 16, color: '#7f66ff' }} />
                    <span>Document / PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAttachDocument('image')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: '#e9edef',
                      fontSize: 13,
                      cursor: 'pointer',
                      borderRadius: 6,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#2a3942'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <ImageIcon style={{ width: 16, height: 16, color: '#007bfc' }} />
                    <span>Photos & Videos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      showToast('Select a client contact to share', 'info');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      background: 'transparent',
                      border: 'none',
                      color: '#e9edef',
                      fontSize: 13,
                      cursor: 'pointer',
                      borderRadius: 6,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#2a3942'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Users style={{ width: 16, height: 16, color: '#02a698' }} />
                    <span>Contact Card</span>
                  </button>
                </div>
              )}

              {/* Extended Emoji Picker Tray */}
              {showEmojiPicker && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    bottom: 68,
                    left: 50,
                    background: '#202c33',
                    border: '1px solid #222d34',
                    borderRadius: 12,
                    padding: 10,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: 6,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    zIndex: 50,
                  }}
                >
                  {EXTENDED_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        setInputText((prev) => prev + em);
                        inputRef.current?.focus();
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: 20,
                        cursor: 'pointer',
                        padding: 4,
                        borderRadius: 6,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#2a3942'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}

              {/* Left Attach & Emoji triggers */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAttachMenu((prev) => !prev);
                  setShowEmojiPicker(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: showAttachMenu ? '#00a884' : '#8696a0',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Attach"
              >
                <Plus style={{ width: 22, height: 22 }} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker((prev) => !prev);
                  setShowAttachMenu(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: showEmojiPicker ? '#00a884' : '#8696a0',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Emojis"
              >
                <Smile style={{ width: 22, height: 22 }} />
              </button>

              {/* Rounded Input Pill */}
              <div
                style={{
                  flex: 1,
                  background: '#2a3942',
                  borderRadius: 24,
                  padding: '0 16px',
                  height: 42,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message"
                  value={inputText}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#e9edef',
                    fontSize: 14,
                  }}
                />
              </div>

              {/* Right Action: Voice note mic or Send Paperplane */}
              {inputText.trim() ? (
                <button
                  type="submit"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: '#00a884',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0, 168, 132, 0.4)',
                    transition: 'transform 0.12s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  title="Send message"
                >
                  <Send style={{ width: 17, height: 17 }} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsRecordingAudio((prev) => !prev);
                    if (!isRecordingAudio) {
                      showToast('Simulating voice note recording (tap again to finish)', 'info');
                    } else {
                      sendMessage(activeConv.id, '🎤 Voice note (0:14)');
                      playSentSound();
                      showToast('Voice message sent', 'success');
                    }
                  }}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: isRecordingAudio ? '#dc2626' : 'transparent',
                    color: isRecordingAudio ? '#ffffff' : '#8696a0',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title={isRecordingAudio ? 'Stop and send voice message' : 'Voice note'}
                >
                  <Mic style={{ width: 20, height: 20 }} />
                </button>
              )}
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
              color: '#8696a0',
              padding: 24,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#202c33',
                color: '#00a884',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <MessageSquare style={{ width: 36, height: 36 }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#e9edef', marginBottom: 6 }}>
              WhatsApp Web for Retentio CRM
            </h3>
            <p style={{ fontSize: 13, maxWidth: 360, lineHeight: 1.5, marginBottom: 20 }}>
              Send and receive messages with your agency colleagues and client teams with real-time delivery ticks and end-to-end encryption.
            </p>
            <button
              onClick={() => setShowNewChatModal(true)}
              style={{
                padding: '10px 20px',
                borderRadius: 24,
                background: '#00a884',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Plus style={{ width: 16, height: 16 }} />
              <span>Start New Conversation</span>
            </button>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* WHATSAPP MESSAGE CONTEXT MENU (Screenshot 3)                      */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {messageContextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: Math.min(messageContextMenu.y, window.innerHeight - 340),
            left: Math.min(messageContextMenu.x, window.innerWidth - 220),
            background: '#202c33',
            border: '1px solid #222d34',
            borderRadius: 10,
            padding: '6px 0',
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
            zIndex: 100,
            minWidth: 190,
          }}
        >
          {/* Reaction Bar in Menu */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '6px 10px 8px 10px',
              borderBottom: '1px solid #222d34',
            }}
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleToggleReaction(messageContextMenu.message.id, emoji)}
                style={{ background: 'transparent', border: 'none', fontSize: 16, cursor: 'pointer', padding: 2 }}
              >
                {emoji}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              showToast(`Message Info: Sent at ${messageContextMenu.message.timestamp}`, 'info');
              setMessageContextMenu(null);
            }}
            style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: '#e9edef', fontSize: 13, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a3942'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Info style={{ width: 15, height: 15, color: '#8696a0' }} />
            <span>Message info</span>
          </button>

          <button
            onClick={() => {
              setReplyingTo(messageContextMenu.message);
              setMessageContextMenu(null);
              inputRef.current?.focus();
            }}
            style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: '#e9edef', fontSize: 13, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a3942'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Reply style={{ width: 15, height: 15, color: '#8696a0' }} />
            <span>Reply</span>
          </button>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(messageContextMenu.message.text);
              showToast('Message copied to clipboard', 'success');
              setMessageContextMenu(null);
            }}
            style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: '#e9edef', fontSize: 13, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a3942'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Copy style={{ width: 15, height: 15, color: '#8696a0' }} />
            <span>Copy</span>
          </button>

          <button
            onClick={() => {
              showToast('Starred message', 'success');
              setMessageContextMenu(null);
            }}
            style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: '#e9edef', fontSize: 13, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a3942'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Star style={{ width: 15, height: 15, color: '#8696a0' }} />
            <span>Star</span>
          </button>

          <button
            onClick={async () => {
              const msg = messageContextMenu.message;
              setMessageContextMenu(null);
              const ok = await confirm({
                title: 'Delete message?',
                description: 'Delete this message for everyone or delete for me?',
                confirmText: 'Delete for everyone',
                destructive: true,
                icon: 'trash',
              });
              if (ok && activeConv) {
                deleteMessage(activeConv.id, msg.id, 'forEveryone');
              }
            }}
            style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a3942'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Trash2 style={{ width: 15, height: 15, color: '#f87171' }} />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* WHATSAPP CHAT ITEM CONTEXT MENU (Screenshot 2)                    */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {chatContextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: Math.min(chatContextMenu.y, window.innerHeight - 300),
            left: Math.min(chatContextMenu.x, window.innerWidth - 220),
            background: '#202c33',
            border: '1px solid #222d34',
            borderRadius: 10,
            padding: '6px 0',
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
            zIndex: 100,
            minWidth: 190,
          }}
        >
          <button
            onClick={() => togglePinChat(chatContextMenu.convId)}
            style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: '#e9edef', fontSize: 13, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a3942'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Pin style={{ width: 15, height: 15, color: '#8696a0' }} />
            <span>{pinnedConvIds.has(chatContextMenu.convId) ? 'Unpin chat' : 'Pin chat'}</span>
          </button>

          <button
            onClick={() => toggleMuteChat(chatContextMenu.convId)}
            style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: '#e9edef', fontSize: 13, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a3942'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <VolumeX style={{ width: 15, height: 15, color: '#8696a0' }} />
            <span>{mutedConvIds.has(chatContextMenu.convId) ? 'Unmute notifications' : 'Mute notifications'}</span>
          </button>

          <button
            onClick={() => toggleFavChat(chatContextMenu.convId)}
            style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: '#e9edef', fontSize: 13, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a3942'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Star style={{ width: 15, height: 15, color: '#8696a0' }} />
            <span>{favouriteConvIds.has(chatContextMenu.convId) ? 'Remove from favourites' : 'Add to favourites'}</span>
          </button>

          <button
            onClick={() => {
              markConversationRead(chatContextMenu.convId);
              setChatContextMenu(null);
            }}
            style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: '#e9edef', fontSize: 13, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a3942'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <CheckCheck style={{ width: 15, height: 15, color: '#00a884' }} />
            <span>Mark as read</span>
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* NEW DIRECT CHAT MODAL (Team Discovery)                            */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {showNewChatModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowNewChatModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              background: '#111b21',
              border: '1px solid #222d34',
              borderRadius: 14,
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '80vh',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                background: '#202c33',
                borderBottom: '1px solid #222d34',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#e9edef', margin: 0 }}>
                  New WhatsApp Direct Chat
                </h3>
                <p style={{ fontSize: 12, color: '#8696a0', margin: '4px 0 0' }}>
                  Select an agency colleague or client manager to message.
                </p>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer', padding: 4 }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Search Input */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #222d34' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#202c33',
                  borderRadius: 8,
                  padding: '0 12px',
                  height: 38,
                }}
              >
                <Search style={{ width: 15, height: 15, color: '#8696a0' }} />
                <input
                  type="text"
                  placeholder="Search team member by name or role..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#e9edef',
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            {/* Colleagues list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
              {availableTeamMembers.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#8696a0', fontSize: 13 }}>
                  No colleagues match your search.
                </div>
              ) : (
                availableTeamMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleLaunchDirectChat(member.id)}
                    disabled={isStartingChat === member.id}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#202c33'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'rgba(0, 168, 132, 0.2)',
                          color: '#00a884',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 15,
                          overflow: 'hidden',
                        }}
                      >
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          member.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#e9edef' }}>{member.name}</div>
                        <div style={{ fontSize: 11, color: '#8696a0', marginTop: 2 }}>
                          {member.designation || member.role} • {member.email}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isStartingChat === member.id ? (
                        <Loader2 style={{ width: 16, height: 16, color: '#00a884' }} className="animate-spin" />
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 14,
                            background: '#00a884',
                            color: '#ffffff',
                          }}
                        >
                          Chat
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDialog}
    </div>
  );
};

export default ChatManager;
