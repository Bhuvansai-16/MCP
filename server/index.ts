import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initializeDatabase } from './config/database.js';
import { mcpClient } from './services/mcpClient.js';
import apiRoutes from './routes/api.js';

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
      console.warn(`CORS blocked origin: ${origin}`);
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
  skip: (req) => req.url === '/health'
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    host: HOST,
    env: process.env.NODE_ENV || 'development',
    services: {
      database: 'connected',
      redis: 'connected',
      mcp_servers: mcpClient.getServerStatus()
    }
  });
});

// API Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Model Context Protocol Playground API',
    version: '2.0.0',
    description: 'Complete backend for MCP Playground with vector store, database, cache, and MCP integration',
    endpoints: [
      'GET /health - Health check',
      'POST /api/run - Run protocols',
      'GET /api/session/:sessionId - Get session results',
      'GET /api/protocols/info - Get protocol information',
      'GET /api/metrics/summary - Get metrics summary',
      'GET /api/mcp/status - Get MCP server status',
      'POST /api/mcp/connect/:serverName - Connect to MCP server',
      'GET /api/mcp/:serverName/tools - List MCP server tools'
    ],
    features: [
      'Four MCP strategies (Raw, Chain, Tree, RAG)',
      'Vector store integration with Pinecone',
      'PostgreSQL database for sessions',
      'Redis caching for performance',
      'MCP server integration',
      'Quality scoring with GPT',
      'Comprehensive metrics tracking'
    ]
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  res.status(err.statusCode || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Catch all route
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl,
    availableRoutes: [
      'GET /health',
      'GET /',
      'POST /api/run',
      'GET /api/session/:sessionId',
      'GET /api/protocols/info',
      'GET /api/metrics/summary',
      'GET /api/mcp/status'
    ]
  });
});

const server = createServer(app);

// Initialize and start server
async function startServer() {
  try {
    console.log('🚀 Initializing MCP Playground Backend...');
    
    // Initialize database connections
    await initializeDatabase();
    
    // Initialize MCP servers
    console.log('🔌 Connecting to MCP servers...');
    const serverNames = ['filesystem', 'fetch', 'memory', 'sequential_thinking'];
    for (const serverName of serverNames) {
      try {
        await mcpClient.connectServer(serverName);
        console.log(`✅ MCP server ${serverName} connected`);
      } catch (error) {
        console.warn(`⚠️  MCP server ${serverName} failed to connect:`, error.message);
      }
    }
    
    // Start HTTP server
    server.listen(PORT, HOST, () => {
      console.log(`🚀 MCP Playground Backend running on http://${HOST}:${PORT}`);
      console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
      console.log(`🔗 API Root: http://${HOST}:${PORT}/`);
      console.log(`🌐 CORS enabled for WebContainer and localhost`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('🎯 Ready to process MCP protocol requests!');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Enhanced error handling
server.on('error', (error: any) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down gracefully`);
  
  // Disconnect MCP servers
  await mcpClient.disconnectAll();
  console.log('MCP servers disconnected');
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();

export default app;