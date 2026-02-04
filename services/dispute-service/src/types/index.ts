/**
 * Type definitions for Dispute Service
 */

export interface DisputeServiceConfig {
  port: number;
  host: string;
  logLevel: string;
  allowedOrigins: string[];
  database: DatabaseConfig;
  redis: RedisConfig;
  notification: NotificationConfig;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  poolSize: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

export interface NotificationConfig {
  email: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  webhook: {
    url: string;
    secret: string;
  };
}

export interface ServiceStatus {
  disputeResolver: boolean;
  triageService: boolean;
  databaseService: boolean;
  redisService: boolean;
  notificationService: boolean;
}

export interface DisputeRequest {
  submissionId: string;
  contestId: string;
  reporterId: string;
  disputeType: DisputeType;
  reason: string;
  evidence?: string[];
  metadata?: Record<string, any>;
}

export enum DisputeType {
  PLAGIARISM = 'plagiarism',
  SPAM = 'spam',
  INAPPROPRIATE = 'inappropriate',
  COPYRIGHT = 'copyright',
  FAKE_SUBMISSION = 'fake_submission',
  OTHER = 'other'
}

export interface DisputeResponse {
  disputeId: string;
  status: DisputeStatus;
  priority: DisputePriority;
  assignedResolver?: string;
  resolution?: ResolutionDetails;
  createdAt: string;
  updatedAt: string;
}

export enum DisputeStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
  ESCALATED = 'escalated'
}

export enum DisputePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface ResolutionDetails {
  resolutionType: ResolutionType;
  reason: string;
  action: string;
  resolvedBy: string;
  resolvedAt: string;
}

export enum ResolutionType {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  MODIFIED = 'modified',
  ESCALATED = 'escalated'
}

export interface TriageRequest {
  disputeId: string;
  disputeType: DisputeType;
  content: string;
  metadata: Record<string, any>;
}

export interface TriageResponse {
  disputeId: string;
  priority: DisputePriority;
  suggestedResolver?: string;
  confidence: number;
  reasoning: string;
  estimatedResolutionTime: number;
}
