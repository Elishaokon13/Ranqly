/**
 * Logger configuration for Algorithm Engine
 * Provides structured logging with different levels and transports
 */

import winston from 'winston';
import path from 'path';

export function setupLogging(logLevel: string = 'info'): winston.Logger {
  const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: {
      service: 'algo-engine',
      version: '1.0.0'
    },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ],
    exitOnError: false
  });

  return logger;
}

export default setupLogging;