/**
 * Main routes setup for Ranqly Backend
 */

import { Application } from 'express';
import { DatabaseService } from '@/shared/database/connection';
import winston from 'winston';

// Import module routes
import { authRoutes } from '@/modules/auth/routes';
import { contestRoutes } from '@/modules/contests/routes';
import { scoringRoutes } from '@/modules/scoring/routes';
import { votingRoutes } from '@/modules/voting/routes';
import { notificationRoutes } from '@/modules/notifications/routes';
import { disputeRoutes } from '@/modules/disputes/routes';
import { crawlerRoutes } from '@/modules/crawler/routes';
import { auditRoutes } from '@/modules/audit/routes';
import { governanceRoutes } from '@/modules/governance/routes';

export function setupRoutes(app: Application, databaseService: DatabaseService, logger: winston.Logger): void {
  // API routes with versioning
  app.use('/api/v1/auth', authRoutes(databaseService, logger));
  app.use('/api/v1/contests', contestRoutes(databaseService, logger));
  app.use('/api/v1/scoring', scoringRoutes(databaseService, logger));
  app.use('/api/v1/voting', votingRoutes(databaseService, logger));
  app.use('/api/v1/notifications', notificationRoutes(databaseService, logger));
  app.use('/api/v1/disputes', disputeRoutes(databaseService, logger));
  app.use('/api/v1/crawler', crawlerRoutes(databaseService, logger));
  app.use('/api/v1/audit', auditRoutes(databaseService, logger));
  app.use('/api/v1/governance', governanceRoutes(databaseService, logger));

  // Legacy routes (without versioning) for backward compatibility
  app.use('/api/auth', authRoutes(databaseService, logger));
  app.use('/api/contests', contestRoutes(databaseService, logger));
  app.use('/api/scoring', scoringRoutes(databaseService, logger));
  app.use('/api/voting', votingRoutes(databaseService, logger));
  app.use('/api/notifications', notificationRoutes(databaseService, logger));
  app.use('/api/disputes', disputeRoutes(databaseService, logger));
  app.use('/api/crawler', crawlerRoutes(databaseService, logger));
  app.use('/api/audit', auditRoutes(databaseService, logger));
  app.use('/api/governance', governanceRoutes(databaseService, logger));

  logger.info('API routes setup completed');
}

export default setupRoutes;


