# 🏗️ Ranqly Backend Restructure Plan

## 🎯 **Goal: Single Backend Server with Organized Modules**

Transform from **8 separate microservices** to **1 unified backend server** with properly organized service modules.

---

## 📋 **Current Structure (Microservices)**
```
Ranqly/
├── services/
│   ├── api-gateway/          (Port 8000)
│   ├── algo-engine/          (Port 8001) 
│   ├── voting-engine/        (Port 8002)
│   ├── notification-service/ (Port 8003)
│   ├── dispute-service/      (Port 8004)
│   ├── content-crawler/      (Port 8005)
│   ├── audit-store/          (Port 8006)
│   ├── governance-service/   (Port 8007)
│   └── ... (other services)
├── frontend/
└── contracts/
```

## 🎯 **Target Structure (Monorepo)**
```
Ranqly/
├── frontend/                 # React frontend
├── backend/                  # Single Node.js backend server
│   ├── src/
│   │   ├── modules/          # Organized service modules
│   │   │   ├── auth/         # Authentication & authorization
│   │   │   ├── contests/     # Contest management
│   │   │   ├── scoring/      # Algorithm engine (NLP scoring)
│   │   │   ├── voting/       # Voting engine (blockchain)
│   │   │   ├── notifications/ # Real-time notifications
│   │   │   ├── disputes/     # Dispute management
│   │   │   ├── crawler/      # Content crawling
│   │   │   ├── audit/        # Audit trails
│   │   │   └── governance/   # DAO governance
│   │   ├── shared/           # Shared utilities
│   │   │   ├── database/     # Database service
│   │   │   ├── redis/        # Redis service
│   │   │   ├── queue/        # Queue service
│   │   │   ├── blockchain/   # Blockchain service
│   │   │   ├── middleware/   # Express middleware
│   │   │   ├── utils/        # Utility functions
│   │   │   └── types/        # TypeScript types
│   │   ├── routes/           # Main route handlers
│   │   ├── app.ts            # Express app setup
│   │   └── server.ts         # Server startup
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── contracts/                # Smart contracts
└── package.json              # Root package.json
```

---

## 🔄 **Migration Strategy**

### **Phase 1: Create Unified Backend Structure**
1. Create `backend/` directory
2. Set up unified Express server
3. Create modular service structure
4. Move shared utilities to `shared/`

### **Phase 2: Consolidate Services**
1. Move each service logic to respective modules
2. Update routing to use module-based endpoints
3. Consolidate database and Redis connections
4. Merge configuration and environment setup

### **Phase 3: Update API Structure**
- **Before**: `http://localhost:8001/api/scoring/score`
- **After**: `http://localhost:8000/api/scoring/score`

### **Phase 4: Update Documentation**
1. Update README.md for new structure
2. Update Swagger documentation
3. Update deployment configurations

---

## 🌐 **New API Structure**

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

## 📦 **Benefits of Unified Backend**

### **✅ Simplified Architecture**
- **Single server** instead of 8 separate services
- **Shared resources** (database, Redis, blockchain)
- **Unified configuration** and environment management
- **Easier deployment** and monitoring

### **✅ Better Development Experience**
- **Single codebase** to maintain
- **Shared utilities** and middleware
- **Consistent API structure**
- **Easier testing** and debugging

### **✅ Improved Performance**
- **Shared connections** to external services
- **Reduced overhead** from multiple servers
- **Better resource utilization**
- **Simplified load balancing**

### **✅ Easier Operations**
- **Single deployment** target
- **Unified logging** and monitoring
- **Simplified health checks**
- **Easier scaling** and maintenance

---

## 🛠️ **Implementation Steps**

1. **Create backend structure** with modules
2. **Consolidate shared services** (database, Redis, etc.)
3. **Move service logic** to respective modules
4. **Update routing** for unified API
5. **Update configuration** and environment
6. **Test all endpoints** work correctly
7. **Update documentation** and README
8. **Remove old microservices** structure

---

## 🎯 **Success Criteria**

- ✅ **Single backend server** running on port 8000
- ✅ **All API endpoints** accessible from single server
- ✅ **Proper module organization** for maintainability
- ✅ **Shared services** working correctly
- ✅ **Updated documentation** reflecting new structure
- ✅ **Clean monorepo** structure: frontend, backend, contracts

This restructure will make your Ranqly project much more maintainable and easier to develop with!


