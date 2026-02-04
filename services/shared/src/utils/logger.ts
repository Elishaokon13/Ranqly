/**
 * Shared logger utility
 */

import winston from 'winston';

export interface LoggerConfig {
  level?: string;
  service?: string;
  filename?: string;
}

export function createLogger(config: LoggerConfig = {}): winston.Logger {
  const {
    level = 'info',
    service = 'ranqly-service',
    filename = 'logs/service.log'
  } = config;

  return winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.label({ label: service }),
      winston.format.json()
    ),
    defaultMeta: { service },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      new winston.transports.File({ 
        filename,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ]
  });
}

export const logger = createLogger();
