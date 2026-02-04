/**
 * Scoring Service for Algorithm Engine - Main scoring orchestration
 * Converted from Python to Node.js with equivalent functionality
 */

import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { NLPService } from './NLPService';
import { DatabaseService } from './DatabaseService';
import { RedisService } from './RedisService';
import { QueueService } from './QueueService';

// Types
interface ScoringRequest {
  submissionId: string;
  content: string;
  contestContext: ContestContext;
  weights?: ScoringWeights;
  customSettings?: any;
}

interface ContestContext {
  contestId?: string;
  theme: string;
  keywords: string[];
  contentType: string;
  submissionDate?: Date;
  metadata?: any;
}

interface ScoringWeights {
  depth: number;
  reach: number;
  relevance: number;
  consistency: number;
}

interface ScoringResult {
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
  timestamp: string;
  modelVersion: string;
  success: boolean;
  error?: string;
}

interface AxisScore {
  score: number;
  confidence: number;
  details: any;
}

export class ScoringService {
  private logger: winston.Logger;
  private nlpService: NLPService | null = null;
  private databaseService: DatabaseService | null = null;
  private redisService: RedisService | null = null;
  private queueService: QueueService | null = null;
  
  private readonly defaultWeights: ScoringWeights = {
    depth: 0.40,
    reach: 0.30,
    relevance: 0.20,
    consistency: 0.10
  };
  
  private readonly modelVersion = '1.0.0';
  private readonly cacheTtl = 3600; // 1 hour in seconds

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  async initialize(
    nlpService: NLPService,
    databaseService: DatabaseService,
    redisService: RedisService,
    queueService: QueueService
  ): Promise<void> {
    try {
      this.nlpService = nlpService;
      this.databaseService = databaseService;
      this.redisService = redisService;
      this.queueService = queueService;
      
      this.logger.info('Scoring service initialized successfully');
      
    } catch (error) {
      this.logger.error(`Failed to initialize scoring service: ${error}`);
      throw error;
    }
  }

