/**
 * Request logging middleware for Algorithm Engine
 * Logs incoming requests and responses
 */

import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

export interface RequestWithId extends Request {
  id?: string;
  startTime?: number;
}

export function requestLogger(logger: winston.Logger) {
  return (req: RequestWithId, res: Response, next: NextFunction): void => {
    // Generate request ID
    req.id = req.headers['x-request-id'] as string || 
             `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Record start time
    req.startTime = Date.now();
    
    // Log incoming request
    logger.info({
      type: 'request',
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: req.get('Content-Length'),
      timestamp: new Date().toISOString()
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any): Response {
      const duration = Date.now() - (req.startTime || Date.now());
      
      logger.info({
        type: 'response',
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('Content-Length'),
        timestamp: new Date().toISOString()
      });

      return originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}