/**
 * Shared TypeScript types for Ranqly Backend
 */

// Base API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  walletAddress?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin';

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  walletAddress?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// Contest Types
export interface Contest {
  id: string;
  title: string;
  description: string;
  status: ContestStatus;
  startDate: Date;
  endDate: Date;
  prizePool: number;
  theme: string;
  keywords: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ContestStatus = 'draft' | 'active' | 'upcoming' | 'completed' | 'cancelled';

export interface CreateContestRequest {
  title: string;
  description: string;
  theme: string;
  keywords: string[];
  startDate: Date;
  endDate: Date;
  prizePool?: number;
}

// Submission Types
export interface Submission {
  id: string;
  contestId: string;
  userId: string;
  content: string;
  contentType: ContentType;
  score?: number;
  status: SubmissionStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type ContentType = 'text' | 'image' | 'video' | 'audio' | 'code' | 'other';
export type SubmissionStatus = 'draft' | 'submitted' | 'scored' | 'disqualified';

export interface CreateSubmissionRequest {
  contestId: string;
  content: string;
  contentType: ContentType;
  metadata?: Record<string, any>;
}

// Scoring Types
export interface ScoringRequest {
  submissionId: string;
  content: string;
  contestContext: ContestContext;
  weights?: ScoringWeights;
}

export interface ContestContext {
  contestId?: string;
  theme: string;
  keywords: string[];
  contentType: ContentType;
  submissionDate?: Date;
}

export interface ScoringWeights {
  depth: number;
  reach: number;
  relevance: number;
  consistency: number;
}

export interface ScoringResponse {
  submissionId: string;
  finalScore: number;
  scoringBreakdown: {
    depth: AxisScore;
    reach: AxisScore;
    relevance: AxisScore;
    consistency: AxisScore;
  };
  weightsUsed: ScoringWeights;
  confidence: number;
  processingTime: number;
  timestamp: Date;
  modelVersion: string;
  success: boolean;
  error?: string;
}

export interface AxisScore {
  score: number;
  confidence: number;
  details: Record<string, any>;
}

// Voting Types
export interface VotingRound {
  id: string;
  contestId: string;
  submissionId: string;
  status: VotingStatus;
  startBlock: number;
  endBlock: number;
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

export type VotingStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface VoteCommit {
  roundId: string;
  commitment: string;
  timestamp: Date;
}

export interface VoteReveal {
  roundId: string;
  secret: string;
  vote: VoteData;
}

export interface VoteData {
  submissionId: string;
  score: number;
  confidence: number;
  reasoning?: string;
}

// Dispute Types
export interface Dispute {
  id: string;
  submissionId: string;
  contestId: string;
  reporterId: string;
  disputeType: DisputeType;
  reason: string;
  evidence: string[];
  status: DisputeStatus;
  priority: DisputePriority;
  assignedResolver?: string;
  resolution?: ResolutionDetails;
  createdAt: Date;
  updatedAt: Date;
}

export type DisputeType = 'plagiarism' | 'spam' | 'inappropriate' | 'copyright' | 'fake_submission' | 'other';
export type DisputeStatus = 'pending' | 'in_review' | 'resolved' | 'dismissed' | 'escalated';
export type DisputePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ResolutionDetails {
  resolutionType: 'approved' | 'rejected' | 'modified' | 'escalated';
  reason: string;
  action: string;
  resolvedBy: string;
  resolvedAt: Date;
}

// Crawler Types
export interface CrawlRequest {
  url: string;
  options?: CrawlOptions;
}

export interface CrawlOptions {
  timeout?: number;
  followRedirects?: boolean;
  extractImages?: boolean;
  extractLinks?: boolean;
  extractMetadata?: boolean;
  extractText?: boolean;
}

export interface CrawlResult {
  url: string;
  title?: string;
  description?: string;
  content?: string;
  links?: string[];
  images?: string[];
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Audit Types
export interface AuditEntry {
  id: string;
  eventType: string;
  entityId: string;
  entityType: string;
  action: string;
  data: Record<string, any>;
  hash: string;
  previousHash?: string;
  timestamp: Date;
  blockNumber?: number;
  transactionHash?: string;
}

export interface CreateAuditEntryRequest {
  eventType: string;
  entityId: string;
  entityType: string;
  action: string;
  data: Record<string, any>;
}

// Governance Types
export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposalType: ProposalType;
  status: ProposalStatus;
  proposer: string;
  votesFor: number;
  votesAgainst: number;
  votingPower: number;
  startBlock: number;
  endBlock: number;
  parameters?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type ProposalType = 'parameter_change' | 'treasury_spend' | 'protocol_upgrade' | 'other';
export type ProposalStatus = 'draft' | 'active' | 'passed' | 'rejected' | 'executed';

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export type NotificationType = 'contest_update' | 'scoring_complete' | 'dispute_update' | 'governance_vote' | 'general';

// Health Check Types
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  version: string;
  uptime: number;
  services: {
    database: boolean;
    redis: boolean;
    queue: boolean;
    blockchain: boolean;
  };
  dependencies: Record<string, boolean>;
  metrics: {
    memoryUsage: number;
    cpuUsage: number;
    requestCount: number;
    errorCount: number;
  };
}

// Configuration Types
export interface Config {
  port: number;
  host: string;
  nodeEnv: string;
  logLevel: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  blockchain: BlockchainConfig;
  jwt: JWTConfig;
  cors: CORSConfig;
  rateLimit: RateLimitConfig;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface BlockchainConfig {
  rpcUrl: string;
  chainId: number;
  privateKey?: string;
  contractAddresses: Record<string, string>;
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface CORSConfig {
  origins: string[];
  credentials: boolean;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

// Service Status Types
export interface ServiceStatus {
  database: boolean;
  redis: boolean;
  queue: boolean;
  blockchain: boolean;
  nlp: boolean;
  scoring: boolean;
}

// Error Types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
}

// Queue Types
export interface QueueJob {
  id: string;
  type: string;
  data: Record<string, any>;
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: string;
    delay: number;
  };
}

// Metrics Types
export interface Metrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  scoring: {
    totalScorings: number;
    averageProcessingTime: number;
    successRate: number;
    averageConfidence: number;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
  };
}


