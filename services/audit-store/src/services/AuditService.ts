/**
 * Audit Service for Audit Store
 * Handles immutable audit trails and data verification
 */

import winston from 'winston';
import { createHash } from 'crypto';
import { DatabaseService } from './DatabaseService';
import { RedisService } from './RedisService';

export interface AuditEntry {
  id: string;
  eventType: string;
  entityId: string;
  entityType: string;
  action: string;
  data: any;
  hash: string;
  previousHash?: string;
  timestamp: string;
  blockNumber?: number;
  transactionHash?: string;
}

export class AuditService {
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
      
      this.logger.info('Audit service initialized successfully');
      
    } catch (error) {
      this.logger.error(`Failed to initialize audit service: ${error}`);
      throw error;
    }
  }

  async createAuditEntry(entry: Omit<AuditEntry, 'id' | 'hash' | 'timestamp'>): Promise<AuditEntry> {
    try {
      this.logger.info(`Creating audit entry for ${entry.entityType}:${entry.entityId}`);
      
      const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      
      // Get previous hash for chain integrity
      const previousHash = await this.getPreviousHash(entry.entityId);
      
      // Calculate hash for this entry
      const hash = this.calculateHash({
        ...entry,
        id,
        timestamp,
        previousHash
      });
      
      const auditEntry: AuditEntry = {
        ...entry,
        id,
        hash,
        previousHash,
        timestamp
      };
      
      // Store in database
      if (this.databaseService) {
        await this.databaseService.storeAuditEntry(auditEntry);
      }
      
      // Cache recent entries
      if (this.redisService) {
        await this.redisService.set(`audit:${id}`, JSON.stringify(auditEntry), 3600);
      }
      
      this.logger.info(`Audit entry ${id} created successfully`);
      return auditEntry;
      
    } catch (error) {
      this.logger.error(`Error creating audit entry: ${error}`);
      throw error;
    }
  }

  async getAuditTrail(entityId: string, entityType?: string): Promise<AuditEntry[]> {
    try {
      this.logger.info(`Getting audit trail for ${entityType}:${entityId}`);
      
      if (this.databaseService) {
        return await this.databaseService.getAuditTrail(entityId, entityType);
      }
      
      return [];
      
    } catch (error) {
      this.logger.error(`Error getting audit trail: ${error}`);
      return [];
    }
  }

  async verifyAuditIntegrity(entityId: string): Promise<boolean> {
    try {
      this.logger.info(`Verifying audit integrity for ${entityId}`);
      
      const auditTrail = await this.getAuditTrail(entityId);
      
      if (auditTrail.length === 0) {
        return true; // No entries to verify
      }
      
      // Verify hash chain
      for (let i = 0; i < auditTrail.length; i++) {
        const entry = auditTrail[i];
        const expectedHash = this.calculateHash(entry);
        
        if (entry.hash !== expectedHash) {
          this.logger.error(`Hash mismatch for audit entry ${entry.id}`);
          return false;
        }
        
        // Verify previous hash link
        if (i > 0) {
          const previousEntry = auditTrail[i - 1];
          if (entry.previousHash !== previousEntry.hash) {
            this.logger.error(`Previous hash mismatch for audit entry ${entry.id}`);
            return false;
          }
        }
      }
      
      this.logger.info(`Audit integrity verified for ${entityId}`);
      return true;
      
    } catch (error) {
      this.logger.error(`Error verifying audit integrity: ${error}`);
      return false;
    }
  }

  async getAuditEntry(auditId: string): Promise<AuditEntry | null> {
    try {
      // Try cache first
      if (this.redisService) {
        const cached = await this.redisService.get(`audit:${auditId}`);
        if (cached) {
          return JSON.parse(cached);
        }
      }
      
      // Fallback to database
      if (this.databaseService) {
        return await this.databaseService.getAuditEntry(auditId);
      }
      
      return null;
      
    } catch (error) {
      this.logger.error(`Error getting audit entry ${auditId}: ${error}`);
      return null;
    }
  }

  async generateAuditReport(entityId: string, startDate?: string, endDate?: string): Promise<any> {
    try {
      this.logger.info(`Generating audit report for ${entityId}`);
      
      const auditTrail = await this.getAuditTrail(entityId);
      
      const filteredTrail = auditTrail.filter(entry => {
        if (startDate && entry.timestamp < startDate) return false;
        if (endDate && entry.timestamp > endDate) return false;
        return true;
      });
      
      const report = {
        entityId,
        totalEntries: filteredTrail.length,
        dateRange: { startDate, endDate },
        eventTypes: this.groupByEventType(filteredTrail),
        timeline: filteredTrail.map(entry => ({
          timestamp: entry.timestamp,
          eventType: entry.eventType,
          action: entry.action,
          hash: entry.hash
        })),
        integrityVerified: await this.verifyAuditIntegrity(entityId),
        generatedAt: new Date().toISOString()
      };
      
      return report;
      
    } catch (error) {
      this.logger.error(`Error generating audit report: ${error}`);
      throw error;
    }
  }

  private calculateHash(entry: Partial<AuditEntry>): string {
    const dataToHash = {
      eventType: entry.eventType,
      entityId: entry.entityId,
      entityType: entry.entityType,
      action: entry.action,
      data: entry.data,
      previousHash: entry.previousHash,
      timestamp: entry.timestamp
    };
    
    const dataString = JSON.stringify(dataToHash, Object.keys(dataToHash).sort());
    return createHash('sha256').update(dataString).digest('hex');
  }

  private async getPreviousHash(entityId: string): Promise<string | undefined> {
    try {
      if (this.databaseService) {
        const lastEntry = await this.databaseService.getLastAuditEntry(entityId);
        return lastEntry?.hash;
      }
      
      return undefined;
      
    } catch (error) {
      this.logger.error(`Error getting previous hash: ${error}`);
      return undefined;
    }
  }

  private groupByEventType(auditTrail: AuditEntry[]): Record<string, number> {
    return auditTrail.reduce((groups, entry) => {
      groups[entry.eventType] = (groups[entry.eventType] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
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
