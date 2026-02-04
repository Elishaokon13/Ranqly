/**
 * Logger configuration for Dispute Service
 */

import winston from 'winston';

export function setupLogging(logLevel: string = 'info'): winston.Logger {
  const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: {
      service: 'dispute-service',
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
