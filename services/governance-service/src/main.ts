/**
 * Ranqly Governance Service - DAO governance and voting mechanisms
 * Converted from Python to Node.js
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Import services
import { GovernanceService } from './services/GovernanceService';
import { DatabaseService } from './services/DatabaseService';
import { RedisService } from './services/RedisService';

// Import routes
import { governanceRoutes } from './routes/governance';
import { healthRoutes } from './routes/health';
import { metricsRoutes } from './routes/metrics';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Import utilities
import { setupLogging } from './utils/logger';
import { Config } from './utils/config';

class GovernanceServiceApp {
  private app: express.Application;
  private logger: winston.Logger;
  private config: any;
  
  // Services
  private governanceService: GovernanceService;
  private databaseService: DatabaseService;
  private redisService: RedisService;
  
  // Service status
  private isInitialized: boolean = false;

  constructor() {
    this.config = new Config().getConfig();
    this.logger = setupLogging(this.config.logLevel);
    this.app = express();

    // Initialize services
    this.governanceService = new GovernanceService(this.logger);
    this.databaseService = new DatabaseService(this.logger);
    this.redisService = new RedisService(this.logger);
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Ranqly Governance Service...');

      // Setup middleware
      this.setupMiddleware();

      // Initialize services
      await this.initializeServices();

      // Setup routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      this.isInitialized = true;
      this.logger.info('Governance Service initialized successfully');

    } catch (error) {
      this.logger.error(`Failed to initialize Governance Service: ${error}`);
      throw error;
    }
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: this.config.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));
    this.app.use(compression());

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(requestLogger(this.logger));
  }

  private async initializeServices(): Promise<void> {
    try {
      this.logger.info('Initializing services...');

      await this.databaseService.initialize(this.config.database);
      this.logger.info('Database service initialized');

      await this.redisService.initialize(this.config.redis);
      this.logger.info('Redis service initialized');

      await this.governanceService.initialize(this.databaseService, this.redisService);
      this.logger.info('Governance service initialized');

    } catch (error) {
      this.logger.error(`Error initializing services: ${error}`);
      throw error;
    }
  }

  private setupRoutes(): void {
    this.app.use('/health', healthRoutes);
    this.app.use('/metrics', metricsRoutes);
    this.app.use('/api/governance', governanceRoutes);

    this.app.get('/', (req, res) => {
      res.json({
        service: 'Ranqly Governance Service',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString()
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });

    this.app.use(errorHandler(this.logger));
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Governance Service not initialized');
    }

    return new Promise((resolve, reject) => {
      this.app.listen(this.config.port, this.config.host, () => {
        this.logger.info(`Governance Service running on ${this.config.host}:${this.config.port}`);
        resolve();
      });

      this.app.on('error', (error: any) => {
        this.logger.error(`Server error: ${error}`);
        reject(error);
      });
    });
  }
}

// Create and start the application
const governanceServiceApp = new GovernanceServiceApp();

governanceServiceApp.initialize()
  .then(() => governanceServiceApp.start())
  .catch((error) => {
    console.error('Failed to start Governance Service:', error);
    process.exit(1);
  });

export default governanceServiceApp;
