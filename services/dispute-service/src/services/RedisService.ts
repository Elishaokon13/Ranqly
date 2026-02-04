/**
 * Redis Service for Dispute Service
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

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      this.logger.warn('Redis client not connected, skipping set operation');
      return false;
    }

    try {
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      
      this.logger.debug(`Redis set: ${key}`);
      return true;

    } catch (error) {
      this.logger.error(`Error setting Redis key ${key}: ${error}`);
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      this.logger.warn('Redis client not connected, skipping get operation');
      return null;
    }

    try {
      const value = await this.client.get(key);
      
      if (value) {
        this.logger.debug(`Redis get: ${key} (hit)`);
      } else {
        this.logger.debug(`Redis get: ${key} (miss)`);
      }
      
      return value;

    } catch (error) {
      this.logger.error(`Error getting Redis key ${key}: ${error}`);
      return null;
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
