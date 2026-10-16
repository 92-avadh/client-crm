import { io, Socket } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'https://client-crm-api-g9qz.onrender.com/api';

function getSocketHost(): string {
  if (API_BASE.startsWith('http')) {
    return API_BASE.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:4000';
}

let socket: Socket | null = null;
let currentUserId: string | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const host = getSocketHost();
    socket = io(host, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: false,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socket.on('connect', () => {
      if (currentUserId) {
        socket?.emit('authenticate', { userId: currentUserId });
      }
    });
  }
  return socket;
}

export function connectSocket(userId: string) {
  currentUserId = userId;
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  } else {
    s.emit('authenticate', { userId });
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  currentUserId = null;
}

export function joinConversationRoom(conversationId: string, userId?: string) {
  const s = getSocket();
  if (s.connected) {
    s.emit('join_conversation', { conversationId, userId: userId || currentUserId });
  }
}

export function leaveConversationRoom(conversationId: string) {
  const s = getSocket();
  if (s.connected) {
    s.emit('leave_conversation', { conversationId });
  }
}

export function emitTypingStatus(conversationId: string, userId: string, userName: string, isTyping: boolean) {
  const s = getSocket();
  if (s.connected) {
    s.emit('typing', { conversationId, userId, userName, isTyping });
  }
}

export function emitMarkRead(conversationId: string, userId: string) {
  const s = getSocket();
  if (s.connected) {
    s.emit('mark_read', { conversationId, userId });
  }
}

export function emitDeleteMessage(
  conversationId: string,
  messageId: string,
  deleteType: 'forEveryone' | 'forMe',
  userId: string
) {
  const s = getSocket();
  if (s.connected) {
    s.emit('delete_message', { conversationId, messageId, deleteType, userId });
  }
}

