import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { authMiddleware } from './middleware/auth.js';
import protocolRoutes from './routes/protocols.js';
import authRoutes from './routes/auth.js';
import metricsRoutes from './routes/metrics.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Enhanced CORS configuration for WebContainer
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost and WebContainer URLs
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      /^https?:\/\/.*\.webcontainer-api\.io$/,
      /^https?:\/\/.*\.local-credentialless\.webcontainer-api\.io$/
    ];
    
    const isAllowed = allowedOrigins.some(pattern => {
      if (typeof pattern === 'string') {
        return origin === pattern;
      }
      return pattern.test(origin);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Security middleware with WebContainer compatibility
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Compression and logging
app.use(compression());
app.use(morgan('combined', { 
  stream: { 
    write: (message) => logger.info(message.trim()) 
  },
  skip: (req) => req.url === '/health'
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting (more lenient for development)
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    host: HOST,
    env: process.env.NODE_ENV || 'development',
    cors: 'enabled'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/protocols', authMiddleware, protocolRoutes);
app.use('/api/metrics', authMiddleware, metricsRoutes);

// Root endpoint for testing
app.get('/', (req, res) => {
  res.json({
    message: 'MCP Playground API Server',
    version: '1.0.0',
    endpoints: [
      '/health',
      '/api/auth/login',
      '/api/auth/register',
      '/api/protocols/run',
      '/api/protocols/info',
      '/api/metrics/summary'
    ]
  });
});

// Catch all route for debugging
app.use('*', (req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl,
    availableRoutes: [
      'GET /health',
      'GET /',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'POST /api/protocols/run',
      'GET /api/protocols/info',
      'GET /api/metrics/summary'
    ]
  });
});

// Error handling
app.use(errorHandler);

const server = createServer(app);

// Start server
server.listen(PORT, HOST, () => {
  logger.info(`🚀 MCP Playground Server running on http://${HOST}:${PORT}`);
  logger.info(`📊 Health check: http://${HOST}:${PORT}/health`);
  logger.info(`🔗 API Root: http://${HOST}:${PORT}/`);
  logger.info(`🌐 CORS enabled for WebContainer and localhost`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Enhanced error handling
server.on('error', (error: any) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;