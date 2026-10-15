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

  io.on('connection', (socket) => {
    let currentUserId = null;

    // Handle user authentication / registration for personal notifications
    socket.on('authenticate', ({ userId }) => {
      if (userId) {
        currentUserId = userId;
        socket.join(`user_${userId}`);
      }
    });

    // Join specific active conversation room
    socket.on('join_conversation', ({ conversationId, userId }) => {
      if (conversationId) {
        socket.join(`conversation_${conversationId}`);
        if (userId && !currentUserId) {
          currentUserId = userId;
          socket.join(`user_${userId}`);
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

    socket.on('disconnect', () => {
      // Room cleanup is handled automatically by socket.io
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

module.exports = {
  initSocket,
  getIO,
  broadcastNewMessage,
  broadcastMessagesRead,
  broadcastConversationCreated,
};
