/**
 * Request validation middleware for Dispute Service
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationResult } from '../types';

export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.headers['x-request-id']) {
      req.headers['x-request-id'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    if (req.path.startsWith('/api/')) {
      const validationResult = validateApiRequest(req);
      
      if (!validationResult.isValid) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          details: validationResult.errors,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id']
        });
        return;
      }
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Request validation failed',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id']
    });
  }
}

function validateApiRequest(req: Request): ValidationResult {
  const errors: string[] = [];

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      errors.push('Content-Type must be application/json');
    }
  }

  const contentLength = parseInt(req.get('Content-Length') || '0', 10);
  const maxContentLength = 10 * 1024 * 1024; // 10MB
  if (contentLength > maxContentLength) {
    errors.push(`Request body too large. Maximum size is ${maxContentLength} bytes`);
  }

  if (req.path === '/api/disputes' && req.method === 'POST') {
    const body = req.body;
    
    if (!body.submissionId || typeof body.submissionId !== 'string') {
      errors.push('submissionId is required and must be a string');
    }
    
    if (!body.contestId || typeof body.contestId !== 'string') {
      errors.push('contestId is required and must be a string');
    }
    
    if (!body.reporterId || typeof body.reporterId !== 'string') {
      errors.push('reporterId is required and must be a string');
    }
    
    if (!body.disputeType || typeof body.disputeType !== 'string') {
      errors.push('disputeType is required and must be a string');
    }
    
    if (!body.reason || typeof body.reason !== 'string') {
      errors.push('reason is required and must be a string');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
