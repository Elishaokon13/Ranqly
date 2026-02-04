import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import winston from 'winston';
import prometheusMiddleware from 'express-prometheus-middleware';
import cron from 'node-cron';

// Import services
import { VotingService } from './services/VotingService';
import { SybilDetectionService } from './services/SybilDetectionService';
import { BlockchainService } from './services/BlockchainService';
import { DatabaseService } from './services/DatabaseService';
import { RedisService } from './services/RedisService';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authMiddleware } from './middleware/auth';

// Import routes
import votingRoutes from './routes/voting';
import sybilRoutes from './routes/sybil';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'voting-engine' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Initialize Express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Prometheus metrics
app.use(prometheusMiddleware({
  metricsPath: '/metrics',
  collectDefaultMetrics: true,
  requestDurationBuckets: [0.1, 0.5, 1, 1.5],
  requestLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
  responseLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      voting: 'healthy',
      sybilDetection: 'healthy',
      blockchain: 'healthy',
      database: 'healthy',
      redis: 'healthy'
    }
  });
});

// API routes
app.use('/api/v1/voting', votingRoutes);
app.use('/api/v1/sybil', sybilRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Join contest room
  socket.on('join-contest', (contestId: string) => {
    socket.join(`contest-${contestId}`);
    logger.info(`Client ${socket.id} joined contest ${contestId}`);
  });

  // Leave contest room
  socket.on('leave-contest', (contestId: string) => {
    socket.leave(`contest-${contestId}`);
    logger.info(`Client ${socket.id} left contest ${contestId}`);
  });

  // Handle voting events
  socket.on('vote-committed', (data: any) => {
    socket.to(`contest-${data.contestId}`).emit('vote-committed', data);
  });

  socket.on('vote-revealed', (data: any) => {
    socket.to(`contest-${data.contestId}`).emit('vote-revealed', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global services
let votingService: VotingService;
let sybilDetectionService: SybilDetectionService;
let blockchainService: BlockchainService;
let databaseService: DatabaseService;
let redisService: RedisService;

// Initialize services
async function initializeServices() {
  try {
    // Initialize database service
    databaseService = new DatabaseService();
    await databaseService.initialize();
    logger.info('Database service initialized');

    // Initialize Redis service
    redisService = new RedisService();
    await redisService.initialize();
    logger.info('Redis service initialized');

    // Initialize blockchain service
    blockchainService = new BlockchainService();
    await blockchainService.initialize();
    logger.info('Blockchain service initialized');

    // Initialize sybil detection service
    sybilDetectionService = new SybilDetectionService();
    await sybilDetectionService.initialize(databaseService, redisService);
    logger.info('Sybil detection service initialized');

    // Initialize voting service
    votingService = new VotingService();
    await votingService.initialize(
      databaseService, 
      redisService, 
      blockchainService, 
      sybilDetectionService,
      io
    );
    logger.info('Voting service initialized');

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Scheduled tasks
function setupScheduledTasks() {
  // Run sybil detection every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      logger.info('Running scheduled sybil detection');
      await sybilDetectionService.runDetection();
    } catch (error) {
      logger.error('Error in scheduled sybil detection:', error);
    }
  });

  // Clean up expired votes every hour
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Cleaning up expired votes');
      await votingService.cleanupExpiredVotes();
    } catch (error) {
      logger.error('Error cleaning up expired votes:', error);
    }
  });

  // Update vote statistics every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    try {
      logger.info('Updating vote statistics');
      await votingService.updateVoteStatistics();
    } catch (error) {
      logger.error('Error updating vote statistics:', error);
    }
  });

  logger.info('Scheduled tasks configured');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  server.close(() => {
    logger.info('HTTP server closed');
  });

  io.close(() => {
    logger.info('WebSocket server closed');
  });

  // Close service connections
  await databaseService?.close();
  await redisService?.close();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  server.close(() => {
    logger.info('HTTP server closed');
  });

  io.close(() => {
    logger.info('WebSocket server closed');
  });

  // Close service connections
  await databaseService?.close();
  await redisService?.close();
  
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 8002;

async function startServer() {
  await initializeServices();
  setupScheduledTasks();
  
  server.listen(PORT, () => {
    logger.info(`Voting Engine server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  });
}

// Export for testing
export { app, server, io, votingService, sybilDetectionService };

// Start server if this file is run directly
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}
