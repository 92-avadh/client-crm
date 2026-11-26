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
  broadcastNotification,
};
