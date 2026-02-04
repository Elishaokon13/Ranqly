/**
 * Winston logger configuration for Ranqly Backend
 */

import winston from 'winston';
import { Config } from '@/shared/types';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

export function createLogger(config: Config): winston.Logger {
  const transports: winston.transport[] = [];

  // Console transport for development
  if (config.nodeEnv !== 'production') {
    transports.push(
      new winston.transports.Console({
        level: config.logLevel,
        format: consoleFormat,
      })
    );
  }

  // File transports for production
  if (config.nodeEnv === 'production') {
    // Error log file
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: logFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 5,
      })
    );

    // Combined log file
    transports.push(
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: logFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 5,
      })
    );

    // Console with minimal output for production
    transports.push(
      new winston.transports.Console({
        level: 'warn',
        format: winston.format.simple(),
      })
    );
  }

  return winston.createLogger({
    level: config.logLevel,
    format: logFormat,
    transports,
    exceptionHandlers: [
      new winston.transports.File({ filename: 'logs/exceptions.log' })
    ],
    rejectionHandlers: [
      new winston.transports.File({ filename: 'logs/rejections.log' })
    ],
    exitOnError: false,
  });
}

export default createLogger;


