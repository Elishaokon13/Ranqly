/**
 * Configuration management for Algorithm Engine
 * Handles environment variables and service configuration
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  poolSize: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
}

export interface AlgoEngineConfig {
  port: number;
  host: string;
  logLevel: string;
  nodeEnv: string;
  allowedOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwtSecret: string;
  corsOrigins: string[];
  maxContentLength: number;
  processingTimeout: number;
  cacheTtl: number;
  maxBatchSize: number;
}

export class Config {
  private config: AlgoEngineConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AlgoEngineConfig {
    return {
      port: parseInt(process.env.ALGO_ENGINE_PORT || '8001', 10),
      host: process.env.ALGO_ENGINE_HOST || '0.0.0.0',
      logLevel: process.env.LOG_LEVEL || 'info',
      nodeEnv: process.env.NODE_ENV || 'development',
      allowedOrigins: this.parseCorsOrigins(process.env.CORS_ORIGINS || 'http://localhost:3000'),
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
      
      database: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        database: process.env.DATABASE_NAME || 'ranqly_dev',
        username: process.env.DATABASE_USER || 'ranqly',
        password: process.env.DATABASE_PASSWORD || 'ranqly_dev_password',
        ssl: process.env.DATABASE_SSL === 'true',
        poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10)
      },
      
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),
        maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10)
      },
      
      jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      corsOrigins: this.parseCorsOrigins(process.env.CORS_ORIGINS || 'http://localhost:3000'),
      maxContentLength: parseInt(process.env.MAX_CONTENT_LENGTH || '10485760', 10),
      processingTimeout: parseInt(process.env.PROCESSING_TIMEOUT || '300000', 10),
      cacheTtl: parseInt(process.env.CACHE_TTL || '3600', 10),
      maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE || '100', 10)
    };
  }

  private parseCorsOrigins(origins: string): string[] {
    return origins.split(',').map(origin => origin.trim());
  }

  getConfig(): AlgoEngineConfig {
    return this.config;
  }
}