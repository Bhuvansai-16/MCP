import express from 'express';
import cors from 'cors';
import { initializeRedis, closeRedis } from './config/database.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/auth.js';
import protocolRoutes from './routes/protocols.js';
import metricsRoutes from './routes/metrics.js';
import apiRoutes from './routes/api.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(rateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/protocols', protocolRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Initialize Redis (with fallback to in-memory store)
    await initializeRedis();
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await closeRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await closeRedis();
  process.exit(0);
});

startServer();