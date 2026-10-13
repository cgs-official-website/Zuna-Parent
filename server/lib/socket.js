import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { logger } from './logger.js';
import { isTokenBlacklisted } from './redis.js';
import { prisma } from './prisma.js';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret_key_change_in_production_32char';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let io = null;
let adminNamespace = null;

export function initSocket(httpServer) {
  const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim());

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || isLocalhost) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by Socket.io CORS`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Attempt Redis adapter configuration for horizontal scale
  try {
    const pubClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 2) return null;
        return 500;
      }
    });
    pubClient.on('error', () => {}); // Catch error to prevent unhandled EventEmitter error

    const subClient = pubClient.duplicate();
    subClient.on('error', () => {}); // Catch error to prevent unhandled EventEmitter error

    pubClient.connect().then(() => {
      subClient.connect().then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        logger.info('Socket.io Redis adapter attached successfully');
      });
    }).catch((err) => {
      logger.info({ err: err.message }, 'Socket.io running in standalone mode (Redis adapter unavailable)');
    });
  } catch (err) {
    logger.info({ err: err.message }, 'Socket.io running in standalone mode (Redis adapter init error)');
  }

  // Define /admin namespace
  adminNamespace = io.of('/admin');

  // Authentication middleware for /admin namespace
  adminNamespace.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers?.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      if (!token && socket.handshake.headers?.cookie) {
        // Simple cookie parse fallback
        const match = socket.handshake.headers.cookie.match(/accessToken=([^;]+)/);
        if (match) token = match[1];
      }

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
      } catch (err) {
        return next(new Error('Authentication error: Invalid or expired token'));
      }

      if (decoded.jti && (await isTokenBlacklisted(decoded.jti))) {
        return next(new Error('Authentication error: Token revoked'));
      }

      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true, isActive: true }
      });

      if (!admin || !admin.isActive) {
        return next(new Error('Authentication error: Account deactivated or not found'));
      }

      socket.admin = admin;
      next();
    } catch (err) {
      logger.error(err, 'Socket handshake auth error');
      next(new Error('Authentication error'));
    }
  });

  // Handle /admin connection
  adminNamespace.on('connection', (socket) => {
    const admin = socket.admin;
    logger.info({ adminId: admin.id, email: admin.email }, 'Admin socket connected');

    // Join admin-specific room for targeted notifications
    socket.join(`admin:${admin.id}`);

    // Join shared tickets room for dashboard views
    socket.join('tickets');

    socket.on('disconnect', (reason) => {
      logger.info({ adminId: admin.id, reason }, 'Admin socket disconnected');
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket first.');
  }
  return io;
}

export function getAdminNamespace() {
  if (!adminNamespace) {
    throw new Error('Admin namespace not initialized.');
  }
  return adminNamespace;
}

// -------------------------------------------------------------
// Realtime Emitters (Only called AFTER DB transaction commits)
// -------------------------------------------------------------

/**
 * Emits when a new ticket is raised
 * @param {object} ticket
 */
export function emitTicketCreated(ticket) {
  if (!adminNamespace) return;
  adminNamespace.to('tickets').emit('ticket:created', ticket);
  logger.debug({ ticketId: ticket.id }, 'Realtime emitted ticket:created');
}

/**
 * Emits when a ticket is updated (status, priority, assignment)
 * @param {object} ticket
 */
export function emitTicketUpdated(ticket) {
  if (!adminNamespace) return;
  adminNamespace.to('tickets').emit('ticket:updated', ticket);
  logger.debug({ ticketId: ticket.id }, 'Realtime emitted ticket:updated');
}

/**
 * Emits when a new reply message is added to a ticket thread
 * @param {string} ticketId
 * @param {object} message
 */
export function emitTicketMessage(ticketId, message) {
  if (!adminNamespace) return;
  adminNamespace.to('tickets').emit('ticket:message', { ticketId, message });
  logger.debug({ ticketId, messageId: message.id }, 'Realtime emitted ticket:message');
}

/**
 * Emits when a new demo request lead is created
 * @param {object} demoRequest
 */
export function emitDemoRequestCreated(demoRequest) {
  if (!adminNamespace) return;
  adminNamespace.to('tickets').emit('demoRequest:created', demoRequest);
  logger.debug({ demoRequestId: demoRequest.id }, 'Realtime emitted demoRequest:created');
}

/**
 * Emits a notification to a specific admin or broadcasts to all
 * @param {object} notification
 * @param {string|null} targetAdminId
 */
export function emitNotification(notification, targetAdminId = null) {
  if (!adminNamespace) return;
  if (targetAdminId) {
    adminNamespace.to(`admin:${targetAdminId}`).emit('notification:new', notification);
    logger.debug({ targetAdminId, notificationId: notification.id }, 'Realtime emitted notification:new to admin room');
  } else {
    adminNamespace.to('tickets').emit('notification:new', notification);
    logger.debug({ notificationId: notification.id }, 'Realtime broadcasted notification:new');
  }
}
