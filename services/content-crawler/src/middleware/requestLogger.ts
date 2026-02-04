/**
 * Request logging middleware for Content Crawler
 */

import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

export function requestLogger(logger: winston.Logger) {
  return (req: any, res: Response, next: NextFunction): void => {
    req.id = req.headers['x-request-id'] as string || 
             `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    req.startTime = Date.now();
    
    logger.info({
      type: 'request',
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

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
        timestamp: new Date().toISOString()
      });

      return originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}
