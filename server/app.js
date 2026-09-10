import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { logger } from './lib/logger.js';
import authRoutes from './modules/auth/auth.routes.js';
import ticketsRoutes from './modules/tickets/tickets.routes.js';
import ingestionRoutes from './modules/ingestion/ingestion.routes.js';
import productsRoutes from './modules/products/products.routes.js';
import { ProductsController } from './modules/products/products.controller.js';
import demosRoutes from './modules/demos/demos.routes.js';
import { DemosController } from './modules/demos/demos.controller.js';
import teamRoutes from './modules/team/team.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';

export const app = express();

// Allowed CORS origins
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman) or matched origins
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key']
  })
);

// Body and Cookie Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/health'
    }
  })
);

// Railway / Cluster Healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount modules
app.use('/api/auth', authRoutes);
app.use('/api/admin/tickets', ticketsRoutes);
app.use('/api/admin/products', productsRoutes);
app.use('/api/admin/demo-requests', demosRoutes);
app.use('/api/admin/team', teamRoutes);
app.use('/api/admin/billing', billingRoutes);
app.use('/api/admin/notifications', notificationsRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/public/tickets', ingestionRoutes);
app.get('/api/public/products', ProductsController.listPublicProducts);
app.post('/api/public/demo-requests', DemosController.createPublicDemoRequest);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route not found: ${req.method} ${req.url}` }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err);

  const statusCode = err.statusCode || (err.status ? Number(err.status) : 500);
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    }
  });
});
