/**
 * Redis Service for Content Crawler
 */

import winston from 'winston';
import { createClient, RedisClientType } from 'redis';

export class RedisService {
  private logger: winston.Logger;
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  async initialize(config: any): Promise<void> {
    try {
      this.client = createClient({
        socket: {
          host: config.host,
          port: config.port,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              this.logger.error('Redis reconnection failed after 10 attempts');
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        },
        password: config.password,
        database: config.db
      });

      this.client.on('error', (error) => {
        this.logger.error(`Redis client error: ${error}`);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.logger.info('Redis client connected');
        this.isConnected = true;
      });

      await this.client.connect();
      await this.client.ping();

      this.logger.info('Redis service initialized successfully');

    } catch (error) {
      this.logger.error(`Failed to initialize Redis service: ${error}`);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.ping();
      return true;
    } catch (error) {
      this.logger.error(`Redis health check failed: ${error}`);
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      this.logger.info('Redis connection closed');
    }
  }
}
