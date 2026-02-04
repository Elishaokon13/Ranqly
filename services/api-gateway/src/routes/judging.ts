import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { DatabaseService } from '../services/database';
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
    new winston.transports.File({ filename: 'logs/judging-routes.log' })
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

// GET /judging/assignments - Get judge assignments
router.get('/assignments', [
  query('judge_address').optional().isEthereumAddress(),
  query('contest_id').optional().isUUID(),
  query('status').optional().isIn(['assigned', 'in_progress', 'completed']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { judge_address, contest_id, status, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT ja.*, c.title as contest_title, c.status as contest_status,
             ARRAY_LENGTH(ja.submission_ids, 1) as submission_count
      FROM judge_assignments ja
      JOIN contests c ON ja.contest_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (judge_address) {
      query += ` AND ja.judge_address = $${paramCount++}`;
      params.push(judge_address);
    }

    if (contest_id) {
      query += ` AND ja.contest_id = $${paramCount++}`;
      params.push(contest_id);
    }

    if (status) {
      query += ` AND ja.status = $${paramCount++}`;
      params.push(status);
    }

    query += ' ORDER BY ja.created_at DESC';
    
    if (limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(parseInt(limit as string));
    }

    if (offset) {
      query += ` OFFSET $${paramCount++}`;
      params.push(parseInt(offset as string));
    }

    const result = await DatabaseService.getInstance().query(query, params);
    
    logger.info(`Retrieved ${result.rows.length} judge assignments`);
    
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
    logger.error('Error getting judge assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve judge assignments',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /judging/assign - Assign judges to contest submissions
router.post('/assign', [
  body('contest_id').isUUID().withMessage('Valid contest ID is required'),
  body('judge_addresses').isArray({ min: 1 }).withMessage('At least one judge address is required'),
  body('judge_addresses.*').isEthereumAddress().withMessage('Invalid judge address'),
  body('submissions_per_judge').optional().isInt({ min: 1, max: 10 }).withMessage('Invalid submissions per judge'),
  body('is_anonymous').optional().isBoolean()
], validateRequest, async (req: Request, res: Response) => {
  try {
    const {
      contest_id,
      judge_addresses,
      submissions_per_judge = 3,
      is_anonymous = true
    } = req.body;

    // Verify contest exists and is in judging phase
    const contest = await DatabaseService.getInstance().getContest(contest_id);
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    if (contest.status !== 'judging' && contest.status !== 'voting_open') {
      return res.status(400).json({
        success: false,
        error: 'Contest is not in judging phase'
      });
    }

    // Get all submissions for the contest
    const submissions = await DatabaseService.getInstance().getContestSubmissions(contest_id);
    if (submissions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No submissions found for contest'
      });
    }

    // Distribute submissions among judges
    const assignments = [];
    const submissionsPerJudge = Math.min(submissions_per_judge, Math.ceil(submissions.length / judge_addresses.length));

    for (let i = 0; i < judge_addresses.length; i++) {
      const startIndex = i * submissionsPerJudge;
      const endIndex = Math.min(startIndex + submissionsPerJudge, submissions.length);
      const assignedSubmissions = submissions.slice(startIndex, endIndex).map(sub => sub.id);

      if (assignedSubmissions.length > 0) {
        // Check if judge already has an assignment for this contest
        const existingAssignment = await DatabaseService.getInstance().query(
          'SELECT id FROM judge_assignments WHERE contest_id = $1 AND judge_address = $2',
          [contest_id, judge_addresses[i]]
        );

        if (existingAssignment.rows.length === 0) {
          const assignment = await DatabaseService.getInstance().query(`
            INSERT INTO judge_assignments (contest_id, judge_address, submission_ids, is_anonymous, status)
            VALUES ($1, $2, $3, $4, 'assigned')
            RETURNING *
          `, [contest_id, judge_addresses[i], assignedSubmissions, is_anonymous]);

          assignments.push(assignment.rows[0]);
        }
      }
    }

    // Log audit event
    await AuditService.getInstance().logEvent({
      entity_type: 'judge_assignment',
      entity_id: contest_id,
      action: 'assigned',
      actor_address: req.headers['x-user-address'] as string,
      details: {
        contest_id,
        judge_count: judge_addresses.length,
        submission_count: submissions.length,
        assignments_created: assignments.length
      }
    });

    logger.info(`Assigned ${assignments.length} judges to contest ${contest_id}`);
    
    res.status(201).json({
      success: true,
      data: {
        contest_id,
        assignments,
        total_judges: judge_addresses.length,
        total_submissions: submissions.length,
        assignments_created: assignments.length
      },
      message: 'Judges assigned successfully'
    });
  } catch (error) {
    logger.error('Error assigning judges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign judges',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /judging/score - Submit judge score
router.post('/score', [
  body('judge_assignment_id').isUUID().withMessage('Valid judge assignment ID is required'),
  body('submission_id').isUUID().withMessage('Valid submission ID is required'),
  body('score').isFloat({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('justification').optional().isLength({ min: 10, max: 1000 }).withMessage('Justification must be between 10 and 1000 characters'),
  body('judge_address').isEthereumAddress().withMessage('Invalid judge address')
], validateRequest, async (req: Request, res: Response) => {
  try {
    const {
      judge_assignment_id,
      submission_id,
      score,
      justification,
      judge_address
    } = req.body;

    // Verify judge assignment exists and belongs to judge
    const assignment = await DatabaseService.getInstance().query(
      'SELECT * FROM judge_assignments WHERE id = $1 AND judge_address = $2',
      [judge_assignment_id, judge_address]
    );

    if (assignment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Judge assignment not found or not authorized'
      });
    }

    // Verify submission is assigned to this judge
    const submissionAssigned = assignment.rows[0].submission_ids.includes(submission_id);
    if (!submissionAssigned) {
      return res.status(400).json({
        success: false,
        error: 'Submission not assigned to this judge'
      });
    }

    // Check if score already exists
    const existingScore = await DatabaseService.getInstance().query(
      'SELECT id FROM judge_scores WHERE judge_assignment_id = $1 AND submission_id = $2',
      [judge_assignment_id, submission_id]
    );

    if (existingScore.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Score already submitted for this submission'
      });
    }

    // Submit score
    const scoreResult = await DatabaseService.getInstance().query(`
      INSERT INTO judge_scores (judge_assignment_id, submission_id, score, justification)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [judge_assignment_id, submission_id, score, justification]);

    const judgeScore = scoreResult.rows[0];

    // Update submission with judge score
    await DatabaseService.getInstance().updateSubmission(submission_id, {
      judge_score: score
    });

    // Log audit event
    await AuditService.getInstance().logEvent({
      entity_type: 'judge_score',
      entity_id: judgeScore.id,
      action: 'submitted',
      actor_address: judge_address,
      details: {
        submission_id,
        score,
        justification: justification ? justification.substring(0, 100) + '...' : null
      }
    });

    logger.info(`Judge score submitted: ${score} for submission ${submission_id} by judge ${judge_address}`);
    
    res.status(201).json({
      success: true,
      data: judgeScore,
      message: 'Judge score submitted successfully'
    });
  } catch (error) {
    logger.error('Error submitting judge score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit judge score',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /judging/scores/:contestId - Get all judge scores for a contest
router.get('/scores/:contestId', [
  param('contestId').isUUID()
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;
    
    // Get all judge scores for the contest
    const scoresQuery = `
      SELECT js.*, s.title as submission_title, s.submitter_address,
             ja.judge_address, ja.is_anonymous,
             CASE 
               WHEN ja.is_anonymous THEN 'Anonymous Judge'
               ELSE SUBSTRING(ja.judge_address, 1, 6) || '...' || SUBSTRING(ja.judge_address, -4)
             END as judge_display
      FROM judge_scores js
      JOIN submissions s ON js.submission_id = s.id
      JOIN judge_assignments ja ON js.judge_assignment_id = ja.id
      WHERE s.contest_id = $1
      ORDER BY js.timestamp DESC
    `;

    const scoresResult = await DatabaseService.getInstance().query(scoresQuery, [contestId]);

    // Calculate average scores for each submission
    const avgScoresQuery = `
      SELECT s.id, s.title, s.submitter_address, 
             AVG(js.score) as average_score,
             COUNT(js.score) as judge_count,
             MIN(js.score) as min_score,
             MAX(js.score) as max_score
      FROM submissions s
      LEFT JOIN judge_scores js ON s.id = js.submission_id
      WHERE s.contest_id = $1
      GROUP BY s.id, s.title, s.submitter_address
      ORDER BY average_score DESC NULLS LAST
    `;

    const avgScoresResult = await DatabaseService.getInstance().query(avgScoresQuery, [contestId]);

    logger.info(`Retrieved judge scores for contest ${contestId}`);
    
    res.json({
      success: true,
      data: {
        individual_scores: scoresResult.rows,
        average_scores: avgScoresResult.rows,
        contest_id: contestId
      }
    });
  } catch (error) {
    logger.error(`Error getting judge scores for contest ${req.params.contestId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve judge scores',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /judging/assignments/:assignmentId/submissions - Get submissions for a judge assignment
router.get('/assignments/:assignmentId/submissions', [
  param('assignmentId').isUUID(),
  query('judge_address').optional().isEthereumAddress()
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { judge_address } = req.query;
    
    // Get assignment details
    const assignmentQuery = `
      SELECT ja.*, c.title as contest_title, c.status as contest_status
      FROM judge_assignments ja
      JOIN contests c ON ja.contest_id = c.id
      WHERE ja.id = $1
    `;
    const assignmentResult = await DatabaseService.getInstance().query(assignmentQuery, [assignmentId]);

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Judge assignment not found'
      });
    }

    const assignment = assignmentResult.rows[0];

    // Verify judge access if judge_address is provided
    if (judge_address && assignment.judge_address !== judge_address) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this assignment'
      });
    }

    // Get submissions with scores
    const submissionsQuery = `
      SELECT s.*, js.score as judge_score, js.justification, js.timestamp as score_timestamp
      FROM submissions s
      LEFT JOIN judge_scores js ON s.id = js.submission_id AND js.judge_assignment_id = $1
      WHERE s.id = ANY($2)
      ORDER BY s.created_at DESC
    `;
    const submissionsResult = await DatabaseService.getInstance().query(
      submissionsQuery, 
      [assignmentId, assignment.submission_ids]
    );

    logger.info(`Retrieved submissions for judge assignment ${assignmentId}`);
    
    res.json({
      success: true,
      data: {
        assignment: {
          ...assignment,
          judge_display: assignment.is_anonymous ? 'Anonymous Judge' : 
                        assignment.judge_address.substring(0, 6) + '...' + assignment.judge_address.substring(-4)
        },
        submissions: submissionsResult.rows,
        total_submissions: submissionsResult.rows.length,
        scored_submissions: submissionsResult.rows.filter(s => s.judge_score !== null).length
      }
    });
  } catch (error) {
    logger.error(`Error getting submissions for judge assignment ${req.params.assignmentId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve submissions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;