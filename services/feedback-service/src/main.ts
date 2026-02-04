import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { FeedbackRouter } from './routes/feedback';
import { SurveyRouter } from './routes/survey';
import { BugReportRouter } from './routes/bug-report';
import { AnalyticsRouter } from './routes/analytics';
import { DatabaseService } from './services/database-service';
import { EmailService } from './services/email-service';
import { Logger } from './utils/logger';
import { ErrorHandler } from './middleware/error-handler';
import { AuthMiddleware } from './middleware/auth';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 8007;
const logger = new Logger();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Initialize services
const databaseService = new DatabaseService();
const emailService = new EmailService();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'feedback-service',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/v1/feedback', new FeedbackRouter(databaseService, emailService).router);
app.use('/api/v1/surveys', new SurveyRouter(databaseService, emailService).router);
app.use('/api/v1/bug-reports', new BugReportRouter(databaseService, emailService).router);
app.use('/api/v1/analytics', new AnalyticsRouter(databaseService).router);

// Error handling middleware
app.use(ErrorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Initialize database connection
databaseService.initialize()
  .then(() => {
    logger.info('Database connection established');
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Feedback Service listening on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  })
  .catch((error) => {
    logger.error('Failed to initialize database connection:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  databaseService.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  databaseService.close();
  process.exit(0);
});

export default app;
