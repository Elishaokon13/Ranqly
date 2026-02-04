/**
 * Error handling middleware for Algorithm Engine
 * Provides centralized error handling and logging
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
    // Log the error
    logger.error({
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // Determine status code
    let statusCode = error.status || error.statusCode || 500;

    // Handle specific error types
    if (error.name === 'ValidationError') {
      statusCode = 400;
    } else if (error.name === 'UnauthorizedError') {
      statusCode = 401;
    } else if (error.name === 'ForbiddenError') {
      statusCode = 403;
    } else if (error.name === 'NotFoundError') {
      statusCode = 404;
    } else if (error.name === 'ConflictError') {
      statusCode = 409;
    } else if (error.name === 'TooManyRequestsError') {
      statusCode = 429;
    }

    // Prepare error response
    const errorResponse: any = {
      success: false,
      error: error.message || 'Internal Server Error',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }

    // Include additional error details if available
    if (error.code) {
      errorResponse.code = error.code;
    }

    // Send error response
    res.status(statusCode).json(errorResponse);
  };
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new Error(`Route ${req.originalUrl} not found`) as ErrorWithStatus;
  error.status = 404;
  next(error);
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}