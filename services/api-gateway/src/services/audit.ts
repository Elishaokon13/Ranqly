import winston from 'winston';
import { DatabaseService } from './database';

interface AuditEvent {
  entity_type: string;
  entity_id: string;
  action: string;
  actor_address?: string;
  details?: any;
  timestamp?: Date;
}

export class AuditService {
  private static instance: AuditService;
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
        new winston.transports.File({ filename: 'logs/audit-service.log' })
      ]
    });
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  public static async initialize(): Promise<void> {
    const instance = AuditService.getInstance();
    instance.logger.info('Audit Service initialized');
  }

  public static async close(): Promise<void> {
    const instance = AuditService.getInstance();
    instance.logger.info('Audit Service closed');
  }

  public async logEvent(event: AuditEvent): Promise<void> {
    try {
      // Validate required fields
      if (!event.entity_type || !event.entity_id || !event.action) {
        throw new Error('Missing required audit event fields');
      }

      // Add timestamp if not provided
      if (!event.timestamp) {
        event.timestamp = new Date();
      }

      // Log to database
      await DatabaseService.getInstance().logAuditEvent(event);

      // Log to file
      this.logger.info('Audit event logged', {
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        action: event.action,
        actor_address: event.actor_address,
        details: event.details,
        timestamp: event.timestamp
      });

    } catch (error) {
      this.logger.error('Failed to log audit event:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  public async getAuditTrail(
    entityType?: string,
    entityId?: string,
    actorAddress?: string,
    action?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    try {
      let query = `
        SELECT al.*, 
               CASE 
                 WHEN al.entity_type = 'contest' THEN c.title
                 WHEN al.entity_type = 'submission' THEN s.title
                 WHEN al.entity_type = 'user' THEN u.username
                 ELSE al.entity_id
               END as entity_name
        FROM audit_logs al
        LEFT JOIN contests c ON al.entity_type = 'contest' AND al.entity_id::uuid = c.id
        LEFT JOIN submissions s ON al.entity_type = 'submission' AND al.entity_id::uuid = s.id
        LEFT JOIN users u ON al.entity_type = 'user' AND al.entity_id = u.wallet_address
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramCount = 1;

      if (entityType) {
        query += ` AND al.entity_type = $${paramCount++}`;
        params.push(entityType);
      }

      if (entityId) {
        query += ` AND al.entity_id = $${paramCount++}`;
        params.push(entityId);
      }

      if (actorAddress) {
        query += ` AND al.actor_address = $${paramCount++}`;
        params.push(actorAddress);
      }

      if (action) {
        query += ` AND al.action = $${paramCount++}`;
        params.push(action);
      }

      query += ` ORDER BY al.timestamp DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      params.push(limit, offset);

      const result = await DatabaseService.getInstance().query(query, params);
      
      this.logger.info(`Retrieved audit trail: ${result.rows.length} records`);
      
      return result.rows;

    } catch (error) {
      this.logger.error('Failed to retrieve audit trail:', error);
      throw error;
    }
  }

  public async getEntityAuditTrail(entityType: string, entityId: string): Promise<any[]> {
    try {
      const auditTrail = await this.getAuditTrail(entityType, entityId);
      
      this.logger.info(`Retrieved audit trail for ${entityType}:${entityId}: ${auditTrail.length} records`);
      
      return auditTrail;

    } catch (error) {
      this.logger.error(`Failed to retrieve audit trail for ${entityType}:${entityId}:`, error);
      throw error;
    }
  }

  public async getUserActivity(actorAddress: string, limit: number = 100): Promise<any[]> {
    try {
      const auditTrail = await this.getAuditTrail(undefined, undefined, actorAddress, undefined, limit);
      
      this.logger.info(`Retrieved user activity for ${actorAddress}: ${auditTrail.length} records`);
      
      return auditTrail;

    } catch (error) {
      this.logger.error(`Failed to retrieve user activity for ${actorAddress}:`, error);
      throw error;
    }
  }

  public async getSystemStats(): Promise<any> {
    try {
      // Get audit statistics
      const statsQuery = `
        SELECT 
          entity_type,
          action,
          COUNT(*) as count,
          DATE_TRUNC('day', timestamp) as date
        FROM audit_logs 
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY entity_type, action, DATE_TRUNC('day', timestamp)
        ORDER BY date DESC, count DESC
      `;

      const statsResult = await DatabaseService.getInstance().query(statsQuery);
      
      // Get total audit events
      const totalQuery = 'SELECT COUNT(*) as total FROM audit_logs';
      const totalResult = await DatabaseService.getInstance().query(totalQuery);
      
      // Get recent activity
      const recentQuery = `
        SELECT COUNT(*) as recent_count 
        FROM audit_logs 
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
      `;
      const recentResult = await DatabaseService.getInstance().query(recentQuery);

      const stats = {
        total_events: parseInt(totalResult.rows[0].total),
        recent_events: parseInt(recentResult.rows[0].recent_count),
        daily_breakdown: statsResult.rows
      };

      this.logger.info('Retrieved audit system stats');
      
      return stats;

    } catch (error) {
      this.logger.error('Failed to retrieve audit system stats:', error);
      throw error;
    }
  }

  // Convenience methods for common audit events
  public async logContestCreated(contestId: string, organizerAddress: string, contestTitle: string): Promise<void> {
    await this.logEvent({
      entity_type: 'contest',
      entity_id: contestId,
      action: 'created',
      actor_address: organizerAddress,
      details: { title: contestTitle }
    });
  }

  public async logContestUpdated(contestId: string, actorAddress: string, updates: any): Promise<void> {
    await this.logEvent({
      entity_type: 'contest',
      entity_id: contestId,
      action: 'updated',
      actor_address: actorAddress,
      details: { updates }
    });
  }

  public async logContestCancelled(contestId: string, actorAddress: string, reason: string): Promise<void> {
    await this.logEvent({
      entity_type: 'contest',
      entity_id: contestId,
      action: 'cancelled',
      actor_address: actorAddress,
      details: { reason }
    });
  }

  public async logSubmissionCreated(submissionId: string, submitterAddress: string, contestId: string): Promise<void> {
    await this.logEvent({
      entity_type: 'submission',
      entity_id: submissionId,
      action: 'created',
      actor_address: submitterAddress,
      details: { contest_id: contestId }
    });
  }

  public async logVoteCommitted(contestId: string, voterAddress: string, submissionId: string): Promise<void> {
    await this.logEvent({
      entity_type: 'vote',
      entity_id: `${contestId}:${submissionId}`,
      action: 'committed',
      actor_address: voterAddress,
      details: { contest_id: contestId, submission_id: submissionId }
    });
  }

  public async logVoteRevealed(contestId: string, voterAddress: string, submissionId: string, voteValue: number): Promise<void> {
    await this.logEvent({
      entity_type: 'vote',
      entity_id: `${contestId}:${submissionId}`,
      action: 'revealed',
      actor_address: voterAddress,
      details: { 
        contest_id: contestId, 
        submission_id: submissionId,
        vote_value: voteValue 
      }
    });
  }

  public async logDisputeCreated(disputeId: string, disputerAddress: string, submissionId: string, disputeType: string): Promise<void> {
    await this.logEvent({
      entity_type: 'dispute',
      entity_id: disputeId,
      action: 'created',
      actor_address: disputerAddress,
      details: { submission_id: submissionId, dispute_type: disputeType }
    });
  }

  public async logDisputeResolved(disputeId: string, resolverAddress: string, resolution: string): Promise<void> {
    await this.logEvent({
      entity_type: 'dispute',
      entity_id: disputeId,
      action: 'resolved',
      actor_address: resolverAddress,
      details: { resolution }
    });
  }

  public async logUserRegistered(userAddress: string, username?: string): Promise<void> {
    await this.logEvent({
      entity_type: 'user',
      entity_id: userAddress,
      action: 'registered',
      actor_address: userAddress,
      details: { username }
    });
  }

  public async logUserUpdated(userAddress: string, updates: any): Promise<void> {
    await this.logEvent({
      entity_type: 'user',
      entity_id: userAddress,
      action: 'updated',
      actor_address: userAddress,
      details: { updates }
    });
  }

  public async logSecurityEvent(eventType: string, details: any, actorAddress?: string): Promise<void> {
    await this.logEvent({
      entity_type: 'security',
      entity_id: `${eventType}:${Date.now()}`,
      action: eventType,
      actor_address: actorAddress,
      details
    });
  }

  public async logSystemEvent(eventType: string, details: any): Promise<void> {
    await this.logEvent({
      entity_type: 'system',
      entity_id: `${eventType}:${Date.now()}`,
      action: eventType,
      details
    });
  }
}