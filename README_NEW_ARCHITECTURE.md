# 🚀 Ranqly - Web3 Ranking and Contest Engine

**Node.js-Only Architecture - No Docker Required**

## 📋 Overview

Ranqly is a Web3-native ranking and contest engine that ensures fairness, transparency, and auditability. This version has been completely restructured to use **Node.js exclusively**, removing all Python dependencies and Docker containerization for a simpler, more maintainable architecture.

## 🏗️ Architecture

### **Before (Mixed Python/Node.js + Docker)**
- ❌ Python services (algo-engine, dispute-service, etc.)
- ❌ Docker containers and orchestration
- ❌ Kubernetes deployment complexity
- ❌ Mixed technology stack maintenance

### **After (Pure Node.js)**
- ✅ All services in TypeScript/Node.js
- ✅ Direct process management with PM2
- ✅ Simplified deployment and development
- ✅ Unified technology stack
- ✅ Better performance and resource utilization

## 🛠️ Technology Stack

### **Core Technologies**
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Process Management**: PM2
- **Database**: PostgreSQL
- **Cache**: Redis
- **Queue**: Bull (Redis-based)
- **Monitoring**: Prometheus + custom metrics

### **Services Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  API Gateway    │    │ Voting Engine   │
│   (React)       │◄──►│   (Express)     │◄──►│   (Express)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌────────┼────────┐
                       ▼        ▼        ▼
                ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                │Algo Engine  │ │Dispute Svc  │ │Notification │
                │ (Express)   │ │ (Express)   │ │ (Express)   │
                └─────────────┘ └─────────────┘ └─────────────┘
```

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- npm 9+
- PostgreSQL 15+
- Redis 7+

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/ranqly/ranqly.git
   cd ranqly
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   npm run migrate
   npm run seed
   ```

### **Development Mode**

```bash
# Start all services in development mode
npm run dev

# Or use the development script
node start-dev.js
```

**Service URLs:**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8000
- Algorithm Engine: http://localhost:8001
- Voting Engine: http://localhost:8002
- Notifications: http://localhost:8003
- Dispute Service: http://localhost:8004

### **Production Mode**

```bash
# Build all services
npm run build

# Start with PM2
npm start

# Or use the production script
node start-prod.js
```

## 📦 Services Overview

### **1. API Gateway** (Port 8000)
- **Purpose**: Central entry point for all API requests
- **Features**: Authentication, rate limiting, request routing
- **Tech**: Express.js, JWT, Helmet

### **2. Algorithm Engine** (Port 8001)
- **Purpose**: NLP scoring and content analysis
- **Features**: Four-axis scoring, ML models, batch processing
- **Tech**: Express.js, Natural.js, TensorFlow.js, Hugging Face

### **3. Voting Engine** (Port 8002)
- **Purpose**: Community voting and sybil detection
- **Features**: Commit-reveal voting, blockchain integration
- **Tech**: Express.js, ethers.js, WebSocket

### **4. Notification Service** (Port 8003)
- **Purpose**: Real-time notifications and communications
- **Features**: Email, push notifications, WebSocket
- **Tech**: Express.js, Socket.io, SMTP

### **5. Dispute Service** (Port 8004)
- **Purpose**: Dispute triage and resolution
- **Features**: Automated triage, resolution workflows
- **Tech**: Express.js, Bull queues, Redis

### **6. Frontend** (Port 3000)
- **Purpose**: User interface and dashboard
- **Features**: React, Web3 integration, real-time updates
- **Tech**: React, Vite, wagmi, Tailwind CSS

## 🔧 Development

### **Available Scripts**

```bash
# Development
npm run dev              # Start all services in development
npm run dev:services     # Start only backend services
npm run dev:frontend     # Start only frontend

# Building
npm run build            # Build all services
npm run build:services   # Build only backend services
npm run build:frontend   # Build only frontend

# Testing
npm test                 # Run all tests
npm run test:contracts   # Test smart contracts
npm run test:e2e         # Run end-to-end tests

# Linting
npm run lint             # Lint all code
npm run lint:fix         # Fix linting issues

# Process Management
npm start                # Start with PM2
npm stop                 # Stop all services
npm restart              # Restart all services
npm run logs             # View logs

# Database
npm run migrate          # Run database migrations
npm run seed             # Seed database with test data
```

