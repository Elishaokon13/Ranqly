/**
 * Configuration management for Dispute Service
 */

import dotenv from 'dotenv';

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
}

export interface NotificationConfig {
  email: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  webhook: {
    url: string;
    secret: string;
  };
}

export interface DisputeServiceConfig {
  port: number;
  host: string;
  logLevel: string;
  allowedOrigins: string[];
  database: DatabaseConfig;
  redis: RedisConfig;
  notification: NotificationConfig;
}

export class Config {
  private config: DisputeServiceConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): DisputeServiceConfig {
    return {
      port: parseInt(process.env.DISPUTE_SERVICE_PORT || '8004', 10),
      host: process.env.DISPUTE_SERVICE_HOST || '0.0.0.0',
      logLevel: process.env.LOG_LEVEL || 'info',
      allowedOrigins: this.parseCorsOrigins(process.env.CORS_ORIGINS || 'http://localhost:3000'),
      
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
        db: parseInt(process.env.REDIS_DB || '0', 10)
      },
      
      notification: {
        email: {
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        },
        webhook: {
          url: process.env.WEBHOOK_URL || '',
          secret: process.env.WEBHOOK_SECRET || ''
        }
      }
    };
  }

  private parseCorsOrigins(origins: string): string[] {
    return origins.split(',').map(origin => origin.trim());
  }

  getConfig(): DisputeServiceConfig {
    return this.config;
  }
}
