/**
 * Triage Service for Dispute Service
 * Handles dispute triage and priority assignment
 */

import winston from 'winston';
import { DatabaseService } from './DatabaseService';
import { RedisService } from './RedisService';
import { TriageRequest, TriageResponse, DisputePriority, DisputeType } from '../types';

export class TriageService {
  private logger: winston.Logger;
  private databaseService: DatabaseService | null = null;
  private redisService: RedisService | null = null;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  async initialize(
    databaseService: DatabaseService,
    redisService: RedisService
  ): Promise<void> {
    try {
      this.databaseService = databaseService;
      this.redisService = redisService;
      
      this.logger.info('Triage service initialized successfully');
      
    } catch (error) {
      this.logger.error(`Failed to initialize triage service: ${error}`);
      throw error;
    }
  }

  async analyzeDispute(request: TriageRequest): Promise<TriageResponse> {
    try {
      this.logger.info(`Analyzing dispute ${request.disputeId} for triage`);
      
      // Analyze dispute type and content
      const analysis = await this.performTriageAnalysis(request);
      
      // Determine priority based on analysis
      const priority = this.determinePriority(request.disputeType, analysis);
      
      // Suggest resolver based on dispute type and workload
      const suggestedResolver = await this.suggestResolver(request.disputeType, priority);
      
      // Calculate confidence score
      const confidence = this.calculateConfidence(analysis);
      
      // Estimate resolution time
      const estimatedResolutionTime = this.estimateResolutionTime(request.disputeType, priority);
      
      const triageResponse: TriageResponse = {
        disputeId: request.disputeId,
        priority,
        suggestedResolver,
        confidence,
        reasoning: this.generateReasoning(analysis, priority),
        estimatedResolutionTime
      };
      
      // Cache triage result
      if (this.redisService) {
        await this.redisService.set(
          `triage:${request.disputeId}`,
          JSON.stringify(triageResponse),
          3600
        );
      }
      
      this.logger.info(`Triage analysis completed for dispute ${request.disputeId}: priority ${priority}`);
      return triageResponse;
      
    } catch (error) {
      this.logger.error(`Error analyzing dispute ${request.disputeId}: ${error}`);
      throw error;
    }
  }

  private async performTriageAnalysis(request: TriageRequest): Promise<any> {
    try {
      const analysis = {
        disputeType: request.disputeType,
        contentLength: request.content.length,
        hasEvidence: request.metadata?.evidence?.length > 0,
        reporterHistory: await this.getReporterHistory(request.metadata?.reporterId),
        similarDisputes: await this.findSimilarDisputes(request.disputeType, request.content),
        urgency: this.calculateUrgency(request.disputeType, request.metadata),
        complexity: this.assessComplexity(request.content, request.metadata)
      };
      
      return analysis;
      
    } catch (error) {
      this.logger.error(`Error performing triage analysis: ${error}`);
      return {};
    }
  }

  private determinePriority(disputeType: DisputeType, analysis: any): DisputePriority {
    // Base priority on dispute type
    const typePriorities: { [key in DisputeType]: DisputePriority } = {
      [DisputeType.PLAGIARISM]: DisputePriority.HIGH,
      [DisputeType.COPYRIGHT]: DisputePriority.HIGH,
      [DisputeType.INAPPROPRIATE]: DisputePriority.MEDIUM,
      [DisputeType.SPAM]: DisputePriority.LOW,
      [DisputeType.FAKE_SUBMISSION]: DisputePriority.MEDIUM,
      [DisputeType.OTHER]: DisputePriority.MEDIUM
    };
    
    let priority = typePriorities[disputeType];
    
    // Adjust based on analysis
    if (analysis.urgency > 0.8) {
      priority = DisputePriority.URGENT;
    } else if (analysis.complexity > 0.7) {
      if (priority === DisputePriority.LOW) priority = DisputePriority.MEDIUM;
      if (priority === DisputePriority.MEDIUM) priority = DisputePriority.HIGH;
    }
    
    // Check for similar disputes (pattern detection)
    if (analysis.similarDisputes > 3) {
      priority = DisputePriority.HIGH;
    }
    
    return priority;
  }

  private async suggestResolver(disputeType: DisputeType, priority: DisputePriority): Promise<string | undefined> {
    try {
      if (this.databaseService) {
        // Get available resolvers with expertise in this dispute type
        const resolvers = await this.databaseService.getAvailableResolvers(disputeType, priority);
        
        if (resolvers.length > 0) {
          // Select resolver with least current workload
          return resolvers[0].id;
        }
      }
      
      return undefined;
      
    } catch (error) {
      this.logger.error(`Error suggesting resolver: ${error}`);
      return undefined;
    }
  }

