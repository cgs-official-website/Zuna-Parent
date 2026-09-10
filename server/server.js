import 'dotenv/config';
import http from 'http';
import { app } from './app.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
import { initSocket } from './lib/socket.js';
import { startBillingCron, stopBillingCron } from './cron/billingCron.js';

import { execSync } from 'child_process';

const PORT = process.env.PORT || 5000;

// Safely deploy database migrations if DATABASE_URL is present
if (process.env.DATABASE_URL) {
  try {
    logger.info('Checking database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    logger.info('Database migrations are verified and up to date.');
  } catch (err) {
    logger.warn({ error: err.message }, 'Database migration notice (continuing startup)');
  }
} else {
  logger.warn('DATABASE_URL environment variable is not defined. Please set it in Railway Variables.');
}

export const server = http.createServer(app);

// Initialize Socket.io realtime layer with Redis adapter
export const io = initSocket(server);

// Start scheduled billing cron job
startBillingCron();

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Zuna Admin API Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  stopBillingCron();
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Prisma disconnected.');
      redis.disconnect();
      logger.info('Redis disconnected.');
    } catch (err) {
      logger.error(err, 'Error during shutdown');
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
