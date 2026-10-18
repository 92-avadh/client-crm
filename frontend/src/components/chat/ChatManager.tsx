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
  Forward,
  CheckSquare,
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
    modalBg: '#111b21',
    cardBg: '#202c33',
    cardBorder: '#2a3942',
    shadow: '0 20px 45px rgba(0,0,0,0.3)',
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
    modalBg: '#ffffff',
    cardBg: '#ffffff',
    cardBorder: '#e9edef',
    shadow: '0 10px 30px rgba(0,0,0,0.06)',
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
    deleteConversation,
    clearConversation,
    isUserOnline,
    showToast,
    theme,
  } = useApp();

  const isLight = theme === 'light';
  const t = isLight ? WA.light : WA.dark;

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

  // Message Actions state (forward, Meta AI, stars, pins, select)
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessage | null>(null);
  const [metaAiMessage, setMetaAiMessage] = useState<ChatMessage | null>(null);
  const [starredMessageIds, setStarredMessageIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('wa_starred_messages');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [pinnedMessageIds, setPinnedMessageIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('wa_pinned_messages');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    try {
      localStorage.setItem('wa_starred_messages', JSON.stringify(Array.from(starredMessageIds)));
    } catch {}
  }, [starredMessageIds]);

  useEffect(() => {
    try {
      localStorage.setItem('wa_pinned_messages', JSON.stringify(Array.from(pinnedMessageIds)));
    } catch {}
  }, [pinnedMessageIds]);

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

    // If direct recipient is online, simulate WhatsApp read receipt after ~3.5 seconds
    if (activeConv.type === 'direct') {
      const otherId = activeConv.otherMember?.id || activeConv.participantIds.find((id) => id !== currentUser.id);
      if (otherId && isUserOnline(otherId)) {
        setTimeout(() => {
          if (activeConv) {
            getSocket().emit('mark_read', { conversationId: activeConv.id, userId: otherId });
          }
        }, 3500);
      }
    }
  };

  // Format timestamp to clean WhatsApp 12h time (e.g. "10:55 am", "5:25 am")
  const formatMessageTime = (ts?: string) => {
    if (!ts) return '';
    const trimmed = ts.trim();
    if (trimmed === 'Just now') return 'Just now';
    if (/^\d{1,2}:\d{2}\s*(am|pm)?$/i.test(trimmed)) {
      return trimmed.toLowerCase();
    }
    try {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
      }
    } catch {}
    return trimmed;
  };

  // Check if direct recipient in active conversation is currently online
  const isRecipientOnline = useMemo(() => {
    if (!activeConv) return false;
    if (activeConv.type === 'direct') {
      const otherId = activeConv.otherMember?.id || activeConv.participantIds.find((id) => id !== currentUser.id);
      return otherId ? isUserOnline(otherId) : false;
    }
    return true;
  }, [activeConv, isUserOnline, currentUser.id]);

  // Render WhatsApp ticks: 1 tick grey if offline, 2 ticks grey if online, 2 ticks blue if read
  const renderDeliveryTicks = (msg: ChatMessage) => {
    const isRead = Boolean(
      msg.isRead ||
      (msg.readBy && msg.readBy.length > 1 && msg.readBy.some((id) => id !== currentUser.id))
    );

    if (isRead) {
      return (
        <span title="Read" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <CheckCheck style={{ width: 14, height: 14, color: '#53bdeb', flexShrink: 0 }} />
        </span>
      );
    }

    let isOnline = false;
    if (activeConv?.type === 'direct') {
      const otherId = activeConv.otherMember?.id || activeConv.participantIds.find((id) => id !== currentUser.id);
      isOnline = otherId ? isUserOnline(otherId) : false;
    } else {
      isOnline = true;
    }

    if (isOnline) {
      return (
        <span title="Delivered (recipient online)" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <CheckCheck style={{ width: 14, height: 14, color: '#8696a0', flexShrink: 0 }} />
        </span>
      );
    }

    return (
      <span title="Sent (recipient offline)" style={{ display: 'inline-flex', alignItems: 'center' }}>
        <Check style={{ width: 14, height: 14, color: '#8696a0', flexShrink: 0 }} />
      </span>
    );
  };

  const toggleStarMessage = (id: string) => {
    setStarredMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast('Message unstarred', 'info');
      } else {
        next.add(id);
        showToast('Message starred', 'success');
      }
      return next;
    });
  };

  const togglePinMessage = (id: string) => {
    setPinnedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast('Message unpinned', 'info');
      } else {
        next.add(id);
        showToast('Message pinned to chat', 'success');
      }
      return next;
    });
  };

  const toggleSelectMessage = (id: string) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      showToast(next.has(id) ? 'Message selected' : 'Message deselected', 'info');
      return next;
    });
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

  // Filter messages in chat search (with robust deduplication against race conditions)
  const visibleMessages = useMemo(() => {
    const seen = new Set<string>();
    const deduped: ChatMessage[] = [];
    for (const m of currentMessages) {
      if (!m || !m.id) continue;
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      deduped.push(m);
    }

    if (!inChatSearchQuery.trim()) return deduped;
    return deduped.filter((m) =>
      m.text.toLowerCase().includes(inChatSearchQuery.toLowerCase())
    );
  }, [currentMessages, inChatSearchQuery]);

  // Set of user IDs who already have an existing direct conversation with currentUser
  const existingDirectUserIds = useMemo(() => {
    const ids = new Set<string>();
    (conversations || []).forEach((conv) => {
      if (conv.type === 'direct') {
        if (conv.otherMember?.id) {
          ids.add(conv.otherMember.id);
        }
        if (Array.isArray(conv.participantIds)) {
          conv.participantIds.forEach((pid) => {
            if (pid && pid !== currentUser.id) {
              ids.add(pid);
            }
          });
        }
        if (conv.title) {
          const matchedByName = (allUsers || []).find(
            (u) => u.name.trim().toLowerCase() === conv.title.trim().toLowerCase()
          );
          if (matchedByName) {
            ids.add(matchedByName.id);
          }
        }
      }
    });
    return ids;
  }, [conversations, currentUser.id, allUsers]);

  // Discover team members for new direct chats (exclude colleagues already in direct chats to prevent duplicates)
  const availableTeamMembers = useMemo(() => {
    return (allUsers || []).filter(
      (u) =>
        u.role !== 'brand' &&
        u.id !== currentUser.id &&
        (u as any).isActive !== false &&
        !existingDirectUserIds.has(u.id) &&
        (u.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(teamSearch.toLowerCase()) ||
          (u.designation || '').toLowerCase().includes(teamSearch.toLowerCase()) ||
          u.role.toLowerCase().includes(teamSearch.toLowerCase()))
    );
  }, [allUsers, currentUser.id, teamSearch, existingDirectUserIds]);

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
        background: t.sidebarBg,
        borderRadius: 14,
        overflow: 'hidden',
        border: `1px solid ${t.border}`,
        boxShadow: t.shadow,
        position: 'relative',
        color: t.textPrimary,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* LEFT SIDEBAR: WHATSAPP CHATS DIRECTORY                             */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div
        className={`wa-sidebar ${showMobileSidebar ? 'flex' : 'hidden md:flex'}`}
        style={{
          height: '100%',
          background: t.sidebarBg,
          borderRight: `1px solid ${t.border}`,
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            padding: '12px 16px',
            background: t.headerBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${t.border}`,
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
                border: isLight ? '1.5px solid rgba(0,0,0,0.08)' : '1.5px solid rgba(255,255,255,0.1)',
              }}
              title={currentUser.name}
            >
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                currentUser.name.charAt(0).toUpperCase()
              )}
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: t.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
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
                color: t.textSecondary,
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
        <div style={{ padding: '8px 12px', background: t.sidebarBg, borderBottom: `1px solid ${t.border}` }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: isLight ? '#f0f2f5' : '#202c33',
              borderRadius: 8,
              padding: '0 12px',
              height: 36,
            }}
          >
            <Search style={{ width: 15, height: 15, color: t.textSecondary, flexShrink: 0 }} />
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
                color: t.inputText,
                fontSize: 13,
              }}
            />
            {searchConv && (
              <button
                onClick={() => setSearchConv('')}
                style={{ background: 'transparent', border: 'none', color: t.textSecondary, cursor: 'pointer', padding: 0 }}
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
            background: t.sidebarBg,
            borderBottom: `1px solid ${t.border}`,
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
                  background: isActive ? '#00a884' : t.pillInactiveBg,
                  color: isActive ? '#ffffff' : t.pillInactiveText,
                  transition: 'all 0.15s ease',
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto', background: t.sidebarBg }}>
          {filteredConversations.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: t.textSecondary, fontSize: 13 }}>
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
                    background: isActive ? t.itemActive : 'transparent',
                    borderBottom: isLight ? '1px solid #f0f2f5' : '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'background 0.12s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = t.itemHover;
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
                        background: isDirect ? 'rgba(0, 168, 132, 0.2)' : (isLight ? '#e9edef' : '#202c33'),
                        color: isDirect ? '#00a884' : t.textPrimary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 16,
                        overflow: 'hidden',
                        border: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.08)',
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
                    {isDirect && other?.id && isUserOnline(other.id) && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 1,
                          right: 1,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: '#00a884',
                          border: `2px solid ${t.sidebarBg}`,
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
                          color: t.textPrimary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isDirect && other ? other.name : conv.title}
                      </span>
                      <span style={{ fontSize: 11, color: (conv.unreadCount || 0) > 0 ? '#00a884' : t.textSecondary, flexShrink: 0, fontWeight: (conv.unreadCount || 0) > 0 ? 700 : 400 }}>
                        {formatMessageTime(conv.lastMessageTime) || ''}
                      </span>
                    </div>

                    {/* Bottom Row: Snippet + Ticks + Unread Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, flex: 1 }}>
                        {/* Delivery ticks: 1 grey if offline, 2 grey/blue if online */}
                        {isDirect && (conv.unreadCount || 0) === 0 && (
                          isUserOnline(other?.id || '') ? (
                            <CheckCheck style={{ width: 14, height: 14, color: '#53bdeb', flexShrink: 0 }} />
                          ) : (
                            <Check style={{ width: 14, height: 14, color: t.textSecondary, flexShrink: 0 }} />
                          )
                        )}
                        <span
                          style={{
                            fontSize: 12,
                            color: t.textSecondary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {conv.lastMessage || 'No messages yet'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {isMuted && <VolumeX style={{ width: 13, height: 13, color: t.textSecondary }} />}
                        {isPinned && <Pin style={{ width: 13, height: 13, color: t.textSecondary, transform: 'rotate(45deg)' }} />}
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
          background: t.chatBg,
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
                background: t.headerBg,
                borderBottom: `1px solid ${t.border}`,
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
                  style={{ background: 'transparent', border: 'none', color: t.textSecondary, cursor: 'pointer', padding: 4 }}
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
                      background: activeConv.type === 'direct' ? 'rgba(0, 168, 132, 0.2)' : (isLight ? '#e9edef' : '#202c33'),
                      color: activeConv.type === 'direct' ? '#00a884' : t.textPrimary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 15,
                      overflow: 'hidden',
                      border: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.08)',
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
                  {activeConv.type === 'direct' && isRecipientOnline && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#00a884',
                        border: `2px solid ${t.headerBg}`,
                      }}
                    />
                  )}
                </div>

                {/* Contact Name & Status */}
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: t.textPrimary, margin: 0, lineHeight: 1.2 }}>
                    {activeConv.type === 'direct' && activeConv.otherMember ? activeConv.otherMember.name : activeConv.title}
                  </h3>
                  <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 2 }}>
                    {activeConv.type === 'direct' ? (
                      isRecipientOnline ? (
                        <span style={{ color: '#00a884', fontWeight: 600 }}>online</span>
                      ) : (
                        <span style={{ color: t.textSecondary }}>offline</span>
                      )
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
                  style={{ background: 'transparent', border: 'none', color: t.textSecondary, cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' }}
                  title="Start instant video call (Google Meet)"
                >
                  <Video style={{ width: 19, height: 19 }} />
                </button>
                <button
                  onClick={handleStartGoogleMeet}
                  style={{ background: 'transparent', border: 'none', color: t.textSecondary, cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' }}
                  title="Audio call"
                >
                  <Phone style={{ width: 18, height: 18 }} />
                </button>
                <button
                  onClick={() => setShowInChatSearch((prev) => !prev)}
                  style={{
                    background: showInChatSearch ? 'rgba(0, 168, 132, 0.15)' : 'transparent',
                    border: 'none',
                    color: showInChatSearch ? '#00a884' : t.textSecondary,
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
                  style={{ background: 'transparent', border: 'none', color: t.textSecondary, cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' }}
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
                  background: t.headerBg,
                  borderBottom: `1px solid ${t.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  zIndex: 9,
                }}
              >
                <Search style={{ width: 15, height: 15, color: t.textSecondary }} />
                <input
                  type="text"
                  placeholder="Search in conversation..."
                  value={inChatSearchQuery}
                  onChange={(e) => setInChatSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    background: t.inputPillBg,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    padding: '6px 12px',
                    color: t.inputText,
                    fontSize: 12.5,
                    outline: 'none',
                  }}
                />
                {inChatSearchQuery && (
                  <span style={{ fontSize: 11, color: t.textSecondary }}>
                    {visibleMessages.length} match{visibleMessages.length === 1 ? '' : 'es'}
                  </span>
                )}
                <button
                  onClick={() => {
                    setShowInChatSearch(false);
                    setInChatSearchQuery('');
                  }}
                  style={{ background: 'transparent', border: 'none', color: t.textSecondary, cursor: 'pointer' }}
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
                background: t.chatBg,
                backgroundImage: isLight
                  ? `radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), radial-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px)`
                  : `radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), radial-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 12px 12px',
              }}
            >
              {/* Privacy Notice Pill */}
              <div
                style={{
                  alignSelf: 'center',
                  background: t.encryptionBg,
                  border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 11,
                  color: t.textSecondary,
                  textAlign: 'center',
                  maxWidth: '85%',
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 12,
                  boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <Lock style={{ width: 12, height: 12, color: t.textPrimary, flexShrink: 0 }} />
                <span>Messages are end-to-end encrypted. No one outside of this chat can read or listen to them.</span>
              </div>

              {/* Date Capsule */}
              <div
                style={{
                  alignSelf: 'center',
                  background: isLight ? '#ffffff' : '#182229',
                  borderRadius: 6,
                  padding: '4px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: t.textSecondary,
                  marginBottom: 10,
                  boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.2)',
                  border: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
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
                            background: isLight ? '#ffffff' : '#202c33',
                            borderRadius: 24,
                            padding: '3px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.15)' : '0 4px 14px rgba(0,0,0,0.4)',
                            zIndex: 20,
                            border: `1px solid ${t.border}`,
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
                              color: t.textSecondary,
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
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMessageContextMenu({ message: msg, x: e.clientX, y: e.clientY });
                        }}
                        style={{
                          background: isMe ? t.sentBubble : t.receivedBubble,
                          color: isMe ? t.sentText : t.receivedText,
                          padding: '6px 9px 6px 9px',
                          borderRadius: 8,
                          borderTopRightRadius: isMe ? 0 : 8,
                          borderTopLeftRadius: !isMe ? 0 : 8,
                          boxShadow: isLight ? '0 1px 1.5px rgba(11,20,26,0.13)' : '0 1px 2px rgba(0,0,0,0.25)',
                          fontSize: 13.5,
                          lineHeight: 1.45,
                          position: 'relative',
                          minWidth: 72,
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
                              background: t.quoteBg,
                              borderLeft: '4px solid #00a884',
                              borderRadius: 4,
                              padding: '4px 8px',
                              fontSize: 12,
                              color: isLight ? '#3b4a54' : '#d1d7db',
                              marginBottom: 6,
                              fontStyle: 'italic',
                            }}
                          >
                            {quoteText}
                          </div>
                        )}

                        {/* Text and WhatsApp Timestamp in Flex Column to prevent ANY collision */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div
                            style={{
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap',
                              fontStyle: msg.isDeletedForEveryone ? 'italic' : 'normal',
                              opacity: msg.isDeletedForEveryone ? 0.75 : 1,
                              paddingRight: isMe ? 22 : 10,
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
                                    background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.25)',
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
                                      <div style={{ fontSize: 12, fontWeight: 600, color: isMe ? t.sentText : t.receivedText }}>{att.name}</div>
                                      <div style={{ fontSize: 10, color: isLight ? '#667781' : '#8696a0' }}>{att.size}</div>
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

                          {/* WhatsApp Timestamp & Delivery Ticks */}
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              alignSelf: 'flex-end',
                              gap: 3,
                              fontSize: 10.5,
                              color: isLight ? '#667781' : '#8696a0',
                              marginTop: 2,
                              userSelect: 'none',
                              flexShrink: 0,
                            }}
                          >
                            <span>{formatMessageTime(msg.timestamp)}</span>
                            {isMe && !msg.isDeletedForEveryone && renderDeliveryTicks(msg)}
                          </div>
                        </div>
                      </div>

                      {/* Displayed Emoji Reactions Badge */}
                      {msgReactions.length > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: -10,
                            [isMe ? 'right' : 'left']: 8,
                            background: isLight ? '#ffffff' : '#202c33',
                            border: `1px solid ${t.border}`,
                            borderRadius: 12,
                            padding: '1px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            fontSize: 12,
                            boxShadow: isLight ? '0 2px 4px rgba(0,0,0,0.1)' : '0 2px 6px rgba(0,0,0,0.3)',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleToggleReaction(msg.id, msgReactions[0])}
                          title="Reactions"
                        >
                          {msgReactions.map((emoji, i) => (
                            <span key={i}>{emoji}</span>
                          ))}
                          {msgReactions.length > 1 && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: t.textSecondary, marginLeft: 2 }}>
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
                    background: isLight ? '#ffffff' : '#202c33',
                    border: isLight ? `1px solid ${t.border}` : 'none',
                    borderRadius: 14,
                    padding: '6px 12px',
                    fontSize: 12,
                    color: t.textSecondary,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontStyle: 'italic',
                    boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
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
                  background: t.headerBg,
                  borderTop: `1px solid ${t.border}`,
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
                    <div style={{ fontSize: 11, color: t.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {replyingTo.text}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  style={{ background: 'transparent', border: 'none', color: t.textSecondary, cursor: 'pointer', padding: 4 }}
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
                background: t.headerBg,
                borderTop: `1px solid ${t.border}`,
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
                    background: isLight ? '#ffffff' : '#202c33',
                    border: `1px solid ${t.border}`,
                    borderRadius: 12,
                    padding: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.12)' : '0 10px 30px rgba(0,0,0,0.5)',
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
                      color: t.textPrimary,
                      fontSize: 13,
                      cursor: 'pointer',
                      borderRadius: 6,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
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
                      color: t.textPrimary,
                      fontSize: 13,
                      cursor: 'pointer',
                      borderRadius: 6,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
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
                      color: t.textPrimary,
                      fontSize: 13,
                      cursor: 'pointer',
                      borderRadius: 6,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
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
                    background: isLight ? '#ffffff' : '#202c33',
                    border: `1px solid ${t.border}`,
                    borderRadius: 12,
                    padding: 10,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: 6,
                    boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.12)' : '0 10px 30px rgba(0,0,0,0.5)',
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
                      onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
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
                  color: showAttachMenu ? '#00a884' : t.textSecondary,
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
                  color: showEmojiPicker ? '#00a884' : t.textSecondary,
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
                className="wa-no-highlight"
                style={{
                  flex: 1,
                  background: isLight ? '#ffffff' : '#2a3942',
                  border: isLight ? `1px solid ${t.border}` : 'none',
                  borderRadius: 24,
                  padding: '0 16px',
                  height: 42,
                  display: 'flex',
                  alignItems: 'center',
                  outline: 'none',
                  boxShadow: 'none',
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message"
                  value={inputText}
                  onChange={handleInputChange}
                  className="wa-chat-input wa-no-highlight"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    color: t.inputText,
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
                    color: isRecordingAudio ? '#ffffff' : t.textSecondary,
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
              color: t.textSecondary,
              padding: 24,
              textAlign: 'center',
              background: t.chatBg,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: isLight ? '#ffffff' : '#202c33',
                border: isLight ? `1px solid ${t.border}` : 'none',
                boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                color: '#00a884',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <MessageSquare style={{ width: 36, height: 36 }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: t.textPrimary, marginBottom: 6 }}>
              WhatsApp Web for Retentio CRM
            </h3>
            <p style={{ fontSize: 13, maxWidth: 360, lineHeight: 1.5, marginBottom: 20, color: t.textSecondary }}>
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
            top: Math.min(messageContextMenu.y, window.innerHeight - 390),
            left: Math.min(messageContextMenu.x, window.innerWidth - 230),
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {/* Reaction Bar Floating Pill on Top (Screenshot 3) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              background: isLight ? '#ffffff' : '#202c33',
              border: `1px solid ${t.border}`,
              borderRadius: 24,
              boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.14)' : '0 8px 24px rgba(0,0,0,0.5)',
              alignSelf: 'flex-start',
            }}
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleToggleReaction(messageContextMenu.message.id, emoji)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  padding: '2px 4px',
                  lineHeight: 1,
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => {
                setShowEmojiPicker(true);
                setMessageContextMenu(null);
              }}
              style={{
                background: isLight ? '#f0f2f5' : 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: t.textSecondary,
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#00a884';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isLight ? '#f0f2f5' : 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = t.textSecondary;
              }}
              title="More reactions"
            >
              <Plus style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* Menu Dropdown List (Screenshot 3) */}
          <div
            style={{
              background: isLight ? '#ffffff' : '#202c33',
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              padding: '6px 0',
              boxShadow: isLight ? '0 16px 36px rgba(0,0,0,0.14)' : '0 16px 36px rgba(0,0,0,0.55)',
              minWidth: 205,
              overflow: 'hidden',
            }}
          >
            {/* 1. Reply */}
            <button
              onClick={() => {
                setReplyingTo(messageContextMenu.message);
                setMessageContextMenu(null);
                inputRef.current?.focus();
              }}
              style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: t.textPrimary, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Reply style={{ width: 16, height: 16, color: t.textSecondary }} />
              <span>Reply</span>
            </button>

            {/* 2. Copy */}
            <button
              onClick={() => {
                navigator.clipboard?.writeText(messageContextMenu.message.text);
                showToast('Message copied to clipboard', 'success');
                setMessageContextMenu(null);
              }}
              style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: t.textPrimary, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Copy style={{ width: 16, height: 16, color: t.textSecondary }} />
              <span>Copy</span>
            </button>

            {/* 3. Forward */}
            <button
              onClick={() => {
                setForwardingMessage(messageContextMenu.message);
                setMessageContextMenu(null);
              }}
              style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: t.textPrimary, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Forward style={{ width: 16, height: 16, color: t.textSecondary }} />
              <span>Forward</span>
            </button>

            {/* 4. Pin */}
            <button
              onClick={() => {
                togglePinMessage(messageContextMenu.message.id);
                setMessageContextMenu(null);
              }}
              style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: t.textPrimary, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Pin style={{ width: 16, height: 16, color: t.textSecondary }} />
              <span>{pinnedMessageIds.has(messageContextMenu.message.id) ? 'Unpin' : 'Pin'}</span>
            </button>

            {/* 5. Ask Meta AI */}
            <button
              onClick={() => {
                setMetaAiMessage(messageContextMenu.message);
                setMessageContextMenu(null);
              }}
              style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: t.textPrimary, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="9" stroke="url(#metaAiGrad)" strokeWidth="2.5" />
                <defs>
                  <linearGradient id="metaAiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00c6ff" />
                    <stop offset="50%" stopColor="#0072ff" />
                    <stop offset="100%" stopColor="#e056fd" />
                  </linearGradient>
                </defs>
              </svg>
              <span>Ask Meta AI</span>
            </button>

            {/* 6. Star */}
            <button
              onClick={() => {
                toggleStarMessage(messageContextMenu.message.id);
                setMessageContextMenu(null);
              }}
              style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: t.textPrimary, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Star style={{ width: 16, height: 16, color: starredMessageIds.has(messageContextMenu.message.id) ? '#eab308' : t.textSecondary }} />
              <span>{starredMessageIds.has(messageContextMenu.message.id) ? 'Unstar' : 'Star'}</span>
            </button>

            {/* 7. Select */}
            <button
              onClick={() => {
                toggleSelectMessage(messageContextMenu.message.id);
                setMessageContextMenu(null);
              }}
              style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: t.textPrimary, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <CheckSquare style={{ width: 16, height: 16, color: t.textSecondary }} />
              <span>Select</span>
            </button>

            {/* 8. Delete */}
            <button
              onClick={async () => {
                const msg = messageContextMenu.message;
                setMessageContextMenu(null);
                const ok = await confirm({
                  title: 'Delete message?',
                  description: 'Are you sure you want to delete this message?',
                  confirmText: 'Delete for everyone',
                  destructive: true,
                  icon: 'trash',
                });
                if (ok && activeConv) {
                  deleteMessage(activeConv.id, msg.id, 'forEveryone');
                }
              }}
              style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: '#f87171', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Trash2 style={{ width: 16, height: 16, color: '#f87171' }} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* WHATSAPP CHAT ITEM CONTEXT MENU (Screenshot 1)                    */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {chatContextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: Math.min(chatContextMenu.y, window.innerHeight - 280),
            left: Math.min(chatContextMenu.x, window.innerWidth - 220),
            background: isLight ? '#ffffff' : '#202c33',
            border: `1px solid ${t.border}`,
            borderRadius: 10,
            padding: '6px 0',
            boxShadow: isLight ? '0 12px 36px rgba(0,0,0,0.14)' : '0 12px 36px rgba(0,0,0,0.5)',
            zIndex: 100,
            minWidth: 195,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => togglePinChat(chatContextMenu.convId)}
            style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: t.textPrimary, fontSize: 13, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Pin style={{ width: 15, height: 15, color: t.textSecondary }} />
            <span>{pinnedConvIds.has(chatContextMenu.convId) ? 'Unpin chat' : 'Pin chat'}</span>
          </button>

          <button
            onClick={() => toggleMuteChat(chatContextMenu.convId)}
            style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: t.textPrimary, fontSize: 13, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <VolumeX style={{ width: 15, height: 15, color: t.textSecondary }} />
            <span>{mutedConvIds.has(chatContextMenu.convId) ? 'Unmute notifications' : 'Mute notifications'}</span>
          </button>

          <button
            onClick={() => toggleFavChat(chatContextMenu.convId)}
            style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: t.textPrimary, fontSize: 13, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Star style={{ width: 15, height: 15, color: t.textSecondary }} />
            <span>{favouriteConvIds.has(chatContextMenu.convId) ? 'Remove from favourites' : 'Add to favourites'}</span>
          </button>

          <button
            onClick={async () => {
              const convId = chatContextMenu.convId;
              setChatContextMenu(null);
              const ok = await confirm({
                title: 'Clear chat history?',
                description: 'Are you sure you want to clear all messages in this chat? This cannot be undone.',
                confirmText: 'Clear chat',
                destructive: true,
                icon: 'trash',
              });
              if (ok) {
                await clearConversation(convId);
                showToast('Chat history cleared', 'success');
              }
            }}
            style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: t.textPrimary, fontSize: 13, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <MessageSquare style={{ width: 15, height: 15, color: t.textSecondary }} />
            <span>Clear chat</span>
          </button>

          <button
            onClick={async () => {
              const convId = chatContextMenu.convId;
              setChatContextMenu(null);
              const targetConv = conversations.find(c => c.id === convId);
              const ok = await confirm({
                title: 'Delete chat?',
                description: `Are you sure you want to delete the chat with ${targetConv?.title || 'this contact'}? All messages and conversation history will be permanently deleted.`,
                confirmText: 'Delete chat',
                destructive: true,
                icon: 'trash',
              });
              if (ok) {
                await deleteConversation(convId);
                showToast('Chat deleted', 'success');
              }
            }}
            style={{ width: '100%', padding: '9px 16px', background: 'transparent', border: 'none', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Trash2 style={{ width: 15, height: 15, color: '#f87171' }} />
            <span>Delete chat</span>
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* FORWARD MESSAGE MODAL                                              */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {forwardingMessage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setForwardingMessage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.75)',
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
              background: isLight ? '#ffffff' : '#111b21',
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              width: '100%',
              maxWidth: 420,
              overflow: 'hidden',
              boxShadow: isLight ? '0 20px 50px rgba(0,0,0,0.16)' : '0 20px 50px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ padding: '16px 20px', background: t.headerBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Forward style={{ width: 18, height: 18, color: '#00a884' }} />
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: t.textPrimary }}>Forward message to...</h4>
              </div>
              <button onClick={() => setForwardingMessage(null)} style={{ background: 'transparent', border: 'none', color: t.textSecondary, cursor: 'pointer', padding: 4 }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div style={{ padding: '12px 16px', background: isLight ? '#f0f2f5' : '#0b141a', fontSize: 12.5, color: t.textSecondary, borderBottom: `1px solid ${t.border}`, fontStyle: 'italic' }}>
              "{forwardingMessage.text.slice(0, 100)}{forwardingMessage.text.length > 100 ? '...' : ''}"
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto', padding: '8px 0' }}>
              {conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    sendMessage(c.id, `↪️ [Forwarded]:\n${forwardingMessage.text}`);
                    setForwardingMessage(null);
                    showToast(`Message forwarded to ${c.title}`, 'success');
                  }}
                  style={{
                    padding: '10px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${t.border}`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: t.textPrimary }}>{c.title}</span>
                  <span style={{ fontSize: 12, color: '#00a884', fontWeight: 600 }}>Send</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* META AI ASSISTANT MODAL (Screenshot 3)                            */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {metaAiMessage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setMetaAiMessage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.75)',
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
              background: isLight ? '#ffffff' : '#111b21',
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              width: '100%',
              maxWidth: 460,
              overflow: 'hidden',
              boxShadow: isLight ? '0 20px 50px rgba(0,0,0,0.16)' : '0 20px 50px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ padding: '16px 20px', background: t.headerBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="9" stroke="url(#metaAiGradModal)" strokeWidth="2.5" />
                  <defs>
                    <linearGradient id="metaAiGradModal" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00c6ff" />
                      <stop offset="50%" stopColor="#0072ff" />
                      <stop offset="100%" stopColor="#e056fd" />
                    </linearGradient>
                  </defs>
                </svg>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: t.textPrimary }}>Ask Meta AI</h4>
              </div>
              <button onClick={() => setMetaAiMessage(null)} style={{ background: 'transparent', border: 'none', color: t.textSecondary, cursor: 'pointer', padding: 4 }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: t.textSecondary, marginBottom: 6, letterSpacing: '0.04em' }}>SELECTED MESSAGE</div>
              <div style={{ background: isLight ? '#f0f2f5' : '#202c33', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: t.textPrimary, marginBottom: 16, border: `1px solid ${t.border}` }}>
                {metaAiMessage.text}
              </div>
              <div style={{ fontSize: 12, color: '#00a884', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles style={{ width: 14, height: 14 }} />
                <span>META AI ANALYSIS & DRAFT</span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: isLight ? '#111b21' : '#d1d7db', background: 'rgba(0, 168, 132, 0.08)', border: '1px solid rgba(0, 168, 132, 0.25)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                {metaAiMessage.text.length < 15
                  ? `Message is concise and direct. Suggested reply: "Got it, thank you for confirming!" or "Received, following up on this shortly."`
                  : `Meta AI CRM Insight: This message addresses account progress. Recommended next step: Acknowledge receipt with clear milestone deliverables.`}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setInputText(`Understood, following up on this right away.`);
                    setMetaAiMessage(null);
                    inputRef.current?.focus();
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: '#00a884',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Use Draft Reply
                </button>
              </div>
            </div>
          </div>
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
            background: isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.75)',
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
              background: isLight ? '#ffffff' : '#111b21',
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              boxShadow: isLight ? '0 24px 60px rgba(0,0,0,0.18)' : '0 24px 60px rgba(0,0,0,0.6)',
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
                background: t.headerBg,
                borderBottom: `1px solid ${t.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: t.textPrimary, margin: 0 }}>
                  New WhatsApp Direct Chat
                </h3>
                <p style={{ fontSize: 12, color: t.textSecondary, margin: '4px 0 0' }}>
                  Select an agency colleague or client manager to message.
                </p>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                style={{ background: 'transparent', border: 'none', color: t.textSecondary, cursor: 'pointer', padding: 4 }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Search Input */}
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.border}` }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: isLight ? '#f0f2f5' : '#202c33',
                  border: isLight ? `1px solid ${t.border}` : 'none',
                  borderRadius: 8,
                  padding: '0 12px',
                  height: 38,
                }}
              >
                <Search style={{ width: 15, height: 15, color: t.textSecondary }} />
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
                    color: t.inputText,
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            {/* Colleagues list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
              {availableTeamMembers.length === 0 ? (
                <div
                  style={{
                    padding: '36px 20px',
                    textAlign: 'center',
                    color: t.textSecondary,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {teamSearch.trim() ? (
                    <>
                      <Search style={{ width: 34, height: 34, margin: '0 auto 10px', opacity: 0.35, color: t.textSecondary }} />
                      <div style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary, marginBottom: 4 }}>
                        No colleagues found
                      </div>
                      <div style={{ fontSize: 12, color: t.textSecondary, maxWidth: 280, lineHeight: 1.5 }}>
                        No team members match &ldquo;{teamSearch}&rdquo;. Try another search term.
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: 'rgba(0, 168, 132, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px',
                        }}
                      >
                        <CheckCheck style={{ width: 24, height: 24, color: '#00a884' }} />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary, marginBottom: 4 }}>
                        All colleagues are in your chats
                      </div>
                      <div style={{ fontSize: 12, color: t.textSecondary, maxWidth: 300, lineHeight: 1.5 }}>
                        You already have an active direct conversation with every team member. Select them from the chats list to continue.
                      </div>
                    </>
                  )}
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
                    onMouseEnter={(e) => { e.currentTarget.style.background = t.itemHover; }}
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
                        <div style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary }}>{member.name}</div>
                        <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 2 }}>
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
