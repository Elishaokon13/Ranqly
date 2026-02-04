/**
 * Configuration management for Content Crawler
 */

import dotenv from 'dotenv';

dotenv.config();

export class Config {
  private config: any;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): any {
    return {
      port: parseInt(process.env.CONTENT_CRAWLER_PORT || '8005', 10),
      host: process.env.CONTENT_CRAWLER_HOST || '0.0.0.0',
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
      }
    };
  }

  private parseCorsOrigins(origins: string): string[] {
    return origins.split(',').map(origin => origin.trim());
  }

  getConfig(): any {
    return this.config;
  }
}
