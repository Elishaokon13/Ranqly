import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { prometheusClient } from './utils/metrics';
import { logger } from './utils/logger';
import { DatabaseService } from './services/database';
import { RedisService } from './services/redis';
import { AnalyticsService } from './services/analytics';
import { ReportService } from './services/report';
import { validateRequest } from './middleware/validation';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authMiddleware } from './middleware/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8016;

// Global services
let databaseService: DatabaseService;
let redisService: RedisService;
let analyticsService: AnalyticsService;
let reportService: ReportService;

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

    // Initialize analytics service
    analyticsService = new AnalyticsService();
    await analyticsService.initialize(databaseService, redisService);
    logger.info('Analytics service initialized');

    // Initialize report service
    reportService = new ReportService();
    await reportService.initialize(databaseService, redisService);
    logger.info('Report service initialized');

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
    service: 'analytics-service',
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
app.use('/api/analytics', authMiddleware, require('./routes/analytics'));
app.use('/api/reports', authMiddleware, require('./routes/reports'));
app.use('/api/dashboards', authMiddleware, require('./routes/dashboards'));

// Error handling middleware
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      logger.info(`Analytics service running on port ${PORT}`);
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
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await databaseService?.close();
  await redisService?.close();
  process.exit(0);
});

startServer();
