const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const { getAgencyId } = require('./utils/agency');
const { JWT_SECRET } = require('./middleware/auth');

let io = null;

function parseSocketCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function initSocket(httpServer, isAllowedOrigin) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || isAllowedOrigin(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Blocked by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // Authenticate every socket connection via JWT before allowing room joins/events
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        parseSocketCookie(socket.handshake.headers?.cookie, 'token');
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
      const { rows } = await pool.query(
        'SELECT id, name, role, agency_id, brand_id, created_by, is_active FROM users WHERE id = $1',
        [decoded.id]
      );
      const u = rows[0];
      if (!u || u.is_active === false) {
        return next(new Error('Account unavailable'));
      }
      socket.user = {
        id: u.id,
        name: u.name,
        role: u.role,
        brandId: u.brand_id,
        agencyId: getAgencyId(u),
      };
      next();
    } catch {
      next(new Error('Invalid authentication token'));
    }
  });

  // agencyId -> Map(userId -> Set(socketId)) so online presence stays strictly within each tenant
  const agencyOnlineUsers = new Map();

  const getAgencyMap = (agencyId) => {
    if (!agencyOnlineUsers.has(agencyId)) {
      agencyOnlineUsers.set(agencyId, new Map());
    }
    return agencyOnlineUsers.get(agencyId);
  };

  io.on('connection', (socket) => {
    const currentUser = socket.user;
    const currentUserId = currentUser.id;
    const currentAgencyId = currentUser.agencyId;

    socket.join(`user_${currentUserId}`);
    if (currentAgencyId) {
      socket.join(`agency_${currentAgencyId}`);
      const agencyMap = getAgencyMap(currentAgencyId);
      if (!agencyMap.has(currentUserId)) {
        agencyMap.set(currentUserId, new Set());
      }
      agencyMap.get(currentUserId).add(socket.id);
      socket.emit('online_users_list', Array.from(agencyMap.keys()));
      io.to(`agency_${currentAgencyId}`).emit('user_online', { userId: currentUserId });
    }

    // Re-emit tenant-scoped online users list (ignores untrusted client userId/agencyId)
    socket.on('authenticate', () => {
      if (currentAgencyId) {
        const agencyMap = getAgencyMap(currentAgencyId);
        socket.emit('online_users_list', Array.from(agencyMap.keys()));
      }
    });

    // Join specific active conversation room after checking membership & agency boundary
    socket.on('join_conversation', async ({ conversationId }) => {
      if (!conversationId) return;
      try {
        const chatService = require('./services/chat.service');
        await chatService.assertConversationAccess(conversationId, currentUser);
        socket.join(`conversation_${conversationId}`);
      } catch {}
    });

    // Leave conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation_${conversationId}`);
      }
    });

    // Real-time typing indicators (only within joined conversation, identity from verified socket.user)
    socket.on('typing', ({ conversationId, isTyping }) => {
      if (conversationId && socket.rooms.has(`conversation_${conversationId}`)) {
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          conversationId,
          userId: currentUserId,
          userName: currentUser.name,
          isTyping: Boolean(isTyping),
        });
      }
    });

    // Mark messages as read in real time
    socket.on('mark_read', async ({ conversationId }) => {
      if (conversationId) {
        try {
          const chatService = require('./services/chat.service');
          const readResult = await chatService.markMessagesRead(conversationId, currentUser);
          if (readResult && readResult.updatedCount > 0) {
            io.to(`conversation_${conversationId}`).emit('messages_read', {
              conversationId,
              userId: currentUserId,
              messageIds: readResult.messageIds,
            });
          }
        } catch (err) {
          console.error('Socket mark_read error:', err.message);
        }
      }
    });

    // Delete message broadcast
    socket.on('delete_message', async ({ conversationId, messageId, deleteType }) => {
      if (conversationId && messageId) {
        try {
          const chatService = require('./services/chat.service');
          await chatService.deleteMessage(conversationId, messageId, deleteType, currentUser);
          broadcastMessageDeleted(conversationId, messageId, deleteType, currentUserId);
        } catch (err) {
          console.error('Socket delete_message error:', err.message);
        }
      }
    });

    socket.on('disconnect', () => {
      if (currentAgencyId && agencyOnlineUsers.has(currentAgencyId)) {
        const agencyMap = agencyOnlineUsers.get(currentAgencyId);
        if (agencyMap.has(currentUserId)) {
          const sockets = agencyMap.get(currentUserId);
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            agencyMap.delete(currentUserId);
            io.to(`agency_${currentAgencyId}`).emit('user_offline', { userId: currentUserId });
          }
        }
      }
    });
  });

  return io;
}

function getIO() {
  return io;
}

function broadcastNewMessage(conversationId, message, participantIds = []) {
  if (!io) return;
  // 1. Broadcast message to all active users inside the conversation room
  io.to(`conversation_${conversationId}`).emit('new_message', {
    conversationId,
    message,
  });

  // 2. Broadcast conversation update (lastMessage, lastMessageTime) to every participant's personal room
  for (const uid of participantIds) {
    io.to(`user_${uid}`).emit('conversation_updated', {
      conversationId,
      lastMessage: message.text || (message.attachments?.length ? 'Attachment' : ''),
      lastMessageTime: message.timestamp || 'Just now',
      senderId: message.senderId,
    });
  }

  // 3. Dispatch web push notification to recipients on mobile / desktop
  try {
    const push = require('./services/push.service');
    for (const uid of participantIds) {
      if (uid && uid !== message.senderId) {
        push.sendPushToUser(uid, {
          title: message.senderName ? `💬 ${message.senderName}` : '💬 New Message',
          body: message.text || (message.attachments?.length ? 'Sent an attachment' : 'New message received'),
          url: '/chat',
          tag: `chat_${conversationId}`,
        });
      }
    }
  } catch (err) {
    console.warn('Chat web push error:', err.message);
  }
}

function broadcastMessagesRead(conversationId, userId, messageIds = []) {
  if (!io) return;
  io.to(`conversation_${conversationId}`).emit('messages_read', {
    conversationId,
    userId,
    messageIds,
  });
}

function broadcastConversationCreated(conversation, participantIds = []) {
  if (!io) return;
  for (const uid of participantIds) {
    io.to(`user_${uid}`).emit('new_conversation', conversation);
  }
}

function broadcastMessageDeleted(conversationId, messageId, deleteType, userId) {
  if (!io) return;
  io.to(`conversation_${conversationId}`).emit('message_deleted', {
    conversationId,
    messageId,
    deleteType,
    userId,
  });
}

function broadcastNotification(notification, targetUserId) {
  if (!io || !notification) return;
  if (targetUserId) {
    io.to(`user_${targetUserId}`).emit('new_notification', notification);
    return;
  }
  const agencyId = notification.agency_id || notification.agencyId;
  if (agencyId) {
    io.to(`agency_${agencyId}`).emit('new_notification', notification);
  }
}

module.exports = {
  initSocket,
  getIO,
  broadcastNewMessage,
  broadcastMessagesRead,
  broadcastConversationCreated,
  broadcastMessageDeleted,
  broadcastNotification,
};
