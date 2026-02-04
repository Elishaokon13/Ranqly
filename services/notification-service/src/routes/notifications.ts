import { Router } from 'express';
import { notificationService } from '../services/notification';

const router = Router();

// Get notifications for a user
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;
    
    const result = await notificationService.getNotifications(address, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      unreadOnly: unreadOnly === 'true'
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mark notification as read
router.post('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const result = await notificationService.markAsRead(notificationId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mark all notifications as read for a user
router.post('/:address/read-all', async (req, res) => {
  try {
    const { address } = req.params;
    
    const result = await notificationService.markAllAsRead(address);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear notification
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const result = await notificationService.clearNotification(notificationId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear all notifications for a user
router.delete('/:address/all', async (req, res) => {
  try {
    const { address } = req.params;
    
    const result = await notificationService.clearAllNotifications(address);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get notification preferences
router.get('/:address/preferences', async (req, res) => {
  try {
    const { address } = req.params;
    
    const result = await notificationService.getNotificationPreferences(address);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update notification preferences
router.put('/:address/preferences', async (req, res) => {
  try {
    const { address } = req.params;
    const preferences = req.body;
    
    const result = await notificationService.updateNotificationPreferences(address, preferences);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send test notification
router.post('/:address/test', async (req, res) => {
  try {
    const { address } = req.params;
    
    const result = await notificationService.sendTestNotification(address);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
