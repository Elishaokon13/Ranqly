# Ranqly: The Fair Content Layer for Web3

## Executive Summary

Ranqly is a Web3-native ranking and contest engine that brings fairness, transparency, and auditability to content bounties. It combines algorithmic scoring, NFT-gated community voting with mandatory rationale, anonymous expert judging, and a structured dispute/appeal process. Ranqly itself never holds bounty funds – it computes and returns ranked outcomes and publishes full audit artifacts (scores, ballots, dispute logs, code hashes, etc.) for integrators to verify and use in disbursing rewards.

## Problem Statement

Blockchain projects and DAOs often run bounties or contests to incentivize high-value content (blog posts, tutorials, videos, designs, memes, etc.). In practice, however, trust and quality problems arise:

1. **Spam and "create-to-earn" farming**: Many submissions are boilerplate or plagiarized, produced solely to grab rewards
2. **Opaque judging**: Traditional contests frequently announce winners without disclosure of scores or rationale
3. **Vote manipulation**: Bad actors create sybil accounts, buy votes, or coordinate brigades
4. **Discovery failure**: Deep, niche content with low initial reach can be overlooked
5. **Moderation burden**: Projects waste time and budget policing contests instead of building

## Ranqly Solution Overview

Ranqly implements a Proof-of-Impact (PoI) contest framework: a repeatable, transparent pipeline with clearly defined phases.

### Contest Lifecycle

1. **Announcement (T₀)**: Contest rulebook, scoring formula, timeline, and immutable configuration hash published on-chain
2. **Submissions (Phase A)**: Creators register entries by submitting content references
3. **Algorithmic Pre-Ranking (Phase B)**: Four-axis scoring system computes initial AlgoScore
4. **Disputes & Nominations (Phase C)**: Community flags issues and nominates underrated entries
5. **Community Voting (Phase D)**: PoI NFT holders vote with mandatory justifications
6. **Anonymous Judging (Phase E)**: Expert judges rank entries independently
7. **Re-Ranking & Finalization (Phase F)**: Final scores computed and published with full audit trail

## Core Components

### 1. Four-Axis Algorithmic Scoring

**Depth (40% weight)**: Content substance and insight level
- Technical depth indicators
- Analysis and evidence markers
- Structural organization
- Content type appropriateness

**Reach (30% weight)**: Audience engagement and social metrics
- Social media metrics (views, likes, shares, comments)
- Platform-specific adjustments
- Time decay factors

**Relevance (20% weight)**: Topic alignment with contest theme
- Semantic similarity using TF-IDF
- Keyword matching
- Theme word frequency

**Consistency (10% weight)**: Quality guidelines and plagiarism checks
- Content shingling for plagiarism detection
- Readability assessment
- Formatting quality
- Language quality indicators

### 2. Proof-of-Impact (PoI) Voting NFT

**Key Features**:
- Soulbound, non-transferable tokens
- One NFT per person for voting rights
- Fixed mint window before submissions
- Anti-sybil mechanisms and cluster detection

**Anti-Sybil Protection**:
- Signature verification during minting
- IP address clustering detection
- Voting pattern analysis
- Timing pattern detection

### 3. Commit-Reveal Voting System

**Vote Structure**:
- K upvotes and L downvotes per voter (default K=5, L=2)
- Mandatory justification sentences
- Pre-defined reason codes
- Commit-reveal scheme to prevent herding

**Reason Codes**:
- **Upvotes**: U1 (Unique insight), U2 (High quality), U3 (Original approach), U4 (Well researched), U5 (Clear explanation)
- **Downvotes**: D1 (Low effort), D2 (Overhyped), D3 (Off-topic), D4 (Plagiarized), D5 (Poor quality)

### 4. Anonymous Judging Process

**Judge Selection**:
- Subject-matter experts chosen by organizers
- Anonymous registration and review process
- Randomized entry presentation

**Borda Count Aggregation**:
- Independent ranking by each judge
- Borda count calculation for fair aggregation
- Written rationales for transparency
- Anonymized publication of judge comments

