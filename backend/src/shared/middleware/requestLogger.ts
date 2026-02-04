/**
 * Request logging middleware
 */

import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

export function requestLogger(logger: winston.Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const requestId = req.id || 'unknown';

    // Log request
    logger.info('Incoming request:', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const duration = Date.now() - start;
      
      logger.info('Request completed:', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });

      // Call original end method
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

export default requestLogger;


