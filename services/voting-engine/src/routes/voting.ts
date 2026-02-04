import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { VotingService } from '../services/VotingService';
import { BlockchainService } from '../services/BlockchainService';
import { SybilDetectionService } from '../services/SybilDetectionService';
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
    new winston.transports.File({ filename: 'logs/voting-routes.log' })
  ]
});

// Validation middleware
const validateRequest = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Middleware to get services (would be injected from main app)
const getServices = (req: Request, res: Response, next: any) => {
  // In a real implementation, these would be injected from the main app
  req.services = {
    voting: new VotingService(),
    blockchain: new BlockchainService(),
    sybil: new SybilDetectionService()
  };
  next();
};

// Create voting session
router.post('/sessions',
  [
    body('contestId').notEmpty().withMessage('Contest ID is required'),
    body('config').isObject().withMessage('Config must be an object')
  ],
  validateRequest,
  getServices,
  async (req: Request, res: Response) => {
    try {
      const { contestId, config } = req.body;
      
      logger.info(`Creating voting session for contest ${contestId}`);
      
      const session = await req.services.voting.createVotingSession(contestId, config);
      
      res.status(201).json({
        success: true,
        message: 'Voting session created successfully',
        data: session
      });
      
    } catch (error) {
      logger.error(`Error creating voting session: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to create voting session',
        error: error.message
      });
    }
  }
);

// Commit vote
router.post('/commit',
  [
    body('voterAddress').isEthereumAddress().withMessage('Invalid voter address'),
    body('contestId').notEmpty().withMessage('Contest ID is required'),
    body('submissionId').notEmpty().withMessage('Submission ID is required'),
    body('voteValue').isInt({ min: 0, max: 1 }).withMessage('Vote value must be 0 or 1'),
    body('salt').notEmpty().withMessage('Salt is required'),
    body('justificationHash').isLength({ min: 64, max: 64 }).withMessage('Invalid justification hash')
  ],
  validateRequest,
  getServices,
  async (req: Request, res: Response) => {
    try {
      const {
        voterAddress,
        contestId,
        submissionId,
        voteValue,
        salt,
        justificationHash
      } = req.body;
      
      logger.info(`Committing vote from ${voterAddress} for submission ${submissionId}`);
      
      // Validate wallet signature if provided
      const signature = req.headers['x-wallet-signature'] as string;
      const message = req.headers['x-wallet-message'] as string;
      
      if (signature && message) {
        const isValidSignature = await req.services.blockchain.validateWalletSignature(
          message,
          signature,
          voterAddress
        );
        
        if (!isValidSignature) {
          return res.status(401).json({
            success: false,
            message: 'Invalid wallet signature'
          });
        }
      }
      
      const result = await req.services.voting.commitVote(
        voterAddress,
        contestId,
        submissionId,
        voteValue,
        salt,
        justificationHash
      );
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            commitHash: result.commitHash,
            contestId,
            submissionId,
            timestamp: Date.now()
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
      
    } catch (error) {
      logger.error(`Error committing vote: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to commit vote',
        error: error.message
      });
    }
  }
);

// Reveal vote
router.post('/reveal',
  [
    body('voterAddress').isEthereumAddress().withMessage('Invalid voter address'),
    body('contestId').notEmpty().withMessage('Contest ID is required'),
    body('submissionId').notEmpty().withMessage('Submission ID is required'),
    body('voteValue').isInt({ min: 0, max: 1 }).withMessage('Vote value must be 0 or 1'),
    body('salt').notEmpty().withMessage('Salt is required'),
    body('justificationHash').isLength({ min: 64, max: 64 }).withMessage('Invalid justification hash')
  ],
  validateRequest,
  getServices,
  async (req: Request, res: Response) => {
    try {
      const {
        voterAddress,
        contestId,
        submissionId,
        voteValue,
        salt,
        justificationHash
      } = req.body;
      
      logger.info(`Revealing vote from ${voterAddress} for submission ${submissionId}`);
      
      const result = await req.services.voting.revealVote(
        voterAddress,
        contestId,
        submissionId,
        voteValue,
        salt,
        justificationHash
      );
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            contestId,
            submissionId,
            voteValue,
            timestamp: Date.now()
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
      
    } catch (error) {
      logger.error(`Error revealing vote: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to reveal vote',
        error: error.message
      });
    }
  }
);

// Get voting results
router.get('/results/:contestId',
  [
    param('contestId').notEmpty().withMessage('Contest ID is required')
  ],
  validateRequest,
  getServices,
  async (req: Request, res: Response) => {
    try {
      const { contestId } = req.params;
      
      logger.info(`Getting voting results for contest ${contestId}`);
      
      const results = await req.services.voting.getVotingResults(contestId);
      
      res.status(200).json({
        success: true,
        message: 'Voting results retrieved successfully',
        data: {
          contestId,
          results,
          timestamp: Date.now()
        }
      });
      
    } catch (error) {
      logger.error(`Error getting voting results: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to get voting results',
        error: error.message
      });
    }
  }
);

