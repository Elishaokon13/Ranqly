import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
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
    new winston.transports.File({ filename: 'logs/analytics-routes.log' })
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

// GET /analytics/overview - Get platform overview statistics
router.get('/overview', async (req: Request, res: Response) => {
  try {
    // Get basic counts
    const contestsCount = await DatabaseService.getInstance().query('SELECT COUNT(*) as count FROM contests');
    const submissionsCount = await DatabaseService.getInstance().query('SELECT COUNT(*) as count FROM submissions');
    const usersCount = await DatabaseService.getInstance().query('SELECT COUNT(*) as count FROM users');
    const votesCount = await DatabaseService.getInstance().query('SELECT COUNT(*) as count FROM vote_reveals');

    // Get active contests
    const activeContests = await DatabaseService.getInstance().query(`
      SELECT COUNT(*) as count FROM contests 
      WHERE status IN ('announced', 'submissions_open', 'voting_open', 'judging')
    `);

    // Get completed contests
    const completedContests = await DatabaseService.getInstance().query(`
      SELECT COUNT(*) as count FROM contests WHERE status = 'completed'
    `);

    // Get total rewards distributed (mock data for now)
    const totalRewards = await DatabaseService.getInstance().query(`
      SELECT SUM(reward_amount) as total FROM contests WHERE status = 'completed'
    `);

    // Get recent activity (last 24 hours)
    const recentActivity = await DatabaseService.getInstance().query(`
      SELECT 
        COUNT(CASE WHEN entity_type = 'contest' THEN 1 END) as new_contests,
        COUNT(CASE WHEN entity_type = 'submission' THEN 1 END) as new_submissions,
        COUNT(CASE WHEN entity_type = 'vote' THEN 1 END) as new_votes,
        COUNT(CASE WHEN entity_type = 'user' THEN 1 END) as new_users
      FROM audit_logs 
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
    `);

    const overview = {
      total_contests: parseInt(contestsCount.rows[0].count),
      active_contests: parseInt(activeContests.rows[0].count),
      completed_contests: parseInt(completedContests.rows[0].count),
      total_submissions: parseInt(submissionsCount.rows[0].count),
      total_users: parseInt(usersCount.rows[0].count),
      total_votes: parseInt(votesCount.rows[0].count),
      total_rewards: parseFloat(totalRewards.rows[0].total || '0'),
      recent_activity: recentActivity.rows[0]
    };

    logger.info('Retrieved platform overview statistics');
    
    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    logger.error('Error getting platform overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve platform overview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /analytics/contests - Get contest analytics
router.get('/contests', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']),
  query('status').optional().isIn(['announced', 'submissions_open', 'voting_open', 'judging', 'completed', 'cancelled'])
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { period = '30d', status } = req.query;
    
    // Calculate date range
    const periods = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    const days = periods[period as keyof typeof periods];
    
    let whereClause = `WHERE created_at >= NOW() - INTERVAL '${days} days'`;
    if (status) {
      whereClause += ` AND status = '${status}'`;
    }

    // Get contest statistics
    const contestStats = await DatabaseService.getInstance().query(`
      SELECT 
        status,
        COUNT(*) as count,
        AVG(reward_amount) as avg_reward,
        SUM(reward_amount) as total_rewards
      FROM contests 
      ${whereClause}
      GROUP BY status
      ORDER BY count DESC
    `);

    // Get contest creation timeline
    const timelineQuery = `
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as contests_created
      FROM contests 
      ${whereClause}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date DESC
    `;
    const timeline = await DatabaseService.getInstance().query(timelineQuery);

    // Get top organizers
    const topOrganizers = await DatabaseService.getInstance().query(`
      SELECT 
        organizer_address,
        COUNT(*) as contest_count,
        SUM(reward_amount) as total_rewards,
        AVG(reward_amount) as avg_reward
      FROM contests 
      ${whereClause}
      GROUP BY organizer_address
      ORDER BY contest_count DESC
      LIMIT 10
    `);

    logger.info(`Retrieved contest analytics for period: ${period}`);
    
    res.json({
      success: true,
      data: {
        period,
        status_breakdown: contestStats.rows,
        timeline: timeline.rows,
        top_organizers: topOrganizers.rows
      }
    });
  } catch (error) {
    logger.error('Error getting contest analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve contest analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /analytics/submissions - Get submission analytics
router.get('/submissions', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']),
  query('contest_id').optional().isUUID()
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { period = '30d', contest_id } = req.query;
    
    const periods = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    const days = periods[period as keyof typeof periods];
    
    let whereClause = `WHERE s.created_at >= NOW() - INTERVAL '${days} days'`;
    if (contest_id) {
      whereClause += ` AND s.contest_id = '${contest_id}'`;
    }

    // Get submission statistics
    const submissionStats = await DatabaseService.getInstance().query(`
      SELECT 
        s.status,
        s.content_type,
        COUNT(*) as count,
        AVG(s.algorithmic_score) as avg_algorithmic_score,
        AVG(s.community_score) as avg_community_score,
        AVG(s.judge_score) as avg_judge_score,
        AVG(s.final_score) as avg_final_score
      FROM submissions s
      ${whereClause}
      GROUP BY s.status, s.content_type
      ORDER BY count DESC
    `);

    // Get submission timeline
    const timelineQuery = `
      SELECT 
        DATE_TRUNC('day', s.created_at) as date,
        COUNT(*) as submissions_created,
        COUNT(DISTINCT s.submitter_address) as unique_submitters
      FROM submissions s
      ${whereClause}
      GROUP BY DATE_TRUNC('day', s.created_at)
      ORDER BY date DESC
    `;
    const timeline = await DatabaseService.getInstance().query(timelineQuery);

    // Get top submitters
    const topSubmitters = await DatabaseService.getInstance().query(`
      SELECT 
        s.submitter_address,
        COUNT(*) as submission_count,
        AVG(s.final_score) as avg_score,
        MAX(s.final_score) as best_score
      FROM submissions s
      ${whereClause}
      GROUP BY s.submitter_address
      ORDER BY submission_count DESC, avg_score DESC
      LIMIT 10
    `);

    // Get score distribution
    const scoreDistribution = await DatabaseService.getInstance().query(`
      SELECT 
        CASE 
          WHEN final_score >= 90 THEN '90-100'
          WHEN final_score >= 80 THEN '80-89'
          WHEN final_score >= 70 THEN '70-79'
          WHEN final_score >= 60 THEN '60-69'
          ELSE 'Below 60'
        END as score_range,
        COUNT(*) as count
      FROM submissions s
      ${whereClause}
      WHERE final_score IS NOT NULL
      GROUP BY score_range
      ORDER BY score_range DESC
    `);

    logger.info(`Retrieved submission analytics for period: ${period}`);
    
    res.json({
      success: true,
      data: {
        period,
        contest_id: contest_id || null,
        status_breakdown: submissionStats.rows,
        timeline: timeline.rows,
        top_submitters: topSubmitters.rows,
        score_distribution: scoreDistribution.rows
      }
    });
  } catch (error) {
    logger.error('Error getting submission analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve submission analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /analytics/voting - Get voting analytics
router.get('/voting', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']),
  query('contest_id').optional().isUUID()
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { period = '30d', contest_id } = req.query;
    
    const periods = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    const days = periods[period as keyof typeof periods];
    
    let whereClause = `WHERE vr.timestamp >= NOW() - INTERVAL '${days} days'`;
    if (contest_id) {
      whereClause += ` AND vr.contest_id = '${contest_id}'`;
    }

    // Get voting statistics
    const votingStats = await DatabaseService.getInstance().query(`
      SELECT 
        vr.vote_value,
        COUNT(*) as count,
        COUNT(DISTINCT vr.voter_address) as unique_voters,
        COUNT(DISTINCT vr.contest_id) as contests_voted_on
      FROM vote_reveals vr
      ${whereClause}
      GROUP BY vr.vote_value
    `);

    // Get voting timeline
    const timelineQuery = `
      SELECT 
        DATE_TRUNC('day', vr.timestamp) as date,
        COUNT(*) as votes_cast,
        COUNT(DISTINCT vr.voter_address) as unique_voters,
        COUNT(DISTINCT vr.contest_id) as active_contests
      FROM vote_reveals vr
      ${whereClause}
      GROUP BY DATE_TRUNC('day', vr.timestamp)
      ORDER BY date DESC
    `;
    const timeline = await DatabaseService.getInstance().query(timelineQuery);

    // Get top voters
    const topVoters = await DatabaseService.getInstance().query(`
      SELECT 
        vr.voter_address,
        COUNT(*) as vote_count,
        COUNT(CASE WHEN vr.vote_value = 1 THEN 1 END) as upvotes,
        COUNT(CASE WHEN vr.vote_value = 0 THEN 1 END) as downvotes,
        COUNT(DISTINCT vr.contest_id) as contests_participated
      FROM vote_reveals vr
      ${whereClause}
      GROUP BY vr.voter_address
      ORDER BY vote_count DESC
      LIMIT 10
    `);

    // Get voting participation by contest
    const contestParticipation = await DatabaseService.getInstance().query(`
      SELECT 
        c.title as contest_title,
        vr.contest_id,
        COUNT(DISTINCT vr.voter_address) as unique_voters,
        COUNT(*) as total_votes,
        COUNT(DISTINCT vr.submission_id) as submissions_voted_on
      FROM vote_reveals vr
      JOIN contests c ON vr.contest_id = c.id
      ${whereClause}
      GROUP BY c.title, vr.contest_id
      ORDER BY unique_voters DESC
      LIMIT 10
    `);

    logger.info(`Retrieved voting analytics for period: ${period}`);
    
    res.json({
      success: true,
      data: {
        period,
        contest_id: contest_id || null,
        vote_breakdown: votingStats.rows,
        timeline: timeline.rows,
        top_voters: topVoters.rows,
        contest_participation: contestParticipation.rows
      }
    });
  } catch (error) {
    logger.error('Error getting voting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve voting analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /analytics/users - Get user analytics
router.get('/users', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y'])
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query;
    
    const periods = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    const days = periods[period as keyof typeof periods];

    // Get user registration timeline
    const registrationTimeline = await DatabaseService.getInstance().query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as users_registered
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date DESC
    `);

    // Get user activity breakdown
    const userActivity = await DatabaseService.getInstance().query(`
      SELECT 
        'Contest Creators' as activity_type,
        COUNT(DISTINCT organizer_address) as count
      FROM contests 
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      
      UNION ALL
      
      SELECT 
        'Submitters' as activity_type,
        COUNT(DISTINCT submitter_address) as count
      FROM submissions 
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      
      UNION ALL
      
      SELECT 
        'Voters' as activity_type,
        COUNT(DISTINCT voter_address) as count
      FROM vote_reveals 
      WHERE timestamp >= NOW() - INTERVAL '${days} days'
    `);

    // Get user engagement metrics
    const engagementMetrics = await DatabaseService.getInstance().query(`
      SELECT 
        COUNT(DISTINCT u.wallet_address) as total_users,
        COUNT(DISTINCT CASE WHEN c.organizer_address IS NOT NULL THEN u.wallet_address END) as contest_creators,
        COUNT(DISTINCT CASE WHEN s.submitter_address IS NOT NULL THEN u.wallet_address END) as submitters,
        COUNT(DISTINCT CASE WHEN vr.voter_address IS NOT NULL THEN u.wallet_address END) as voters
      FROM users u
      LEFT JOIN contests c ON u.wallet_address = c.organizer_address
      LEFT JOIN submissions s ON u.wallet_address = s.submitter_address
      LEFT JOIN vote_reveals vr ON u.wallet_address = vr.voter_address
    `);

    // Get most active users
    const mostActiveUsers = await DatabaseService.getInstance().query(`
      SELECT 
        u.wallet_address,
        u.username,
        COUNT(DISTINCT c.id) as contests_created,
        COUNT(DISTINCT s.id) as submissions_made,
        COUNT(DISTINCT vr.id) as votes_cast,
        (COUNT(DISTINCT c.id) + COUNT(DISTINCT s.id) + COUNT(DISTINCT vr.id)) as total_activity
      FROM users u
      LEFT JOIN contests c ON u.wallet_address = c.organizer_address
      LEFT JOIN submissions s ON u.wallet_address = s.submitter_address
      LEFT JOIN vote_reveals vr ON u.wallet_address = vr.voter_address
      GROUP BY u.wallet_address, u.username
      HAVING (COUNT(DISTINCT c.id) + COUNT(DISTINCT s.id) + COUNT(DISTINCT vr.id)) > 0
      ORDER BY total_activity DESC
      LIMIT 10
    `);

    logger.info(`Retrieved user analytics for period: ${period}`);
    
    res.json({
      success: true,
      data: {
        period,
        registration_timeline: registrationTimeline.rows,
        activity_breakdown: userActivity.rows,
        engagement_metrics: engagementMetrics.rows[0],
        most_active_users: mostActiveUsers.rows
      }
    });
  } catch (error) {
    logger.error('Error getting user analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /analytics/leaderboard - Get platform leaderboard
router.get('/leaderboard', [
  query('type').optional().isIn(['contests', 'submissions', 'voting', 'overall']),
  query('period').optional().isIn(['7d', '30d', '90d', '1y', 'all'])
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { type = 'overall', period = 'all' } = req.query;
    
    const periods = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
      'all': null
    };
    const days = periods[period as keyof typeof periods];
    
    let dateFilter = '';
    if (days) {
      dateFilter = `AND created_at >= NOW() - INTERVAL '${days} days'`;
    }

    let leaderboardQuery = '';
    
    switch (type) {
      case 'contests':
        leaderboardQuery = `
          SELECT 
            organizer_address as user_address,
            COUNT(*) as score,
            SUM(reward_amount) as total_rewards,
            AVG(reward_amount) as avg_reward
          FROM contests 
          WHERE 1=1 ${dateFilter.replace('created_at', 'created_at')}
          GROUP BY organizer_address
          ORDER BY score DESC, total_rewards DESC
          LIMIT 20
        `;
        break;
        
      case 'submissions':
        leaderboardQuery = `
          SELECT 
            s.submitter_address as user_address,
            COUNT(*) as score,
            AVG(s.final_score) as avg_score,
            MAX(s.final_score) as best_score
          FROM submissions s
          WHERE 1=1 ${dateFilter}
          GROUP BY s.submitter_address
          ORDER BY score DESC, avg_score DESC
          LIMIT 20
        `;
        break;
        
      case 'voting':
        leaderboardQuery = `
          SELECT 
            vr.voter_address as user_address,
            COUNT(*) as score,
            COUNT(CASE WHEN vr.vote_value = 1 THEN 1 END) as upvotes,
            COUNT(CASE WHEN vr.vote_value = 0 THEN 1 END) as downvotes,
            COUNT(DISTINCT vr.contest_id) as contests_participated
          FROM vote_reveals vr
          WHERE 1=1 ${dateFilter.replace('created_at', 'timestamp')}
          GROUP BY vr.voter_address
          ORDER BY score DESC, contests_participated DESC
          LIMIT 20
        `;
        break;
        
      default: // overall
        leaderboardQuery = `
          SELECT 
            u.wallet_address as user_address,
            u.username,
            COALESCE(contest_score, 0) + COALESCE(submission_score, 0) + COALESCE(voting_score, 0) as total_score,
            COALESCE(contest_score, 0) as contests_created,
            COALESCE(submission_score, 0) as submissions_made,
            COALESCE(voting_score, 0) as votes_cast
          FROM users u
          LEFT JOIN (
            SELECT organizer_address, COUNT(*) * 3 as contest_score
            FROM contests 
            WHERE 1=1 ${dateFilter.replace('created_at', 'created_at')}
            GROUP BY organizer_address
          ) c ON u.wallet_address = c.organizer_address
          LEFT JOIN (
            SELECT submitter_address, COUNT(*) * 2 as submission_score
            FROM submissions 
            WHERE 1=1 ${dateFilter}
            GROUP BY submitter_address
          ) s ON u.wallet_address = s.submitter_address
          LEFT JOIN (
            SELECT voter_address, COUNT(*) as voting_score
            FROM vote_reveals 
            WHERE 1=1 ${dateFilter.replace('created_at', 'timestamp')}
            GROUP BY voter_address
          ) v ON u.wallet_address = v.voter_address
          WHERE COALESCE(contest_score, 0) + COALESCE(submission_score, 0) + COALESCE(voting_score, 0) > 0
          ORDER BY total_score DESC
          LIMIT 20
        `;
    }

    const leaderboard = await DatabaseService.getInstance().query(leaderboardQuery);

    logger.info(`Retrieved ${type} leaderboard for period: ${period}`);
    
    res.json({
      success: true,
      data: {
        type,
        period,
        leaderboard: leaderboard.rows
      }
    });
  } catch (error) {
    logger.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve leaderboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;