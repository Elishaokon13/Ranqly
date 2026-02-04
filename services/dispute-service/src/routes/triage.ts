/**
 * Triage routes for Dispute Service
 */

import { Router, Request, Response } from 'express';
import { TriageService } from '../services/TriageService';
import { asyncHandler } from '../middleware/errorHandler';
import { TriageRequest } from '../types';

export function triageRoutes(triageService: TriageService): Router {
  const router = Router();

  // Analyze dispute for triage
  router.post('/analyze', asyncHandler(async (req: Request, res: Response) => {
    const triageRequest: TriageRequest = req.body;
    
    const triageResponse = await triageService.analyzeDispute(triageRequest);
    
    res.json({
      success: true,
      data: triageResponse,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }));

  // Get triage queue
  router.get('/queue', asyncHandler(async (req: Request, res: Response) => {
    const queue = await triageService.getTriageQueue();
    
    res.json({
      success: true,
      data: queue,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }));

  return router;
}
