import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';
import { Notification } from './notification';

export class WebSocketService {
  private io: SocketIOServer;

  async initialize(io: SocketIOServer): Promise<void> {
    this.io = io;
    
    // Set up connection handling
    this.io.on('connection', (socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);
      
      // Join user-specific room
      socket.on('join', (userId: string) => {
        socket.join(`user:${userId}`);
        logger.info(`User ${userId} joined WebSocket room`);
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`WebSocket client disconnected: ${socket.id}`);
      });
    });
    
    logger.info('WebSocket service initialized');
  }

  async sendNotification(notification: Notification): Promise<void> {
    try {
      // Send notification to user-specific room
      this.io.to(`user:${notification.userId}`).emit('notification', {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data,
        createdAt: notification.createdAt
      });
      
      logger.info(`WebSocket notification sent to user ${notification.userId}`);
    } catch (error) {
      logger.error('Failed to send WebSocket notification:', error);
      throw error;
    }
  }

  async sendToRoom(room: string, event: string, data: any): Promise<void> {
    try {
      this.io.to(room).emit(event, data);
      logger.info(`WebSocket message sent to room ${room}: ${event}`);
    } catch (error) {
      logger.error('Failed to send WebSocket message:', error);
      throw error;
    }
  }

  async broadcast(event: string, data: any): Promise<void> {
    try {
      this.io.emit(event, data);
      logger.info(`WebSocket broadcast sent: ${event}`);
    } catch (error) {
      logger.error('Failed to send WebSocket broadcast:', error);
      throw error;
    }
  }

  getConnectionCount(): number {
    return this.io.engine.clientsCount;
  }
}
