/**
 * PM2 Ecosystem Configuration for Ranqly
 * Process management for all Node.js services
 */

module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: './services/api-gateway/dist/main.js',
      cwd: './services/api-gateway',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8000,
        LOG_LEVEL: 'info'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 8000,
        LOG_LEVEL: 'debug'
      },
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/api-gateway-error.log',
      out_file: './logs/api-gateway-out.log',
      log_file: './logs/api-gateway-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'voting-engine',
      script: './services/voting-engine/dist/main.js',
      cwd: './services/voting-engine',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8002,
        LOG_LEVEL: 'info'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 8002,
        LOG_LEVEL: 'debug'
      },
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/voting-engine-error.log',
      out_file: './logs/voting-engine-out.log',
      log_file: './logs/voting-engine-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'algo-engine',
      script: './services/algo-engine/dist/main.js',
      cwd: './services/algo-engine',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8001,
        LOG_LEVEL: 'info'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 8001,
        LOG_LEVEL: 'debug'
      },
      watch: false,
      max_memory_restart: '2G', // More memory for ML models
      error_file: './logs/algo-engine-error.log',
      out_file: './logs/algo-engine-out.log',
      log_file: './logs/algo-engine-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'notification-service',
      script: './services/notification-service/dist/main.js',
      cwd: './services/notification-service',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8003,
        LOG_LEVEL: 'info'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 8003,
        LOG_LEVEL: 'debug'
      },
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/notification-service-error.log',
      out_file: './logs/notification-service-out.log',
      log_file: './logs/notification-service-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'dispute-service',
      script: './services/dispute-service/dist/main.js',
      cwd: './services/dispute-service',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8004,
        LOG_LEVEL: 'info'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 8004,
        LOG_LEVEL: 'debug'
      },
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/dispute-service-error.log',
      out_file: './logs/dispute-service-out.log',
      log_file: './logs/dispute-service-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'content-crawler',
      script: './services/content-crawler/dist/main.js',
      cwd: './services/content-crawler',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8005,
        LOG_LEVEL: 'info'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 8005,
        LOG_LEVEL: 'debug'
      },
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/content-crawler-error.log',
      out_file: './logs/content-crawler-out.log',
      log_file: './logs/content-crawler-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'audit-store',
      script: './services/audit-store/dist/main.js',
      cwd: './services/audit-store',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8006,
        LOG_LEVEL: 'info'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 8006,
        LOG_LEVEL: 'debug'
      },
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/audit-store-error.log',
      out_file: './logs/audit-store-out.log',
      log_file: './logs/audit-store-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'governance-service',
      script: './services/governance-service/dist/main.js',
      cwd: './services/governance-service',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8007,
        LOG_LEVEL: 'info'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 8007,
        LOG_LEVEL: 'debug'
      },
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/governance-service-error.log',
      out_file: './logs/governance-service-out.log',
      log_file: './logs/governance-service-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ],

  deploy: {
    production: {
      user: 'ranqly',
      host: ['production-server-1', 'production-server-2'],
      ref: 'origin/main',
      repo: 'git@github.com:ranqly/ranqly.git',
      path: '/var/www/ranqly',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    staging: {
      user: 'ranqly',
      host: 'staging-server',
      ref: 'origin/develop',
      repo: 'git@github.com:ranqly/ranqly.git',
      path: '/var/www/ranqly-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    }
  }
};

