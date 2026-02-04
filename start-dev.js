/**
 * Development startup script for Ranqly
 * Starts all services in development mode
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Ranqly in development mode...\n');

// Services to start
const services = [
  {
    name: 'API Gateway',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'services', 'api-gateway'),
    color: '\x1b[36m' // Cyan
  },
  {
    name: 'Voting Engine',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'services', 'voting-engine'),
    color: '\x1b[32m' // Green
  },
  {
    name: 'Algorithm Engine',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'services', 'algo-engine'),
    color: '\x1b[33m' // Yellow
  },
  {
    name: 'Notification Service',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'services', 'notification-service'),
    color: '\x1b[35m' // Magenta
  },
  {
    name: 'Dispute Service',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'services', 'dispute-service'),
    color: '\x1b[31m' // Red
  },
  {
    name: 'Frontend',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'frontend'),
    color: '\x1b[34m' // Blue
  }
];

const processes = [];

// Start each service
services.forEach((service, index) => {
  console.log(`${service.color}[${service.name}]${'\x1b[0m'} Starting...`);
  
  const process = spawn(service.command, service.args, {
    cwd: service.cwd,
    stdio: 'pipe',
    shell: true
  });

  // Handle output
  process.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${service.color}[${service.name}]${'\x1b[0m'} ${line}`);
      }
    });
  });

  process.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${service.color}[${service.name}] ERROR:${'\x1b[0m'} ${line}`);
      }
    });
  });

  process.on('close', (code) => {
    if (code !== 0) {
      console.log(`${service.color}[${service.name}]${'\x1b[0m'} Process exited with code ${code}`);
    }
  });

  process.on('error', (error) => {
    console.log(`${service.color}[${service.name}] ERROR:${'\x1b[0m'} ${error.message}`);
  });

  processes.push({ ...service, process });
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down services...\n');
  
  processes.forEach(({ name, process, color }) => {
    console.log(`${color}[${name}]${'\x1b[0m'} Stopping...`);
    process.kill('SIGINT');
  });

  setTimeout(() => {
    processes.forEach(({ name, process, color }) => {
      if (!process.killed) {
        console.log(`${color}[${name}]${'\x1b[0m'} Force killing...`);
        process.kill('SIGKILL');
      }
    });
    process.exit(0);
  }, 5000);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down services...\n');
  
  processes.forEach(({ name, process, color }) => {
    console.log(`${color}[${name}]${'\x1b[0m'} Stopping...`);
    process.kill('SIGTERM');
  });

  setTimeout(() => {
    process.exit(0);
  }, 5000);
});

// Display service URLs
setTimeout(() => {
  console.log('\n🌐 Service URLs:');
  console.log('  Frontend:        http://localhost:3000');
  console.log('  API Gateway:     http://localhost:8000');
  console.log('  Algorithm Engine: http://localhost:8001');
  console.log('  Voting Engine:   http://localhost:8002');
  console.log('  Notifications:   http://localhost:8003');
  console.log('  Dispute Service: http://localhost:8004');
  console.log('\n📚 API Documentation:');
  console.log('  API Gateway:     http://localhost:8000/api/docs');
  console.log('  Algorithm Engine: http://localhost:8001/api/docs');
  console.log('  Voting Engine:   http://localhost:8002/api/docs');
  console.log('  Dispute Service: http://localhost:8004/api/docs');
  console.log('\n⚡ Development mode active. Press Ctrl+C to stop all services.\n');
}, 3000);

