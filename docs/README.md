# Ranqly: The Fair Content Layer for Web3

## 📖 Overview

Ranqly is a Web3-native ranking and contest engine that brings fairness, transparency, and auditability to content bounties. It combines algorithmic scoring, NFT-gated community voting with mandatory rationale, anonymous expert judging, and a structured dispute/appeal process.

## 🎯 Key Features

### ✅ **Four-Axis Algorithmic Scoring**
- **Depth (40%)**: Content substance and insight analysis
- **Reach (30%)**: Audience engagement and social metrics
- **Relevance (20%)**: Topic alignment with contest theme
- **Consistency (10%)**: Quality guidelines and plagiarism checks

### ✅ **Proof-of-Impact (PoI) Voting NFT**
- Soulbound, non-transferable tokens
- One NFT per person for voting rights
- Fixed mint window before submissions
- Anti-sybil mechanisms

### ✅ **Commit-Reveal Voting System**
- K upvotes and L downvotes per voter (default K=5, L=2)
- Mandatory justification sentences
- Reason codes for accountability
- Cluster detection for manipulation prevention

### ✅ **Anonymous Judging Process**
- Independent judge rankings
- Borda count aggregation
- Written rationales for transparency
- Randomized entry presentation

### ✅ **Structured Dispute System**
- Evidence-based dispute filing
- Anonymous triage reviewers
- Public dispute logs
- Nomination system for underrated content

### ✅ **ContestVault Smart Contracts**
- Multi-signature escrow system
- Fund locking until contest finalization
- Automated payout distribution

### ✅ **Content Caching Layer**
- IPFS/Arweave integration
- Immutable content storage
- Content fingerprinting and verification

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Microservices │
│   (React)       │◄──►│   (Port 8000)   │◄──►│   (Ports 8001+) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   Smart         │
                       │   Contracts     │
                       │   (Hardhat)     │
                       └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   Infrastructure│
                       │   (Postgres,    │
                       │    Redis, IPFS) │
                       └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+
- Git

### 1. Clone Repository
```bash
git clone https://github.com/ranqly/ranqly.git
cd ranqly
```

### 2. Start Development Environment
```bash
docker-compose -f deployment/docker/docker-compose.dev.yml up --build
```

### 3. Deploy Smart Contracts
```bash
cd contracts
npm install
npm run deploy:ranqly
```

### 4. Access Services
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **Algo Engine**: http://localhost:8001
- **Voting Engine**: http://localhost:8002
- **Judge Service**: http://localhost:8009
- **Dispute Service**: http://localhost:8010
- **Content Crawler**: http://localhost:8011

## 📚 Documentation

### Technical Documentation
- [API Reference](./api/README.md)
- [Smart Contract Documentation](./smart-contracts/README.md)
- [Architecture Guide](./architecture/README.md)
- [Deployment Guide](./deployment/README.md)

### User Guides
- [Contest Creation Guide](./user-guides/contest-creation.md)
- [Voting Guide](./user-guides/voting.md)
- [Judging Guide](./user-guides/judging.md)
- [Dispute Resolution](./user-guides/disputes.md)

### Developer Resources
- [SDK Documentation](./sdk/README.md)
- [Integration Examples](./examples/README.md)
- [Testing Guide](./testing/README.md)

## 🔧 Configuration

### Environment Variables
```bash
# Blockchain
BLOCKCHAIN_RPC=http://hardhat:8545
POI_NFT_CONTRACT=0x742d35Cc6634C0532925a3b8D5a0F6b2e1E8C1e

# IPFS
IPFS_HOST=localhost
IPFS_PORT=5001

# Database
DATABASE_URL=postgresql://ranqly:password@localhost:5432/ranqly
REDIS_URL=redis://localhost:6379
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Smart Contract Tests
```bash
cd contracts
npm test
```

## 📊 Monitoring

### Health Checks
All services provide health check endpoints:
- `/health` - Service status and metrics

### Logs
```bash
docker-compose logs -f [service-name]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.ranqly.com](https://docs.ranqly.com)
- **Discord**: [discord.gg/ranqly](https://discord.gg/ranqly)
- **GitHub Issues**: [github.com/ranqly/ranqly/issues](https://github.com/ranqly/ranqly/issues)

## 🔗 Links

- **Website**: [ranqly.com](https://ranqly.com)
- **Whitepaper**: [whitepaper.ranqly.com](https://whitepaper.ranqly.com)
- **Demo**: [demo.ranqly.com](https://demo.ranqly.com)

---

**Built with ❤️ by the Ranqly Team**
