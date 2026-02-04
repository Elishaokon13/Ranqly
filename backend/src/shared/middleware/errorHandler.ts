/**
 * Global error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import { AppError } from '@/shared/types';

export function errorHandler(logger: winston.Logger) {
  return (error: Error, req: Request, res: Response, next: NextFunction) => {
    const requestId = req.id || 'unknown';

    // Log error
    logger.error('Request error:', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      error: error.message,
      stack: error.stack,
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Handle different error types
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.code || 'APPLICATION_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
        requestId,
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
        requestId,
      });
    }

    // Handle database errors
    if (error.name === 'DatabaseError' || error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Database operation failed',
        timestamp: new Date().toISOString(),
        requestId,
      });
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
        timestamp: new Date().toISOString(),
        requestId,
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
        timestamp: new Date().toISOString(),
        requestId,
      });
    }

    // Handle rate limiting errors
    if (error.message.includes('Too many requests')) {
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        timestamp: new Date().toISOString(),
        requestId,
      });
    }

    // Default error response
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      timestamp: new Date().toISOString(),
      requestId,
    });
  };
}

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default errorHandler;


