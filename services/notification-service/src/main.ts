import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { prometheusClient } from './utils/metrics';
import { logger } from './utils/logger';
import { DatabaseService } from './services/database';
import { RedisService } from './services/redis';
import { NotificationService } from './services/notification';
import { EmailService } from './services/email';
import { PushService } from './services/push';
import { WebSocketService } from './services/websocket';
import { validateRequest } from './middleware/validation';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authMiddleware } from './middleware/auth';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8013;

// Global services
let databaseService: DatabaseService;
let redisService: RedisService;
let notificationService: NotificationService;
let emailService: EmailService;
let pushService: PushService;
let webSocketService: WebSocketService;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

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

    // Initialize email service
    emailService = new EmailService();
    await emailService.initialize();
    logger.info('Email service initialized');

    // Initialize push service
    pushService = new PushService();
    await pushService.initialize();
    logger.info('Push service initialized');

    // Initialize WebSocket service
    webSocketService = new WebSocketService();
    await webSocketService.initialize(io);
    logger.info('WebSocket service initialized');

    // Initialize notification service
    notificationService = new NotificationService();
    await notificationService.initialize(
      databaseService,
      redisService,
      emailService,
      pushService,
      webSocketService
    );
    logger.info('Notification service initialized');

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheusClient.register.contentType);
  res.end(prometheusClient.register.metrics());
});

// API Routes
app.use('/api/notifications', authMiddleware, require('./routes/notifications'));
app.use('/api/email', authMiddleware, require('./routes/email'));
app.use('/api/push', authMiddleware, require('./routes/push'));
app.use('/api/websocket', authMiddleware, require('./routes/websocket'));

// Error handling middleware
app.use(errorHandler);

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`);
  
  socket.on('join', (userId: string) => {
    socket.join(`user:${userId}`);
    logger.info(`User ${userId} joined WebSocket room`);
  });

  socket.on('disconnect', () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`);
  });
});

// Start server
async function startServer() {
  try {
    await initializeServices();
    
    server.listen(PORT, () => {
      logger.info(`Notification service running on port ${PORT}`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await databaseService?.close();
  await redisService?.close();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await databaseService?.close();
  await redisService?.close();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();
