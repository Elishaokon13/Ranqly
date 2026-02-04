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
    new winston.transports.File({ filename: 'logs/voting-routes.log' })
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

// GET /voting/sessions/:contestId - Get voting session for a contest
router.get('/sessions/:contestId', [
  param('contestId').isUUID()
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;
    
    const votingSession = await DatabaseService.getInstance().getVotingSession(contestId);
    if (!votingSession) {
      return res.status(404).json({
        success: false,
        error: 'Voting session not found'
      });
    }

    logger.info(`Retrieved voting session for contest ${contestId}`);
    
    res.json({
      success: true,
      data: votingSession
    });
  } catch (error) {
    logger.error(`Error getting voting session for contest ${req.params.contestId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve voting session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /voting/sessions - Create a new voting session
router.post('/sessions', [
  body('contest_id').isUUID().withMessage('Valid contest ID is required'),
  body('commit_duration').optional().isInt({ min: 3600, max: 604800 }).withMessage('Commit duration must be between 1 hour and 7 days'),
  body('reveal_duration').optional().isInt({ min: 3600, max: 1209600 }).withMessage('Reveal duration must be between 1 hour and 14 days')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { contest_id, commit_duration = 86400, reveal_duration = 172800 } = req.body;
    
    // Verify contest exists and is in correct state
    const contest = await DatabaseService.getInstance().getContest(contest_id);
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    if (contest.status !== 'submissions_open' && contest.status !== 'voting_open') {
      return res.status(400).json({
        success: false,
        error: 'Contest is not in the correct state for voting'
      });
    }

    // Check if voting session already exists
    const existingSession = await DatabaseService.getInstance().getVotingSession(contest_id);
    if (existingSession) {
      return res.status(400).json({
        success: false,
        error: 'Voting session already exists for this contest'
      });
    }

    // Calculate deadlines
    const now = Date.now();
    const commitEndTime = now + (commit_duration * 1000);
    const revealEndTime = commitEndTime + (reveal_duration * 1000);

    // Create voting session
    const votingSession = await DatabaseService.getInstance().createVotingSession({
      contestId: contest_id,
      commitEndTime,
      revealEndTime,
      phase: 'commit'
    });

    // Update contest status to voting_open
    await DatabaseService.getInstance().updateContest(contest_id, { status: 'voting_open' });

    // Log audit event
    await AuditService.getInstance().logEvent({
      entity_type: 'voting_session',
      entity_id: votingSession.id,
      action: 'created',
      actor_address: req.headers['x-user-address'] as string,
      details: {
        contest_id,
        commit_duration,
        reveal_duration
      }
    });

    logger.info(`Created voting session for contest ${contest_id}`);
    
    res.status(201).json({
      success: true,
      data: votingSession,
      message: 'Voting session created successfully'
    });
  } catch (error) {
    logger.error('Error creating voting session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create voting session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /voting/commit - Commit a vote
router.post('/commit', [
  body('voter_address').isEthereumAddress().withMessage('Invalid voter address'),
  body('contest_id').isUUID().withMessage('Valid contest ID is required'),
  body('submission_id').isUUID().withMessage('Valid submission ID is required'),
  body('vote_value').isIn([0, 1]).withMessage('Vote value must be 0 or 1'),
  body('salt').notEmpty().withMessage('Salt is required'),
  body('justification_hash').optional().isLength({ min: 64, max: 64 }).withMessage('Invalid justification hash')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const {
      voter_address,
      contest_id,
      submission_id,
      vote_value,
      salt,
      justification_hash = ''
    } = req.body;

    // Verify contest exists
    const contest = await DatabaseService.getInstance().getContest(contest_id);
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    // Verify submission exists and belongs to contest
    const submission = await DatabaseService.getInstance().getSubmission(submission_id);
    if (!submission || submission.contest_id !== contest_id) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found or does not belong to contest'
      });
    }

    // Get voting session
    const votingSession = await DatabaseService.getInstance().getVotingSession(contest_id);
    if (!votingSession) {
      return res.status(404).json({
        success: false,
        error: 'Voting session not found'
      });
    }

    if (votingSession.phase !== 'commit') {
      return res.status(400).json({
        success: false,
        error: 'Not in commit phase'
      });
    }

    // Check if commit phase has ended
    if (Date.now() > new Date(votingSession.commit_end_time).getTime()) {
      return res.status(400).json({
        success: false,
        error: 'Commit phase has ended'
      });
    }

    // Check if user has already committed for this submission
    const existingCommit = await DatabaseService.getInstance().getVoteCommit(
      voter_address, contest_id, submission_id
    );
    if (existingCommit) {
      return res.status(400).json({
        success: false,
        error: 'Already committed for this submission'
      });
    }

    // Verify voter has PoI NFT or sufficient voting power
    const poiInfo = await BlockchainService.getInstance().getPoINFTInfo(voter_address);
    if (!poiInfo.isValid || poiInfo.balance === 0) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient voting power - PoI NFT required'
      });
    }

    // Generate commit hash
    const crypto = require('crypto');
    const commitHash = crypto.createHash('sha256')
      .update(`${vote_value}:${salt}:${justification_hash}`)
      .digest('hex');

    // Store vote commit
    const voteCommit = await DatabaseService.getInstance().storeVoteCommit({
      voterAddress: voter_address,
      contestId: contest_id,
      submissionId: submission_id,
      commitHash
    });

    // Update voting session statistics
    const updatedSession = await DatabaseService.getInstance().updateVotingSession({
      ...votingSession,
      totalCommits: votingSession.total_commits + 1
    });

    // Log audit event
    await AuditService.getInstance().logEvent({
      entity_type: 'vote_commit',
      entity_id: voteCommit.id,
      action: 'created',
      actor_address: voter_address,
      details: {
        contest_id,
        submission_id,
        vote_value,
        commit_hash: commitHash.substring(0, 8) + '...'
      }
    });

    logger.info(`Vote committed by ${voter_address} for submission ${submission_id} in contest ${contest_id}`);
    
    res.status(201).json({
      success: true,
      data: {
        commit_hash: commitHash,
        phase: 'commit',
        commit_end_time: votingSession.commit_end_time
      },
      message: 'Vote committed successfully'
    });
  } catch (error) {
    logger.error('Error committing vote:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to commit vote',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /voting/reveal - Reveal a vote
router.post('/reveal', [
  body('voter_address').isEthereumAddress().withMessage('Invalid voter address'),
  body('contest_id').isUUID().withMessage('Valid contest ID is required'),
  body('submission_id').isUUID().withMessage('Valid submission ID is required'),
  body('vote_value').isIn([0, 1]).withMessage('Vote value must be 0 or 1'),
  body('salt').notEmpty().withMessage('Salt is required'),
  body('justification_hash').optional().isLength({ min: 64, max: 64 }).withMessage('Invalid justification hash')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const {
      voter_address,
      contest_id,
      submission_id,
      vote_value,
      salt,
      justification_hash = ''
    } = req.body;

    // Get voting session
    const votingSession = await DatabaseService.getInstance().getVotingSession(contest_id);
    if (!votingSession) {
      return res.status(404).json({
        success: false,
        error: 'Voting session not found'
      });
    }

    if (votingSession.phase !== 'reveal') {
      return res.status(400).json({
        success: false,
        error: 'Not in reveal phase'
      });
    }

    // Check if reveal phase has ended
    if (Date.now() > new Date(votingSession.reveal_end_time).getTime()) {
      return res.status(400).json({
        success: false,
        error: 'Reveal phase has ended'
      });
    }

    // Get the original commit
    const voteCommit = await DatabaseService.getInstance().getVoteCommit(
      voter_address, contest_id, submission_id
    );
    if (!voteCommit) {
      return res.status(404).json({
        success: false,
        error: 'No commit found for this vote'
      });
    }

    // Verify the reveal matches the commit
    const crypto = require('crypto');
    const expectedCommitHash = crypto.createHash('sha256')
      .update(`${vote_value}:${salt}:${justification_hash}`)
      .digest('hex');

    if (voteCommit.commit_hash !== expectedCommitHash) {
      return res.status(400).json({
        success: false,
        error: 'Reveal does not match commit'
      });
    }

    // Check if already revealed
    const existingReveal = await DatabaseService.getInstance().getVoteReveal(
      voter_address, contest_id, submission_id
    );
    if (existingReveal) {
      return res.status(400).json({
        success: false,
        error: 'Vote already revealed'
      });
    }

    // Store vote reveal
    const voteReveal = await DatabaseService.getInstance().storeVoteReveal({
      voterAddress: voter_address,
      contestId: contest_id,
      submissionId: submission_id,
      voteValue: vote_value,
      salt,
      justificationHash: justification_hash
    });

    // Update voting session statistics
    const updatedSession = await DatabaseService.getInstance().updateVotingSession({
      ...votingSession,
      totalReveals: votingSession.total_reveals + 1
    });

    // Log audit event
    await AuditService.getInstance().logEvent({
      entity_type: 'vote_reveal',
      entity_id: voteReveal.id,
      action: 'created',
      actor_address: voter_address,
      details: {
        contest_id,
        submission_id,
        vote_value
      }
    });

    logger.info(`Vote revealed by ${voter_address} for submission ${submission_id} in contest ${contest_id}`);
    
    res.status(201).json({
      success: true,
      data: voteReveal,
      message: 'Vote revealed successfully'
    });
  } catch (error) {
    logger.error('Error revealing vote:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reveal vote',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /voting/results/:contestId - Get voting results for a contest
router.get('/results/:contestId', [
  param('contestId').isUUID()
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;
    
    // Get voting session
    const votingSession = await DatabaseService.getInstance().getVotingSession(contestId);
    if (!votingSession) {
      return res.status(404).json({
        success: false,
        error: 'Voting session not found'
      });
    }

    // Get all submissions for the contest
    const submissions = await DatabaseService.getInstance().getContestSubmissions(contestId);
    
    // Calculate voting results for each submission
    const results = await Promise.all(
      submissions.map(async (submission) => {
        // Get vote reveals for this submission
        const upvotesResult = await DatabaseService.getInstance().query(
          'SELECT COUNT(*) as count FROM vote_reveals WHERE contest_id = $1 AND submission_id = $2 AND vote_value = 1',
          [contestId, submission.id]
        );
        
        const downvotesResult = await DatabaseService.getInstance().query(
          'SELECT COUNT(*) as count FROM vote_reveals WHERE contest_id = $1 AND submission_id = $2 AND vote_value = 0',
          [contestId, submission.id]
        );

        const upvotes = parseInt(upvotesResult.rows[0].count);
        const downvotes = parseInt(downvotesResult.rows[0].count);
        const totalVotes = upvotes + downvotes;
        const netScore = upvotes - downvotes;

        return {
          submission_id: submission.id,
          submission_title: submission.title,
          submitter_address: submission.submitter_address,
          upvotes,
          downvotes,
          total_votes: totalVotes,
          net_score: netScore,
          final_score: submission.final_score || 0
        };
      })
    );

    // Sort by net score
    results.sort((a, b) => b.net_score - a.net_score);

    logger.info(`Retrieved voting results for contest ${contestId}`);
    
    res.json({
      success: true,
      data: {
        contest_id: contestId,
        voting_session: votingSession,
        results,
        total_submissions: submissions.length,
        total_votes: results.reduce((sum, result) => sum + result.total_votes, 0)
      }
    });
  } catch (error) {
    logger.error(`Error getting voting results for contest ${req.params.contestId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve voting results',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /voting/votes/:contestId - Get votes for a contest (for transparency)
router.get('/votes/:contestId', [
  param('contestId').isUUID(),
  query('submission_id').optional().isUUID(),
  query('voter_address').optional().isEthereumAddress(),
  query('phase').optional().isIn(['commit', 'reveal'])
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;
    const { submission_id, voter_address, phase = 'reveal' } = req.query;
    
    let query = `
      SELECT vr.*, s.title as submission_title, s.submitter_address
      FROM vote_reveals vr
      JOIN submissions s ON vr.submission_id = s.id
      WHERE vr.contest_id = $1
    `;
    const params: any[] = [contestId];
    let paramCount = 2;

    if (submission_id) {
      query += ` AND vr.submission_id = $${paramCount++}`;
      params.push(submission_id);
    }

    if (voter_address) {
      query += ` AND vr.voter_address = $${paramCount++}`;
      params.push(voter_address);
    }

    query += ' ORDER BY vr.timestamp DESC';

    const result = await DatabaseService.getInstance().query(query, params);

    logger.info(`Retrieved ${result.rows.length} votes for contest ${contestId}`);
    
    res.json({
      success: true,
      data: result.rows,
      contest_id: contestId
    });
  } catch (error) {
    logger.error(`Error getting votes for contest ${req.params.contestId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve votes',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;