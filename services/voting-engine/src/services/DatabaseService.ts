import { Pool, PoolClient } from 'pg';
import { Logger } from '../utils/logger';

interface VoteCommit {
  id?: number;
  voterAddress: string;
  contestId: string;
  submissionId: string;
  commitHash: string;
  timestamp: number;
  phase: string;
}

interface VoteReveal {
  id?: number;
  voterAddress: string;
  contestId: string;
  submissionId: string;
  voteValue: number;
  salt: string;
  justificationHash: string;
  timestamp: number;
}

interface VotingSession {
  id?: number;
  contestId: string;
  phase: string;
  commitEndTime: number;
  revealEndTime: number;
  totalCommits: number;
  totalReveals: number;
  isActive: boolean;
  createdAt?: number;
  updatedAt?: number;
}

interface InvalidVote {
  id?: number;
  voterAddress: string;
  contestId: string;
  submissionId: string;
  voteValue: number;
  reason: string;
  sybilScore?: number;
  timestamp: number;
}

interface VotingResult {
  id?: number;
  contestId: string;
  submissionId: string;
  upvotes: number;
  downvotes: number;
  totalVotes: number;
  netScore: number;
  participationRate: number;
  confidenceScore: number;
  createdAt?: number;
}

interface UserVotingHistory {
  id?: number;
  voterAddress: string;
  contestId: string;
  submissionId: string;
  voteValue: number;
  timestamp: number;
}

