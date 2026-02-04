import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/validation.log' })
  ]
});

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      url: req.url,
      method: req.method,
      errors: errors.array(),
      body: req.body,
      query: req.query,
      params: req.params
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
    return;
  }

  next();
};

export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitize string inputs to prevent XSS
  const sanitizeString = (str: string): string => {
    return str
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
};

export const validateFileUpload = (allowedTypes: string[], maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.file && !req.files) {
      next();
      return;
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    
    for (const file of files) {
      if (!file) continue;

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        res.status(400).json({
          success: false,
          error: 'Invalid file type',
          allowedTypes
        });
        return;
      }

      // Check file size
      if (file.size > maxSize) {
        res.status(400).json({
          success: false,
          error: 'File too large',
          maxSize: `${maxSize / 1024 / 1024}MB`
        });
        return;
      }
    }

    next();
  };
};

export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const { limit, offset } = req.query;
  
  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    res.status(400).json({
      success: false,
      error: 'Invalid limit parameter (must be between 1 and 100)'
    });
    return;
  }

  if (offset && (isNaN(Number(offset)) || Number(offset) < 0)) {
    res.status(400).json({
      success: false,
      error: 'Invalid offset parameter (must be >= 0)'
    });
    return;
  }

  next();
};