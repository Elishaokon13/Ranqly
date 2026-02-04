/**
 * Error handling middleware for Dispute Service
 */

import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

export interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export function errorHandler(logger: winston.Logger) {
  return (error: ErrorWithStatus, req: Request, res: Response, next: NextFunction): void => {
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

    if (error.name === 'ValidationError') {
      statusCode = 400;
    } else if (error.name === 'UnauthorizedError') {
      statusCode = 401;
    } else if (error.name === 'ForbiddenError') {
      statusCode = 403;
    } else if (error.name === 'NotFoundError') {
      statusCode = 404;
    }

    const errorResponse: any = {
      success: false,
      error: error.message || 'Internal Server Error',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }

    if (error.code) {
      errorResponse.code = error.code;
    }

    res.status(statusCode).json(errorResponse);
  };
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
