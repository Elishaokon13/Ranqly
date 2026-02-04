/**
 * Type definitions for Algorithm Engine
 * Centralized type definitions for the scoring service
 */

export interface ContentEntry {
  id: string;
  content: string;
  contentType: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentMetrics {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  retweets?: number;
  platform: string;
}

export interface ScoringRequest {
  submissionId: string;
  content: string;
  contestContext: ContestContext;
  weights?: ScoringWeights;
  customSettings?: Record<string, any>;
}

export interface ContestContext {
  contestId?: string;
  theme: string;
  keywords: string[];
  contentType: string;
  submissionDate?: Date;
  metadata?: Record<string, any>;
}

export interface ScoringResponse {
  submissionId: string;
  finalScore: number;
  scoringBreakdown: ScoringBreakdown;
  weightsUsed: ScoringWeights;
  confidence: number;
  processingTime: number;
  timestamp: string;
  modelVersion: string;
  success: boolean;
  error?: string;
}

export interface ScoringBreakdown {
  depth: AxisScore;
  reach: AxisScore;
  relevance: AxisScore;
  consistency: AxisScore;
}

export interface AxisScore {
  score: number;
  confidence: number;
  details: Record<string, any>;
}

export interface ScoringWeights {
  depth: number;
  reach: number;
  relevance: number;
  consistency: number;
}

export interface BatchScoringRequest {
  submissions: ScoringRequest[];
  batchId?: string;
  priority?: 'low' | 'normal' | 'high';
  callbackUrl?: string;
}

export interface BatchScoringResponse {
  batchId: string;
  totalSubmissions: number;
  processedSubmissions: number;
  failedSubmissions: number;
  results: ScoringResponse[];
  processingTime: number;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface ScoringMetrics {
  totalScorings: number;
  averageProcessingTime: number;
  successRate: number;
  averageConfidence: number;
  modelPerformance: Record<string, number>;
  errorRate: number;
  cacheHitRate: number;
  lastUpdated: string;
}

export interface ScoringConfiguration {
  defaultWeights: ScoringWeights;
  modelSettings: ModelSettings;
  processingLimits: ProcessingLimits;
  cacheSettings: CacheSettings;
  featureFlags: FeatureFlags;
  version: string;
}

export interface ModelSettings {
  bertModel: string;
  robertaModel: string;
  embeddingDim: number;
  maxLength: number;
}

export interface ProcessingLimits {
  maxBatchSize: number;
  maxContentLength: number;
  timeoutSeconds: number;
}

export interface CacheSettings {
  ttlSeconds: number;
  maxCacheSize: number;
}

export interface FeatureFlags {
  enableSemanticSimilarity: boolean;
  enablePlagiarismDetection: boolean;
  enableSocialAnalysis: boolean;
  enableTopicModeling: boolean;
}

export interface ServiceStatus {
  nlpService: boolean;
  scoringService: boolean;
  databaseService: boolean;
  redisService: boolean;
  queueService: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  services: ServiceStatus;
  dependencies: Record<string, boolean>;
  metrics: {
    memoryUsage: number;
    cpuUsage: number;
    requestCount: number;
    errorCount: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T = any> {
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