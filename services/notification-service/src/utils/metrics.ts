import { register, Counter, Histogram, Gauge } from 'prom-client';

// Create a custom registry
const registry = register;

// Metrics
export const notificationMetrics = {
  // Counters
  notificationsSent: new Counter({
    name: 'notifications_sent_total',
    help: 'Total number of notifications sent',
    labelNames: ['type', 'channel']
  }),
  
  notificationsDelivered: new Counter({
    name: 'notifications_delivered_total',
    help: 'Total number of notifications delivered',
    labelNames: ['type', 'channel']
  }),
  
  notificationsFailed: new Counter({
    name: 'notifications_failed_total',
    help: 'Total number of notifications failed',
    labelNames: ['type', 'channel', 'reason']
  }),
  
  // Histograms
  notificationLatency: new Histogram({
    name: 'notification_latency_seconds',
    help: 'Time taken to send notifications',
    labelNames: ['type', 'channel'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),
  
  // Gauges
  activeConnections: new Gauge({
    name: 'websocket_connections_active',
    help: 'Number of active WebSocket connections'
  }),
  
  queueSize: new Gauge({
    name: 'notification_queue_size',
    help: 'Number of notifications in queue'
  })
};

export const prometheusClient = {
  register: registry,
  metrics: notificationMetrics
};