export class DatabaseService {
  private logger: winston.Logger;
  private pool: Pool;
  private isInitialized: boolean = false;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/database-service.log' })
      ]
    });
  }

  async initialize(): Promise<void> {
    try {
      // Initialize connection pool
      this.pool = new Pool({
        connectionString: process.env.POSTGRES_URL || 'postgresql://user:password@localhost:5432/ranqly_db',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      // Create tables if they don't exist
      await this.createTables();

      this.isInitialized = true;
      this.logger.info('Database Service initialized successfully');

    } catch (error) {
      this.logger.error(`Failed to initialize Database Service: ${error}`);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Create voting_sessions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS voting_sessions (
          id SERIAL PRIMARY KEY,
          contest_id VARCHAR(255) UNIQUE NOT NULL,
          phase VARCHAR(50) NOT NULL DEFAULT 'commit',
          commit_end_time BIGINT NOT NULL,
          reveal_end_time BIGINT NOT NULL,
          total_commits INTEGER DEFAULT 0,
          total_reveals INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
          updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
        )
      `);

      // Create vote_commits table
      await client.query(`
        CREATE TABLE IF NOT EXISTS vote_commits (
          id SERIAL PRIMARY KEY,
          voter_address VARCHAR(42) NOT NULL,
          contest_id VARCHAR(255) NOT NULL,
          submission_id VARCHAR(255) NOT NULL,
          commit_hash VARCHAR(66) NOT NULL,
          timestamp BIGINT NOT NULL,
          phase VARCHAR(50) DEFAULT 'commit',
          created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
          UNIQUE(voter_address, contest_id, submission_id)
        )
      `);

      // Create vote_reveals table
      await client.query(`
        CREATE TABLE IF NOT EXISTS vote_reveals (
          id SERIAL PRIMARY KEY,
          voter_address VARCHAR(42) NOT NULL,
          contest_id VARCHAR(255) NOT NULL,
          submission_id VARCHAR(255) NOT NULL,
          vote_value INTEGER NOT NULL,
          salt VARCHAR(255) NOT NULL,
          justification_hash VARCHAR(66) NOT NULL,
          timestamp BIGINT NOT NULL,
          created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
          UNIQUE(voter_address, contest_id, submission_id)
        )
      `);

      // Create invalid_votes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS invalid_votes (
          id SERIAL PRIMARY KEY,
          voter_address VARCHAR(42) NOT NULL,
          contest_id VARCHAR(255) NOT NULL,
          submission_id VARCHAR(255) NOT NULL,
          vote_value INTEGER NOT NULL,
          reason TEXT NOT NULL,
          sybil_score DECIMAL(3,2),
          timestamp BIGINT NOT NULL,
          created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
        )
      `);

      // Create voting_results table
      await client.query(`
        CREATE TABLE IF NOT EXISTS voting_results (
          id SERIAL PRIMARY KEY,
          contest_id VARCHAR(255) NOT NULL,
          submission_id VARCHAR(255) NOT NULL,
          upvotes INTEGER DEFAULT 0,
          downvotes INTEGER DEFAULT 0,
          total_votes INTEGER DEFAULT 0,
          net_score INTEGER DEFAULT 0,
          participation_rate DECIMAL(5,4) DEFAULT 0,
          confidence_score DECIMAL(5,4) DEFAULT 0,
          created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
          updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
          UNIQUE(contest_id, submission_id)
        )
      `);

      // Create user_voting_history table
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_voting_history (
          id SERIAL PRIMARY KEY,
          voter_address VARCHAR(42) NOT NULL,
          contest_id VARCHAR(255) NOT NULL,
          submission_id VARCHAR(255) NOT NULL,
          vote_value INTEGER NOT NULL,
          timestamp BIGINT NOT NULL,
          created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
        )
      `);

      // Create submission_vote_counts table
      await client.query(`
        CREATE TABLE IF NOT EXISTS submission_vote_counts (
          id SERIAL PRIMARY KEY,
          contest_id VARCHAR(255) NOT NULL,
          submission_id VARCHAR(255) NOT NULL,
          upvotes INTEGER DEFAULT 0,
          downvotes INTEGER DEFAULT 0,
          total_votes INTEGER DEFAULT 0,
          updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
          UNIQUE(contest_id, submission_id)
        )
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_vote_commits_voter ON vote_commits(voter_address);
        CREATE INDEX IF NOT EXISTS idx_vote_commits_contest ON vote_commits(contest_id);
        CREATE INDEX IF NOT EXISTS idx_vote_reveals_voter ON vote_reveals(voter_address);
        CREATE INDEX IF NOT EXISTS idx_vote_reveals_contest ON vote_reveals(contest_id);
        CREATE INDEX IF NOT EXISTS idx_voting_sessions_contest ON voting_sessions(contest_id);
        CREATE INDEX IF NOT EXISTS idx_voting_sessions_active ON voting_sessions(is_active);
        CREATE INDEX IF NOT EXISTS idx_user_voting_history_voter ON user_voting_history(voter_address);
        CREATE INDEX IF NOT EXISTS idx_user_voting_history_timestamp ON user_voting_history(timestamp);
      `);

      this.logger.info('Database tables created successfully');

    } catch (error) {
      this.logger.error(`Error creating database tables: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async storeVotingSession(session: VotingSession): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        INSERT INTO voting_sessions (
          contest_id, phase, commit_end_time, reveal_end_time,
          total_commits, total_reveals, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (contest_id) DO UPDATE SET
          phase = EXCLUDED.phase,
          commit_end_time = EXCLUDED.commit_end_time,
          reveal_end_time = EXCLUDED.reveal_end_time,
          total_commits = EXCLUDED.total_commits,
          total_reveals = EXCLUDED.total_reveals,
          is_active = EXCLUDED.is_active,
          updated_at = EXTRACT(EPOCH FROM NOW()) * 1000
      `, [
        session.contestId,
        session.phase,
        session.commitEndTime,
        session.revealEndTime,
        session.totalCommits,
        session.totalReveals,
        session.isActive
      ]);

    } catch (error) {
      this.logger.error(`Error storing voting session: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async getVotingSession(contestId: string): Promise<VotingSession | null> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT * FROM voting_sessions WHERE contest_id = $1
      `, [contestId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        contestId: row.contest_id,
        phase: row.phase,
        commitEndTime: parseInt(row.commit_end_time),
        revealEndTime: parseInt(row.reveal_end_time),
        totalCommits: row.total_commits,
        totalReveals: row.total_reveals,
        isActive: row.is_active,
        createdAt: parseInt(row.created_at),
        updatedAt: parseInt(row.updated_at)
      };

    } catch (error) {
      this.logger.error(`Error getting voting session: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateVotingSession(session: VotingSession): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        UPDATE voting_sessions SET
          phase = $2,
          total_commits = $3,
          total_reveals = $4,
          is_active = $5,
          updated_at = EXTRACT(EPOCH FROM NOW()) * 1000
        WHERE contest_id = $1
      `, [
        session.contestId,
        session.phase,
        session.totalCommits,
        session.totalReveals,
        session.isActive
      ]);

    } catch (error) {
      this.logger.error(`Error updating voting session: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async storeVoteCommit(voteCommit: VoteCommit): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        INSERT INTO vote_commits (
          voter_address, contest_id, submission_id, commit_hash, timestamp, phase
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (voter_address, contest_id, submission_id) DO UPDATE SET
          commit_hash = EXCLUDED.commit_hash,
          timestamp = EXCLUDED.timestamp,
          phase = EXCLUDED.phase
      `, [
        voteCommit.voterAddress,
        voteCommit.contestId,
        voteCommit.submissionId,
        voteCommit.commitHash,
        voteCommit.timestamp,
        voteCommit.phase
      ]);

    } catch (error) {
      this.logger.error(`Error storing vote commit: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async getVoteCommit(voterAddress: string, contestId: string, submissionId: string): Promise<VoteCommit | null> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT * FROM vote_commits 
        WHERE voter_address = $1 AND contest_id = $2 AND submission_id = $3
      `, [voterAddress, contestId, submissionId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        voterAddress: row.voter_address,
        contestId: row.contest_id,
        submissionId: row.submission_id,
        commitHash: row.commit_hash,
        timestamp: parseInt(row.timestamp),
        phase: row.phase
      };

    } catch (error) {
      this.logger.error(`Error getting vote commit: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async storeVoteReveal(voteReveal: VoteReveal): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        INSERT INTO vote_reveals (
          voter_address, contest_id, submission_id, vote_value, salt, justification_hash, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (voter_address, contest_id, submission_id) DO UPDATE SET
          vote_value = EXCLUDED.vote_value,
          salt = EXCLUDED.salt,
          justification_hash = EXCLUDED.justification_hash,
          timestamp = EXCLUDED.timestamp
      `, [
        voteReveal.voterAddress,
        voteReveal.contestId,
        voteReveal.submissionId,
        voteReveal.voteValue,
        voteReveal.salt,
        voteReveal.justificationHash,
        voteReveal.timestamp
      ]);

      // Also store in voting history
      await client.query(`
        INSERT INTO user_voting_history (
          voter_address, contest_id, submission_id, vote_value, timestamp
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        voteReveal.voterAddress,
        voteReveal.contestId,
        voteReveal.submissionId,
        voteReveal.voteValue,
        voteReveal.timestamp
      ]);

    } catch (error) {
      this.logger.error(`Error storing vote reveal: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async getVoteReveal(voterAddress: string, contestId: string, submissionId: string): Promise<VoteReveal | null> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT * FROM vote_reveals 
        WHERE voter_address = $1 AND contest_id = $2 AND submission_id = $3
      `, [voterAddress, contestId, submissionId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        voterAddress: row.voter_address,
        contestId: row.contest_id,
        submissionId: row.submission_id,
        voteValue: row.vote_value,
        salt: row.salt,
        justificationHash: row.justification_hash,
        timestamp: parseInt(row.timestamp)
      };

    } catch (error) {
      this.logger.error(`Error getting vote reveal: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async storeInvalidVote(invalidVote: InvalidVote): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        INSERT INTO invalid_votes (
          voter_address, contest_id, submission_id, vote_value, reason, sybil_score, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        invalidVote.voterAddress,
        invalidVote.contestId,
        invalidVote.submissionId,
        invalidVote.voteValue,
        invalidVote.reason,
        invalidVote.sybilScore,
        invalidVote.timestamp
      ]);

    } catch (error) {
      this.logger.error(`Error storing invalid vote: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async getContestSubmissions(contestId: string): Promise<string[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT DISTINCT submission_id FROM vote_reveals WHERE contest_id = $1
        UNION
        SELECT DISTINCT submission_id FROM vote_commits WHERE contest_id = $1
      `, [contestId]);

      return result.rows.map(row => row.submission_id);

    } catch (error) {
      this.logger.error(`Error getting contest submissions: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async getSubmissionUpvotes(contestId: string, submissionId: string): Promise<number> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT COUNT(*) as count FROM vote_reveals 
        WHERE contest_id = $1 AND submission_id = $2 AND vote_value = 1
      `, [contestId, submissionId]);

      return parseInt(result.rows[0].count);

    } catch (error) {
      this.logger.error(`Error getting submission upvotes: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async getSubmissionDownvotes(contestId: string, submissionId: string): Promise<number> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT COUNT(*) as count FROM vote_reveals 
        WHERE contest_id = $1 AND submission_id = $2 AND vote_value = 0
      `, [contestId, submissionId]);

      return parseInt(result.rows[0].count);

    } catch (error) {
      this.logger.error(`Error getting submission downvotes: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async incrementSubmissionUpvotes(contestId: string, submissionId: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        INSERT INTO submission_vote_counts (contest_id, submission_id, upvotes, total_votes)
        VALUES ($1, $2, 1, 1)
        ON CONFLICT (contest_id, submission_id) DO UPDATE SET
          upvotes = submission_vote_counts.upvotes + 1,
          total_votes = submission_vote_counts.total_votes + 1,
          updated_at = EXTRACT(EPOCH FROM NOW()) * 1000
      `, [contestId, submissionId]);

    } catch (error) {
      this.logger.error(`Error incrementing submission upvotes: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async incrementSubmissionDownvotes(contestId: string, submissionId: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        INSERT INTO submission_vote_counts (contest_id, submission_id, downvotes, total_votes)
        VALUES ($1, $2, 1, 1)
        ON CONFLICT (contest_id, submission_id) DO UPDATE SET
          downvotes = submission_vote_counts.downvotes + 1,
          total_votes = submission_vote_counts.total_votes + 1,
          updated_at = EXTRACT(EPOCH FROM NOW()) * 1000
      `, [contestId, submissionId]);

    } catch (error) {
      this.logger.error(`Error incrementing submission downvotes: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async getEligibleVotersCount(contestId: string): Promise<number> {
    // This would typically query a registry of eligible voters
    // For now, returning a placeholder
    return 1000;
  }

  async getUserVoteCount(voterAddress: string, contestId: string): Promise<number> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT COUNT(*) as count FROM vote_reveals 
        WHERE voter_address = $1 AND contest_id = $2
      `, [voterAddress, contestId]);

      return parseInt(result.rows[0].count);

    } catch (error) {
      this.logger.error(`Error getting user vote count: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserVotingHistory(voterAddress: string): Promise<UserVotingHistory[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT * FROM user_voting_history 
        WHERE voter_address = $1 
        ORDER BY timestamp DESC
      `, [voterAddress]);

      return result.rows.map(row => ({
        id: row.id,
        voterAddress: row.voter_address,
        contestId: row.contest_id,
        submissionId: row.submission_id,
        voteValue: row.vote_value,
        timestamp: parseInt(row.timestamp)
      }));

    } catch (error) {
      this.logger.error(`Error getting user voting history: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async getExpiredVotingSessions(): Promise<VotingSession[]> {
    const client = await this.pool.connect();
    
    try {
      const now = Date.now();
      const result = await client.query(`
        SELECT * FROM voting_sessions 
        WHERE is_active = true AND reveal_end_time < $1
      `, [now]);

      return result.rows.map(row => ({
        id: row.id,
        contestId: row.contest_id,
        phase: row.phase,
        commitEndTime: parseInt(row.commit_end_time),
        revealEndTime: parseInt(row.reveal_end_time),
        totalCommits: row.total_commits,
        totalReveals: row.total_reveals,
        isActive: row.is_active,
        createdAt: parseInt(row.created_at),
        updatedAt: parseInt(row.updated_at)
      }));

    } catch (error) {
      this.logger.error(`Error getting expired voting sessions: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async getActiveVotingSessions(): Promise<VotingSession[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT * FROM voting_sessions WHERE is_active = true
      `);

      return result.rows.map(row => ({
        id: row.id,
        contestId: row.contest_id,
        phase: row.phase,
        commitEndTime: parseInt(row.commit_end_time),
        revealEndTime: parseInt(row.reveal_end_time),
        totalCommits: row.total_commits,
        totalReveals: row.total_reveals,
        isActive: row.is_active,
        createdAt: parseInt(row.created_at),
        updatedAt: parseInt(row.updated_at)
      }));

    } catch (error) {
      this.logger.error(`Error getting active voting sessions: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async storeFinalVotingResults(contestId: string, results: any[]): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      for (const result of results) {
        await client.query(`
          INSERT INTO voting_results (
            contest_id, submission_id, upvotes, downvotes, total_votes,
            net_score, participation_rate, confidence_score
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (contest_id, submission_id) DO UPDATE SET
            upvotes = EXCLUDED.upvotes,
            downvotes = EXCLUDED.downvotes,
            total_votes = EXCLUDED.total_votes,
            net_score = EXCLUDED.net_score,
            participation_rate = EXCLUDED.participation_rate,
            confidence_score = EXCLUDED.confidence_score,
            updated_at = EXTRACT(EPOCH FROM NOW()) * 1000
        `, [
          contestId,
          result.submissionId,
          result.upvotes,
          result.downvotes,
          result.totalVotes,
          result.netScore,
          result.participationRate,
          result.confidenceScore
        ]);
      }

    } catch (error) {
      this.logger.error(`Error storing final voting results: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateVoteStatistics(contestId: string, results: any[]): Promise<void> {
    // Update vote statistics in real-time
    await this.storeFinalVotingResults(contestId, results);
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.logger.info('Database Service closed');
    }
  }
}