  private calculateConfidence(analysis: any): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on available data
    if (analysis.hasEvidence) confidence += 0.2;
    if (analysis.reporterHistory?.reputation > 0.8) confidence += 0.2;
    if (analysis.similarDisputes > 0) confidence += 0.1;
    
    return Math.min(1.0, confidence);
  }

  private estimateResolutionTime(disputeType: DisputeType, priority: DisputePriority): number {
    // Base resolution times in hours
    const baseTimes: { [key in DisputeType]: number } = {
      [DisputeType.PLAGIARISM]: 24,
      [DisputeType.COPYRIGHT]: 48,
      [DisputeType.INAPPROPRIATE]: 12,
      [DisputeType.SPAM]: 4,
      [DisputeType.FAKE_SUBMISSION]: 8,
      [DisputeType.OTHER]: 16
    };
    
    let time = baseTimes[disputeType];
    
    // Adjust based on priority
    switch (priority) {
      case DisputePriority.URGENT:
        time *= 0.25; // 25% of base time
        break;
      case DisputePriority.HIGH:
        time *= 0.5; // 50% of base time
        break;
      case DisputePriority.MEDIUM:
        time *= 1.0; // Base time
        break;
      case DisputePriority.LOW:
        time *= 2.0; // Double time
        break;
    }
    
    return Math.round(time);
  }

  private generateReasoning(analysis: any, priority: DisputePriority): string {
    const reasons = [];
    
    if (analysis.urgency > 0.8) {
      reasons.push('High urgency detected');
    }
    
    if (analysis.complexity > 0.7) {
      reasons.push('Complex case requiring expert review');
    }
    
    if (analysis.similarDisputes > 3) {
      reasons.push('Pattern of similar disputes detected');
    }
    
    if (analysis.hasEvidence) {
      reasons.push('Evidence provided');
    }
    
    switch (priority) {
      case DisputePriority.URGENT:
        reasons.push('Escalated to urgent priority');
        break;
      case DisputePriority.HIGH:
        reasons.push('High priority due to nature of dispute');
        break;
      case DisputePriority.MEDIUM:
        reasons.push('Standard priority assignment');
        break;
      case DisputePriority.LOW:
        reasons.push('Low priority - routine case');
        break;
    }
    
    return reasons.join(', ');
  }

  private calculateUrgency(disputeType: DisputeType, metadata: any): number {
    let urgency = 0.5; // Base urgency
    
    // Check for time-sensitive factors
    if (metadata?.contestDeadline) {
      const deadline = new Date(metadata.contestDeadline);
      const now = new Date();
      const hoursToDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursToDeadline < 24) urgency += 0.3;
      if (hoursToDeadline < 6) urgency += 0.2;
    }
    
    // Check dispute type urgency
    if (disputeType === DisputeType.COPYRIGHT || disputeType === DisputeType.PLAGIARISM) {
      urgency += 0.2;
    }
    
    return Math.min(1.0, urgency);
  }

  private assessComplexity(content: string, metadata: any): number {
    let complexity = 0.3; // Base complexity
    
    // Content length factor
    if (content.length > 1000) complexity += 0.2;
    if (content.length > 5000) complexity += 0.1;
    
    // Evidence factor
    if (metadata?.evidence?.length > 2) complexity += 0.2;
    
    // Technical content factor
    if (content.includes('code') || content.includes('technical')) complexity += 0.1;
    
    return Math.min(1.0, complexity);
  }

  private async getReporterHistory(reporterId?: string): Promise<any> {
    if (!reporterId || !this.databaseService) {
      return { reputation: 0.5, totalReports: 0 };
    }
    
    try {
      return await this.databaseService.getReporterHistory(reporterId);
    } catch (error) {
      this.logger.error(`Error getting reporter history: ${error}`);
      return { reputation: 0.5, totalReports: 0 };
    }
  }

  private async findSimilarDisputes(disputeType: DisputeType, content: string): Promise<number> {
    if (!this.databaseService) {
      return 0;
    }
    
    try {
      return await this.databaseService.countSimilarDisputes(disputeType, content);
    } catch (error) {
      this.logger.error(`Error finding similar disputes: ${error}`);
      return 0;
    }
  }

  async getTriageQueue(): Promise<TriageResponse[]> {
    try {
      if (this.databaseService) {
        return await this.databaseService.getTriageQueue();
      }
      
      return [];
      
    } catch (error) {
      this.logger.error(`Error getting triage queue: ${error}`);
      return [];
    }
  }

  healthCheck(): { status: string; dependencies: any } {
    return {
      status: 'healthy',
      dependencies: {
        databaseService: this.databaseService !== null,
        redisService: this.redisService !== null
      }
    };
  }
}