  async scoreSubmission(request: ScoringRequest): Promise<ScoringResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Scoring submission ${request.submissionId}`);
      
      // Check cache first
      const cachedScore = await this.getCachedScore(request.submissionId);
      if (cachedScore) {
        this.logger.info(`Returning cached score for submission ${request.submissionId}`);
        return cachedScore;
      }
      
      // Get contest weights
      const contestWeights = await this.getContestWeights(
        request.contestContext.contestId,
        request.weights
      );
      
      // Perform scoring analysis
      const scoringBreakdown = await this.performScoringAnalysis(
        request.content,
        request.contestContext,
        contestWeights
      );
      
      // Calculate final score
      const finalScore = this.calculateFinalScore(scoringBreakdown, contestWeights);
      
      // Calculate overall confidence
      const confidence = this.calculateConfidence(scoringBreakdown);
      
      // Calculate processing time
      const processingTime = (Date.now() - startTime) / 1000;
      
      // Prepare comprehensive response
      const result: ScoringResult = {
        submissionId: request.submissionId,
        finalScore,
        scoringBreakdown,
        weightsUsed: contestWeights,
        confidence,
        processingTime,
        timestamp: new Date().toISOString(),
        modelVersion: this.modelVersion,
        success: true
      };
      
      // Cache the results
      await this.cacheScore(request.submissionId, result);
      
      // Log scoring event
      await this.logScoringEvent(request.submissionId, scoringBreakdown, finalScore, processingTime);
      
      this.logger.info(`Scored submission ${request.submissionId}: ${finalScore}`);
      return result;
      
    } catch (error) {
      this.logger.error(`Error scoring submission ${request.submissionId}: ${error}`);
      
      const processingTime = (Date.now() - startTime) / 1000;
      
      return {
        submissionId: request.submissionId,
        finalScore: 0,
        scoringBreakdown: {
          depth: { score: 0, confidence: 0, details: {} },
          reach: { score: 0, confidence: 0, details: {} },
          relevance: { score: 0, confidence: 0, details: {} },
          consistency: { score: 0, confidence: 0, details: {} }
        },
        weightsUsed: this.defaultWeights,
        confidence: 0,
        processingTime,
        timestamp: new Date().toISOString(),
        modelVersion: this.modelVersion,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async performScoringAnalysis(
    content: string,
    contestContext: ContestContext,
    weights: ScoringWeights
  ): Promise<{
    depth: AxisScore;
    reach: AxisScore;
    relevance: AxisScore;
    consistency: AxisScore;
  }> {
    try {
      if (!this.nlpService) {
        throw new Error('NLP service not initialized');
      }
      
      // Run all analyses in parallel for efficiency
      const [depthResult, reachResult, relevanceResult, consistencyResult] = await Promise.all([
        this.nlpService.analyzeContentDepth(content, contestContext.contentType),
        this.nlpService.analyzeContentReach(content, contestContext.contentType),
        this.nlpService.analyzeContentRelevance(content, contestContext, contestContext.contentType),
        this.nlpService.analyzeContentConsistency(content, contestContext.contentType)
      ]);
      
      return {
        depth: {
          score: depthResult.score,
          confidence: depthResult.confidence,
          details: depthResult.details
        },
        reach: {
          score: reachResult.score,
          confidence: reachResult.confidence,
          details: reachResult.details
        },
        relevance: {
          score: relevanceResult.score,
          confidence: relevanceResult.confidence,
          details: relevanceResult.details
        },
        consistency: {
          score: consistencyResult.score,
          confidence: consistencyResult.confidence,
          details: consistencyResult.details
        }
      };
      
    } catch (error) {
      this.logger.error(`Error performing scoring analysis: ${error}`);
      throw error;
    }
  }

  private calculateFinalScore(
    scoringBreakdown: {
      depth: AxisScore;
      reach: AxisScore;
      relevance: AxisScore;
      consistency: AxisScore;
    },
    weights: ScoringWeights
  ): number {
    try {
      let totalScore = 0.0;
      let totalWeight = 0.0;
      
      // Calculate weighted score for each axis
      const axisScores = [
        { score: scoringBreakdown.depth.score, weight: weights.depth },
        { score: scoringBreakdown.reach.score, weight: weights.reach },
        { score: scoringBreakdown.relevance.score, weight: weights.relevance },
        { score: scoringBreakdown.consistency.score, weight: weights.consistency }
      ];
      
      for (const { score, weight } of axisScores) {
        totalScore += score * weight;
        totalWeight += weight;
      }
      
      // Normalize by total weight
      const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0.0;
      
      return Math.round(finalScore * 100) / 100; // Round to 2 decimal places
      
    } catch (error) {
      this.logger.error(`Error calculating final score: ${error}`);
      return 0.0;
    }
  }

  private calculateConfidence(scoringBreakdown: {
    depth: AxisScore;
    reach: AxisScore;
    relevance: AxisScore;
    consistency: AxisScore;
  }): number {
    try {
      const confidences = [
        scoringBreakdown.depth.confidence,
        scoringBreakdown.reach.confidence,
        scoringBreakdown.relevance.confidence,
        scoringBreakdown.consistency.confidence
      ];
      
      const averageConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
      return Math.round(averageConfidence * 100) / 100;
      
    } catch (error) {
      this.logger.error(`Error calculating confidence: ${error}`);
      return 0.0;
    }
  }

  private async getContestWeights(
    contestId?: string,
    customWeights?: ScoringWeights
  ): Promise<ScoringWeights> {
    try {
      // Use custom weights if provided
      if (customWeights) {
        return { ...this.defaultWeights, ...customWeights };
      }
      
      // Get contest-specific weights from database
      if (contestId && this.databaseService) {
        const contestWeights = await this.databaseService.getContestWeights(contestId);
        if (contestWeights) {
          return { ...this.defaultWeights, ...contestWeights };
        }
      }
      
      // Return default weights
      return { ...this.defaultWeights };
      
    } catch (error) {
      this.logger.error(`Error getting contest weights: ${error}`);
      return { ...this.defaultWeights };
    }
  }

  async cacheScore(submissionId: string, scoreData: ScoringResult): Promise<boolean> {
    try {
      if (this.redisService) {
        return await this.redisService.set(
          `score:${submissionId}`,
          JSON.stringify(scoreData),
          this.cacheTtl
        );
      }
      return false;
      
    } catch (error) {
      this.logger.error(`Error caching score for ${submissionId}: ${error}`);
      return false;
    }
  }

  async getCachedScore(submissionId: string): Promise<ScoringResult | null> {
    try {
      if (this.redisService) {
        const cached = await this.redisService.get(`score:${submissionId}`);
        if (cached) {
          return JSON.parse(cached);
        }
      }
      return null;
      
    } catch (error) {
      this.logger.error(`Error getting cached score for ${submissionId}: ${error}`);
      return null;
    }
  }

  private async logScoringEvent(
    submissionId: string,
    scoringBreakdown: any,
    finalScore: number,
    processingTime: number
  ): Promise<boolean> {
    try {
      if (this.databaseService) {
        const eventDetails = {
          scoringBreakdown,
          finalScore,
          processingTime,
          serviceVersion: this.modelVersion
        };
        
        return await this.databaseService.logScoringEvent(
          submissionId,
          'scored',
          eventDetails,
          processingTime
        );
      }
      return false;
      
    } catch (error) {
      this.logger.error(`Error logging scoring event for ${submissionId}: ${error}`);
      return false;
    }
  }

  async getScoringMetrics(): Promise<any> {
    try {
      // This would typically fetch from a metrics service
      // For now, returning sample metrics
      return {
        totalScorings: 1000,
        averageProcessingTime: 2.5,
        successRate: 0.95,
        averageConfidence: 0.87,
        modelPerformance: {
          depthModel: 0.92,
          reachModel: 0.88,
          relevanceModel: 0.90,
          consistencyModel: 0.85
        },
        errorRate: 0.05,
        cacheHitRate: 0.75,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error(`Error retrieving scoring metrics: ${error}`);
      throw error;
    }
  }

  async getScoringConfiguration(): Promise<any> {
    try {
      return {
        defaultWeights: this.defaultWeights,
        modelSettings: {
          bertModel: 'bert-base-uncased',
          robertaModel: 'roberta-base',
          embeddingDim: 768,
          maxLength: 512
        },
        processingLimits: {
          maxBatchSize: 100,
          maxContentLength: 10000,
          timeoutSeconds: 300
        },
        cacheSettings: {
          ttlSeconds: this.cacheTtl,
          maxCacheSize: 10000
        },
        featureFlags: {
          enableSemanticSimilarity: true,
          enablePlagiarismDetection: true,
          enableSocialAnalysis: true,
          enableTopicModeling: true
        },
        version: this.modelVersion
      };
      
    } catch (error) {
      this.logger.error(`Error retrieving scoring configuration: ${error}`);
      throw error;
    }
  }

  healthCheck(): { status: string; dependencies: any; defaultWeights: ScoringWeights } {
    try {
      return {
        status: 'healthy',
        dependencies: {
          nlpService: this.nlpService !== null,
          databaseService: this.databaseService !== null,
          redisService: this.redisService !== null,
          queueService: this.queueService !== null
        },
        defaultWeights: this.defaultWeights
      };
      
    } catch (error) {
      this.logger.error(`Scoring service health check failed: ${error}`);
      return {
        status: 'unhealthy',
        dependencies: {},
        defaultWeights: this.defaultWeights
      };
    }
  }
}