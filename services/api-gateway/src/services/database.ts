import { Pool, PoolClient } from 'pg';
import winston from 'winston';

export class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool;
  private logger: winston.Logger;

  private constructor() {
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

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://ranqly:ranqly_dev_password@localhost:5432/ranqly_dev',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected error on idle client', err);
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public static async initialize(): Promise<void> {
    const instance = DatabaseService.getInstance();
    await instance.connect();
    await instance.createTables();
  }

  public static async close(): Promise<void> {
    const instance = DatabaseService.getInstance();
    await instance.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      this.logger.info('Database connected successfully');
    } catch (error) {
      this.logger.error('Database connection failed:', error);
      throw error;
    }
  }

  private async disconnect(): Promise<void> {
    await this.pool.end();
    this.logger.info('Database disconnected');
  }

  private async createTables(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          wallet_address VARCHAR(42) UNIQUE NOT NULL,
          username VARCHAR(50) UNIQUE,
          email VARCHAR(255),
          avatar_url TEXT,
          reputation_score INTEGER DEFAULT 0,
          poi_nft_balance INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Contests table
      await client.query(`
        CREATE TABLE IF NOT EXISTS contests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          reward_amount DECIMAL(18, 8) NOT NULL,
          reward_token VARCHAR(10) NOT NULL,
          submission_deadline TIMESTAMP NOT NULL,
          voting_deadline TIMESTAMP NOT NULL,
          judging_deadline TIMESTAMP NOT NULL,
          rules TEXT[],
          organizer_address VARCHAR(42) NOT NULL,
          status VARCHAR(20) DEFAULT 'announced',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Submissions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS submissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
          submitter_address VARCHAR(42) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          content_url TEXT,
          content_type VARCHAR(50),
          file_hash VARCHAR(64),
          algorithmic_score DECIMAL(5, 2) DEFAULT 0,
          community_score DECIMAL(5, 2) DEFAULT 0,
          judge_score DECIMAL(5, 2) DEFAULT 0,
          final_score DECIMAL(5, 2) DEFAULT 0,
          status VARCHAR(20) DEFAULT 'submitted',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Voting sessions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS voting_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
          phase VARCHAR(20) DEFAULT 'commit',
          commit_end_time TIMESTAMP NOT NULL,
          reveal_end_time TIMESTAMP NOT NULL,
          total_commits INTEGER DEFAULT 0,
          total_reveals INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Vote commits table
      await client.query(`
        CREATE TABLE IF NOT EXISTS vote_commits (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          voter_address VARCHAR(42) NOT NULL,
          contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
          submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
          commit_hash VARCHAR(64) NOT NULL,
          timestamp TIMESTAMP DEFAULT NOW(),
          UNIQUE(voter_address, contest_id, submission_id)
        )
      `);

      // Vote reveals table
      await client.query(`
        CREATE TABLE IF NOT EXISTS vote_reveals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          voter_address VARCHAR(42) NOT NULL,
          contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
          submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
          vote_value INTEGER NOT NULL CHECK (vote_value IN (0, 1)),
          salt VARCHAR(32) NOT NULL,
          justification_hash VARCHAR(64),
          timestamp TIMESTAMP DEFAULT NOW(),
          UNIQUE(voter_address, contest_id, submission_id)
        )
      `);

      // Judge assignments table
      await client.query(`
        CREATE TABLE IF NOT EXISTS judge_assignments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
          judge_address VARCHAR(42) NOT NULL,
          submission_ids UUID[] NOT NULL,
          is_anonymous BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Judge scores table
      await client.query(`
        CREATE TABLE IF NOT EXISTS judge_scores (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          judge_assignment_id UUID REFERENCES judge_assignments(id) ON DELETE CASCADE,
          submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
          score DECIMAL(5, 2) NOT NULL,
          justification TEXT,
          timestamp TIMESTAMP DEFAULT NOW(),
          UNIQUE(judge_assignment_id, submission_id)
        )
      `);

      // Disputes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS disputes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
          submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
          disputer_address VARCHAR(42) NOT NULL,
          dispute_type VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          status VARCHAR(20) DEFAULT 'open',
          resolution TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          resolved_at TIMESTAMP
        )
      `);

      // Audit logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          entity_type VARCHAR(50) NOT NULL,
          entity_id UUID NOT NULL,
          action VARCHAR(50) NOT NULL,
          actor_address VARCHAR(42),
          details JSONB,
          timestamp TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
        CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status);
        CREATE INDEX IF NOT EXISTS idx_contests_organizer ON contests(organizer_address);
        CREATE INDEX IF NOT EXISTS idx_submissions_contest ON submissions(contest_id);
        CREATE INDEX IF NOT EXISTS idx_submissions_submitter ON submissions(submitter_address);
        CREATE INDEX IF NOT EXISTS idx_vote_commits_voter ON vote_commits(voter_address);
        CREATE INDEX IF NOT EXISTS idx_vote_commits_contest ON vote_commits(contest_id);
        CREATE INDEX IF NOT EXISTS idx_vote_reveals_voter ON vote_reveals(voter_address);
        CREATE INDEX IF NOT EXISTS idx_vote_reveals_contest ON vote_reveals(contest_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
      `);

      await client.query('COMMIT');
      this.logger.info('Database tables created successfully');
      
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Error creating database tables:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      this.logger.debug('Query executed', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      this.logger.error('Database query error:', { text, error });
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
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

  // Contest methods
  public async createContest(contest: any): Promise<any> {
    const result = await this.query(`
      INSERT INTO contests (title, description, reward_amount, reward_token, 
                          submission_deadline, voting_deadline, judging_deadline, 
                          rules, organizer_address, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      contest.title, contest.description, contest.reward_amount, contest.reward_token,
      contest.submission_deadline, contest.voting_deadline, contest.judging_deadline,
      contest.rules, contest.organizer_address, contest.status || 'announced'
    ]);
    return result.rows[0];
  }

  public async getContest(id: string): Promise<any> {
    const result = await this.query('SELECT * FROM contests WHERE id = $1', [id]);
    return result.rows[0];
  }

  public async getContests(filters: any = {}): Promise<any[]> {
    let query = 'SELECT * FROM contests WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND status = $${paramCount++}`;
      params.push(filters.status);
    }

    if (filters.organizer_address) {
      query += ` AND organizer_address = $${paramCount++}`;
      params.push(filters.organizer_address);
    }

    query += ' ORDER BY created_at DESC';
    
    if (filters.limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(filters.limit);
    }

    const result = await this.query(query, params);
    return result.rows;
  }

  public async updateContest(id: string, updates: any): Promise<any> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await this.query(`
      UPDATE contests 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, ...values]);
    
    return result.rows[0];
  }

  // Submission methods
  public async createSubmission(submission: any): Promise<any> {
    const result = await this.query(`
      INSERT INTO submissions (contest_id, submitter_address, title, description, 
                              content_url, content_type, file_hash, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      submission.contest_id, submission.submitter_address, submission.title,
      submission.description, submission.content_url, submission.content_type,
      submission.file_hash, submission.status || 'submitted'
    ]);
    return result.rows[0];
  }

  public async getSubmission(id: string): Promise<any> {
    const result = await this.query('SELECT * FROM submissions WHERE id = $1', [id]);
    return result.rows[0];
  }

  public async getContestSubmissions(contestId: string): Promise<any[]> {
    const result = await this.query(
      'SELECT * FROM submissions WHERE contest_id = $1 ORDER BY created_at DESC',
      [contestId]
    );
    return result.rows;
  }

  public async updateSubmission(id: string, updates: any): Promise<any> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await this.query(`
      UPDATE submissions 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, ...values]);
    
    return result.rows[0];
  }

  // Voting methods
  public async createVotingSession(session: any): Promise<any> {
    const result = await this.query(`
      INSERT INTO voting_sessions (contest_id, commit_end_time, reveal_end_time, phase)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [session.contestId, session.commitEndTime, session.revealEndTime, session.phase]);
    return result.rows[0];
  }

  public async getVotingSession(contestId: string): Promise<any> {
    const result = await this.query(
      'SELECT * FROM voting_sessions WHERE contest_id = $1 AND is_active = true',
      [contestId]
    );
    return result.rows[0];
  }

  public async updateVotingSession(session: any): Promise<any> {
    const result = await this.query(`
      UPDATE voting_sessions 
      SET phase = $2, total_commits = $3, total_reveals = $4, is_active = $5, updated_at = NOW()
      WHERE contest_id = $1
      RETURNING *
    `, [session.contestId, session.phase, session.totalCommits, session.totalReveals, session.isActive]);
    return result.rows[0];
  }

  public async storeVoteCommit(commit: any): Promise<any> {
    const result = await this.query(`
      INSERT INTO vote_commits (voter_address, contest_id, submission_id, commit_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [commit.voterAddress, commit.contestId, commit.submissionId, commit.commitHash]);
    return result.rows[0];
  }

  public async getVoteCommit(voterAddress: string, contestId: string, submissionId: string): Promise<any> {
    const result = await this.query(
      'SELECT * FROM vote_commits WHERE voter_address = $1 AND contest_id = $2 AND submission_id = $3',
      [voterAddress, contestId, submissionId]
    );
    return result.rows[0];
  }

  public async storeVoteReveal(reveal: any): Promise<any> {
    const result = await this.query(`
      INSERT INTO vote_reveals (voter_address, contest_id, submission_id, vote_value, salt, justification_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [reveal.voterAddress, reveal.contestId, reveal.submissionId, reveal.voteValue, reveal.salt, reveal.justificationHash]);
    return result.rows[0];
  }

  public async getVoteReveal(voterAddress: string, contestId: string, submissionId: string): Promise<any> {
    const result = await this.query(
      'SELECT * FROM vote_reveals WHERE voter_address = $1 AND contest_id = $2 AND submission_id = $3',
      [voterAddress, contestId, submissionId]
    );
    return result.rows[0];
  }

  // User methods
  public async createUser(user: any): Promise<any> {
    const result = await this.query(`
      INSERT INTO users (wallet_address, username, email, avatar_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [user.wallet_address, user.username, user.email, user.avatar_url]);
    return result.rows[0];
  }

  public async getUser(walletAddress: string): Promise<any> {
    const result = await this.query('SELECT * FROM users WHERE wallet_address = $1', [walletAddress]);
    return result.rows[0];
  }

  public async updateUser(walletAddress: string, updates: any): Promise<any> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await this.query(`
      UPDATE users 
      SET ${setClause}, updated_at = NOW()
      WHERE wallet_address = $1
      RETURNING *
    `, [walletAddress, ...values]);
    
    return result.rows[0];
  }

  // Audit methods
  public async logAuditEvent(event: any): Promise<any> {
    const result = await this.query(`
      INSERT INTO audit_logs (entity_type, entity_id, action, actor_address, details)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [event.entity_type, event.entity_id, event.action, event.actor_address, event.details]);
    return result.rows[0];
  }
}