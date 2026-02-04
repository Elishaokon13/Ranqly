import Redis from 'ioredis';
import { logger } from '../utils/logger';

export class RedisService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.redis.ping();
      logger.info('Redis connection established');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await this.redis.get(`unread_count:${userId}`);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      logger.error('Failed to get unread count:', error);
      return 0;
    }
  }

  async incrementUnreadCount(userId: string): Promise<void> {
    try {
      await this.redis.incr(`unread_count:${userId}`);
    } catch (error) {
      logger.error('Failed to increment unread count:', error);
    }
  }

  async decrementUnreadCount(userId: string): Promise<void> {
    try {
      const result = await this.redis.decr(`unread_count:${userId}`);
      if (result < 0) {
        await this.redis.set(`unread_count:${userId}`, 0);
      }
    } catch (error) {
      logger.error('Failed to decrement unread count:', error);
    }
  }

  async resetUnreadCount(userId: string): Promise<void> {
    try {
      await this.redis.set(`unread_count:${userId}`, 0);
    } catch (error) {
      logger.error('Failed to reset unread count:', error);
    }
  }

  async cacheNotification(notification: any, ttl: number = 3600): Promise<void> {
    try {
      await this.redis.setex(
        `notification:${notification.id}`,
        ttl,
        JSON.stringify(notification)
      );
    } catch (error) {
      logger.error('Failed to cache notification:', error);
    }
  }

  async getCachedNotification(notificationId: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(`notification:${notificationId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Failed to get cached notification:', error);
      return null;
    }
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}
