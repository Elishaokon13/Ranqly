/**
 * Metrics routes for Dispute Service
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

# HELP dispute_service_disputes_total Total number of disputes
# TYPE dispute_service_disputes_total counter
dispute_service_disputes_total{status="pending"} 10
dispute_service_disputes_total{status="in_review"} 5
dispute_service_disputes_total{status="resolved"} 100
dispute_service_disputes_total{status="dismissed"} 20

# HELP dispute_service_resolution_time_seconds Time to resolve disputes
# TYPE dispute_service_resolution_time_seconds histogram
dispute_service_resolution_time_seconds_bucket{le="1"} 10
dispute_service_resolution_time_seconds_bucket{le="24"} 50
dispute_service_resolution_time_seconds_bucket{le="72"} 80
dispute_service_resolution_time_seconds_bucket{le="168"} 95
dispute_service_resolution_time_seconds_bucket{le="+Inf"} 100
dispute_service_resolution_time_seconds_sum 5000
dispute_service_resolution_time_seconds_count 100

# HELP dispute_service_triage_queue_size Current triage queue size
# TYPE dispute_service_triage_queue_size gauge
dispute_service_triage_queue_size 5
`;
}
