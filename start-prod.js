/**
 * Production startup script for Ranqly
 * Starts all services using PM2 process manager
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Ranqly in production mode...\n');

// Check if PM2 is installed
const pm2Check = spawn('pm2', ['--version'], { stdio: 'pipe' });

pm2Check.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ PM2 is not installed. Please install PM2 first:');
    console.error('   npm install -g pm2');
    process.exit(1);
  }

  // Start services with PM2
  console.log('📦 Starting services with PM2...\n');

  const pm2Start = spawn('pm2', ['start', 'ecosystem.config.js', '--env', 'production'], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  pm2Start.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ All services started successfully!');
      console.log('\n📊 Service Status:');
      
      // Show PM2 status
      const pm2Status = spawn('pm2', ['status'], {
        cwd: __dirname,
        stdio: 'inherit'
      });

      pm2Status.on('close', () => {
        console.log('\n🌐 Service URLs:');
        console.log('  Frontend:        http://localhost:3000');
        console.log('  API Gateway:     http://localhost:8000');
        console.log('  Algorithm Engine: http://localhost:8001');
        console.log('  Voting Engine:   http://localhost:8002');
        console.log('  Notifications:   http://localhost:8003');
        console.log('  Dispute Service: http://localhost:8004');
        console.log('\n📚 Useful PM2 Commands:');
        console.log('  pm2 status       - View service status');
        console.log('  pm2 logs         - View all logs');
        console.log('  pm2 logs <name>  - View specific service logs');
        console.log('  pm2 restart all  - Restart all services');
        console.log('  pm2 stop all     - Stop all services');
        console.log('  pm2 monit        - Monitor services');
        console.log('\n⚡ Production mode active!\n');
      });
    } else {
      console.error('❌ Failed to start services with PM2');
      process.exit(1);
    }
  });

  pm2Start.on('error', (error) => {
    console.error('❌ Error starting PM2:', error.message);
    process.exit(1);
  });
});

pm2Check.on('error', (error) => {
  console.error('❌ Error checking PM2:', error.message);
  process.exit(1);
});

