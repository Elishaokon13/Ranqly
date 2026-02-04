import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { DatabaseService } from '../services/database';
import { BlockchainService } from '../services/blockchain';
import { AuditService } from '../services/audit';
import { generateAuthToken, verifyWalletSignature } from '../middleware/auth';
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
    new winston.transports.File({ filename: 'logs/users-routes.log' })
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

// GET /users/:address - Get user profile
router.get('/:address', [
  param('address').isEthereumAddress()
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    const user = await DatabaseService.getInstance().getUser(address);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get blockchain data
    const poiInfo = await BlockchainService.getInstance().getPoINFTInfo(address);
    const onChainActivity = await BlockchainService.getInstance().getDetailedOnChainActivity(address);
    const balance = await BlockchainService.getInstance().getBalance(address);

    logger.info(`Retrieved user profile for ${address}`);
    
    res.json({
      success: true,
      data: {
        ...user,
        blockchain_data: {
          poi_nft: poiInfo,
          on_chain_activity: onChainActivity,
          balance
        }
      }
    });
  } catch (error) {
    logger.error(`Error getting user profile ${req.params.address}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /users/register - Register a new user
router.post('/register', [
  body('wallet_address').isEthereumAddress().withMessage('Invalid wallet address'),
  body('username').optional().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('email').optional().isEmail().withMessage('Invalid email address'),
  body('message').notEmpty().withMessage('Message is required for signature verification'),
  body('signature').notEmpty().withMessage('Signature is required for verification')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const {
      wallet_address,
      username,
      email,
      message,
      signature
    } = req.body;

    // Verify wallet signature
    const isValidSignature = await verifyWalletSignature(message, signature, wallet_address);
    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Check if user already exists
    const existingUser = await DatabaseService.getInstance().getUser(wallet_address);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Check username availability if provided
    if (username) {
      const existingUsername = await DatabaseService.getInstance().query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );
      if (existingUsername.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Username already taken'
        });
      }
    }

    // Create user
    const user = await DatabaseService.getInstance().createUser({
      wallet_address,
      username,
      email
    });

    // Log audit event
    await AuditService.getInstance().logUserRegistered(wallet_address, username);

    // Generate auth token
    const token = generateAuthToken(wallet_address);

    logger.info(`User registered: ${wallet_address}`);
    
    res.status(201).json({
      success: true,
      data: {
        user,
        token
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    logger.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /users/:address - Update user profile
router.put('/:address', [
  param('address').isEthereumAddress(),
  body('username').optional().isLength({ min: 3, max: 50 }),
  body('email').optional().isEmail(),
  body('avatar_url').optional().isURL(),
  body('message').notEmpty().withMessage('Message is required for signature verification'),
  body('signature').notEmpty().withMessage('Signature is required for verification')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { username, email, avatar_url, message, signature } = req.body;

    // Verify wallet signature
    const isValidSignature = await verifyWalletSignature(message, signature, address);
    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Check if user exists
    const existingUser = await DatabaseService.getInstance().getUser(address);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check username availability if changing username
    if (username && username !== existingUser.username) {
      const existingUsername = await DatabaseService.getInstance().query(
        'SELECT id FROM users WHERE username = $1 AND wallet_address != $2',
        [username, address]
      );
      if (existingUsername.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Username already taken'
        });
      }
    }

    // Prepare updates
    const updates: any = {};
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid updates provided'
      });
    }

    // Update user
    const updatedUser = await DatabaseService.getInstance().updateUser(address, updates);

    // Log audit event
    await AuditService.getInstance().logUserUpdated(address, updates);

    logger.info(`User profile updated: ${address}`);
    
    res.json({
      success: true,
      data: updatedUser,
      message: 'User profile updated successfully'
    });
  } catch (error) {
    logger.error(`Error updating user profile ${req.params.address}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /users/login - Login user
router.post('/login', [
  body('wallet_address').isEthereumAddress().withMessage('Invalid wallet address'),
  body('message').notEmpty().withMessage('Message is required for signature verification'),
  body('signature').notEmpty().withMessage('Signature is required for verification')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { wallet_address, message, signature } = req.body;

    // Verify wallet signature
    const isValidSignature = await verifyWalletSignature(message, signature, wallet_address);
    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Get or create user
    let user = await DatabaseService.getInstance().getUser(wallet_address);
    if (!user) {
      // Auto-register user if they don't exist
      user = await DatabaseService.getInstance().createUser({
        wallet_address
      });
      
      // Log audit event
      await AuditService.getInstance().logUserRegistered(wallet_address);
    }

    // Generate auth token
    const token = generateAuthToken(wallet_address);

    // Get blockchain data
    const poiInfo = await BlockchainService.getInstance().getPoINFTInfo(wallet_address);
    const onChainActivity = await BlockchainService.getInstance().getDetailedOnChainActivity(wallet_address);

    logger.info(`User logged in: ${wallet_address}`);
    
    res.json({
      success: true,
      data: {
        user,
        token,
        blockchain_data: {
          poi_nft: poiInfo,
          on_chain_activity: onChainActivity
        }
      },
      message: 'Login successful'
    });
  } catch (error) {
    logger.error('Error during login:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /users/:address/activity - Get user activity
router.get('/:address/activity', [
  param('address').isEthereumAddress(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // Check if user exists
    const user = await DatabaseService.getInstance().getUser(address);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user activity from audit logs
    const activity = await AuditService.getInstance().getUserActivity(address, parseInt(limit as string));

    // Get user's submissions
    const submissions = await DatabaseService.getInstance().query(
      'SELECT id, title, contest_id, status, created_at FROM submissions WHERE submitter_address = $1 ORDER BY created_at DESC LIMIT $2',
      [address, parseInt(limit as string)]
    );

    // Get user's votes
    const votes = await DatabaseService.getInstance().query(
      `SELECT vr.*, s.title as submission_title, c.title as contest_title
       FROM vote_reveals vr
       JOIN submissions s ON vr.submission_id = s.id
       JOIN contests c ON vr.contest_id = c.id
       WHERE vr.voter_address = $1
       ORDER BY vr.timestamp DESC
       LIMIT $2`,
      [address, parseInt(limit as string)]
    );

    logger.info(`Retrieved activity for user ${address}`);
    
    res.json({
      success: true,
      data: {
        audit_logs: activity,
        submissions: submissions.rows,
        votes: votes.rows
      }
    });
  } catch (error) {
    logger.error(`Error getting user activity ${req.params.address}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user activity',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /users/:address/contests - Get contests created by user
router.get('/:address/contests', [
  param('address').isEthereumAddress(),
  query('status').optional().isIn(['announced', 'submissions_open', 'voting_open', 'judging', 'completed', 'cancelled']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;
    
    const filters: any = { organizer_address: address };
    if (status) filters.status = status;
    if (limit) filters.limit = parseInt(limit as string);
    
    const contests = await DatabaseService.getInstance().getContests(filters);

    logger.info(`Retrieved ${contests.length} contests for user ${address}`);
    
    res.json({
      success: true,
      data: contests,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: contests.length
      }
    });
  } catch (error) {
    logger.error(`Error getting user contests ${req.params.address}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user contests',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /users/:address/submissions - Get submissions by user
router.get('/:address/submissions', [
  param('address').isEthereumAddress(),
  query('status').optional().isIn(['submitted', 'under_review', 'approved', 'rejected', 'disputed']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT s.*, c.title as contest_title, c.status as contest_status
      FROM submissions s
      JOIN contests c ON s.contest_id = c.id
      WHERE s.submitter_address = $1
    `;
    const params: any[] = [address];
    let paramCount = 2;

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

    logger.info(`Retrieved ${result.rows.length} submissions for user ${address}`);
    
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
    logger.error(`Error getting user submissions ${req.params.address}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user submissions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;