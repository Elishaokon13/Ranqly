# 📚 Ranqly API Documentation

## 🚀 Complete API Documentation for All Services

This document provides comprehensive API documentation for all Ranqly services after the successful Node.js migration.

---

## 📋 **Service Overview**

| Service | Port | Documentation URL | Description |
|---------|------|-------------------|-------------|
| **API Gateway** | 8000 | `http://localhost:8000/api/docs` | Central API gateway and routing |
| **Algorithm Engine** | 8001 | `http://localhost:8001/api/docs` | NLP scoring and content analysis |
| **Voting Engine** | 8002 | `http://localhost:8002/api/docs` | Blockchain voting and sybil detection |
| **Notification Service** | 8003 | `http://localhost:8003/api/docs` | Real-time notifications |
| **Dispute Service** | 8004 | `http://localhost:8004/api/docs` | Dispute management and resolution |
| **Content Crawler** | 8005 | `http://localhost:8005/api/docs` | Web content crawling |
| **Audit Store** | 8006 | `http://localhost:8006/api/docs` | Audit trails and verification |
| **Governance Service** | 8007 | `http://localhost:8007/api/docs` | DAO governance and voting |

---

## 🔧 **Quick Start**

### **1. Start All Services**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### **2. Access Documentation**
- **Main Documentation**: `http://localhost:8000/api/docs`
- **Individual Services**: `http://localhost:800{1-7}/api/docs`

### **3. Health Checks**
```bash
# Check all services
curl http://localhost:8000/health

# Check individual services
curl http://localhost:8001/health  # Algorithm Engine
curl http://localhost:8002/health  # Voting Engine
curl http://localhost:8003/health  # Notification Service
curl http://localhost:8004/health  # Dispute Service
curl http://localhost:8005/health  # Content Crawler
curl http://localhost:8006/health  # Audit Store
curl http://localhost:8007/health  # Governance Service
```

---

## 📖 **API Endpoints Overview**

### **🔐 Authentication & Authorization**

#### **API Gateway (Port 8000)**
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

