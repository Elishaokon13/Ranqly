/**
 * Server entry point for Ranqly Backend
 */

import { RanqlyApp } from './app';

// Create and start the application
const app = new RanqlyApp();

// Initialize and start the server
app.initialize()
  .then(() => app.start())
  .catch((error) => {
    console.error('Failed to start Ranqly Backend Server:', error);
    process.exit(1);
  });

export default app;


