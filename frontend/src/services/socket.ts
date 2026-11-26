import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

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
let currentAgencyId: string | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const host = getSocketHost();
    socket = io(host, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: (cb) => cb({ token: getToken() }),
      autoConnect: false,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socket.on('connect', () => {
      if (currentUserId) {
        socket?.emit('authenticate', { userId: currentUserId, agencyId: currentAgencyId });
      }
    });
  }
  return socket;
}

export function connectSocket(userId: string, agencyId?: string) {
  currentUserId = userId;
  currentAgencyId = agencyId || null;
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  } else {
    s.emit('authenticate', { userId, agencyId: currentAgencyId });
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  currentUserId = null;
  currentAgencyId = null;
}

