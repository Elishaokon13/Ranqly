import { api } from './api'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
  data?: any
}

export interface NotificationResponse {
  success: boolean
  notifications?: Notification[]
  unreadCount?: number
  error?: string
}

class NotificationService {
  async getNotifications(address: string): Promise<NotificationResponse> {
    try {
      const response = await api.get(`/notifications/${address}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      return {
        success: false,
        error: 'Failed to fetch notifications',
      }
    }
  }

  async markAsRead(notificationId: string): Promise<{ success: boolean }> {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`)
      return response.data
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      return { success: false }
    }
  }

  async markAllAsRead(address: string): Promise<{ success: boolean }> {
    try {
      const response = await api.put(`/notifications/${address}/read-all`)
      return response.data
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      return { success: false }
    }
  }

  async clearNotification(notificationId: string): Promise<{ success: boolean }> {
    try {
      const response = await api.delete(`/notifications/${notificationId}`)
      return response.data
    } catch (error) {
      console.error('Failed to clear notification:', error)
      return { success: false }
    }
  }

  async subscribeToNotifications(address: string, callback: (notification: Notification) => void) {
    // This would typically use WebSocket or Server-Sent Events
    // For now, we'll simulate with polling
    const pollInterval = setInterval(async () => {
      try {
        const response = await this.getNotifications(address)
        if (response.success && response.notifications) {
          const unreadNotifications = response.notifications.filter(n => !n.read)
          unreadNotifications.forEach(callback)
        }
      } catch (error) {
        console.error('Failed to poll for notifications:', error)
      }
    }, 30000) // Poll every 30 seconds

    return () => clearInterval(pollInterval)
  }
}

export const notificationService = new NotificationService()