#### **Headers Required**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Request-ID: <optional_request_id>
```

---

### **🏆 Contest Management**

#### **API Gateway (Port 8000)**
- `GET /api/contests` - List contests (paginated)
- `POST /api/contests` - Create new contest
- `GET /api/contests/:id` - Get contest details
- `PUT /api/contests/:id` - Update contest
- `DELETE /api/contests/:id` - Delete contest
- `GET /api/contests/:id/submissions` - Get contest submissions
- `POST /api/contests/:id/submit` - Submit to contest

#### **Example Contest Creation**
```json
{
  "title": "AI Art Contest 2024",
  "description": "Create amazing AI-generated artwork",
  "theme": "Digital Art",
  "keywords": ["AI", "art", "digital", "creativity"],
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "prizePool": 10000
}
```

---

### **🧠 Content Scoring & Analysis**

#### **Algorithm Engine (Port 8001)**
- `POST /api/scoring/score` - Score single submission
- `POST /api/scoring/batch-score` - Batch score submissions
- `GET /api/scoring/score/:id` - Get cached score
- `POST /api/scoring/recalculate/:id` - Recalculate score
- `GET /api/scoring/metrics` - Get scoring metrics
- `GET /api/scoring/configuration` - Get scoring config
- `PUT /api/scoring/configuration` - Update scoring config

#### **Four-Axis Scoring System**
```json
{
  "submissionId": "sub_123",
  "content": "Your content here...",
  "contestContext": {
    "contestId": "contest_456",
    "theme": "Digital Art",
    "keywords": ["AI", "art", "digital"],
    "contentType": "image"
  },
  "weights": {
    "depth": 0.4,
    "reach": 0.3,
    "relevance": 0.2,
    "consistency": 0.1
  }
}
```

#### **Scoring Response**
```json
{
  "success": true,
  "data": {
    "submissionId": "sub_123",
    "finalScore": 87.5,
    "scoringBreakdown": {
      "depth": {
        "score": 90,
        "confidence": 0.95,
        "details": {
          "analysisDepth": "comprehensive",
          "technicalComplexity": "high"
        }
      },
      "reach": {
        "score": 85,
        "confidence": 0.88,
        "details": {
          "potentialAudience": "broad",
          "viralPotential": "medium"
        }
      },
      "relevance": {
        "score": 92,
        "confidence": 0.92,
        "details": {
          "themeAlignment": "excellent",
          "keywordRelevance": "high"
        }
      },
      "consistency": {
        "score": 83,
        "confidence": 0.85,
        "details": {
          "styleConsistency": "good",
          "qualityConsistency": "high"
        }
      }
    },
    "weightsUsed": {
      "depth": 0.4,
      "reach": 0.3,
      "relevance": 0.2,
      "consistency": 0.1
    },
    "confidence": 0.9,
    "processingTime": 2.3,
    "timestamp": "2024-01-15T10:30:00Z",
    "modelVersion": "1.2.0"
  }
}
```

---

### **⚖️ Dispute Management**

#### **Dispute Service (Port 8004)**
- `POST /api/disputes` - Create dispute
- `GET /api/disputes` - List disputes (filtered)
- `GET /api/disputes/:id` - Get dispute details
- `PUT /api/disputes/:id` - Update dispute
- `POST /api/disputes/:id/resolve` - Resolve dispute
- `GET /api/disputes/triage` - Get triage queue
- `POST /api/disputes/:id/assign` - Assign resolver

#### **Dispute Types**
- `plagiarism` - Content plagiarism
- `spam` - Spam or low-quality content
- `inappropriate` - Inappropriate content
- `copyright` - Copyright infringement
- `fake_submission` - Fake or manipulated submission
- `other` - Other violations

#### **Example Dispute Creation**
```json
{
  "submissionId": "sub_123",
  "contestId": "contest_456",
  "reporterId": "user_789",
  "disputeType": "plagiarism",
  "reason": "This submission appears to be copied from another source",
  "evidence": [
    "https://example.com/original-source",
    "https://example.com/comparison-image"
  ]
}
```

---

### **🕷️ Web Content Crawling**

#### **Content Crawler (Port 8005)**
- `POST /api/crawler/crawl` - Crawl single URL
- `POST /api/crawler/batch-crawl` - Batch crawl URLs
- `GET /api/crawler/jobs/:id` - Get crawl job status
- `GET /api/crawler/content/:id` - Get crawled content
- `POST /api/crawler/schedule` - Schedule crawl job

#### **Crawl Options**
```json
{
  "url": "https://example.com/article",
  "options": {
    "timeout": 30000,
    "followRedirects": true,
    "extractImages": true,
    "extractLinks": true,
    "extractMetadata": true,
    "extractText": true
  }
}
```

#### **Crawl Result**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/article",
    "title": "Article Title",
    "description": "Article description",
    "content": "Extracted article content...",
    "links": [
      "https://example.com/link1",
      "https://example.com/link2"
    ],
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "metadata": {
      "author": "John Doe",
      "publishDate": "2024-01-15",
      "wordCount": 1250,
      "readingTime": 5
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

### **📋 Audit Trails**

#### **Audit Store (Port 8006)**
- `POST /api/audit/entries` - Create audit entry
- `GET /api/audit/trail/:entityId` - Get audit trail
- `GET /api/audit/entries` - List audit entries
- `GET /api/audit/verify/:entryId` - Verify audit entry
- `GET /api/audit/chain/:entityId` - Get hash chain

#### **Audit Entry Creation**
```json
{
  "eventType": "submission_created",
  "entityId": "sub_123",
  "entityType": "submission",
  "action": "create",
  "data": {
    "contestId": "contest_456",
    "userId": "user_789",
    "contentHash": "sha256:abc123...",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### **Audit Entry Response**
```json
{
  "success": true,
  "data": {
    "id": "audit_123",
    "eventType": "submission_created",
    "entityId": "sub_123",
    "entityType": "submission",
    "action": "create",
    "data": {
      "contestId": "contest_456",
      "userId": "user_789"
    },
    "hash": "sha256:def456...",
    "previousHash": "sha256:ghi789...",
    "timestamp": "2024-01-15T10:30:00Z",
    "blockNumber": 12345,
    "transactionHash": "0xabc123..."
  }
}
```

---

### **🗳️ DAO Governance**

#### **Governance Service (Port 8007)**
- `GET /api/governance/proposals` - List proposals
- `POST /api/governance/proposals` - Create proposal
- `GET /api/governance/proposals/:id` - Get proposal details
- `POST /api/governance/proposals/:id/vote` - Vote on proposal
- `GET /api/governance/members` - List DAO members
- `GET /api/governance/tokens` - Get governance tokens

#### **Proposal Types**
- `parameter_change` - Change protocol parameters
- `treasury_spend` - Spend treasury funds
- `protocol_upgrade` - Upgrade protocol
- `other` - Other governance actions

#### **Example Proposal Creation**
```json
{
  "title": "Increase Contest Prize Pool Limit",
  "description": "Proposal to increase the maximum prize pool limit from $10,000 to $25,000 to accommodate larger contests",
  "proposalType": "parameter_change",
  "parameters": {
    "parameter": "max_prize_pool",
    "currentValue": 10000,
    "newValue": 25000,
    "reasoning": "Larger contests need higher prize pools to attract quality submissions"
  }
}
```

---

### **🔔 Real-time Notifications**

#### **Notification Service (Port 8003)**
- WebSocket connection for real-time updates
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications/mark-read` - Mark notifications as read
- `GET /api/notifications/settings` - Get notification settings
- `PUT /api/notifications/settings` - Update notification settings

#### **WebSocket Events**
```javascript
// Connect to notification service
const socket = io('http://localhost:8003');

// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
});

