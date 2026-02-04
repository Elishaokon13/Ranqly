/**
 * Error handling middleware for Content Crawler
 */

import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

export function errorHandler(logger: winston.Logger) {
  return (error: any, req: Request, res: Response, next: NextFunction): void => {
    logger.error({
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    let statusCode = error.status || error.statusCode || 500;

    const errorResponse: any = {
      success: false,
      error: error.message || 'Internal Server Error',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }

    res.status(statusCode).json(errorResponse);
  };
}
