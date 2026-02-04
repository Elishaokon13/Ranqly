/**
 * Metrics routes for Content Crawler
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

# HELP content_crawler_requests_total Total number of crawl requests
# TYPE content_crawler_requests_total counter
content_crawler_requests_total{status="success"} 100
content_crawler_requests_total{status="error"} 5

# HELP content_crawler_crawl_duration_seconds Time spent crawling URLs
# TYPE content_crawler_crawl_duration_seconds histogram
content_crawler_crawl_duration_seconds_bucket{le="1"} 50
content_crawler_crawl_duration_seconds_bucket{le="5"} 80
content_crawler_crawl_duration_seconds_bucket{le="10"} 95
content_crawler_crawl_duration_seconds_bucket{le="+Inf"} 100
content_crawler_crawl_duration_seconds_sum 500
content_crawler_crawl_duration_seconds_count 100
`;
}
