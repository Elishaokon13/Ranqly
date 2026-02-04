import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
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
    new winston.transports.File({ filename: 'logs/sybil-routes.log' })
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
    sybil: new SybilDetectionService()
  };
  next();
};

// Detect sybil voting behavior
router.post('/detect',
  [
    body('voterAddress').isEthereumAddress().withMessage('Invalid voter address'),
    body('contestId').notEmpty().withMessage('Contest ID is required'),
    body('submissionId').notEmpty().withMessage('Submission ID is required'),
    body('ipAddress').isIP().withMessage('Invalid IP address'),
    body('userAgent').notEmpty().withMessage('User agent is required'),
    body('justification').notEmpty().withMessage('Justification is required')
  ],
  validateRequest,
  getServices,
  async (req: Request, res: Response) => {
    try {
      const {
        voterAddress,
        contestId,
        submissionId,
        ipAddress,
        userAgent,
        justification
      } = req.body;
      
      logger.info(`Detecting sybil behavior for voter ${voterAddress}`);
      
      const votePattern = {
        voterAddress,
        contestId,
        submissionId,
        voteTimestamp: Date.now(),
        ipAddress,
        userAgent,
        justification
      };
      
      const result = await req.services.sybil.detectSybilVoting(votePattern);
      
      res.status(200).json({
        success: true,
        message: 'Sybil detection completed',
        data: {
          isSybil: result.isSybil,
          confidence: result.confidence,
          evidence: result.evidence,
          clusterId: result.clusterId,
          similarVoters: result.similarVoters,
          timestamp: Date.now()
        }
      });
      
    } catch (error) {
      logger.error(`Error detecting sybil behavior: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to detect sybil behavior',
        error: error.message
      });
    }
  }
);

// Get sybil detection result for a voter
router.get('/result/:address',
  [
    param('address').isEthereumAddress().withMessage('Invalid address')
  ],
  validateRequest,
  getServices,
  async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      
      const result = await req.services.sybil.getSybilDetection(address);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'No sybil detection result found for this address'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Sybil detection result retrieved successfully',
        data: {
          address,
          ...result,
          timestamp: Date.now()
        }
      });
      
    } catch (error) {
      logger.error(`Error getting sybil detection result: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to get sybil detection result',
        error: error.message
      });
    }
  }
);

// Run scheduled sybil detection
router.post('/run-detection',
  getServices,
  async (req: Request, res: Response) => {
    try {
      logger.info('Running scheduled sybil detection');
      
      await req.services.sybil.runDetection();
      
      res.status(200).json({
        success: true,
        message: 'Scheduled sybil detection completed successfully',
        data: {
          timestamp: Date.now()
        }
      });
      
    } catch (error) {
      logger.error(`Error running scheduled sybil detection: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to run scheduled sybil detection',
        error: error.message
      });
    }
  }
);

// Get sybil detection statistics
router.get('/stats',
  [
    query('timeframe').optional().isIn(['24h', '7d', '30d']).withMessage('Invalid timeframe')
  ],
  validateRequest,
  getServices,
  async (req: Request, res: Response) => {
    try {
      const { timeframe = '24h' } = req.query;
      
      // This would typically fetch from database
      // For now, returning sample statistics
      
      const stats = {
        timeframe,
        totalDetections: 150,
        sybilDetections: 12,
        falsePositives: 2,
        accuracy: 0.95,
        topPatterns: [
          { pattern: 'IP Clustering', count: 8, percentage: 66.7 },
          { pattern: 'Justification Similarity', count: 3, percentage: 25.0 },
          { pattern: 'Behavioral Patterns', count: 1, percentage: 8.3 }
        ],
        recentDetections: [
          {
            address: '0x1234...5678',
            confidence: 0.92,
            pattern: 'IP Clustering',
            timestamp: Date.now() - 3600000
          },
          {
            address: '0xabcd...efgh',
            confidence: 0.87,
            pattern: 'Justification Similarity',
            timestamp: Date.now() - 7200000
          }
        ],
        timestamp: Date.now()
      };
      
      res.status(200).json({
        success: true,
        message: 'Sybil detection statistics retrieved successfully',
        data: stats
      });
      
    } catch (error) {
      logger.error(`Error getting sybil detection statistics: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to get sybil detection statistics',
        error: error.message
      });
    }
  }
);

