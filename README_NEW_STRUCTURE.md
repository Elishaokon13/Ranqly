# 🏆 Ranqly - The Fair Content Layer for Web3

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Compatible-627eea.svg)](https://ethereum.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Web3-native ranking and contest engine ensuring fairness, transparency, and auditability**

Ranqly is a decentralized platform that revolutionizes content ranking and contest management through blockchain technology, advanced NLP scoring algorithms, and transparent governance mechanisms.

## 🏗️ **New Architecture Overview**

Ranqly has been restructured as a **monorepo** with a **unified backend architecture**:

```
Ranqly/
├── backend/          # Single Node.js backend server
├── frontend/         # React frontend application  
└── contracts/        # Smart contracts
```

### **🚀 Unified Backend Server**
- **Single server** running on port 8000
- **Modular architecture** with organized service modules
- **Shared services** (database, Redis, blockchain)
- **Unified API** with versioned endpoints

---

## 🌐 **API Structure**

### **Single Server (Port 8000)**
```
http://localhost:8000/
├── /api/auth/*              # Authentication endpoints
├── /api/contests/*          # Contest management
├── /api/scoring/*           # Algorithm engine
├── /api/voting/*            # Voting engine
├── /api/notifications/*     # Notifications
├── /api/disputes/*          # Dispute management
├── /api/crawler/*           # Content crawling
├── /api/audit/*             # Audit trails
├── /api/governance/*        # DAO governance
├── /health                  # Health check
├── /metrics                 # Metrics
└── /docs                    # Swagger documentation
```

---

## 🚀 **Quick Start**

### **1. Install Dependencies**
```bash
# Install all workspace dependencies
npm run install:all
```

### **2. Setup Environment**
```bash
# Copy environment file
cp backend/env.example backend/.env

# Edit backend/.env with your configuration
```

### **3. Start Development**
```bash
# Start backend and frontend
npm run dev

# Or start individually
npm run dev:backend    # Backend only (port 8000)
npm run dev:frontend   # Frontend only (port 3000)
```

### **4. Access the Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 📊 **Backend Modules**

### **🔐 Authentication (`/api/auth`)**
- User registration and login
- JWT token management
- Role-based access control
- Wallet integration

### **🏆 Contests (`/api/contests`)**
- Contest creation and management
- Submission handling
- Contest lifecycle management
- Prize pool management

### **🧠 Scoring (`/api/scoring`)**
- NLP-based content analysis
- Four-axis scoring system
- Batch processing
- Model management

### **🗳️ Voting (`/api/voting`)**
- Commit-reveal voting
- PoI NFT integration
- Sybil detection
- Vote tallying

### **🔔 Notifications (`/api/notifications`)**
- Real-time notifications
- WebSocket integration
- Notification preferences
- Push notifications

### **⚖️ Disputes (`/api/disputes`)**
- Dispute creation and management
- Triage system
- Resolution workflows
- Evidence handling

### **🕷️ Crawler (`/api/crawler`)**
- Web content crawling
- Content extraction
- Batch processing
- URL validation

### **📋 Audit (`/api/audit`)**
- Immutable audit trails
- Hash chain verification
- Blockchain integration
- Audit reporting

### **🗳️ Governance (`/api/governance`)**
- DAO proposal management
- Voting mechanisms
- Treasury management
- Parameter updates

---

## 🛠️ **Development Commands**

### **Backend Commands**
```bash
cd backend

# Development
npm run dev              # Start with nodemon
npm run build           # Build TypeScript
npm run start           # Start production server

# Testing
npm run test            # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# Linting
npm run lint            # Check code
npm run lint:fix        # Fix issues
```

### **Frontend Commands**
```bash
cd frontend

# Development
npm run dev             # Start dev server
npm run build           # Build for production
npm run preview         # Preview build

# Testing
npm run test            # Run tests
npm run test:ui         # Test UI
```

### **Root Commands**
```bash
# Development
npm run dev             # Start backend + frontend
npm run dev:backend     # Backend only
npm run dev:frontend    # Frontend only

# Building
npm run build           # Build all workspaces
npm run build:backend   # Build backend only
npm run build:frontend  # Build frontend only

# Utilities
npm run install:all     # Install all dependencies
npm run clean           # Clean all workspaces
npm run health          # Check backend health
npm run docs            # Show API docs URL
```

---

## 📚 **API Documentation**

### **Interactive Swagger UI**
Visit http://localhost:8000/docs for complete API documentation with:
- **Interactive testing** of all endpoints
- **Request/response schemas** with validation
- **Authentication** examples and testing
- **Error handling** documentation
- **Real examples** for all operations

### **API Endpoints Overview**

#### **Authentication**
```bash
POST /api/auth/register     # Register new user
POST /api/auth/login        # User login
GET  /api/auth/profile      # Get user profile
```

#### **Contests**
```bash
GET    /api/contests        # List contests
POST   /api/contests        # Create contest
GET    /api/contests/:id    # Get contest details
PUT    /api/contests/:id    # Update contest
DELETE /api/contests/:id    # Delete contest
```

#### **Scoring**
```bash
POST /api/scoring/score           # Score single submission
POST /api/scoring/batch-score     # Batch scoring
GET  /api/scoring/metrics         # Scoring metrics
GET  /api/scoring/configuration   # Get configuration
```

---

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Server Configuration
PORT=8000
HOST=localhost
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ranqly
DB_USER=ranqly
DB_PASSWORD=ranqly

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Blockchain
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_CHAIN_ID=31337
```

---

## 🎯 **Benefits of New Architecture**

### **✅ Simplified Development**
- **Single backend** to maintain and deploy
- **Shared utilities** and middleware
- **Consistent API** structure across all modules
- **Easier testing** and debugging

### **✅ Better Performance**
- **Shared database connections**
- **Reduced overhead** from multiple servers
- **Better resource utilization**
- **Simplified load balancing**

### **✅ Easier Operations**
- **Single deployment** target
- **Unified logging** and monitoring
- **Simplified health checks**
- **Easier scaling** and maintenance

### **✅ Improved Developer Experience**
- **Monorepo structure** for easy navigation
- **Shared TypeScript types**
- **Consistent code patterns**
- **Better IDE support**

---

## 🚀 **Production Deployment**

### **Simple Node.js Deployment**
```bash
# Build the application
npm run build

# Start production server
npm run start

# Or use PM2 for process management
npm install -g pm2
pm2 start backend/dist/server.js --name ranqly-backend
```

### **Environment Setup**
1. Set up PostgreSQL database
2. Set up Redis cache
3. Configure environment variables
4. Deploy smart contracts
5. Start the backend server

---

## 📈 **Migration from Microservices**

The project has been successfully migrated from **8 separate microservices** to **1 unified backend**:

### **Before (Microservices)**
- 8 separate Node.js servers
- Complex service communication
- Multiple deployment targets
- Docker complexity

### **After (Unified Backend)**
- 1 powerful Node.js server
- Modular service organization
- Single deployment target
- Simplified operations

---

## 🎉 **Getting Started**

1. **Clone the repository**
2. **Install dependencies**: `npm run install:all`
3. **Setup environment**: Copy and configure `backend/env.example`
4. **Start development**: `npm run dev`
5. **Access documentation**: http://localhost:8000/docs
6. **Start building**: Use the modular API structure

**Your unified Ranqly backend is ready for development!** 🚀

---

## 📞 **Support**

- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **API Status**: Check the `/health` endpoint for service status

**The new unified architecture makes Ranqly easier to develop, deploy, and maintain!** 🎯