### **Service Development**

Each service follows the same structure:

```
services/
├── service-name/
│   ├── src/
│   │   ├── main.ts              # Entry point
│   │   ├── services/            # Business logic
│   │   ├── routes/              # API routes
│   │   ├── middleware/          # Express middleware
│   │   ├── utils/               # Utilities
│   │   └── types/               # TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   └── dist/                    # Built files
```

### **Adding a New Service**

1. Create service directory:
   ```bash
   mkdir services/my-service
   cd services/my-service
   ```

2. Initialize package.json:
   ```bash
   npm init -y
   ```

3. Add dependencies and scripts
4. Create src/main.ts with Express app
5. Add to workspace in root package.json
6. Add to ecosystem.config.js for PM2

## 🚀 Deployment

### **Production Deployment**

1. **Server Setup**
   ```bash
   # Install Node.js and PM2
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   
   # Install PostgreSQL and Redis
   sudo apt-get install postgresql redis-server
   ```

2. **Application Deployment**
   ```bash
   # Clone and setup
   git clone https://github.com/ranqly/ranqly.git
   cd ranqly
   npm run install:all
   npm run build
   
   # Start services
   npm start
   ```

3. **Process Management**
   ```bash
   # View status
   pm2 status
   
   # View logs
   pm2 logs
   
   # Restart services
   pm2 restart all
   
   # Stop services
   pm2 stop all
   ```

### **Environment Variables**

Key environment variables for each service:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ranqly
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ranqly
DATABASE_USER=ranqly
DATABASE_PASSWORD=your_password

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Blockchain
BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/your-key
POI_NFT_CONTRACT_ADDRESS=0x...
CONTEST_REGISTRY_ADDRESS=0x...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📊 Monitoring

### **Health Checks**

Each service provides health check endpoints:

```bash
# Basic health check
curl http://localhost:8000/health

# Detailed health check
curl http://localhost:8000/health/detailed

# Service-specific health
curl http://localhost:8001/health
curl http://localhost:8002/health
```

### **Metrics**

Prometheus-compatible metrics available at `/metrics`:

```bash
# View metrics
curl http://localhost:8000/metrics
curl http://localhost:8001/metrics
```

### **PM2 Monitoring**

```bash
# Real-time monitoring
pm2 monit

# View process information
pm2 show api-gateway

# View logs
pm2 logs --lines 100
```

## 🔧 Troubleshooting

### **Common Issues**

1. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :8000
   
   # Kill process
   kill -9 <PID>
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check connection
   psql -h localhost -U ranqly -d ranqly
   ```

3. **Redis Connection Issues**
   ```bash
   # Check Redis status
   sudo systemctl status redis
   
   # Test connection
   redis-cli ping
   ```

4. **Service Won't Start**
   ```bash
   # Check logs
   pm2 logs <service-name>
   
   # Check configuration
   pm2 show <service-name>
   
   # Restart service
   pm2 restart <service-name>
   ```

### **Performance Optimization**

1. **Memory Usage**
   ```bash
   # Monitor memory
   pm2 monit
   
   # Set memory limits in ecosystem.config.js
   max_memory_restart: '1G'
   ```

2. **Database Optimization**
   - Add indexes for frequently queried fields
   - Use connection pooling
   - Monitor slow queries

3. **Redis Optimization**
   - Configure appropriate memory limits
   - Use Redis persistence appropriately
   - Monitor cache hit rates

## 📚 API Documentation

Each service provides its own API documentation:

- **API Gateway**: http://localhost:8000/api/docs
- **Algorithm Engine**: http://localhost:8001/api/docs
- **Voting Engine**: http://localhost:8002/api/docs
- **Dispute Service**: http://localhost:8004/api/docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### **Development Guidelines**

- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.ranqly.io](https://docs.ranqly.io)
- **Discord**: [discord.gg/ranqly](https://discord.gg/ranqly)
- **Email**: support@ranqly.io
- **Issues**: [GitHub Issues](https://github.com/ranqly/ranqly/issues)

---

**🎉 Welcome to the new Node.js-only Ranqly architecture!**

