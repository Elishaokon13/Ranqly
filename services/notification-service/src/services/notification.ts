import { DatabaseService } from './database';
import { RedisService } from './redis';
import { EmailService } from './email';
import { PushService } from './push';
import { WebSocketService } from './websocket';
import { logger } from '../utils/logger';
import { notificationMetrics } from '../utils/metrics';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  channel: 'email' | 'push' | 'websocket' | 'in_app';
  read: boolean;
  data?: any;
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  contestUpdates: boolean;
  votingReminders: boolean;
  disputeAlerts: boolean;
  governanceProposals: boolean;
}

export class NotificationService {
  private databaseService: DatabaseService;
  private redisService: RedisService;
  private emailService: EmailService;
  private pushService: PushService;
  private webSocketService: WebSocketService;

  async initialize(
    databaseService: DatabaseService,
    redisService: RedisService,
    emailService: EmailService,
    pushService: PushService,
    webSocketService: WebSocketService
  ) {
    this.databaseService = databaseService;
    this.redisService = redisService;
    this.emailService = emailService;
    this.pushService = pushService;
    this.webSocketService = webSocketService;
    
    logger.info('Notification service initialized');
  }

  async getNotifications(userId: string, options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  } = {}): Promise<{
    success: boolean;
    notifications: Notification[];
    unreadCount: number;
  }> {
    try {
      const { limit = 50, offset = 0, unreadOnly = false } = options;
      
      // Get notifications from database
      const notifications = await this.databaseService.getNotifications(userId, {
        limit,
        offset,
        unreadOnly
      });
      
      // Get unread count from Redis cache
      const unreadCount = await this.redisService.getUnreadCount(userId);
      
      return {
        success: true,
        notifications,
        unreadCount: unreadCount || 0
      };
    } catch (error) {
      logger.error('Failed to get notifications:', error);
      return {
        success: false,
        notifications: [],
        unreadCount: 0
      };
    }
  }

  async markAsRead(notificationId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      await this.databaseService.markNotificationAsRead(notificationId);
      
      // Update Redis cache
      const notification = await this.databaseService.getNotification(notificationId);
      if (notification) {
        await this.redisService.decrementUnreadCount(notification.userId);
      }
      
      return {
        success: true,
        message: 'Notification marked as read'
      };
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      return {
        success: false,
        message: 'Failed to mark notification as read'
      };
    }
  }

  async markAllAsRead(userId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      await this.databaseService.markAllNotificationsAsRead(userId);
      
      // Reset Redis cache
      await this.redisService.resetUnreadCount(userId);
      
      return {
        success: true,
        message: 'All notifications marked as read'
      };
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      return {
        success: false,
        message: 'Failed to mark all notifications as read'
      };
    }
  }

  async clearNotification(notificationId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const notification = await this.databaseService.getNotification(notificationId);
      
      await this.databaseService.deleteNotification(notificationId);
      
      // Update Redis cache if notification was unread
      if (notification && !notification.read) {
        await this.redisService.decrementUnreadCount(notification.userId);
      }
      
      return {
        success: true,
        message: 'Notification cleared'
      };
    } catch (error) {
      logger.error('Failed to clear notification:', error);
      return {
        success: false,
        message: 'Failed to clear notification'
      };
    }
  }

  async clearAllNotifications(userId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      await this.databaseService.deleteAllNotifications(userId);
      
      // Reset Redis cache
      await this.redisService.resetUnreadCount(userId);
      
      return {
        success: true,
        message: 'All notifications cleared'
      };
    } catch (error) {
      logger.error('Failed to clear all notifications:', error);
      return {
        success: false,
        message: 'Failed to clear all notifications'
      };
    }
  }

  async sendNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<{
    success: boolean;
    notificationId?: string;
    message?: string;
  }> {
    try {
      // Save notification to database
      const savedNotification = await this.databaseService.createNotification({
        ...notification,
        read: false,
        createdAt: new Date()
      });
      
      // Update Redis cache
      await this.redisService.incrementUnreadCount(notification.userId);
      
      // Send notification through appropriate channels
      await this.sendThroughChannels(savedNotification);
      
      return {
        success: true,
        notificationId: savedNotification.id,
        message: 'Notification sent successfully'
      };
    } catch (error) {
      logger.error('Failed to send notification:', error);
      notificationMetrics.notificationsFailed.inc({
        type: notification.type,
        channel: notification.channel,
        reason: 'send_failed'
      });
      return {
        success: false,
        message: 'Failed to send notification'
      };
    }
  }

  private async sendThroughChannels(notification: Notification): Promise<void> {
    const preferences = await this.getNotificationPreferences(notification.userId);
    
    // Send via WebSocket (always enabled for real-time)
    if (notification.channel === 'websocket' || notification.channel === 'in_app') {
      await this.webSocketService.sendNotification(notification);
    }
    
    // Send via email if enabled
    if (notification.channel === 'email' && preferences.email) {
      await this.emailService.sendNotification(notification);
    }
    
    // Send via push if enabled
    if (notification.channel === 'push' && preferences.push) {
      await this.pushService.sendNotification(notification);
    }
    
    // Update metrics
    notificationMetrics.notificationsSent.inc({
      type: notification.type,
      channel: notification.channel
    });
  }

  async getNotificationPreferences(userId: string): Promise<{
    success: boolean;
    preferences?: NotificationPreferences;
    message?: string;
  }> {
    try {
      const preferences = await this.databaseService.getNotificationPreferences(userId);
      
      return {
        success: true,
        preferences: preferences || this.getDefaultPreferences()
      };
    } catch (error) {
      logger.error('Failed to get notification preferences:', error);
      return {
        success: false,
        message: 'Failed to get notification preferences'
      };
    }
  }

  async updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      await this.databaseService.updateNotificationPreferences(userId, preferences);
      
      return {
        success: true,
        message: 'Notification preferences updated'
      };
    } catch (error) {
      logger.error('Failed to update notification preferences:', error);
      return {
        success: false,
        message: 'Failed to update notification preferences'
      };
    }
  }

  async sendTestNotification(userId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const testNotification: Omit<Notification, 'id' | 'createdAt' | 'read'> = {
        userId,
        title: 'Test Notification',
        message: 'This is a test notification to verify your notification settings.',
        type: 'info',
        channel: 'in_app'
      };
      
      const result = await this.sendNotification(testNotification);
      
      return {
        success: result.success,
        message: result.success ? 'Test notification sent' : 'Failed to send test notification'
      };
    } catch (error) {
      logger.error('Failed to send test notification:', error);
      return {
        success: false,
        message: 'Failed to send test notification'
      };
    }
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      email: true,
      push: true,
      inApp: true,
      contestUpdates: true,
      votingReminders: true,
      disputeAlerts: true,
      governanceProposals: true
    };
  }
}
