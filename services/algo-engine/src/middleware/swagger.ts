/**
 * Swagger/OpenAPI documentation middleware for Algorithm Engine
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ranqly Algorithm Engine',
      version: '1.0.0',
      description: 'NLP scoring and content analysis service for the Ranqly platform',
    },
    servers: [
      {
        url: 'http://localhost:8001',
        description: 'Development server',
      },
      {
        url: 'https://algo-engine.ranqly.io',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        ScoringRequest: {
          type: 'object',
          required: ['submissionId', 'content', 'contestContext'],
          properties: {
            submissionId: { type: 'string', description: 'Unique identifier for the submission' },
            content: { type: 'string', description: 'Content to be scored', minLength: 10 },
            contestContext: {
              type: 'object',
              required: ['theme', 'keywords', 'contentType'],
              properties: {
                contestId: { type: 'string' },
                theme: { type: 'string' },
                keywords: { type: 'array', items: { type: 'string' } },
                contentType: { type: 'string', enum: ['text', 'image', 'video', 'audio', 'code', 'other'] },
                submissionDate: { type: 'string', format: 'date-time' },
              },
            },
            weights: {
              type: 'object',
              properties: {
                depth: { type: 'number', minimum: 0, maximum: 1, default: 0.4 },
                reach: { type: 'number', minimum: 0, maximum: 1, default: 0.3 },
                relevance: { type: 'number', minimum: 0, maximum: 1, default: 0.2 },
                consistency: { type: 'number', minimum: 0, maximum: 1, default: 0.1 },
              },
            },
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
                depth: { $ref: '#/components/schemas/AxisScore' },
                reach: { $ref: '#/components/schemas/AxisScore' },
                relevance: { $ref: '#/components/schemas/AxisScore' },
                consistency: { $ref: '#/components/schemas/AxisScore' },
              },
            },
            weightsUsed: {
              type: 'object',
              properties: {
                depth: { type: 'number' },
                reach: { type: 'number' },
                relevance: { type: 'number' },
                consistency: { type: 'number' },
              },
            },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            processingTime: { type: 'number', description: 'Processing time in seconds' },
            timestamp: { type: 'string', format: 'date-time' },
            modelVersion: { type: 'string' },
            success: { type: 'boolean' },
          },
        },
        AxisScore: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            details: { type: 'object', description: 'Detailed scoring information' },
          },
        },
        BatchScoringRequest: {
          type: 'object',
          required: ['submissions'],
          properties: {
            submissions: {
              type: 'array',
              items: { $ref: '#/components/schemas/ScoringRequest' },
            },
            batchId: { type: 'string', description: 'Optional batch identifier' },
            priority: { type: 'string', enum: ['low', 'normal', 'high'], default: 'normal' },
            callbackUrl: { type: 'string', format: 'uri' },
          },
        },
        BatchScoringResponse: {
          type: 'object',
          properties: {
            batchId: { type: 'string' },
            totalSubmissions: { type: 'integer' },
            processedSubmissions: { type: 'integer' },
            failedSubmissions: { type: 'integer' },
            results: {
              type: 'array',
              items: { $ref: '#/components/schemas/ScoringResponse' },
            },
            processingTime: { type: 'number' },
            timestamp: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
          },
        },
        ScoringMetrics: {
          type: 'object',
          properties: {
            totalScorings: { type: 'integer' },
            averageProcessingTime: { type: 'number' },
            successRate: { type: 'number' },
            averageConfidence: { type: 'number' },
            modelPerformance: {
              type: 'object',
              properties: {
                depthModel: { type: 'number' },
                reachModel: { type: 'number' },
                relevanceModel: { type: 'number' },
                consistencyModel: { type: 'number' },
              },
            },
            errorRate: { type: 'number' },
            cacheHitRate: { type: 'number' },
            lastUpdated: { type: 'string', format: 'date-time' },
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
  },
  apis: [
    './src/routes/*.ts',
  ],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Application): void {
  // Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Ranqly Algorithm Engine API',
  }));

  // JSON endpoint
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Redirect root to docs
  app.get('/docs', (req, res) => {
    res.redirect('/api/docs');
  });
}

export default setupSwagger;

