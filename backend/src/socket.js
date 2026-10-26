const { Server } = require('socket.io');

let io = null;

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

  const onlineUserSockets = new Map(); // userId -> Set of socket IDs

  io.on('connection', (socket) => {
    let currentUserId = null;

    const registerUser = (userId) => {
      if (!userId) return;
      currentUserId = userId;
      socket.join(`user_${userId}`);
      if (!onlineUserSockets.has(userId)) {
        onlineUserSockets.set(userId, new Set());
      }
      onlineUserSockets.get(userId).add(socket.id);
      socket.emit('online_users_list', Array.from(onlineUserSockets.keys()));
      io.emit('user_online', { userId });
    };

    // Handle user authentication / registration for personal notifications
    socket.on('authenticate', ({ userId }) => {
      registerUser(userId);
    });

    // Join specific active conversation room
    socket.on('join_conversation', ({ conversationId, userId }) => {
      if (conversationId) {
        socket.join(`conversation_${conversationId}`);
        if (userId) {
          registerUser(userId);
        }
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation_${conversationId}`);
      }
    });

    // Real-time typing indicators
    socket.on('typing', ({ conversationId, userId, userName, isTyping }) => {
      if (conversationId) {
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          conversationId,
          userId,
          userName,
          isTyping,
        });
      }
    });

    // Mark messages as read in real time
    socket.on('mark_read', async ({ conversationId, userId }) => {
      if (conversationId && userId) {
        try {
          const chatService = require('./services/chat.service');
          const readResult = await chatService.markMessagesRead(conversationId, userId);
          if (readResult && readResult.updatedCount > 0) {
            io.to(`conversation_${conversationId}`).emit('messages_read', {
              conversationId,
              userId,
              messageIds: readResult.messageIds,
            });
          }
        } catch (err) {
          console.error('Socket mark_read error:', err.message);
        }
      }
    });

    // Delete message broadcast
    socket.on('delete_message', async ({ conversationId, messageId, deleteType, userId }) => {
      if (conversationId && messageId) {
        try {
          const chatService = require('./services/chat.service');
          await chatService.deleteMessage(conversationId, messageId, deleteType, userId);
          broadcastMessageDeleted(conversationId, messageId, deleteType, userId);
        } catch (err) {
          console.error('Socket delete_message error:', err.message);
        }
      }
    });

    socket.on('disconnect', () => {
      if (currentUserId && onlineUserSockets.has(currentUserId)) {
        const sockets = onlineUserSockets.get(currentUserId);
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUserSockets.delete(currentUserId);
          io.emit('user_offline', { userId: currentUserId });
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
  if (!io) return;
  if (targetUserId) {
    io.to(`user_${targetUserId}`).emit('new_notification', notification);
  }
  io.emit('new_notification', notification);
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
