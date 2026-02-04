/**
 * Configuration management for Ranqly Backend
 */

import dotenv from 'dotenv';
import { Config, DatabaseConfig, RedisConfig, BlockchainConfig, JWTConfig, CORSConfig, RateLimitConfig } from '@/shared/types';

// Load environment variables
dotenv.config();

class ConfigManager {
  private config: Config;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    return {
      port: parseInt(process.env.PORT || '8000', 10),
      host: process.env.HOST || 'localhost',
      nodeEnv: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info',
      
      database: this.loadDatabaseConfig(),
      redis: this.loadRedisConfig(),
      blockchain: this.loadBlockchainConfig(),
      jwt: this.loadJWTConfig(),
      cors: this.loadCORSConfig(),
      rateLimit: this.loadRateLimitConfig(),
    };
  }

  private loadDatabaseConfig(): DatabaseConfig {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'ranqly',
      username: process.env.DB_USER || 'ranqly',
      password: process.env.DB_PASSWORD || 'ranqly',
      ssl: process.env.DB_SSL === 'true',
    };
  }

  private loadRedisConfig(): RedisConfig {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    };
  }

  private loadBlockchainConfig(): BlockchainConfig {
    return {
      rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545',
      chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || '31337', 10),
      privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
      contractAddresses: {
        voting: process.env.VOTING_CONTRACT_ADDRESS || '',
        governance: process.env.GOVERNANCE_CONTRACT_ADDRESS || '',
        nft: process.env.NFT_CONTRACT_ADDRESS || '',
      },
    };
  }

  private loadJWTConfig(): JWTConfig {
    return {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    };
  }

  private loadCORSConfig(): CORSConfig {
    const origins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
    return {
      origins,
      credentials: process.env.CORS_CREDENTIALS === 'true',
    };
  }

  private loadRateLimitConfig(): RateLimitConfig {
    return {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
    };
  }

  public getConfig(): Config {
    return { ...this.config };
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  public isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }

  public getDatabaseUrl(): string {
    const { host, port, database, username, password, ssl } = this.config.database;
    const sslParam = ssl ? '?sslmode=require' : '';
    return `postgresql://${username}:${password}@${host}:${port}/${database}${sslParam}`;
  }

  public getRedisUrl(): string {
    const { host, port, password, db } = this.config.redis;
    const auth = password ? `:${password}@` : '';
    return `redis://${auth}${host}:${port}/${db}`;
  }

  public validateConfig(): void {
    const required = [
      'JWT_SECRET',
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate database connection
    if (!this.config.database.host || !this.config.database.database) {
      throw new Error('Database configuration is incomplete');
    }

    // Validate Redis connection
    if (!this.config.redis.host) {
      throw new Error('Redis configuration is incomplete');
    }

    // Validate blockchain configuration
    if (!this.config.blockchain.rpcUrl) {
      throw new Error('Blockchain RPC URL is required');
    }
  }
}

// Create singleton instance
const configManager = new ConfigManager();

export default configManager;
export { ConfigManager };


