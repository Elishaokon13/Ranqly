/**
 * Health check routes for Algorithm Engine
 * Provides health status and diagnostics
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { RedisService } from '../services/RedisService';
import { NLPService } from '../services/NLPService';
import { ScoringService } from '../services/ScoringService';
import { QueueService } from '../services/QueueService';
import { asyncHandler } from '../middleware/errorHandler';
import { HealthCheckResult } from '../types';

export function healthRoutes(
  databaseService: DatabaseService,
  redisService: RedisService,
  nlpService: NLPService,
  scoringService: ScoringService,
  queueService: QueueService
): Router {
  const router = Router();

  // Basic health check
  router.get('/', asyncHandler(async (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'Algorithm Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }));

  // Detailed health check
  router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    // Check all dependencies
    const [dbHealth, redisHealth, nlpHealth, scoringHealth, queueHealth] = await Promise.all([
      databaseService.healthCheck(),
      redisService.healthCheck(),
      Promise.resolve(nlpService.healthCheck()),
      Promise.resolve(scoringService.healthCheck()),
      queueService.healthCheck()
    ]);
    
    const responseTime = Date.now() - startTime;
    
    // Determine overall status
    const allHealthy = dbHealth && redisHealth && nlpHealth.status === 'healthy' && scoringHealth.status === 'healthy' && queueHealth;
    const anyUnhealthy = !dbHealth || !redisHealth || !queueHealth;
    
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (anyUnhealthy) {
      status = 'unhealthy';
    } else if (!nlpHealth.modelsLoaded || scoringHealth.status !== 'healthy') {
      status = 'degraded';
    }
    
    const healthResult: HealthCheckResult = {
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      services: {
        nlpService: nlpHealth.status === 'healthy',
        scoringService: scoringHealth.status === 'healthy',
        databaseService: dbHealth,
        redisService: redisHealth,
        queueService: queueHealth
      },
      dependencies: {
        database: dbHealth,
        redis: redisHealth,
        nlpModels: nlpHealth.modelsLoaded,
        queue: queueHealth
      },
      metrics: {
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpuUsage: 0, // Would need to calculate this
        requestCount: 0, // Would track this
        errorCount: 0 // Would track this
      }
    };
    
    res.status(status === 'healthy' ? 200 : 503).json(healthResult);
  }));

  // Readiness probe
  router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
    const [dbHealth, redisHealth] = await Promise.all([
      databaseService.healthCheck(),
      redisService.healthCheck()
    ]);
    
    if (dbHealth && redisHealth) {
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Liveness probe
  router.get('/live', asyncHandler(async (req: Request, res: Response) => {
    res.json({
      status: 'alive',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
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

  router.get('/nlp', asyncHandler(async (req: Request, res: Response) => {
    const health = nlpService.healthCheck();
    res.status(health.status === 'healthy' ? 200 : 503).json({
      service: 'nlp',
      ...health,
      timestamp: new Date().toISOString()
    });
  }));

  router.get('/scoring', asyncHandler(async (req: Request, res: Response) => {
    const health = scoringService.healthCheck();
    res.status(health.status === 'healthy' ? 200 : 503).json({
      service: 'scoring',
      ...health,
      timestamp: new Date().toISOString()
    });
  }));

  router.get('/queue', asyncHandler(async (req: Request, res: Response) => {
    const isHealthy = await queueService.healthCheck();
    res.status(isHealthy ? 200 : 503).json({
      service: 'queue',
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString()
    });
  }));

  return router;
}