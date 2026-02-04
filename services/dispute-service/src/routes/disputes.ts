/**
 * Dispute routes for Dispute Service
 */

import { Router, Request, Response } from 'express';
import { DisputeResolver } from '../services/DisputeResolver';
import { asyncHandler } from '../middleware/errorHandler';
import { DisputeRequest, DisputeResponse } from '../types';

export function disputeRoutes(disputeResolver: DisputeResolver): Router {
  const router = Router();

  // Create a new dispute
  router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const disputeRequest: DisputeRequest = req.body;
    
    const dispute = await disputeResolver.createDispute(disputeRequest);
    
    res.status(201).json({
      success: true,
      data: dispute,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }));

  // Get a specific dispute
  router.get('/:disputeId', asyncHandler(async (req: Request, res: Response) => {
    const { disputeId } = req.params;
    
    const dispute = await disputeResolver.getDispute(disputeId);
    
    if (!dispute) {
      res.status(404).json({
        success: false,
        error: 'Dispute not found',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
      return;
    }
    
    res.json({
      success: true,
      data: dispute,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }));

  // List disputes with filters
  router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const { status, priority, limit, offset } = req.query;
    
    const disputes = await disputeResolver.listDisputes(
      status as any,
      priority as any,
      parseInt(limit as string) || 50,
      parseInt(offset as string) || 0
    );
    
    res.json({
      success: true,
      data: disputes,
      pagination: {
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0,
        total: disputes.length
      },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }));

  // Assign resolver to dispute
  router.post('/:disputeId/assign', asyncHandler(async (req: Request, res: Response) => {
    const { disputeId } = req.params;
    const { resolverId } = req.body;
    
    if (!resolverId) {
      res.status(400).json({
        success: false,
        error: 'resolverId is required',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
      return;
    }
    
    const success = await disputeResolver.assignResolver(disputeId, resolverId);
    
    if (!success) {
      res.status(400).json({
        success: false,
        error: 'Failed to assign resolver',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Resolver assigned successfully',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }));

  // Resolve dispute
  router.post('/:disputeId/resolve', asyncHandler(async (req: Request, res: Response) => {
    const { disputeId } = req.params;
    const { resolution, resolverId } = req.body;
    
    if (!resolution || !resolverId) {
      res.status(400).json({
        success: false,
        error: 'resolution and resolverId are required',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
      return;
    }
    
    const dispute = await disputeResolver.resolveDispute(disputeId, resolution, resolverId);
    
    res.json({
      success: true,
      data: dispute,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }));

  // Escalate dispute
  router.post('/:disputeId/escalate', asyncHandler(async (req: Request, res: Response) => {
    const { disputeId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      res.status(400).json({
        success: false,
        error: 'reason is required',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
      return;
    }
    
    const success = await disputeResolver.escalateDispute(disputeId, reason);
    
    if (!success) {
      res.status(400).json({
        success: false,
        error: 'Failed to escalate dispute',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Dispute escalated successfully',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }));

  return router;
}
