/**
 * Main Express application setup for Ranqly Backend
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Import configuration and utilities
import configManager from '@/shared/utils/config';
import { createLogger } from '@/shared/utils/logger';

// Import services
import { DatabaseService } from '@/shared/database/connection';

// Import middleware
import { errorHandler } from '@/shared/middleware/errorHandler';
import { requestLogger } from '@/shared/middleware/requestLogger';
import { setupSwagger } from '@/shared/middleware/swagger';

// Import routes
import { setupRoutes } from '@/routes';

// Import types
import { Config } from '@/shared/types';

export class RanqlyApp {
  public app: express.Application;
  public server: any;
  public io: SocketIOServer;
  private config: Config;
  private logger: any;
  private databaseService: DatabaseService;

  constructor() {
    this.config = configManager.getConfig();
    this.logger = createLogger(this.config);
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: this.config.cors.origins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: this.config.cors.credentials,
      },
    });

    // Initialize services
    this.databaseService = new DatabaseService(this.config.database, this.logger);
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Ranqly Backend Server...');

      // Validate configuration
      configManager.validateConfig();

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

      this.logger.info('Ranqly Backend Server initialized successfully');

    } catch (error) {
      this.logger.error(`Failed to initialize Ranqly Backend Server: ${error}`);
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
      origin: this.config.cors.origins,
      credentials: this.config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.max,
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

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.id = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      res.setHeader('X-Request-ID', req.id);
      next();
    });
  }

  private async initializeServices(): Promise<void> {
    try {
      this.logger.info('Initializing services...');

      // Initialize database
      await this.databaseService.initialize();
      this.logger.info('Database service initialized');

      // TODO: Initialize other services (Redis, Queue, Blockchain, etc.)

      this.logger.info('All services initialized successfully');

    } catch (error) {
      this.logger.error(`Error initializing services: ${error}`);
      throw error;
    }
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
          database: true,
          redis: false, // TODO: Implement health checks
          queue: false,
          blockchain: false,
        },
      });
    });

    // Detailed health check
    this.app.get('/health/detailed', async (req, res) => {
      try {
        // Test database connection
        await this.databaseService.query('SELECT NOW()');
        
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          uptime: process.uptime(),
          services: {
            database: true,
            redis: false, // TODO: Implement health checks
            queue: false,
            blockchain: false,
          },
          dependencies: {
            postgresql: true,
            redis: false,
            ethereum: false,
          },
          metrics: {
            memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
            cpuUsage: process.cpuUsage(),
            requestCount: 0, // TODO: Implement metrics
            errorCount: 0,
          },
        });
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'Ranqly Backend Server',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          docs: '/docs',
          api: '/api/*',
        },
        modules: [
          'auth',
          'contests',
          'scoring',
          'voting',
          'notifications',
          'disputes',
          'crawler',
          'audit',
          'governance',
        ],
      });
    });

    // Setup API routes
    setupRoutes(this.app, this.databaseService, this.logger);
  }

  private setupSwagger(): void {
    setupSwagger(this.app);
    this.logger.info('Swagger documentation setup completed');
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
        requestId: req.id,
      });
    });

    // Global error handler
    this.app.use(errorHandler(this.logger));
  }

  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      this.logger.info(`Client connected: ${socket.id}`);

      // Join user-specific room
      socket.on('join-user', (userId: string) => {
        socket.join(`user-${userId}`);
        this.logger.info(`Client ${socket.id} joined user room: ${userId}`);
      });

      // Join contest-specific room
      socket.on('join-contest', (contestId: string) => {
        socket.join(`contest-${contestId}`);
        this.logger.info(`Client ${socket.id} joined contest room: ${contestId}`);
      });

      // Handle real-time updates
      socket.on('disconnect', () => {
        this.logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    this.logger.info('WebSocket server setup completed');
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = (signal: string) => {
      this.logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      this.server.close(async () => {
        this.logger.info('HTTP server closed');
        
        try {
          // Close services
          await this.databaseService.close();
          
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
    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port, this.config.host, () => {
        this.logger.info(`Ranqly Backend Server running on ${this.config.host}:${this.config.port}`);
        this.logger.info(`API Documentation: http://${this.config.host}:${this.config.port}/docs`);
        this.logger.info(`Health Check: http://${this.config.host}:${this.config.port}/health`);
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

  getDatabaseService(): DatabaseService {
    return this.databaseService;
  }
}

export default RanqlyApp;


