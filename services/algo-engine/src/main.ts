/**
 * Ranqly Algorithm Engine - NLP scoring and content analysis service
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
import { NLPService } from './services/NLPService';
import { ScoringService } from './services/ScoringService';
import { DatabaseService } from './services/DatabaseService';
import { RedisService } from './services/RedisService';
import { QueueService } from './services/QueueService';

// Import routes
import { scoringRoutes } from './routes/scoring';
import { healthRoutes } from './routes/health';
import { metricsRoutes } from './routes/metrics';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { validateRequest } from './middleware/validation';
import { setupSwagger } from './middleware/swagger';

// Import utilities
import { setupLogging } from './utils/logger';
import { Config } from './utils/config';

// Import types
import { AlgoEngineConfig, ServiceStatus } from './types';

class AlgoEngine {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private logger: winston.Logger;
  private config: AlgoEngineConfig;
  
  // Services
  private nlpService: NLPService;
  private scoringService: ScoringService;
  private databaseService: DatabaseService;
  private redisService: RedisService;
  private queueService: QueueService;
  
  // Service status
  private isInitialized: boolean = false;
  private servicesStatus: ServiceStatus = {
    nlpService: false,
    scoringService: false,
    databaseService: false,
    redisService: false,
    queueService: false
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
    this.nlpService = new NLPService(this.logger);
    this.scoringService = new ScoringService(this.logger);
    this.databaseService = new DatabaseService(this.logger);
    this.redisService = new RedisService(this.logger);
    this.queueService = new QueueService(this.logger);
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Ranqly Algorithm Engine...');

      // Setup middleware
      this.setupMiddleware();

      // Initialize services
      await this.initializeServices();

      // Setup routes
      this.setupRoutes();

      // Setup Swagger documentation
      this.setupSwagger();

      // Setup error handling
      this.setupErrorHandling();

      // Setup WebSocket
      this.setupWebSocket();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      this.isInitialized = true;
      this.logger.info('Algorithm Engine initialized successfully');

    } catch (error) {
      this.logger.error(`Failed to initialize Algorithm Engine: ${error}`);
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

      // Initialize queue service
      await this.queueService.initialize(this.config.redis);
      this.servicesStatus.queueService = true;
      this.logger.info('Queue service initialized');

      // Initialize NLP service
      await this.nlpService.initialize();
      this.servicesStatus.nlpService = true;
      this.logger.info('NLP service initialized');

      // Initialize scoring service with dependencies
      await this.scoringService.initialize(
        this.nlpService,
        this.databaseService,
        this.redisService,
        this.queueService
      );
      this.servicesStatus.scoringService = true;
      this.logger.info('Scoring service initialized');

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

    // Scoring routes with validation
    this.app.use('/api/scoring', validateRequest, scoringRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'Ranqly Algorithm Engine',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        services: this.servicesStatus
      });
    });

    // API documentation endpoint
    this.app.get('/api/docs', (req, res) => {
      res.json({
        title: 'Ranqly Algorithm Engine API',
        version: '1.0.0',
        description: 'NLP scoring and content analysis service',
        endpoints: {
          'POST /api/scoring/score': 'Score a single submission',
          'POST /api/scoring/batch-score': 'Score multiple submissions',
          'GET /api/scoring/score/:id': 'Get cached score',
          'POST /api/scoring/recalculate/:id': 'Recalculate score',
          'GET /api/scoring/metrics': 'Get scoring metrics',
          'GET /api/scoring/configuration': 'Get scoring configuration',
          'PUT /api/scoring/configuration': 'Update scoring configuration',
          'GET /api/scoring/models/status': 'Get model status',
          'POST /api/scoring/models/train': 'Train models',
          'GET /api/scoring/queue/status': 'Get queue status'
        }
      });
    });
  }

  private setupSwagger(): void {
    setupSwagger(this.app);
    this.logger.info('Swagger documentation setup completed');
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

      // Join scoring room for real-time updates
      socket.on('join-scoring', (submissionId: string) => {
        socket.join(`scoring-${submissionId}`);
        this.logger.info(`Client ${socket.id} joined scoring room for ${submissionId}`);
      });

      // Handle scoring progress updates
      socket.on('scoring-progress', (data: any) => {
        socket.to(`scoring-${data.submissionId}`).emit('scoring-update', data);
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
          await this.queueService.close();
          
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
      throw new Error('Algorithm Engine not initialized');
    }

    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port, this.config.host, () => {
        this.logger.info(`Algorithm Engine running on ${this.config.host}:${this.config.port}`);
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
const algoEngine = new AlgoEngine();

// Initialize and start the server
algoEngine.initialize()
  .then(() => algoEngine.start())
  .catch((error) => {
    console.error('Failed to start Algorithm Engine:', error);
    process.exit(1);
  });

export default algoEngine;