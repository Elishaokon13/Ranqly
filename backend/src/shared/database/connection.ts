/**
 * PostgreSQL database connection and management
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { DatabaseConfig } from '@/shared/types';
import winston from 'winston';

export class DatabaseService {
  private pool: Pool;
  private logger: winston.Logger;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig, logger: winston.Logger) {
    this.config = config;
    this.logger = logger;
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      this.logger.error('Unexpected error on idle client', err);
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.logger.info('Database connection established successfully');
      
      // Run migrations
      await this.runMigrations();
      
    } catch (error) {
      this.logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      this.logger.debug('Executed query', {
        query: text,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
      
      return result;
    } catch (error) {
      this.logger.error('Database query error:', {
        query: text,
        params,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    this.logger.info('Database connection pool closed');
  }

  private async runMigrations(): Promise<void> {
    try {
      // Create extensions
      await this.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      await this.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

      // Create users table
      await this.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
          wallet_address VARCHAR(42),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // Create contests table
      await this.query(`
        CREATE TABLE IF NOT EXISTS contests (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'upcoming', 'completed', 'cancelled')),
          start_date TIMESTAMP WITH TIME ZONE NOT NULL,
          end_date TIMESTAMP WITH TIME ZONE NOT NULL,
          prize_pool DECIMAL(15,2) DEFAULT 0,
          theme VARCHAR(100) NOT NULL,
          keywords TEXT[] NOT NULL,
          created_by UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // Create submissions table
      await this.query(`
        CREATE TABLE IF NOT EXISTS submissions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'video', 'audio', 'code', 'other')),
          score DECIMAL(5,2),
          status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'scored', 'disqualified')),
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // Create scoring_results table
      await this.query(`
        CREATE TABLE IF NOT EXISTS scoring_results (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
          final_score DECIMAL(5,2) NOT NULL,
          scoring_breakdown JSONB NOT NULL,
          weights_used JSONB NOT NULL,
          confidence DECIMAL(3,2) NOT NULL,
          processing_time INTEGER NOT NULL,
          model_version VARCHAR(50) NOT NULL,
          success BOOLEAN NOT NULL DEFAULT true,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // Create disputes table
      await this.query(`
        CREATE TABLE IF NOT EXISTS disputes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
          contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
          reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
          dispute_type VARCHAR(30) NOT NULL CHECK (dispute_type IN ('plagiarism', 'spam', 'inappropriate', 'copyright', 'fake_submission', 'other')),
          reason TEXT NOT NULL,
          evidence TEXT[],
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'dismissed', 'escalated')),
          priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          assigned_resolver UUID REFERENCES users(id) ON DELETE SET NULL,
          resolution JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // Create audit_entries table
      await this.query(`
        CREATE TABLE IF NOT EXISTS audit_entries (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          event_type VARCHAR(100) NOT NULL,
          entity_id VARCHAR(100) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          action VARCHAR(50) NOT NULL,
          data JSONB NOT NULL,
          hash VARCHAR(64) NOT NULL,
          previous_hash VARCHAR(64),
          block_number INTEGER,
          transaction_hash VARCHAR(66),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // Create proposals table
      await this.query(`
        CREATE TABLE IF NOT EXISTS proposals (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          proposal_type VARCHAR(30) NOT NULL CHECK (proposal_type IN ('parameter_change', 'treasury_spend', 'protocol_upgrade', 'other')),
          status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'passed', 'rejected', 'executed')),
          proposer UUID REFERENCES users(id) ON DELETE CASCADE,
          votes_for INTEGER DEFAULT 0,
          votes_against INTEGER DEFAULT 0,
          voting_power DECIMAL(20,2) DEFAULT 0,
          start_block INTEGER,
          end_block INTEGER,
          parameters JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // Create notifications table
      await this.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(30) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          data JSONB,
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // Create indexes
      await this.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_contests_created_by ON contests(created_by)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_submissions_contest_id ON submissions(contest_id)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_scoring_results_submission_id ON scoring_results(submission_id)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_disputes_priority ON disputes(priority)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_audit_entries_entity_id ON audit_entries(entity_id)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_audit_entries_entity_type ON audit_entries(entity_type)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
      await this.query('CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)');

      this.logger.info('Database migrations completed successfully');
      
    } catch (error) {
      this.logger.error('Database migration failed:', error);
      throw error;
    }
  }
}

export default DatabaseService;


