/**
 * Service initialization utilities
 */

import winston from 'winston';
import { ServiceConfig, ServiceInitializationOptions, HealthCheckResponse } from '../types';

export class ServiceInitializer {
  private logger: winston.Logger;
  private config: ServiceConfig;
  private services: Map<string, any> = new Map();

  constructor(config: ServiceConfig) {
    this.config = config;
    this.logger = winston.createLogger({
      level: config.logging.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/service.log' })
      ]
    });
  }

  async initializeServices(options: ServiceInitializationOptions = {}) {
    const {
      database = true,
      redis = true,
      blockchain = true,
      logger = true
    } = options;

    try {
      this.logger.info('Starting service initialization...');

      if (logger) {
        await this.initializeLogger();
      }

      if (database) {
        await this.initializeDatabase();
      }

      if (redis) {
        await this.initializeRedis();
      }

      if (blockchain) {
        await this.initializeBlockchain();
      }

      this.logger.info('All services initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize services:', error);
      throw error;
    }
  }

  async closeServices() {
    this.logger.info('Closing services...');
    
    for (const [name, service] of this.services) {
      try {
        if (service && typeof service.close === 'function') {
          await service.close();
          this.logger.info(`${name} service closed`);
        }
      } catch (error) {
        this.logger.error(`Error closing ${name} service:`, error);
      }
    }
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    const dependencies: { [key: string]: boolean } = {};
    
    // Check database
    if (this.services.has('database')) {
      try {
        const dbService = this.services.get('database');
        await dbService.query('SELECT 1');
        dependencies.database = true;
      } catch (error) {
        dependencies.database = false;
      }
    }

    // Check redis
    if (this.services.has('redis')) {
      try {
        const redisService = this.services.get('redis');
        await redisService.ping();
        dependencies.redis = true;
      } catch (error) {
        dependencies.redis = false;
      }
    }

    // Check blockchain
    if (this.services.has('blockchain')) {
      try {
        const blockchainService = this.services.get('blockchain');
        await blockchainService.getNetworkInfo();
        dependencies.blockchain = true;
      } catch (error) {
        dependencies.blockchain = false;
      }
    }

    return {
      status: Object.values(dependencies).every(Boolean) ? 'healthy' : 'unhealthy',
      service: 'ranqly-service',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      dependencies
    };
  }

  private async initializeLogger() {
    this.logger.info('Logger initialized');
  }

  private async initializeDatabase() {
    // Database initialization logic would go here
    this.logger.info('Database service initialized');
  }

  private async initializeRedis() {
    // Redis initialization logic would go here
    this.logger.info('Redis service initialized');
  }

  private async initializeBlockchain() {
    // Blockchain initialization logic would go here
    this.logger.info('Blockchain service initialized');
  }

  getService<T>(name: string): T | undefined {
    return this.services.get(name);
  }

  setService(name: string, service: any) {
    this.services.set(name, service);
  }
}
