/**
 * Database Service for Content Crawler
 */

import winston from 'winston';
import { Pool } from 'pg';

export class DatabaseService {
  private logger: winston.Logger;
  private pool: Pool | null = null;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  async initialize(config: any): Promise<void> {
    try {
      this.pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        ssl: config.ssl,
        max: config.poolSize,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.logger.info('Database service initialized successfully');

    } catch (error) {
      this.logger.error(`Failed to initialize database service: ${error}`);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.pool) return false;

    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      this.logger.error(`Database health check failed: ${error}`);
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.logger.info('Database connection pool closed');
    }
  }
}
