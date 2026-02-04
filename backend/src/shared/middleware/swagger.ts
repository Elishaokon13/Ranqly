/**
 * Swagger/OpenAPI documentation middleware
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ranqly Backend API',
      version: '1.0.0',
      description: `
        Complete API documentation for the Ranqly Web3 Ranking and Contest Engine.
        
        This unified backend provides endpoints for:
        - Authentication and user management
        - Contest creation and management
        - Content scoring and analysis
        - Blockchain voting and sybil detection
        - Real-time notifications
        - Dispute management and resolution
        - Web content crawling and extraction
        - Audit trails and verification
        - DAO governance and voting
        
        All services are now consolidated into a single, powerful backend server.
      `,
      contact: {
        name: 'Ranqly Team',
        email: 'support@ranqly.io',
        url: 'https://ranqly.io',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Local development server',
      },
      {
        url: 'https://api.ranqly.io',
        description: 'Production server',
      },
      {
        url: 'https://staging-api.ranqly.io',
        description: 'Staging server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string' },
            role: { type: 'string', enum: ['user', 'moderator', 'admin', 'super_admin'] },
            walletAddress: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Contest: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'active', 'upcoming', 'completed', 'cancelled'] },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            prizePool: { type: 'number' },
            theme: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } },
            createdBy: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Submission: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            contestId: { type: 'string' },
            userId: { type: 'string' },
            content: { type: 'string' },
            contentType: { type: 'string', enum: ['text', 'image', 'video', 'audio', 'code', 'other'] },
            score: { type: 'number' },
            status: { type: 'string', enum: ['draft', 'submitted', 'scored', 'disqualified'] },
            metadata: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ScoringResponse: {
          type: 'object',
          properties: {
            submissionId: { type: 'string' },
            finalScore: { type: 'number', minimum: 0, maximum: 100 },
            scoringBreakdown: {
              type: 'object',
              properties: {
                depth: { type: 'object' },
                reach: { type: 'object' },
                relevance: { type: 'object' },
                consistency: { type: 'object' },
              },
            },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            processingTime: { type: 'number' },
            timestamp: { type: 'string', format: 'date-time' },
            modelVersion: { type: 'string' },
            success: { type: 'boolean' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            error: { type: 'string' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/modules/*/routes/*.ts',
  ],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Application): void {
  // Swagger UI
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Ranqly API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  }));

  // JSON endpoint
  app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Redirect root to docs
  app.get('/api/docs', (req, res) => {
    res.redirect('/docs');
  });
}

export default setupSwagger;


