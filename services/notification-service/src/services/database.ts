import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { Notification, NotificationPreferences } from './notification';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      await this.pool.query('SELECT NOW()');
      logger.info('Database connection established');
      
      // Create tables if they don't exist
      await this.createTables();
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const createNotificationsTable = `
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(42) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
        channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'push', 'websocket', 'in_app')),
        read BOOLEAN DEFAULT FALSE,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP
      );
    `;

    const createNotificationPreferencesTable = `
      CREATE TABLE IF NOT EXISTS notification_preferences (
        user_id VARCHAR(42) PRIMARY KEY,
        email BOOLEAN DEFAULT TRUE,
        push BOOLEAN DEFAULT TRUE,
        in_app BOOLEAN DEFAULT TRUE,
        contest_updates BOOLEAN DEFAULT TRUE,
        voting_reminders BOOLEAN DEFAULT TRUE,
        dispute_alerts BOOLEAN DEFAULT TRUE,
        governance_proposals BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
    `;

    await this.pool.query(createNotificationsTable);
    await this.pool.query(createNotificationPreferencesTable);
    await this.pool.query(createIndexes);
    
    logger.info('Database tables created/verified');
  }

  async getNotifications(userId: string, options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<Notification[]> {
    const { limit = 50, offset = 0, unreadOnly = false } = options;
    
    let query = `
      SELECT id, user_id, title, message, type, channel, read, data, created_at, sent_at, delivered_at
      FROM notifications
      WHERE user_id = $1
    `;
    
    const params: any[] = [userId];
    
    if (unreadOnly) {
      query += ' AND read = FALSE';
    }
    
    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);
    
    const result = await this.pool.query(query, params);
    
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type,
      channel: row.channel,
      read: row.read,
      data: row.data,
      createdAt: row.created_at,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at
    }));
  }

  async getNotification(notificationId: string): Promise<Notification | null> {
    const query = `
      SELECT id, user_id, title, message, type, channel, read, data, created_at, sent_at, delivered_at
      FROM notifications
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [notificationId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type,
      channel: row.channel,
      read: row.read,
      data: row.data,
      createdAt: row.created_at,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at
    };
  }

  async createNotification(notification: Notification): Promise<Notification> {
    const query = `
      INSERT INTO notifications (user_id, title, message, type, channel, read, data, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, user_id, title, message, type, channel, read, data, created_at, sent_at, delivered_at
    `;
    
    const values = [
      notification.userId,
      notification.title,
      notification.message,
      notification.type,
      notification.channel,
      notification.read,
      JSON.stringify(notification.data),
      notification.createdAt
    ];
    
    const result = await this.pool.query(query, values);
    const row = result.rows[0];
    
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type,
      channel: row.channel,
      read: row.read,
      data: row.data,
      createdAt: row.created_at,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at
    };
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const query = `
      UPDATE notifications
      SET read = TRUE
      WHERE id = $1
    `;
    
    await this.pool.query(query, [notificationId]);
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const query = `
      UPDATE notifications
      SET read = TRUE
      WHERE user_id = $1 AND read = FALSE
    `;
    
    await this.pool.query(query, [userId]);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const query = `
      DELETE FROM notifications
      WHERE id = $1
    `;
    
    await this.pool.query(query, [notificationId]);
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    const query = `
      DELETE FROM notifications
      WHERE user_id = $1
    `;
    
    await this.pool.query(query, [userId]);
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    const query = `
      SELECT email, push, in_app, contest_updates, voting_reminders, dispute_alerts, governance_proposals
      FROM notification_preferences
      WHERE user_id = $1
    `;
    
    const result = await this.pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      email: row.email,
      push: row.push,
      inApp: row.in_app,
      contestUpdates: row.contest_updates,
      votingReminders: row.voting_reminders,
      disputeAlerts: row.dispute_alerts,
      governanceProposals: row.governance_proposals
    };
  }

  async updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void> {
    const query = `
      INSERT INTO notification_preferences (
        user_id, email, push, in_app, contest_updates, voting_reminders, dispute_alerts, governance_proposals
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id)
      DO UPDATE SET
        email = EXCLUDED.email,
        push = EXCLUDED.push,
        in_app = EXCLUDED.in_app,
        contest_updates = EXCLUDED.contest_updates,
        voting_reminders = EXCLUDED.voting_reminders,
        dispute_alerts = EXCLUDED.dispute_alerts,
        governance_proposals = EXCLUDED.governance_proposals,
        updated_at = NOW()
    `;
    
    const values = [
      userId,
      preferences.email,
      preferences.push,
      preferences.inApp,
      preferences.contestUpdates,
      preferences.votingReminders,
      preferences.disputeAlerts,
      preferences.governanceProposals
    ];
    
    await this.pool.query(query, values);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
