import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRoutes from './routes/index.js';
import { notFoundHandler } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { sanitizeInput } from './middlewares/sanitize.middleware.js';
import { globalLimiter } from './middlewares/rateLimiter.middleware.js';
import { config } from './config/env.js';

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Managed at frontend layer for SPA and Socket.IO
  })
);

// CORS configuration
const allowedOrigins = config.corsOrigin.split(',').map((origin) => origin.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching origins
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request logging
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL Injection sanitization
app.use(sanitizeInput);

// Root Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 Fitness Platform Backend API is running successfully!',
    environment: config.nodeEnv,
    frontendUrl: config.corsOrigin,
    endpoints: {
      healthCheck: '/api/v1/health',
      auth: '/api/v1/auth',
      exercises: '/api/v1/exercises',
      workouts: '/api/v1/workouts',
      nutrition: '/api/v1/nutrition',
      progress: '/api/v1/progress',
      trainers: '/api/v1/trainers',
      chat: '/api/v1/chat',
      admin: '/api/v1/admin',
    },
  });
});

// API version 1 routes
app.use('/api/v1', apiRoutes);

// 404 Not Found Handler for unmatched routes
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;
