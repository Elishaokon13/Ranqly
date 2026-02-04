# Ranqly API Documentation

## Overview

The Ranqly API provides programmatic access to all platform functionality including contest management, content analysis, voting systems, and dispute resolution.

## Base URL

- **Development**: `http://localhost:8000`
- **Staging**: `https://api-staging.ranqly.com`
- **Production**: `https://api.ranqly.com`

## Authentication

Most endpoints require authentication via API key or wallet signature.

```bash
# API Key Authentication
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     https://api.ranqly.com/v1/contests

# Wallet Signature Authentication
curl -H "X-Wallet-Address: 0x..." \
     -H "X-Signature: 0x..." \
     -H "X-Message: ..." \
     https://api.ranqly.com/v1/contests
```

## Rate Limits

- **Free Tier**: 100 requests/hour
- **Pro Tier**: 1,000 requests/hour
- **Enterprise**: 10,000 requests/hour

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Error Handling

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required field: contestId",
    "details": { ... }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## API Endpoints

### Contest Management

#### Create Contest
```http
POST /api/v1/contests
```

**Request Body:**
```json
{
  "title": "Best DeFi Tutorial Contest",
  "description": "Create the most comprehensive DeFi tutorial",
  "rewardAmount": "2.5",
  "rewardToken": "ETH",
  "submissionDeadline": "2024-02-01T00:00:00Z",
  "votingDeadline": "2024-02-08T00:00:00Z",
  "judgingDeadline": "2024-02-15T00:00:00Z",
  "scoringWeights": {
    "algorithm": 0.4,
    "community": 0.3,
    "judges": 0.3
  },
  "rules": {
    "maxSubmissions": 3,
    "contentTypes": ["blog", "video", "tutorial"],
    "minWordCount": 500
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contestId": "contest_123",
    "title": "Best DeFi Tutorial Contest",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00Z",
    "submissionDeadline": "2024-02-01T00:00:00Z",
    "votingDeadline": "2024-02-08T00:00:00Z",
    "judgingDeadline": "2024-02-15T00:00:00Z"
  }
}
```

#### Get Contest
```http
GET /api/v1/contests/{contestId}
```

#### List Contests
```http
GET /api/v1/contests
```

**Query Parameters:**
- `status`: Filter by contest status (active, completed, upcoming)
- `limit`: Number of contests to return (default: 20)
- `offset`: Number of contests to skip (default: 0)

### Content Submission

#### Submit Content
```http
POST /api/v1/contests/{contestId}/submissions
```

**Request Body:**
```json
{
  "title": "Complete Guide to DeFi Yield Farming",
  "contentReferences": [
    {
      "url": "https://example.com/defi-guide",
      "type": "url",
      "title": "DeFi Yield Farming Tutorial",
      "description": "Comprehensive guide covering all aspects"
    }
  ],
  "metadata": {
    "contentType": "blog",
    "tags": ["defi", "yield-farming", "tutorial"],
    "estimatedReadTime": "15 minutes"
  }
}
```

#### Get Submission
```http
GET /api/v1/submissions/{submissionId}
```

#### List Contest Submissions
```http
GET /api/v1/contests/{contestId}/submissions
```

### Content Analysis

#### Analyze Content
```http
POST /api/v1/analyze
```

**Request Body:**
```json
{
  "content": "Content to analyze...",
  "contentType": "blog",
  "contestId": "contest_123",
  "submissionId": "submission_456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": "submission_456",
    "contestId": "contest_123",
    "analysisResult": {
      "overallScore": 0.85,
      "algoScore": 87.5,
      "depthScore": 92.0,
      "reachScore": 78.5,
      "relevanceScore": 89.2,
      "consistencyScore": 84.3,
      "analysisDetails": {
        "scoringBreakdown": {
          "depth": {
            "score": 92.0,
            "weight": 0.4,
            "contribution": 36.8,
            "description": "Content substance and insight level"
          }
        }
      }
    }
  }
}
```

#### Four-Axis Scoring
```http
POST /api/v1/four-axis-score
```

### Voting System

#### Create Voting Session
```http
POST /api/v1/voting/session/create
```

**Request Body:**
```json
{
  "contestId": "contest_123",
  "config": {
    "poiNFTContract": "0x...",
    "entryIds": ["entry_1", "entry_2", "entry_3"],
    "maxUpvotes": 5,
    "maxDownvotes": 2,
    "commitPhaseStart": "2024-02-01T00:00:00Z",
    "commitPhaseEnd": "2024-02-02T00:00:00Z",
    "revealPhaseStart": "2024-02-02T01:00:00Z",
    "revealPhaseEnd": "2024-02-03T00:00:00Z"
  }
}
```

#### Commit Vote
```http
POST /api/v1/voting/commit-enhanced
```