### 5. Structured Dispute System

**Dispute Filing**:
- Pre-defined reason codes (A1-A8)
- Evidence-based submissions
- Anonymous filing option
- No bond required (to avoid disincentivizing legitimate flags)

**Triage Process**:
- Two anonymous triage reviewers
- Evidence validation
- Consensus-based decisions
- Public dispute logs

**Nomination System**:
- Community nominations for underrated entries
- Highlighting high-quality content with low reach
- Extra weight in algorithmic re-runs

### 6. ContestVault Smart Contracts

**Multi-Signature Escrow**:
- Organizer and Ranqly oracle signatures required
- Funds locked until contest finalization
- Automated payout distribution
- Non-custodial design

**Security Features**:
- ReentrancyGuard protection
- Pausable functionality
- Emergency withdrawal mechanisms
- Signature timeout protection

## Score Aggregation

### Final Score Calculation

```
FinalScore = w_a × AlgoScore + w_c × CommunityScore + w_j × JudgeScore
```

**Default Weights**:
- w_a = 0.40 (Algorithm)
- w_c = 0.30 (Community)
- w_j = 0.30 (Judges)

**Example**:
- AlgoScore = 71/100
- CommunityScore = 77/100
- JudgeScore = 85/100
- FinalScore = 0.40×71 + 0.30×77 + 0.30×85 ≈ 77.0

## Technical Architecture

### Microservices Design

1. **API Gateway**: Request routing and orchestration
2. **Algo Engine**: Four-axis scoring computation
3. **Voting Engine**: Commit-reveal voting management
4. **Judge Service**: Anonymous judging coordination
5. **Dispute Service**: Dispute and nomination handling
6. **Content Crawler**: Content extraction and IPFS storage
7. **PoI NFT Service**: NFT management and verification

### Smart Contracts

1. **PoIVotingNFT**: Soulbound voting tokens
2. **ContestVault**: Multi-signature escrow
3. **CommitRevealVoting**: On-chain voting coordination

### Infrastructure

- **PostgreSQL**: Primary database
- **Redis**: Caching and session management
- **IPFS**: Decentralized content storage
- **Docker**: Containerized deployment
- **Kubernetes**: Production orchestration

## Integration and Adoption

### Modular Integration

**Algorithm-Only Mode**: Quick objective scoring
**Voting-Only Module**: Structured voting with justifications
**Judging Pipeline Only**: Expert-judged contests
**Full Pipeline**: Complete fairness system

### API/SDK Support

- JavaScript SDK
- Python SDK
- RESTful API
- Webhook notifications
- Embeddable widgets

## Security and Privacy

### No Custody of Funds
- Ranqly never handles prize funds
- Integrators retain payment control
- Regulatory compliance simplified

### Data Privacy
- Minimal personal data storage
- Anonymous dispute filing
- Public audit logs with privacy protection

### Content Policy Enforcement
- Host-defined content rules
- Algorithmic violation detection
- Structured dispute resolution

## Roadmap

### Phase 1: Core Platform (0-3 months)
- Four-axis scoring system
- PoI NFT implementation
- Commit-reveal voting
- Anonymous judging
- Dispute system
- Smart contract deployment

### Phase 2: Integration (3-9 months)
- Public SDKs and widgets
- Platform partnerships
- Enhanced anti-sybil mechanisms
- Mobile applications

### Phase 3: Ecosystem (9-18 months)
- Multi-tenant API
- Reputation system
- Cross-chain support
- Advanced analytics

## Conclusion

Ranqly transforms Web3 content contests by embedding fairness and transparency into core mechanics. By combining algorithmic depth-reach analysis, accountable community voting, anonymous expert review, and robust dispute systems, Ranqly guarantees that quality content wins on merit.

The platform serves as the content infrastructure for Web3 – a standardized protocol layer that all projects can plug into for honest evaluation. In this vision, every deserving creator is rewarded, ecosystem knowledge flourishes, and projects spend far less time policing noise.

**Ranqly: ranked, auditable, builder-friendly.**
