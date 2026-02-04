/**
 * Ranqly Dispute Service - Triage and resolution system for contest disputes
 * Converted from Python FastAPI to Node.js Express
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Import services
import { DisputeResolver } from './services/DisputeResolver';
import { TriageService } from './services/TriageService';
import { DatabaseService } from './services/DatabaseService';
import { RedisService } from './services/RedisService';
import { NotificationService } from './services/NotificationService';

// Import routes
import { disputeRoutes } from './routes/disputes';
import { triageRoutes } from './routes/triage';
import { healthRoutes } from './routes/health';
import { metricsRoutes } from './routes/metrics';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { validateRequest } from './middleware/validation';

// Import utilities
import { setupLogging } from './utils/logger';
import { Config } from './utils/config';

// Import types
import { DisputeServiceConfig, ServiceStatus } from './types';

class DisputeService {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private logger: winston.Logger;
  private config: DisputeServiceConfig;
  
  // Services
  private disputeResolver: DisputeResolver;
  private triageService: TriageService;
  private databaseService: DatabaseService;
  private redisService: RedisService;
  private notificationService: NotificationService;
  
  // Service status
  private isInitialized: boolean = false;
  private servicesStatus: ServiceStatus = {
    disputeResolver: false,
    triageService: false,
    databaseService: false,
    redisService: false,
    notificationService: false
  };

  constructor() {
    this.config = new Config().getConfig();
    this.logger = setupLogging(this.config.logLevel);
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: this.config.allowedOrigins,
        methods: ['GET', 'POST']
      }
    });

    // Initialize services
    this.disputeResolver = new DisputeResolver(this.logger);
    this.triageService = new TriageService(this.logger);
    this.databaseService = new DatabaseService(this.logger);
    this.redisService = new RedisService(this.logger);
    this.notificationService = new NotificationService(this.logger);
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Ranqly Dispute Service...');

      // Setup middleware
      this.setupMiddleware();

      // Initialize services
      await this.initializeServices();

      // Setup routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      // Setup WebSocket
      this.setupWebSocket();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      this.isInitialized = true;
      this.logger.info('Dispute Service initialized successfully');

    } catch (error) {
      this.logger.error(`Failed to initialize Dispute Service: ${error}`);
      throw error;
    }
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
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
    this.app.use(cors({
      origin: this.config.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger(this.logger));
  }

  private async initializeServices(): Promise<void> {
    try {
      this.logger.info('Initializing services...');

      // Initialize database service
      await this.databaseService.initialize(this.config.database);
      this.servicesStatus.databaseService = true;
      this.logger.info('Database service initialized');

      // Initialize Redis service
      await this.redisService.initialize(this.config.redis);
      this.servicesStatus.redisService = true;
      this.logger.info('Redis service initialized');

      // Initialize notification service
      await this.notificationService.initialize(this.config.notification);
      this.servicesStatus.notificationService = true;
      this.logger.info('Notification service initialized');

      // Initialize triage service
      await this.triageService.initialize(
        this.databaseService,
        this.redisService
      );
      this.servicesStatus.triageService = true;
      this.logger.info('Triage service initialized');

      // Initialize dispute resolver
      await this.disputeResolver.initialize(
        this.triageService,
        this.databaseService,
        this.redisService,
        this.notificationService
      );
      this.servicesStatus.disputeResolver = true;
      this.logger.info('Dispute resolver initialized');

    } catch (error) {
      this.logger.error(`Error initializing services: ${error}`);
      throw error;
    }
  }

  private setupRoutes(): void {
    // Health check routes
    this.app.use('/health', healthRoutes);

    // Metrics routes
    this.app.use('/metrics', metricsRoutes);

    // Dispute routes with validation
    this.app.use('/api/disputes', validateRequest, disputeRoutes);

    // Triage routes
    this.app.use('/api/triage', validateRequest, triageRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'Ranqly Dispute Service',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        services: this.servicesStatus
      });
    });

    // API documentation endpoint
    this.app.get('/api/docs', (req, res) => {
      res.json({
        title: 'Ranqly Dispute Service API',
        version: '1.0.0',
        description: 'Dispute triage and resolution system',
        endpoints: {
          'POST /api/disputes': 'Create a new dispute',
          'GET /api/disputes/:id': 'Get dispute details',
          'PUT /api/disputes/:id': 'Update dispute',
          'POST /api/disputes/:id/resolve': 'Resolve dispute',
          'GET /api/disputes': 'List disputes',
          'POST /api/triage/analyze': 'Analyze dispute for triage',
          'GET /api/triage/queue': 'Get triage queue',
          'POST /api/triage/assign': 'Assign dispute to resolver'
        }
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
    this.app.use(errorHandler(this.logger));
  }

  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      this.logger.info(`Client connected: ${socket.id}`);

      // Join dispute room for real-time updates
      socket.on('join-dispute', (disputeId: string) => {
        socket.join(`dispute-${disputeId}`);
        this.logger.info(`Client ${socket.id} joined dispute room for ${disputeId}`);
      });

      // Handle dispute updates
      socket.on('dispute-update', (data: any) => {
        socket.to(`dispute-${data.disputeId}`).emit('dispute-changed', data);
      });

      socket.on('disconnect', () => {
        this.logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = (signal: string) => {
      this.logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      this.server.close(async () => {
        this.logger.info('HTTP server closed');
        
        try {
          // Close services
          await this.databaseService.close();
          await this.redisService.close();
          
          this.logger.info('All services closed gracefully');
          process.exit(0);
        } catch (error) {
          this.logger.error(`Error during graceful shutdown: ${error}`);
          process.exit(1);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        this.logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Dispute Service not initialized');
    }

    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port, this.config.host, () => {
        this.logger.info(`Dispute Service running on ${this.config.host}:${this.config.port}`);
        this.logger.info(`API Documentation: http://${this.config.host}:${this.config.port}/api/docs`);
        resolve();
      });

      this.server.on('error', (error: any) => {
        this.logger.error(`Server error: ${error}`);
        reject(error);
      });
    });
  }

  getApp(): express.Application {
    return this.app;
  }

  getIO(): SocketIOServer {
    return this.io;
  }

  getServicesStatus(): ServiceStatus {
    return this.servicesStatus;
  }
}

// Create and start the application
const disputeService = new DisputeService();

// Initialize and start the server
disputeService.initialize()
  .then(() => disputeService.start())
  .catch((error) => {
    console.error('Failed to start Dispute Service:', error);
    process.exit(1);
  });

export default disputeService;