// Get voting session status
router.get('/sessions/:contestId',
  [
    param('contestId').notEmpty().withMessage('Contest ID is required')
  ],
  validateRequest,
  getServices,
  async (req: Request, res: Response) => {
    try {
      const { contestId } = req.params;
      
      const session = await req.services.voting.getVotingSession(contestId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Voting session not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Voting session retrieved successfully',
        data: session
      });
      
    } catch (error) {
      logger.error(`Error getting voting session: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to get voting session',
        error: error.message
      });
    }
  }
);

// Get user's voting power
router.get('/power/:address',
  [
    param('address').isEthereumAddress().withMessage('Invalid address')
  ],
  validateRequest,
  getServices,
  async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      
      const poiInfo = await req.services.blockchain.getPoINFTInfo(address);
      const onChainActivity = await req.services.blockchain.getOnChainActivity(address);
      
      res.status(200).json({
        success: true,
        message: 'Voting power retrieved successfully',
        data: {
          address,
          poiBalance: poiInfo.balance,
          isValidHolder: poiInfo.isValid,
          onChainActivity,
          votingPower: poiInfo.balance + Math.floor(onChainActivity / 10)
        }
      });
      
    } catch (error) {
      logger.error(`Error getting voting power: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to get voting power',
        error: error.message
      });
    }
  }
);

// Get user's voting history
router.get('/history/:address',
  [
    param('address').isEthereumAddress().withMessage('Invalid address'),
    query('contestId').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  getServices,
  async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const { contestId, limit = 50 } = req.query;
      
      // This would typically use the database service to get voting history
      // For now, returning a placeholder response
      
      res.status(200).json({
        success: true,
        message: 'Voting history retrieved successfully',
        data: {
          address,
          contestId: contestId || 'all',
          votes: [], // Would be populated from database
          totalVotes: 0,
          timestamp: Date.now()
        }
      });
      
    } catch (error) {
      logger.error(`Error getting voting history: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to get voting history',
        error: error.message
      });
    }
  }
);

// Get voting statistics
router.get('/stats/:contestId',
  [
    param('contestId').notEmpty().withMessage('Contest ID is required')
  ],
  validateRequest,
  getServices,
  async (req: Request, res: Response) => {
    try {
      const { contestId } = req.params;
      
      const session = await req.services.voting.getVotingSession(contestId);
      const results = await req.services.voting.getVotingResults(contestId);
      
      const stats = {
        contestId,
        totalSubmissions: results.length,
        totalVotes: results.reduce((sum, r) => sum + r.totalVotes, 0),
        totalUpvotes: results.reduce((sum, r) => sum + r.upvotes, 0),
        totalDownvotes: results.reduce((sum, r) => sum + r.downvotes, 0),
        averageParticipationRate: results.reduce((sum, r) => sum + r.participationRate, 0) / results.length,
        averageConfidenceScore: results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length,
        session: session ? {
          phase: session.phase,
          totalCommits: session.totalCommits,
          totalReveals: session.totalReveals,
          isActive: session.isActive
        } : null,
        timestamp: Date.now()
      };
      
      res.status(200).json({
        success: true,
        message: 'Voting statistics retrieved successfully',
        data: stats
      });
      
    } catch (error) {
      logger.error(`Error getting voting statistics: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to get voting statistics',
        error: error.message
      });
    }
  }
);

// Get blockchain voting data
router.get('/blockchain/:contestId',
  [
    param('contestId').notEmpty().withMessage('Contest ID is required')
  ],
  validateRequest,
  getServices,
  async (req: Request, res: Response) => {
    try {
      const { contestId } = req.params;
      
      const contestInfo = await req.services.blockchain.getContestInfo(contestId);
      const votingPhase = await req.services.blockchain.getVotingPhase(contestId);
      
      res.status(200).json({
        success: true,
        message: 'Blockchain voting data retrieved successfully',
        data: {
          contestId,
          contestInfo,
          votingPhase,
          timestamp: Date.now()
        }
      });
      
    } catch (error) {
      logger.error(`Error getting blockchain voting data: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to get blockchain voting data',
        error: error.message
      });
    }
  }
);

// Validate wallet signature
router.post('/validate-signature',
  [
    body('message').notEmpty().withMessage('Message is required'),
    body('signature').notEmpty().withMessage('Signature is required'),
    body('address').isEthereumAddress().withMessage('Invalid address')
  ],
  validateRequest,
  getServices,
  async (req: Request, res: Response) => {
    try {
      const { message, signature, address } = req.body;
      
      const isValid = await req.services.blockchain.validateWalletSignature(
        message,
        signature,
        address
      );
      
      res.status(200).json({
        success: true,
        message: 'Signature validation completed',
        data: {
          isValid,
          address,
          timestamp: Date.now()
        }
      });
      
    } catch (error) {
      logger.error(`Error validating signature: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to validate signature',
        error: error.message
      });
    }
  }
);

// Get network information
router.get('/network',
  getServices,
  async (req: Request, res: Response) => {
    try {
      const networkInfo = await req.services.blockchain.getNetworkInfo();
      const gasPrice = await req.services.blockchain.getGasPrice();
      
      res.status(200).json({
        success: true,
        message: 'Network information retrieved successfully',
        data: {
          network: networkInfo,
          gasPrice,
          timestamp: Date.now()
        }
      });
      
    } catch (error) {
      logger.error(`Error getting network information: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to get network information',
        error: error.message
      });
    }
  }
);

export default router;
