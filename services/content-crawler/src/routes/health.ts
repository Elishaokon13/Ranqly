/**
 * Health check routes for Content Crawler
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { RedisService } from '../services/RedisService';
import { CrawlerService } from '../services/CrawlerService';

export function healthRoutes(
  databaseService: DatabaseService,
  redisService: RedisService,
  crawlerService: CrawlerService
): Router {
  const router = Router();

  // Basic health check
  router.get('/', async (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'Content Crawler',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Detailed health check
  router.get('/detailed', async (req: Request, res: Response) => {
    const [dbHealth, redisHealth] = await Promise.all([
      databaseService.healthCheck(),
      redisService.healthCheck()
    ]);
    
    const crawlerHealth = crawlerService.healthCheck();
    
    const allHealthy = dbHealth && redisHealth && crawlerHealth.status === 'healthy';
    const status = allHealthy ? 'healthy' : 'degraded';
    
    res.status(allHealthy ? 200 : 503).json({
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      services: {
        database: dbHealth,
        redis: redisHealth,
        crawler: crawlerHealth.status === 'healthy'
      }
    });
  });

  return router;
}