// Join user-specific room
socket.emit('join-room', userId);

// Listen for specific events
socket.on('scoring-complete', (data) => {
  console.log('Scoring completed:', data);
});

socket.on('dispute-update', (data) => {
  console.log('Dispute update:', data);
});
```

---

### **⛓️ Blockchain Voting**

#### **Voting Engine (Port 8002)**
- `POST /api/voting/commit` - Commit vote
- `POST /api/voting/reveal` - Reveal vote
- `GET /api/voting/rounds/:id` - Get voting round
- `GET /api/voting/results/:id` - Get voting results
- `POST /api/voting/sybil-check` - Check for sybil attacks

#### **Commit-Reveal Voting**
```json
// Step 1: Commit vote
{
  "roundId": "round_123",
  "commitment": "sha256(secret + vote)",
  "timestamp": "2024-01-15T10:30:00Z"
}

// Step 2: Reveal vote (after reveal phase)
{
  "roundId": "round_123",
  "secret": "random_secret_string",
  "vote": {
    "submissionId": "sub_123",
    "score": 85,
    "confidence": 0.9
  }
}
```

---

## 🔍 **Error Handling**

### **Standard Error Response**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "details": {
    "field": "content",
    "issue": "Content must be at least 10 characters long"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456"
}
```

### **Common Error Codes**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## 📊 **Rate Limiting**

### **Rate Limits by Service**
- **API Gateway**: 1000 requests/15min per IP
- **Algorithm Engine**: 100 requests/15min per IP
- **Dispute Service**: 50 requests/15min per IP
- **Content Crawler**: 20 requests/15min per IP
- **Other Services**: 500 requests/15min per IP

### **Headers**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248600
```

---

## 🔐 **Security**

### **Authentication**
- JWT tokens for API authentication
- Token expiration: 24 hours
- Refresh token: 7 days
- Rate limiting on auth endpoints

### **Authorization**
- Role-based access control (RBAC)
- Roles: `user`, `moderator`, `admin`, `super_admin`
- Resource-level permissions

### **Security Headers**
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

---

## 📈 **Monitoring & Metrics**

### **Health Endpoints**
All services provide health check endpoints:
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with dependencies

### **Metrics Endpoints**
- `GET /metrics` - Prometheus metrics
- `GET /api/metrics/custom` - Custom business metrics

### **Logging**
- Structured JSON logging
- Request/response logging
- Error tracking and alerting
- Performance monitoring

---

## 🚀 **Getting Started Examples**

### **1. Create a Contest**
```bash
curl -X POST http://localhost:8000/api/contests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Art Contest",
    "description": "Create amazing AI artwork",
    "theme": "Digital Art",
    "keywords": ["AI", "art", "digital"],
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z",
    "prizePool": 10000
  }'
```

### **2. Submit Content**
```bash
curl -X POST http://localhost:8000/api/contests/contest_123/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "My amazing AI-generated artwork description",
    "contentType": "text",
    "metadata": {
      "imageUrl": "https://example.com/my-artwork.jpg",
      "technique": "stable-diffusion"
    }
  }'
```

### **3. Score Content**
```bash
curl -X POST http://localhost:8001/api/scoring/score \
  -H "Content-Type: application/json" \
  -d '{
    "submissionId": "sub_123",
    "content": "My amazing AI-generated artwork description",
    "contestContext": {
      "contestId": "contest_123",
      "theme": "Digital Art",
      "keywords": ["AI", "art", "digital"],
      "contentType": "text"
    }
  }'
```

---

## 📚 **Additional Resources**

### **Documentation URLs**
- **Main API Docs**: `http://localhost:8000/api/docs`
- **Algorithm Engine**: `http://localhost:8001/api/docs`
- **Voting Engine**: `http://localhost:8002/api/docs`
- **Notification Service**: `http://localhost:8003/api/docs`
- **Dispute Service**: `http://localhost:8004/api/docs`
- **Content Crawler**: `http://localhost:8005/api/docs`
- **Audit Store**: `http://localhost:8006/api/docs`
- **Governance Service**: `http://localhost:8007/api/docs`

### **OpenAPI Specifications**
- **JSON Format**: `http://localhost:800{0-7}/api/docs.json`
- **YAML Format**: Available in each service's `/api/docs` endpoint

### **SDK Libraries**
- **JavaScript/TypeScript**: Available in `sdk/javascript/`
- **Python**: Available in `sdk/python/`

---

## 🎯 **Next Steps**

1. **Start the services**: `npm run dev`
2. **Access documentation**: Visit the service URLs above
3. **Test endpoints**: Use the provided examples
4. **Integrate**: Use the SDK libraries for your application
5. **Monitor**: Check health and metrics endpoints

**The complete Ranqly API is now documented and ready for development!** 🚀

