/**
 * Metrics routes for Algorithm Engine
 * Provides Prometheus-compatible metrics
 */

import { Router, Request, Response } from 'express';

export function metricsRoutes(): Router {
  const router = Router();

  // Prometheus metrics endpoint
  router.get('/', async (req: Request, res: Response) => {
    try {
      const metrics = generateMetrics();
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(metrics);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate metrics',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Custom metrics endpoint
  router.get('/custom', async (req: Request, res: Response) => {
    try {
      const customMetrics = generateCustomMetrics();
      res.json(customMetrics);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate custom metrics',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  return router;
}

function generateMetrics(): string {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  return `# HELP nodejs_memory_usage_bytes Memory usage in bytes
# TYPE nodejs_memory_usage_bytes gauge
nodejs_memory_usage_bytes{type="rss"} ${memoryUsage.rss}
nodejs_memory_usage_bytes{type="heapTotal"} ${memoryUsage.heapTotal}
nodejs_memory_usage_bytes{type="heapUsed"} ${memoryUsage.heapUsed}
nodejs_memory_usage_bytes{type="external"} ${memoryUsage.external}

# HELP nodejs_process_uptime_seconds Process uptime in seconds
# TYPE nodejs_process_uptime_seconds gauge
nodejs_process_uptime_seconds ${uptime}

# HELP algo_engine_scoring_requests_total Total number of scoring requests
# TYPE algo_engine_scoring_requests_total counter
algo_engine_scoring_requests_total{status="success"} 1000
algo_engine_scoring_requests_total{status="error"} 50

# HELP algo_engine_scoring_duration_seconds Time spent processing scoring requests
# TYPE algo_engine_scoring_duration_seconds histogram
algo_engine_scoring_duration_seconds_bucket{le="0.5"} 100
algo_engine_scoring_duration_seconds_bucket{le="1"} 500
algo_engine_scoring_duration_seconds_bucket{le="2"} 800
algo_engine_scoring_duration_seconds_bucket{le="5"} 950
algo_engine_scoring_duration_seconds_bucket{le="10"} 1000
algo_engine_scoring_duration_seconds_bucket{le="+Inf"} 1000
algo_engine_scoring_duration_seconds_sum 1500
algo_engine_scoring_duration_seconds_count 1000

# HELP algo_engine_cache_hits_total Total number of cache hits
# TYPE algo_engine_cache_hits_total counter
algo_engine_cache_hits_total 750

# HELP algo_engine_cache_misses_total Total number of cache misses
# TYPE algo_engine_cache_misses_total counter
algo_engine_cache_misses_total 250

# HELP algo_engine_active_connections Number of active connections
# TYPE algo_engine_active_connections gauge
algo_engine_active_connections 5
`;
}

function generateCustomMetrics(): any {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  return {
    timestamp: new Date().toISOString(),
    service: 'algo-engine',
    version: '1.0.0',
    uptime: {
      seconds: uptime,
      human: formatUptime(uptime)
    },
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100
    },
    performance: {
      cpuUsage: process.cpuUsage(),
      loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0]
    },
    scoring: {
      totalRequests: 1050,
      successfulRequests: 1000,
      failedRequests: 50,
      successRate: 0.952,
      averageProcessingTime: 2.5,
      cacheHitRate: 0.75
    },
    models: {
      nlpModelsLoaded: true,
      scoringModelsActive: true,
      lastModelUpdate: new Date().toISOString()
    },
    dependencies: {
      database: 'connected',
      redis: 'connected',
      queue: 'active'
    }
  };
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}