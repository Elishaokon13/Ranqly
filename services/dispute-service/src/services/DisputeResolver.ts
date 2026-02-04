/**
 * Dispute Resolver Service
 * Handles dispute resolution logic and workflows
 */

import winston from 'winston';
import { TriageService } from './TriageService';
import { DatabaseService } from './DatabaseService';
import { RedisService } from './RedisService';
import { NotificationService } from './NotificationService';
import { DisputeRequest, DisputeResponse, DisputeStatus, DisputePriority, ResolutionDetails, ResolutionType } from '../types';

export class DisputeResolver {
  private logger: winston.Logger;
  private triageService: TriageService | null = null;
  private databaseService: DatabaseService | null = null;
  private redisService: RedisService | null = null;
  private notificationService: NotificationService | null = null;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  async initialize(
    triageService: TriageService,
    databaseService: DatabaseService,
    redisService: RedisService,
    notificationService: NotificationService
  ): Promise<void> {
    try {
      this.triageService = triageService;
      this.databaseService = databaseService;
      this.redisService = redisService;
      this.notificationService = notificationService;
      
      this.logger.info('Dispute resolver initialized successfully');
      
    } catch (error) {
      this.logger.error(`Failed to initialize dispute resolver: ${error}`);
      throw error;
    }
  }

  async createDispute(request: DisputeRequest): Promise<DisputeResponse> {
    try {
      this.logger.info(`Creating dispute for submission ${request.submissionId}`);
      
      const disputeId = `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create dispute record
      const dispute: DisputeResponse = {
        disputeId,
        status: DisputeStatus.PENDING,
        priority: DisputePriority.MEDIUM,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Store in database
      if (this.databaseService) {
        await this.databaseService.storeDispute(disputeId, request);
      }
      
      // Cache dispute data
      if (this.redisService) {
        await this.redisService.set(`dispute:${disputeId}`, JSON.stringify(dispute), 3600);
      }
      
      // Send notification
      if (this.notificationService) {
        await this.notificationService.notifyDisputeCreated(disputeId, request);
      }
      
      this.logger.info(`Dispute ${disputeId} created successfully`);
      return dispute;
      
    } catch (error) {
      this.logger.error(`Error creating dispute: ${error}`);
      throw error;
    }
  }

  async resolveDispute(
    disputeId: string,
    resolution: ResolutionDetails,
    resolverId: string
  ): Promise<DisputeResponse> {
    try {
      this.logger.info(`Resolving dispute ${disputeId}`);
      
      // Get dispute from cache or database
      let dispute = await this.getDispute(disputeId);
      if (!dispute) {
        throw new Error(`Dispute ${disputeId} not found`);
      }
      
      // Update dispute with resolution
      dispute.status = DisputeStatus.RESOLVED;
      dispute.resolution = resolution;
      dispute.assignedResolver = resolverId;
      dispute.updatedAt = new Date().toISOString();
      
      // Update in database
      if (this.databaseService) {
        await this.databaseService.updateDispute(disputeId, dispute);
      }
      
      // Update cache
      if (this.redisService) {
        await this.redisService.set(`dispute:${disputeId}`, JSON.stringify(dispute), 3600);
      }
      
      // Send notification
      if (this.notificationService) {
        await this.notificationService.notifyDisputeResolved(disputeId, resolution);
      }
      
      this.logger.info(`Dispute ${disputeId} resolved successfully`);
      return dispute;
      
    } catch (error) {
      this.logger.error(`Error resolving dispute ${disputeId}: ${error}`);
      throw error;
    }
  }

  async getDispute(disputeId: string): Promise<DisputeResponse | null> {
    try {
      // Try cache first
      if (this.redisService) {
        const cached = await this.redisService.get(`dispute:${disputeId}`);
        if (cached) {
          return JSON.parse(cached);
        }
      }
      
      // Fallback to database
      if (this.databaseService) {
        return await this.databaseService.getDispute(disputeId);
      }
      
      return null;
      
    } catch (error) {
      this.logger.error(`Error getting dispute ${disputeId}: ${error}`);
      return null;
    }
  }

  async listDisputes(
    status?: DisputeStatus,
    priority?: DisputePriority,
    limit: number = 50,
    offset: number = 0
  ): Promise<DisputeResponse[]> {
    try {
      if (this.databaseService) {
        return await this.databaseService.listDisputes(status, priority, limit, offset);
      }
      
      return [];
      
    } catch (error) {
      this.logger.error(`Error listing disputes: ${error}`);
      return [];
    }
  }

  async assignResolver(disputeId: string, resolverId: string): Promise<boolean> {
    try {
      const dispute = await this.getDispute(disputeId);
      if (!dispute) {
        throw new Error(`Dispute ${disputeId} not found`);
      }
      
      dispute.assignedResolver = resolverId;
      dispute.status = DisputeStatus.IN_REVIEW;
      dispute.updatedAt = new Date().toISOString();
      
      // Update in database
      if (this.databaseService) {
        await this.databaseService.updateDispute(disputeId, dispute);
      }
      
      // Update cache
      if (this.redisService) {
        await this.redisService.set(`dispute:${disputeId}`, JSON.stringify(dispute), 3600);
      }
      
      this.logger.info(`Dispute ${disputeId} assigned to resolver ${resolverId}`);
      return true;
      
    } catch (error) {
      this.logger.error(`Error assigning resolver to dispute ${disputeId}: ${error}`);
      return false;
    }
  }

  async escalateDispute(disputeId: string, reason: string): Promise<boolean> {
    try {
      const dispute = await this.getDispute(disputeId);
      if (!dispute) {
        throw new Error(`Dispute ${disputeId} not found`);
      }
      
      dispute.status = DisputeStatus.ESCALATED;
      dispute.priority = DisputePriority.URGENT;
      dispute.updatedAt = new Date().toISOString();
      
      // Update in database
      if (this.databaseService) {
        await this.databaseService.updateDispute(disputeId, dispute);
      }
      
      // Update cache
      if (this.redisService) {
        await this.redisService.set(`dispute:${disputeId}`, JSON.stringify(dispute), 3600);
      }
      
      // Send escalation notification
      if (this.notificationService) {
        await this.notificationService.notifyDisputeEscalated(disputeId, reason);
      }
      
      this.logger.info(`Dispute ${disputeId} escalated`);
      return true;
      
    } catch (error) {
      this.logger.error(`Error escalating dispute ${disputeId}: ${error}`);
      return false;
    }
  }

  healthCheck(): { status: string; dependencies: any } {
    return {
      status: 'healthy',
      dependencies: {
        triageService: this.triageService !== null,
        databaseService: this.databaseService !== null,
        redisService: this.redisService !== null,
        notificationService: this.notificationService !== null
      }
    };
  }
}
