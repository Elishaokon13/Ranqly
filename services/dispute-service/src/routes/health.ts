/**
 * Health check routes for Dispute Service
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { RedisService } from '../services/RedisService';
import { TriageService } from '../services/TriageService';
import { DisputeResolver } from '../services/DisputeResolver';
import { NotificationService } from '../services/NotificationService';
import { asyncHandler } from '../middleware/errorHandler';

export function healthRoutes(
  databaseService: DatabaseService,
  redisService: RedisService,
  triageService: TriageService,
  disputeResolver: DisputeResolver,
  notificationService: NotificationService
): Router {
  const router = Router();

  // Basic health check
  router.get('/', asyncHandler(async (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'Dispute Service',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }));

  // Detailed health check
  router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
    const [dbHealth, redisHealth] = await Promise.all([
      databaseService.healthCheck(),
      redisService.healthCheck()
    ]);
    
    const triageHealth = triageService.healthCheck();
    const resolverHealth = disputeResolver.healthCheck();
    const notificationHealth = notificationService.healthCheck();
    
    const allHealthy = dbHealth && redisHealth && 
                      triageHealth.status === 'healthy' && 
                      resolverHealth.status === 'healthy' && 
                      notificationHealth.status === 'healthy';
    
    const status = allHealthy ? 'healthy' : 'degraded';
    
    res.status(allHealthy ? 200 : 503).json({
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      services: {
        database: dbHealth,
        redis: redisHealth,
        triage: triageHealth.status === 'healthy',
        resolver: resolverHealth.status === 'healthy',
        notification: notificationHealth.status === 'healthy'
      },
      dependencies: triageHealth.dependencies
    });
  }));

  // Service-specific health checks
  router.get('/database', asyncHandler(async (req: Request, res: Response) => {
    const isHealthy = await databaseService.healthCheck();
    res.status(isHealthy ? 200 : 503).json({
      service: 'database',
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString()
    });
  }));

  router.get('/redis', asyncHandler(async (req: Request, res: Response) => {
    const isHealthy = await redisService.healthCheck();
    res.status(isHealthy ? 200 : 503).json({
      service: 'redis',
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString()
    });
  }));

  router.get('/triage', asyncHandler(async (req: Request, res: Response) => {
    const health = triageService.healthCheck();
    res.status(health.status === 'healthy' ? 200 : 503).json({
      service: 'triage',
      ...health,
      timestamp: new Date().toISOString()
    });
  }));

  router.get('/resolver', asyncHandler(async (req: Request, res: Response) => {
    const health = disputeResolver.healthCheck();
    res.status(health.status === 'healthy' ? 200 : 503).json({
      service: 'resolver',
      ...health,
      timestamp: new Date().toISOString()
    });
  }));

  return router;
}