// Get sybil clusters
router.get('/clusters',
  [
    query('contestId').optional().isString(),
    query('minSize').optional().isInt({ min: 2 }).withMessage('Minimum cluster size must be at least 2'),
    query('confidence').optional().isFloat({ min: 0, max: 1 }).withMessage('Confidence must be between 0 and 1')
  ],
  validateRequest,
  getServices,
  async (req: Request, res: Response) => {
    try {
      const { contestId, minSize = 2, confidence = 0.7 } = req.query;
      
      // This would typically fetch from database
      // For now, returning sample clusters
      
      const clusters = [
        {
          clusterId: 'cluster_001',
          voterAddresses: [
            '0x1234...5678',
            '0xabcd...efgh',
            '0x9876...5432'
          ],
          confidence: 0.89,
          evidence: [
            'Multiple voters from same IP address: 3 unique addresses',
            'High similarity in justifications'
          ],
          detectedAt: Date.now() - 86400000,
          contestId: contestId || 'contest_123'
        },
        {
          clusterId: 'cluster_002',
          voterAddresses: [
            '0x1111...2222',
            '0x3333...4444'
          ],
          confidence: 0.76,
          evidence: [
            'Sequential voting pattern detected',
            'Identical user agent strings'
          ],
          detectedAt: Date.now() - 172800000,
          contestId: contestId || 'contest_456'
        }
      ];
      
      res.status(200).json({
        success: true,
        message: 'Sybil clusters retrieved successfully',
        data: {
          clusters,
          totalClusters: clusters.length,
          timestamp: Date.now()
        }
      });
      
    } catch (error) {
      logger.error(`Error getting sybil clusters: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to get sybil clusters',
        error: error.message
      });
    }
  }
);

// Validate voter authenticity
router.post('/validate-voter',
  [
    body('voterAddress').isEthereumAddress().withMessage('Invalid voter address'),
    body('ipAddress').isIP().withMessage('Invalid IP address'),
    body('userAgent').notEmpty().withMessage('User agent is required'),
    body('contestId').notEmpty().withMessage('Contest ID is required')
  ],
  validateRequest,
  getServices,
  async (req: Request, res: Response) => {
    try {
      const {
        voterAddress,
        ipAddress,
        userAgent,
        contestId
      } = req.body;
      
      logger.info(`Validating voter authenticity for ${voterAddress}`);
      
      // This would typically run a comprehensive validation
      // For now, returning a sample validation result
      
      const validation = {
        voterAddress,
        isAuthentic: true,
        riskScore: 0.15,
        factors: {
          ipReputation: 0.9,
          userAgentAnalysis: 0.8,
          votingHistory: 0.95,
          onChainActivity: 0.85
        },
        warnings: [],
        recommendations: [
          'Monitor for unusual voting patterns',
          'Verify PoI NFT ownership'
        ],
        timestamp: Date.now()
      };
      
      res.status(200).json({
        success: true,
        message: 'Voter validation completed',
        data: validation
      });
      
    } catch (error) {
      logger.error(`Error validating voter: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to validate voter',
        error: error.message
      });
    }
  }
);

// Get detection patterns
router.get('/patterns',
  [
    query('type').optional().isIn(['ip', 'justification', 'behavior', 'timing', 'user_agent']),
    query('severity').optional().isIn(['low', 'medium', 'high'])
  ],
  validateRequest,
  getServices,
  async (req: Request, res: Response) => {
    try {
      const { type, severity } = req.query;
      
      // This would typically fetch from database
      // For now, returning sample patterns
      
      const patterns = [
        {
          id: 'ip_clustering',
          type: 'ip',
          name: 'IP Address Clustering',
          description: 'Multiple voters using the same IP address',
          severity: 'high',
          threshold: 3,
          examples: [
            '5 voters from IP 192.168.1.1',
            '3 voters from IP 10.0.0.1'
          ],
          detectionRate: 0.92
        },
        {
          id: 'justification_similarity',
          type: 'justification',
          name: 'Justification Similarity',
          description: 'High similarity in voting justifications',
          severity: 'medium',
          threshold: 0.85,
          examples: [
            'Identical justification text',
            'Minimal variations in wording'
          ],
          detectionRate: 0.78
        },
        {
          id: 'rapid_voting',
          type: 'behavior',
          name: 'Rapid Voting Pattern',
          description: 'Unusually fast voting behavior',
          severity: 'medium',
          threshold: 10,
          examples: [
            '10 votes within 1 minute',
            'Consistent time intervals between votes'
          ],
          detectionRate: 0.85
        },
        {
          id: 'synchronized_voting',
          type: 'timing',
          name: 'Synchronized Voting',
          description: 'Votes submitted at exactly the same time',
          severity: 'high',
          threshold: 5,
          examples: [
            'Multiple votes at identical timestamps',
            'Votes within 1-second windows'
          ],
          detectionRate: 0.96
        }
      ];
      
      let filteredPatterns = patterns;
      
      if (type) {
        filteredPatterns = filteredPatterns.filter(p => p.type === type);
      }
      
      if (severity) {
        filteredPatterns = filteredPatterns.filter(p => p.severity === severity);
      }
      
      res.status(200).json({
        success: true,
        message: 'Detection patterns retrieved successfully',
        data: {
          patterns: filteredPatterns,
          totalPatterns: filteredPatterns.length,
          timestamp: Date.now()
        }
      });
      
    } catch (error) {
      logger.error(`Error getting detection patterns: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to get detection patterns',
        error: error.message
      });
    }
  }
);

// Update detection thresholds
router.put('/thresholds',
  [
    body('patterns').isArray().withMessage('Patterns must be an array'),
    body('patterns.*.id').notEmpty().withMessage('Pattern ID is required'),
    body('patterns.*.threshold').isNumeric().withMessage('Threshold must be numeric')
  ],
  validateRequest,
  getServices,
  async (req: Request, res: Response) => {
    try {
      const { patterns } = req.body;
      
      logger.info('Updating sybil detection thresholds');
      
      // This would typically update the detection service configuration
      // For now, returning a success response
      
      res.status(200).json({
        success: true,
        message: 'Detection thresholds updated successfully',
        data: {
          updatedPatterns: patterns.length,
          timestamp: Date.now()
        }
      });
      
    } catch (error) {
      logger.error(`Error updating detection thresholds: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Failed to update detection thresholds',
        error: error.message
      });
    }
  }
);

export default router;
