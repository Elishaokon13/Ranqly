import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { DatabaseService } from '../services/database-service';
import { EmailService } from '../services/email-service';
import { Logger } from '../utils/logger';

export class FeedbackRouter {
  public router: Router;
  private dbService: DatabaseService;
  private emailService: EmailService;
  private logger: Logger;

  constructor(dbService: DatabaseService, emailService: EmailService) {
    this.router = Router();
    this.dbService = dbService;
    this.emailService = emailService;
    this.logger = new Logger();
    this.setupRoutes();
  }

  private setupRoutes() {
    // Submit feedback
    this.router.post('/submit', this.validateFeedbackSubmission(), this.submitFeedback.bind(this));
    
    // Get feedback by user
    this.router.get('/user/:userId', this.getUserFeedback.bind(this));
    
    // Get feedback by contest
    this.router.get('/contest/:contestId', this.getContestFeedback.bind(this));
    
    // Get all feedback (admin)
    this.router.get('/all', this.getAllFeedback.bind(this));
    
    // Update feedback
    this.router.put('/:feedbackId', this.validateFeedbackUpdate(), this.updateFeedback.bind(this));
    
    // Delete feedback
    this.router.delete('/:feedbackId', this.deleteFeedback.bind(this));
    
    // Get feedback analytics
    this.router.get('/analytics/summary', this.getFeedbackAnalytics.bind(this));
  }

  private validateFeedbackSubmission() {
    return [
      body('userId').isString().notEmpty().withMessage('User ID is required'),
      body('contestId').optional().isString().withMessage('Contest ID must be a string'),
      body('feature').isString().notEmpty().withMessage('Feature is required'),
      body('type').isIn(['bug', 'suggestion', 'complaint', 'praise', 'question']).withMessage('Invalid feedback type'),
      body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
      body('title').isString().notEmpty().withMessage('Title is required'),
      body('description').isString().notEmpty().withMessage('Description is required'),
      body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
      body('metadata').optional().isObject().withMessage('Metadata must be an object'),
    ];
  }

  private validateFeedbackUpdate() {
    return [
      body('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status'),
      body('response').optional().isString().withMessage('Response must be a string'),
      body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
    ];
  }

  private async submitFeedback(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        userId,
        contestId,
        feature,
        type,
        rating,
        title,
        description,
        priority = 'medium',
        metadata = {}
      } = req.body;

      // Create feedback record
      const feedback = await this.dbService.createFeedback({
        userId,
        contestId,
        feature,
        type,
        rating,
        title,
        description,
        priority,
        metadata,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Send notification email for high priority feedback
      if (priority === 'high' || priority === 'critical') {
        await this.emailService.sendFeedbackNotification(feedback);
      }

      // Log feedback submission
      this.logger.info(`Feedback submitted by user ${userId}: ${feedback.id}`);

      res.status(201).json({
        success: true,
        feedback: {
          id: feedback.id,
          userId: feedback.userId,
          feature: feedback.feature,
          type: feedback.type,
          rating: feedback.rating,
          title: feedback.title,
          status: feedback.status,
          createdAt: feedback.createdAt
        }
      });

    } catch (error) {
      this.logger.error('Error submitting feedback:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to submit feedback'
      });
    }
  }

  private async getUserFeedback(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, type, status } = req.query;

      const filters: any = { userId };
      if (type) filters.type = type;
      if (status) filters.status = status;

      const feedback = await this.dbService.getFeedback(filters, {
        page: Number(page),
        limit: Number(limit),
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      });

      res.json({
        success: true,
        feedback: feedback.data,
        pagination: {
          page: feedback.page,
          limit: feedback.limit,
          total: feedback.total,
          pages: feedback.pages
        }
      });

    } catch (error) {
      this.logger.error('Error getting user feedback:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve feedback'
      });
    }
  }

  private async getContestFeedback(req: Request, res: Response) {
    try {
      const { contestId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const feedback = await this.dbService.getFeedback(
        { contestId },
        {
          page: Number(page),
          limit: Number(limit),
          sortBy: 'createdAt',
          sortOrder: 'DESC'
        }
      );

      res.json({
        success: true,
        feedback: feedback.data,
        pagination: {
          page: feedback.page,
          limit: feedback.limit,
          total: feedback.total,
          pages: feedback.pages
        }
      });

    } catch (error) {
      this.logger.error('Error getting contest feedback:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve contest feedback'
      });
    }
  }

  private async getAllFeedback(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, type, status, priority, feature } = req.query;

      const filters: any = {};
      if (type) filters.type = type;
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (feature) filters.feature = feature;

      const feedback = await this.dbService.getFeedback(filters, {
        page: Number(page),
        limit: Number(limit),
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      });

      res.json({
        success: true,
        feedback: feedback.data,
        pagination: {
          page: feedback.page,
          limit: feedback.limit,
          total: feedback.total,
          pages: feedback.pages
        }
      });

    } catch (error) {
      this.logger.error('Error getting all feedback:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve feedback'
      });
    }
  }

  private async updateFeedback(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { feedbackId } = req.params;
      const updates = req.body;

      const feedback = await this.dbService.updateFeedback(feedbackId, {
        ...updates,
        updatedAt: new Date()
      });

      if (!feedback) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Feedback not found'
        });
      }

      // Send response email to user if response is provided
      if (updates.response) {
        await this.emailService.sendFeedbackResponse(feedback);
      }

      res.json({
        success: true,
        feedback
      });

    } catch (error) {
      this.logger.error('Error updating feedback:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update feedback'
      });
    }
  }

  private async deleteFeedback(req: Request, res: Response) {
    try {
      const { feedbackId } = req.params;

      const deleted = await this.dbService.deleteFeedback(feedbackId);

      if (!deleted) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Feedback not found'
        });
      }

      res.json({
        success: true,
        message: 'Feedback deleted successfully'
      });

    } catch (error) {
      this.logger.error('Error deleting feedback:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete feedback'
      });
    }
  }

  private async getFeedbackAnalytics(req: Request, res: Response) {
    try {
      const { period = '7d', feature, type } = req.query;

      const analytics = await this.dbService.getFeedbackAnalytics({
        period: period as string,
        feature: feature as string,
        type: type as string
      });

      res.json({
        success: true,
        analytics
      });

    } catch (error) {
      this.logger.error('Error getting feedback analytics:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve feedback analytics'
      });
    }
  }
}
