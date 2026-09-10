import 'dotenv/config';
import http from 'http';
import { app } from './app.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
import { initSocket } from './lib/socket.js';
import { startBillingCron, stopBillingCron } from './cron/billingCron.js';

const PORT = process.env.PORT || 5000;

export const server = http.createServer(app);

// Initialize Socket.io realtime layer with Redis adapter
export const io = initSocket(server);

// Start scheduled billing cron job
startBillingCron();

server.listen(PORT, () => {
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
