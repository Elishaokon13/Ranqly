/**
 * Request validation middleware for Algorithm Engine
 * Validates incoming requests and sanitizes data
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationResult } from '../types';

export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  try {
    // Add request ID if not present
    if (!req.headers['x-request-id']) {
      req.headers['x-request-id'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Basic validation for API requests
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

  // Validate Content-Type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      errors.push('Content-Type must be application/json');
    }
  }

  // Validate request body size
  const contentLength = parseInt(req.get('Content-Length') || '0', 10);
  const maxContentLength = 10 * 1024 * 1024; // 10MB
  if (contentLength > maxContentLength) {
    errors.push(`Request body too large. Maximum size is ${maxContentLength} bytes`);
  }

  // Validate specific endpoints
  if (req.path === '/api/scoring/score' && req.method === 'POST') {
    const body = req.body;
    
    if (!body.submissionId || typeof body.submissionId !== 'string') {
      errors.push('submissionId is required and must be a string');
    }
    
    if (!body.content || typeof body.content !== 'string') {
      errors.push('content is required and must be a string');
    }
    
    if (!body.contestContext || typeof body.contestContext !== 'object') {
      errors.push('contestContext is required and must be an object');
    } else {
      if (!body.contestContext.theme || typeof body.contestContext.theme !== 'string') {
        errors.push('contestContext.theme is required and must be a string');
      }
      
      if (!Array.isArray(body.contestContext.keywords)) {
        errors.push('contestContext.keywords must be an array');
      }
      
      if (!body.contestContext.contentType || typeof body.contestContext.contentType !== 'string') {
        errors.push('contestContext.contentType is required and must be a string');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potentially dangerous characters
    return input.replace(/[<>\"'&]/g, '');
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}