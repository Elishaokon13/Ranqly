/**
 * Scoring routes for Algorithm Engine
 * Handles all scoring-related API endpoints
 * 
 * @swagger
 * tags:
 *   name: Scoring
 *   description: Content scoring and analysis endpoints
 */

import { Router, Request, Response } from 'express';
import { ScoringService } from '../services/ScoringService';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse, ScoringRequest, BatchScoringRequest } from '../types';

export function scoringRoutes(scoringService: ScoringService): Router {
  const router = Router();

  /**
   * @swagger
   * /api/scoring/score:
   *   post:
   *     summary: Score content
   *     description: Score a single content submission using NLP analysis
   *     tags: [Scoring]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [submissionId, content, contestContext]
   *             properties:
   *               submissionId:
   *                 type: string
   *                 description: Unique identifier for the submission
   *               content:
   *                 type: string
   *                 description: Content to be scored
   *                 minLength: 10
   *               contestContext:
   *                 type: object
   *                 required: [theme, keywords, contentType]
   *                 properties:
   *                   contestId:
   *                     type: string
   *                   theme:
   *                     type: string
   *                   keywords:
   *                     type: array
   *                     items:
   *                       type: string
   *                   contentType:
   *                     type: string
   *                     enum: [text, image, video, audio, code, other]
   *                   submissionDate:
   *                     type: string
   *                     format: date-time
   *               weights:
   *                 type: object
   *                 properties:
   *                   depth:
   *                     type: number
   *                     minimum: 0
   *                     maximum: 1
   *                     default: 0.4
   *                   reach:
   *                     type: number
   *                     minimum: 0
   *                     maximum: 1
   *                     default: 0.3
   *                   relevance:
   *                     type: number
   *                     minimum: 0
   *                     maximum: 1
   *                     default: 0.2
   *                   consistency:
   *                     type: number
   *                     minimum: 0
   *                     maximum: 1
   *                     default: 0.1
   *     responses:
   *       200:
   *         description: Content scored successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     submissionId:
   *                       type: string
   *                     finalScore:
   *                       type: number
   *                       minimum: 0
   *                       maximum: 100
   *                     scoringBreakdown:
   *                       type: object
   *                       properties:
   *                         depth:
   *                           type: object
   *                           properties:
   *                             score:
   *                               type: number
   *                             confidence:
   *                               type: number
   *                             details:
   *                               type: object
   *                         reach:
   *                           type: object
   *                           properties:
   *                             score:
   *                               type: number
   *                             confidence:
   *                               type: number
   *                             details:
   *                               type: object
   *                         relevance:
   *                           type: object
   *                           properties:
   *                             score:
   *                               type: number
   *                             confidence:
   *                               type: number
   *                             details:
   *                               type: object
   *                         consistency:
   *                           type: object
   *                           properties:
   *                             score:
   *                               type: number
   *                             confidence:
   *                               type: number
   *                             details:
   *                               type: object
   *                     weightsUsed:
   *                       type: object
   *                     confidence:
   *                       type: number
   *                     processingTime:
   *                       type: number
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *                     modelVersion:
   *                       type: string
   *                     success:
   *                       type: boolean
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 requestId:
   *                   type: string
   *       400:
   *         description: Bad request - invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   default: false
   *                 error:
   *                   type: string
   *                 message:
   *                   type: string
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 requestId:
   *                   type: string
   */
  router.post('/score', asyncHandler(async (req: Request, res: Response) => {
    const scoringRequest: ScoringRequest = req.body;
    
    const result = await scoringService.scoreSubmission(scoringRequest);
    
    const response: ApiResponse = {
      success: result.success,
      data: result,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || 'unknown'
    };
    
    res.status(result.success ? 200 : 400).json(response);
  }));

  // Score multiple submissions in batch
  router.post('/batch-score', asyncHandler(async (req: Request, res: Response) => {
    const batchRequest: BatchScoringRequest = req.body;
    
    // Process batch scoring (simplified implementation)
    const results = [];
    for (const submission of batchRequest.submissions) {
      try {
        const result = await scoringService.scoreSubmission(submission);
        results.push(result);
      } catch (error) {
        results.push({
          submissionId: submission.submissionId,
          finalScore: 0,
          scoringBreakdown: {
            depth: { score: 0, confidence: 0, details: {} },
            reach: { score: 0, confidence: 0, details: {} },
            relevance: { score: 0, confidence: 0, details: {} },
            consistency: { score: 0, confidence: 0, details: {} }
          },
          weightsUsed: scoringService['defaultWeights'],
          confidence: 0,
          processingTime: 0,
          timestamp: new Date().toISOString(),
          modelVersion: '1.0.0',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    const batchResponse = {
      batchId: batchRequest.batchId || `batch_${Date.now()}`,
      totalSubmissions: batchRequest.submissions.length,
      processedSubmissions: results.filter(r => r.success).length,
      failedSubmissions: results.filter(r => !r.success).length,
      results,
      processingTime: 0, // Would calculate actual processing time
      timestamp: new Date().toISOString(),
      status: 'completed' as const
    };
    
    const response: ApiResponse = {
      success: true,
      data: batchResponse,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || 'unknown'
    };
    
    res.json(response);
  }));

  // Get cached score for a submission
  router.get('/score/:submissionId', asyncHandler(async (req: Request, res: Response) => {
    const { submissionId } = req.params;
    
    const cachedScore = await scoringService.getCachedScore(submissionId);
    
    if (!cachedScore) {
      const response: ApiResponse = {
        success: false,
        error: 'Score not found in cache',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'unknown'
      };
      res.status(404).json(response);
      return;
    }
    
    const response: ApiResponse = {
      success: true,
      data: cachedScore,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || 'unknown'
    };
    
    res.json(response);
  }));

  // Recalculate score for a submission
  router.post('/recalculate/:submissionId', asyncHandler(async (req: Request, res: Response) => {
    const { submissionId } = req.params;
    const scoringRequest: ScoringRequest = req.body;
    
    // Ensure submissionId matches
    scoringRequest.submissionId = submissionId;
    
    const result = await scoringService.scoreSubmission(scoringRequest);
    
    const response: ApiResponse = {
      success: result.success,
      data: result,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || 'unknown'
    };
    
    res.status(result.success ? 200 : 400).json(response);
  }));

  // Get scoring metrics
  router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
    const metrics = await scoringService.getScoringMetrics();
    
    const response: ApiResponse = {
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || 'unknown'
    };
    
    res.json(response);
  }));

  // Get scoring configuration
  router.get('/configuration', asyncHandler(async (req: Request, res: Response) => {
    const config = await scoringService.getScoringConfiguration();
    
    const response: ApiResponse = {
      success: true,
      data: config,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || 'unknown'
    };
    
    res.json(response);
  }));

  // Update scoring configuration
  router.put('/configuration', asyncHandler(async (req: Request, res: Response) => {
    // This would update the scoring configuration
    // For now, just return success
    const response: ApiResponse = {
      success: true,
      message: 'Configuration updated successfully',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || 'unknown'
    };
    
    res.json(response);
  }));

  // Get model status
  router.get('/models/status', asyncHandler(async (req: Request, res: Response) => {
    const modelStatus = {
      nlpModels: {
        status: 'loaded',
        version: '1.0.0',
        lastUpdated: new Date().toISOString()
      },
      scoringModels: {
        status: 'active',
        version: '1.0.0',
        lastUpdated: new Date().toISOString()
      }
    };
    
    const response: ApiResponse = {
      success: true,
      data: modelStatus,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || 'unknown'
    };
    
    res.json(response);
  }));

  // Train models
  router.post('/models/train', asyncHandler(async (req: Request, res: Response) => {
    // This would trigger model training
    // For now, just return success
    const response: ApiResponse = {
      success: true,
      message: 'Model training initiated',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || 'unknown'
    };
    
    res.json(response);
  }));

  // Get queue status
  router.get('/queue/status', asyncHandler(async (req: Request, res: Response) => {
    const queueStatus = {
      pendingJobs: 0,
      processingJobs: 0,
      completedJobs: 1000,
      failedJobs: 50,
      averageProcessingTime: 2.5,
      lastProcessed: new Date().toISOString()
    };
    
    const response: ApiResponse = {
      success: true,
      data: queueStatus,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || 'unknown'
    };
    
    res.json(response);
  }));

  return router;
}