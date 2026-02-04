import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { DatabaseService } from '../services/database';
import { BlockchainService } from '../services/blockchain';
import { AuditService } from '../services/audit';
import winston from 'winston';

const router = Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/submissions-routes.log' })
  ]
});

// Validation middleware
const validateRequest = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// GET /submissions - Get submissions with optional filtering
router.get('/', [
  query('contest_id').optional().isUUID(),
  query('submitter_address').optional().isEthereumAddress(),
  query('status').optional().isIn(['submitted', 'under_review', 'approved', 'rejected', 'disputed']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { contest_id, submitter_address, status, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT s.*, c.title as contest_title, c.status as contest_status
      FROM submissions s
      JOIN contests c ON s.contest_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (contest_id) {
      query += ` AND s.contest_id = $${paramCount++}`;
      params.push(contest_id);
    }

    if (submitter_address) {
      query += ` AND s.submitter_address = $${paramCount++}`;
      params.push(submitter_address);
    }

    if (status) {
      query += ` AND s.status = $${paramCount++}`;
      params.push(status);
    }

    query += ' ORDER BY s.created_at DESC';
    
    if (limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(parseInt(limit as string));
    }

    if (offset) {
      query += ` OFFSET $${paramCount++}`;
      params.push(parseInt(offset as string));
    }

    const result = await DatabaseService.getInstance().query(query, params);
    
    logger.info(`Retrieved ${result.rows.length} submissions`);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: result.rows.length
      }
    });
  } catch (error) {
    logger.error('Error getting submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve submissions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /submissions/:id - Get a specific submission
router.get('/:id', [
  param('id').isUUID()
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const submission = await DatabaseService.getInstance().getSubmission(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Get contest details
    const contest = await DatabaseService.getInstance().getContest(submission.contest_id);

    logger.info(`Retrieved submission ${id}`);
    
    res.json({
      success: true,
      data: {
        ...submission,
        contest
      }
    });
  } catch (error) {
    logger.error(`Error getting submission ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve submission',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /submissions - Create a new submission
router.post('/', [
  body('contest_id').isUUID().withMessage('Valid contest ID is required'),
  body('title').notEmpty().withMessage('Title is required').isLength({ min: 5, max: 255 }),
  body('description').notEmpty().withMessage('Description is required').isLength({ min: 20, max: 5000 }),
  body('content_url').optional().isURL().withMessage('Invalid content URL'),
  body('content_type').optional().isIn(['text', 'image', 'video', 'audio', 'document', 'code', 'url']),
  body('submitter_address').isEthereumAddress().withMessage('Invalid submitter address')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const {
      contest_id,
      title,
      description,
      content_url,
      content_type = 'text',
      submitter_address
    } = req.body;

    // Verify contest exists and is accepting submissions
    const contest = await DatabaseService.getInstance().getContest(contest_id);
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    if (contest.status !== 'announced' && contest.status !== 'submissions_open') {
      return res.status(400).json({
        success: false,
        error: 'Contest is not accepting submissions'
      });
    }

    // Check if submission deadline has passed
    const now = new Date();
    const submissionDeadline = new Date(contest.submission_deadline);
    if (now > submissionDeadline) {
      return res.status(400).json({
        success: false,
        error: 'Submission deadline has passed'
      });
    }

    // Check if user has already submitted to this contest
    const existingSubmissions = await DatabaseService.getInstance().getContestSubmissions(contest_id);
    const userSubmissions = existingSubmissions.filter(sub => sub.submitter_address === submitter_address);
    
    if (userSubmissions.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'You have already submitted to this contest'
      });
    }

    // Generate file hash if content_url is provided
    let file_hash = null;
    if (content_url) {
      // In a real implementation, you would download the content and hash it
      // For now, we'll create a hash based on the URL and timestamp
      const crypto = require('crypto');
      file_hash = crypto.createHash('sha256')
        .update(content_url + Date.now())
        .digest('hex');
    }

    // Create submission
    const submission = await DatabaseService.getInstance().createSubmission({
      contest_id,
      submitter_address,
      title,
      description,
      content_url,
      content_type,
      file_hash,
      status: 'submitted'
    });

    // Log audit event
    await AuditService.getInstance().logEvent({
      entity_type: 'submission',
      entity_id: submission.id,
      action: 'created',
      actor_address: submitter_address,
      details: {
        contest_id,
        title,
        content_type
      }
    });

    logger.info(`Created submission ${submission.id} by ${submitter_address} for contest ${contest_id}`);
    
    res.status(201).json({
      success: true,
      data: submission,
      message: 'Submission created successfully'
    });
  } catch (error) {
    logger.error('Error creating submission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create submission',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /submissions/:id - Update a submission
router.put('/:id', [
  param('id').isUUID(),
  body('title').optional().isLength({ min: 5, max: 255 }),
  body('description').optional().isLength({ min: 20, max: 5000 }),
  body('content_url').optional().isURL(),
  body('status').optional().isIn(['submitted', 'under_review', 'approved', 'rejected', 'disputed'])
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check if submission exists
    const existingSubmission = await DatabaseService.getInstance().getSubmission(id);
    if (!existingSubmission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Check if user is authorized to update (only submitter or admin)
    const userAddress = req.headers['x-user-address'] as string;
    if (existingSubmission.submitter_address !== userAddress) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this submission'
      });
    }

    // Only allow updates to certain fields
    const allowedUpdates = ['title', 'description', 'content_url', 'status'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid updates provided'
      });
    }

    const updatedSubmission = await DatabaseService.getInstance().updateSubmission(id, filteredUpdates);

    // Log audit event
    await AuditService.getInstance().logEvent({
      entity_type: 'submission',
      entity_id: id,
      action: 'updated',
      actor_address: userAddress,
      details: filteredUpdates
    });

    logger.info(`Updated submission ${id}`);
    
    res.json({
      success: true,
      data: updatedSubmission,
      message: 'Submission updated successfully'
    });
  } catch (error) {
    logger.error(`Error updating submission ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to update submission',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /submissions/:id - Delete a submission
router.delete('/:id', [
  param('id').isUUID()
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if submission exists
    const submission = await DatabaseService.getInstance().getSubmission(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Check if user is authorized to delete (only submitter or admin)
    const userAddress = req.headers['x-user-address'] as string;
    if (submission.submitter_address !== userAddress) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this submission'
      });
    }

    // Check if contest is still in submission phase
    const contest = await DatabaseService.getInstance().getContest(submission.contest_id);
    const now = new Date();
    const submissionDeadline = new Date(contest.submission_deadline);
    
    if (now > submissionDeadline) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete submission after deadline'
      });
    }

    // Delete submission (this would cascade to related records)
    await DatabaseService.getInstance().query('DELETE FROM submissions WHERE id = $1', [id]);

    // Log audit event
    await AuditService.getInstance().logEvent({
      entity_type: 'submission',
      entity_id: id,
      action: 'deleted',
      actor_address: userAddress,
      details: { contest_id: submission.contest_id }
    });

    logger.info(`Deleted submission ${id}`);
    
    res.json({
      success: true,
      message: 'Submission deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting submission ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete submission',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /submissions/:id/dispute - Create a dispute for a submission
router.post('/:id/dispute', [
  param('id').isUUID(),
  body('dispute_type').isIn(['plagiarism', 'inappropriate', 'spam', 'violation', 'other']).withMessage('Invalid dispute type'),
  body('description').notEmpty().withMessage('Dispute description is required').isLength({ min: 10, max: 1000 }),
  body('disputer_address').isEthereumAddress().withMessage('Invalid disputer address')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dispute_type, description, disputer_address } = req.body;
    
    // Check if submission exists
    const submission = await DatabaseService.getInstance().getSubmission(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Check if user is not the submitter (can't dispute own submission)
    if (submission.submitter_address === disputer_address) {
      return res.status(400).json({
        success: false,
        error: 'Cannot dispute your own submission'
      });
    }

    // Create dispute
    const result = await DatabaseService.getInstance().query(`
      INSERT INTO disputes (contest_id, submission_id, disputer_address, dispute_type, description, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [submission.contest_id, id, disputer_address, dispute_type, description, 'open']);

    const dispute = result.rows[0];

    // Update submission status to disputed
    await DatabaseService.getInstance().updateSubmission(id, { status: 'disputed' });

    // Log audit event
    await AuditService.getInstance().logEvent({
      entity_type: 'dispute',
      entity_id: dispute.id,
      action: 'created',
      actor_address: disputer_address,
      details: {
        submission_id: id,
        dispute_type,
        description
      }
    });

    logger.info(`Created dispute ${dispute.id} for submission ${id} by ${disputer_address}`);
    
    res.status(201).json({
      success: true,
      data: dispute,
      message: 'Dispute created successfully'
    });
  } catch (error) {
    logger.error(`Error creating dispute for submission ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to create dispute',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;