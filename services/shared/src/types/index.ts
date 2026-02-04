/**
 * Shared types for Ranqly services
 */

export interface ServiceConfig {
  database: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  blockchain: {
    rpcUrl: string;
    poiNftAddress: string;
    contestRegistryAddress: string;
    contestVaultAddress: string;
    commitRevealVotingAddress: string;
  };
  logging: {
    level: string;
    format: string;
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  service: string;
  timestamp: string;
  version: string;
  uptime: number;
  dependencies?: {
    database: boolean;
    redis: boolean;
    blockchain: boolean;
  };
}

export interface ServiceInitializationOptions {
  database?: boolean;
  redis?: boolean;
  blockchain?: boolean;
  logger?: boolean;
}

export interface BaseService {
  initialize(): Promise<void>;
  close(): Promise<void>;
  healthCheck(): Promise<HealthCheckResponse>;
}

export interface DatabaseService extends BaseService {
  query(sql: string, params?: any[]): Promise<any>;
  transaction<T>(callback: (client: any) => Promise<T>): Promise<T>;
}

export interface RedisService extends BaseService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export interface BlockchainService extends BaseService {
  getNetworkInfo(): Promise<{ name: string; chainId: number; blockNumber: number }>;
  isAddressValid(address: string): Promise<boolean>;
  getBalance(address: string): Promise<string>;
}
