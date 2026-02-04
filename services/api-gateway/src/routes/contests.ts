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
    new winston.transports.File({ filename: 'logs/contests-routes.log' })
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

// GET /contests - Get all contests with optional filtering
router.get('/', [
  query('status').optional().isIn(['announced', 'submissions_open', 'voting_open', 'judging', 'completed', 'cancelled']),
  query('organizer').optional().isEthereumAddress(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { status, organizer, limit = 20, offset = 0 } = req.query;
    
    const filters: any = {};
    if (status) filters.status = status;
    if (organizer) filters.organizer_address = organizer;
    if (limit) filters.limit = parseInt(limit as string);
    
    const contests = await DatabaseService.getInstance().getContests(filters);
    
    // Get submission counts for each contest
    const contestsWithCounts = await Promise.all(
      contests.map(async (contest) => {
        const submissions = await DatabaseService.getInstance().getContestSubmissions(contest.id);
        return {
          ...contest,
          submission_count: submissions.length,
          total_reward: contest.reward_amount,
          time_remaining: {
            submission_deadline: contest.submission_deadline,
            voting_deadline: contest.voting_deadline,
            judging_deadline: contest.judging_deadline
          }
        };
      })
    );

    logger.info(`Retrieved ${contests.length} contests`);
    
    res.json({
      success: true,
      data: contestsWithCounts,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: contests.length
      }
    });
  } catch (error) {
    logger.error('Error getting contests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve contests',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /contests/:id - Get a specific contest
router.get('/:id', [
  param('id').isUUID()
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const contest = await DatabaseService.getInstance().getContest(id);
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    // Get submissions for this contest
    const submissions = await DatabaseService.getInstance().getContestSubmissions(id);
    
    // Get voting session if exists
    const votingSession = await DatabaseService.getInstance().getVotingSession(id);

    logger.info(`Retrieved contest ${id}`);
    
    res.json({
      success: true,
      data: {
        ...contest,
        submissions,
        voting_session: votingSession,
        submission_count: submissions.length
      }
    });
  } catch (error) {
    logger.error(`Error getting contest ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve contest',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /contests - Create a new contest
router.post('/', [
  body('title').notEmpty().withMessage('Title is required').isLength({ min: 5, max: 255 }),
  body('description').notEmpty().withMessage('Description is required').isLength({ min: 20, max: 5000 }),
  body('reward_amount').isDecimal({ decimal_digits: '0,8' }).withMessage('Invalid reward amount'),
  body('reward_token').isIn(['ETH', 'USDC', 'USDT', 'DAI']).withMessage('Invalid reward token'),
  body('submission_deadline').isISO8601().withMessage('Invalid submission deadline'),
  body('voting_deadline').isISO8601().withMessage('Invalid voting deadline'),
  body('judging_deadline').isISO8601().withMessage('Invalid judging deadline'),
  body('rules').isArray({ min: 1 }).withMessage('At least one rule is required'),
  body('organizer_address').isEthereumAddress().withMessage('Invalid organizer address')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      reward_amount,
      reward_token,
      submission_deadline,
      voting_deadline,
      judging_deadline,
      rules,
      organizer_address
    } = req.body;

    // Validate deadline order
    const submissionDeadline = new Date(submission_deadline);
    const votingDeadline = new Date(voting_deadline);
    const judgingDeadline = new Date(judging_deadline);
    const now = new Date();

    if (submissionDeadline <= now) {
      return res.status(400).json({
        success: false,
        error: 'Submission deadline must be in the future'
      });
    }

    if (votingDeadline <= submissionDeadline) {
      return res.status(400).json({
        success: false,
        error: 'Voting deadline must be after submission deadline'
      });
    }

    if (judgingDeadline <= votingDeadline) {
      return res.status(400).json({
        success: false,
        error: 'Judging deadline must be after voting deadline'
      });
    }

    // Verify organizer has sufficient balance (optional check)
    const balance = await BlockchainService.getInstance().getBalance(organizer_address);
    const requiredBalance = parseFloat(reward_amount) * 1.1; // 10% buffer for gas
    
    if (parseFloat(balance) < requiredBalance) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance to create contest'
      });
    }

    // Create contest
    const contest = await DatabaseService.getInstance().createContest({
      title,
      description,
      reward_amount,
      reward_token,
      submission_deadline: submissionDeadline,
      voting_deadline: votingDeadline,
      judging_deadline: judgingDeadline,
      rules,
      organizer_address,
      status: 'announced'
    });

    // Log audit event
    await AuditService.getInstance().logEvent({
      entity_type: 'contest',
      entity_id: contest.id,
      action: 'created',
      actor_address: organizer_address,
      details: {
        title,
        reward_amount,
        reward_token
      }
    });

    logger.info(`Created contest ${contest.id} by ${organizer_address}`);
    
    res.status(201).json({
      success: true,
      data: contest,
      message: 'Contest created successfully'
    });
  } catch (error) {
    logger.error('Error creating contest:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create contest',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /contests/:id - Update a contest
router.put('/:id', [
  param('id').isUUID(),
  body('title').optional().isLength({ min: 5, max: 255 }),
  body('description').optional().isLength({ min: 20, max: 5000 }),
  body('status').optional().isIn(['announced', 'submissions_open', 'voting_open', 'judging', 'completed', 'cancelled']),
  body('rules').optional().isArray({ min: 1 })
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check if contest exists
    const existingContest = await DatabaseService.getInstance().getContest(id);
    if (!existingContest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    // Only allow updates to certain fields
    const allowedUpdates = ['title', 'description', 'status', 'rules'];
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

    const updatedContest = await DatabaseService.getInstance().updateContest(id, filteredUpdates);

    // Log audit event
    await AuditService.getInstance().logEvent({
      entity_type: 'contest',
      entity_id: id,
      action: 'updated',
      actor_address: req.headers['x-user-address'] as string,
      details: filteredUpdates
    });

    logger.info(`Updated contest ${id}`);
    
    res.json({
      success: true,
      data: updatedContest,
      message: 'Contest updated successfully'
    });
  } catch (error) {
    logger.error(`Error updating contest ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to update contest',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /contests/:id - Cancel a contest
router.delete('/:id', [
  param('id').isUUID()
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if contest exists
    const contest = await DatabaseService.getInstance().getContest(id);
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    // Only allow cancellation if contest is not completed
    if (contest.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel completed contest'
      });
    }

    const updatedContest = await DatabaseService.getInstance().updateContest(id, {
      status: 'cancelled'
    });

    // Log audit event
    await AuditService.getInstance().logEvent({
      entity_type: 'contest',
      entity_id: id,
      action: 'cancelled',
      actor_address: req.headers['x-user-address'] as string,
      details: { reason: 'Contest cancelled by organizer' }
    });

    logger.info(`Cancelled contest ${id}`);
    
    res.json({
      success: true,
      data: updatedContest,
      message: 'Contest cancelled successfully'
    });
  } catch (error) {
    logger.error(`Error cancelling contest ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel contest',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /contests/:id/submissions - Get contest submissions
router.get('/:id/submissions', [
  param('id').isUUID()
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if contest exists
    const contest = await DatabaseService.getInstance().getContest(id);
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    const submissions = await DatabaseService.getInstance().getContestSubmissions(id);
    
    logger.info(`Retrieved ${submissions.length} submissions for contest ${id}`);
    
    res.json({
      success: true,
      data: submissions,
      contest_id: id
    });
  } catch (error) {
    logger.error(`Error getting submissions for contest ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve submissions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;