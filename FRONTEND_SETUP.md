# Frontend Setup Guide

This guide will help you get the Ranqly frontend running locally.

## Prerequisites

- Node.js 18+ 
- npm 9+
- Docker (optional, for containerized development)

## Quick Start

### Option 1: Local Development (Recommended)

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - The frontend will automatically proxy API requests to http://localhost:8000

### Option 2: Using the startup script

```bash
./start-frontend.sh
```

### Option 3: Docker Development

1. **Start with Docker:**
   ```bash
   ./start-frontend-docker.sh
   ```

2. **Or manually with Docker Compose:**
   ```bash
   docker-compose -f docker-compose.frontend.yml up --build
   ```

## Environment Variables

The frontend uses the following environment variables:

- `VITE_API_URL`: Backend API URL (default: http://localhost:8000)
- `VITE_BLOCKCHAIN_RPC_URL`: Blockchain RPC URL (default: http://localhost:8545)
- `VITE_SOCKET_URL`: WebSocket URL (default: ws://localhost:8000)
- `VITE_WALLET_CONNECT_PROJECT_ID`: WalletConnect Project ID
- `VITE_ENVIRONMENT`: Environment (development/production)

## Troubleshooting

### Common Issues

1. **Port 3000 already in use:**
   ```bash
   # Kill process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Dependencies installation fails:**
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

3. **Docker build fails:**
   ```bash
   # Clean Docker cache
   docker system prune -a
   docker-compose -f docker-compose.frontend.yml build --no-cache
   ```

### Development Tips

- The frontend uses Vite for fast development builds
- Hot module replacement is enabled for instant updates
- TypeScript is configured with strict mode
- Tailwind CSS is used for styling
- The app uses React Router for navigation

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks
- `npm run test` - Run tests

## Project Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions
│   ├── services/      # API and external services
│   ├── store/         # State management
│   └── utils/         # Helper functions
├── public/            # Static assets
├── dist/              # Build output
└── package.json       # Dependencies and scripts
```

## API Integration

The frontend expects the following backend services to be running:

- API Gateway on port 8000
- WebSocket server on port 8000
- Blockchain RPC on port 8545 (Hardhat)

## Web3 Integration

The frontend supports:

- MetaMask and other Web3 wallets
- Multiple blockchain networks (Polygon, Optimism, Arbitrum)
- WalletConnect integration
- Transaction signing and verification

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify all environment variables are set correctly
3. Ensure backend services are running
4. Check network connectivity between frontend and backend