**Request Body:**
```json
{
  "contestId": "contest_123",
  "voterAddress": "0x...",
  "voteData": {
    "votes": [
      {
        "entryId": "entry_1",
        "voteType": 1,
        "reason": "U1",
        "justification": "This entry provides unique insights into DeFi protocols"
      }
    ],
    "nonce": "random_nonce",
    "timestamp": "2024-02-01T12:00:00Z"
  }
}
```

#### Reveal Vote
```http
POST /api/v1/voting/reveal-enhanced
```

#### Get Voting Results
```http
GET /api/v1/voting/{contestId}/results-enhanced
```

### PoI NFT Management

#### Check PoI Status
```http
GET /api/v1/poi/status/{address}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "hasPoI": true,
    "tokenId": "123",
    "mintedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Mint PoI NFT
```http
POST /api/v1/poi/mint
```

**Request Body:**
```json
{
  "userAddress": "0x...",
  "mintFee": "0.01",
  "signature": "0x...",
  "nonce": "123"
}
```

### Anonymous Judging

#### Create Judging Session
```http
POST /api/v1/judge/session/create
```

**Request Body:**
```json
{
  "contestId": "contest_123",
  "entryIds": ["entry_1", "entry_2", "entry_3"],
  "judgeIds": ["judge_1", "judge_2", "judge_3"]
}
```

#### Submit Judge Ballot
```http
POST /api/v1/judge/ballot/submit
```

**Request Body:**
```json
{
  "sessionId": "session_456",
  "judgeId": "judge_1",
  "rankings": {
    "entry_1": 1,
    "entry_2": 3,
    "entry_3": 2
  },
  "rationales": {
    "entry_1": "Excellent technical depth and clear explanations",
    "entry_2": "Good content but lacks originality",
    "entry_3": "Solid entry with good practical examples"
  }
}
```

#### Get Judging Results
```http
GET /api/v1/judge/session/{sessionId}/results
```

### Dispute System

#### File Dispute
```http
POST /api/v1/dispute/file
```

**Request Body:**
```json
{
  "contestId": "contest_123",
  "entryId": "entry_1",
  "reasonCode": "A1",
  "explanation": "This content appears to be plagiarized from another source",
  "evidence": [
    "https://example.com/original-source",
    "Screenshot of duplicate content"
  ],
  "filerAddress": "0x...",
  "isAnonymous": false
}
```

#### Submit Nomination
```http
POST /api/v1/nomination/submit
```

**Request Body:**
```json
{
  "contestId": "contest_123",
  "entryId": "entry_1",
  "nominatorAddress": "0x...",
  "reason": "High quality technical content",
  "justification": "This entry provides deep technical insights that deserve more recognition",
  "isAnonymous": false
}
```

#### Get Contest Disputes
```http
GET /api/v1/dispute/contest/{contestId}
```

### Content Caching

#### Submit Content for Caching
```http
POST /api/v1/content/submit
```

**Request Body:**
```json
{
  "submissionId": "submission_123",
  "contestId": "contest_456",
  "submitterAddress": "0x...",
  "contentReferences": [
    {
      "url": "https://example.com/content",
      "type": "url",
      "title": "Content Title",
      "description": "Content description"
    }
  ]
}
```

#### Get Cached Content
```http
GET /api/v1/content/{contentHash}
```

## Webhooks

Configure webhooks to receive real-time notifications about contest events.

### Webhook Events

- `contest.created`
- `submission.submitted`
- `voting.completed`
- `judging.completed`
- `dispute.filed`
- `contest.finalized`

### Webhook Payload

```json
{
  "event": "contest.finalized",
  "data": {
    "contestId": "contest_123",
    "finalScores": [...],
    "winners": [...]
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## SDKs

### JavaScript SDK

```bash
npm install @ranqly/sdk
```

```javascript
import { RanqlyClient } from '@ranqly/sdk';

const client = new RanqlyClient({
  apiKey: 'your-api-key',
  network: 'mainnet'
});

// Create contest
const contest = await client.contests.create({
  title: 'My Contest',
  description: 'Contest description',
  rewardAmount: '1.0'
});

// Submit content
const submission = await client.submissions.create({
  contestId: contest.id,
  contentReferences: [{
    url: 'https://example.com/content'
  }]
});
```

### Python SDK

```bash
pip install ranqly-sdk
```

```python
from ranqly import RanqlyClient

client = RanqlyClient(api_key='your-api-key')

# Create contest
contest = client.contests.create(
    title='My Contest',
    description='Contest description',
    reward_amount='1.0'
)

# Submit content
submission = client.submissions.create(
    contest_id=contest.id,
    content_references=[{
        'url': 'https://example.com/content'
    }]
)
```

## Testing

Use our sandbox environment for testing:

```bash
# Set sandbox API key
export RANQLY_API_KEY="sandbox_..."

# Use sandbox endpoints
curl https://api-sandbox.ranqly.com/v1/contests
```

## Support

- **Documentation**: [docs.ranqly.com](https://docs.ranqly.com)
- **Discord**: [discord.gg/ranqly](https://discord.gg/ranqly)
- **Email**: api-support@ranqly.com
