# Ranqly Smart Contracts Documentation

## Overview

The Ranqly smart contract system implements the core on-chain functionality for PoI NFT management, voting coordination, and fund escrow. All contracts are built using OpenZeppelin libraries for security and best practices.

## Contract Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PoIVotingNFT  │    │ ContestVault    │    │CommitRevealVoting│
│   (ERC721)      │    │ (MultiSig)      │    │ (Voting)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Integration    │
                    │  Layer          │
                    └─────────────────┘
```

## Contracts

### 1. PoIVotingNFT.sol

**Purpose**: Soulbound voting tokens for Sybil-resistant community voting

**Key Features**:
- Non-transferable (soulbound) tokens
- One NFT per address maximum
- Mint window control
- Anti-sybil mechanisms
- Voting eligibility enforcement

#### Functions

```solidity
// Mint PoI NFT with signature verification
function mintPoI(bytes memory signature, uint256 nonce) external payable

// Check voting eligibility
function hasVotingRights(address voter) external view returns (bool)

// Configure contest parameters
function configureContest(string memory contestId, string memory metadataURI) external onlyOwner

// Set mint window
function setMintWindow(uint256 start, uint256 end) external onlyOwner
```

#### Events

```solidity
event PoIMinted(address indexed to, uint256 indexed tokenId, uint256 mintFee);
event PoIBurned(address indexed from, uint256 indexed tokenId);
event MintWindowUpdated(uint256 start, uint256 end);
event ContestConfigured(string contestId, string metadataURI);
```

#### Usage Example

```javascript
// Mint PoI NFT
const poiNFT = new ethers.Contract(poiNFTAddress, poiNFTABI, signer);
const tx = await poiNFT.mintPoI(signature, nonce, { value: mintFee });
await tx.wait();

// Check voting rights
const hasRights = await poiNFT.hasVotingRights(userAddress);
```

### 2. ContestVault.sol

**Purpose**: Multi-signature escrow for contest funds

**Key Features**:
- Multi-signature fund release
- Support for ETH and ERC20 tokens
- Contest finalization verification
- Emergency pause functionality
- Automatic payout distribution

#### Functions

```solidity
// Create contest vault
function createContest(
    string memory contestId,
    address rewardToken,
    uint256 totalReward,
    uint256[] memory rewardDistribution,
    uint256 finalizationDeadline
) external payable

// Finalize contest with signatures
function finalizeContest(ContestFinalization memory finalization) external

// Claim reward
function claimReward(string memory contestId, uint256 winnerIndex) external

// Emergency withdraw
function emergencyWithdraw(string memory contestId, address to) external onlyOwner
```

#### Data Structures

```solidity
struct ContestConfig {
    string contestId;
    address rewardToken;
    uint256 totalReward;
    uint256[] rewardDistribution;
    uint256 finalizationDeadline;
    bool isFinalized;
    uint256 createdAt;
}

struct Winner {
    address winner;
    uint256 rank;
    uint256 rewardAmount;
    bool claimed;
}
```

#### Usage Example

```javascript
// Create contest
const vault = new ethers.Contract(vaultAddress, vaultABI, signer);
const tx = await vault.createContest(
    contestId,
    ethers.constants.AddressZero, // ETH
    totalReward,
    rewardDistribution,
    deadline,
    { value: totalReward }
);

// Finalize contest
const finalization = {
    contestId,
    resultsHash,
    winners,
    timestamp,
    organizerSignature,
    ranqlySignature
};
await vault.finalizeContest(finalization);
```

### 3. CommitRevealVoting.sol

**Purpose**: Commit-reveal voting coordination with PoI NFT gating

**Key Features**:
- PoI NFT gated voting
- Commit-reveal scheme
- Mandatory justifications
- Reason codes for accountability
- Vote limits and sybil prevention

#### Functions

```solidity
// Create voting session
function createContest(
    string memory contestId,
    address poiNFTContract,
    uint256 commitStart,
    uint256 commitEnd,
    uint256 revealStart,
    uint256 revealEnd,
    uint256 maxUpvotes,
    uint256 maxDownvotes,
    string[] memory entryIds
) external onlyOwner

// Commit votes
function commitVote(string memory contestId, bytes32 commitment) external

// Reveal votes
function revealVote(string memory contestId, VoteReveal memory reveal) external

// Finalize contest
function finalizeContest(string memory contestId) external onlyOwner
```

#### Data Structures

```solidity
struct VoteCommitment {
    bytes32 commitment;
    uint256 timestamp;
    bool revealed;
}

struct VoteReveal {
    string[] entryIds;
    int8[] voteTypes;
    VoteReason[] reasons;
    string[] justifications;
    uint256 nonce;
}

enum VoteReason {
    U1, U2, U3, U4, U5, // Upvote reasons
    D1, D2, D3, D4, D5  // Downvote reasons
}
```

#### Usage Example

```javascript
// Commit vote
const voting = new ethers.Contract(votingAddress, votingABI, signer);
const commitment = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
        ['string[]', 'int8[]', 'uint8[]', 'string[]', 'uint256'],
        [entryIds, voteTypes, reasons, justifications, nonce]
    )
);
await voting.commitVote(contestId, commitment);

// Reveal vote
const reveal = {
    entryIds,
    voteTypes,
    reasons,
    justifications,
    nonce
};
await voting.revealVote(contestId, reveal);
```

## Security Features

### Access Control
- Owner-only functions for critical operations
- Role-based access control where appropriate
- Multi-signature requirements for fund operations

### Reentrancy Protection
- ReentrancyGuard on all external functions
- Checks-effects-interactions pattern
- State validation before external calls

### Pausable Functionality
- Emergency pause for all contracts
- Owner can pause/unpause as needed
- Critical functions remain accessible during pause

### Input Validation
- Comprehensive parameter validation
- Range checks for numeric inputs
- String length validation
- Address validation

## Deployment

### Prerequisites
```bash
npm install
npx hardhat compile
```

### Local Development
```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### Testnet Deployment
```bash
npx hardhat run scripts/deploy.js --network polygon-mumbai
```

### Mainnet Deployment
```bash
npx hardhat run scripts/deploy.js --network polygon
npx hardhat verify --network polygon CONTRACT_ADDRESS
```

## Testing

### Unit Tests
```bash
npx hardhat test
```

### Gas Optimization
```bash
REPORT_GAS=true npx hardhat test
```

### Coverage
```bash
npx hardhat coverage
```

## Contract Addresses

### Development (Hardhat)
- **PoIVotingNFT**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **ContestVault**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- **CommitRevealVoting**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

### Testnet (Polygon Mumbai)
- **PoIVotingNFT**: `0x...` (To be deployed)
- **ContestVault**: `0x...` (To be deployed)
- **CommitRevealVoting**: `0x...` (To be deployed)

### Mainnet (Polygon)
- **PoIVotingNFT**: `0x...` (To be deployed)
- **ContestVault**: `0x...` (To be deployed)
- **CommitRevealVoting**: `0x...` (To be deployed)

## Integration Examples

### Frontend Integration

```javascript
// Connect to contracts
const poiNFT = new ethers.Contract(poiNFTAddress, poiNFTABI, provider);
const vault = new ethers.Contract(vaultAddress, vaultABI, provider);
const voting = new ethers.Contract(votingAddress, votingABI, provider);

// Check PoI NFT ownership
const hasPoI = await poiNFT.hasVotingRights(userAddress);

// Mint PoI NFT
if (!hasPoI) {
    const mintTx = await poiNFT.mintPoI(signature, nonce, { value: mintFee });
    await mintTx.wait();
}

// Create contest
const contestTx = await vault.createContest(
    contestId,
    rewardToken,
    totalReward,
    distribution,
    deadline,
    { value: totalReward }
);
```

### Backend Integration

```javascript
// Monitor contract events
poiNFT.on('PoIMinted', (to, tokenId, mintFee) => {
    console.log(`PoI NFT minted: ${tokenId} to ${to}`);
});

vault.on('ContestCreated', (contestId, rewardToken, totalReward) => {
    console.log(`Contest created: ${contestId}`);
});

// Listen for voting events
voting.on('VoteCommitted', (contestId, voter, commitment) => {
    console.log(`Vote committed for contest ${contestId}`);
});
```

## Upgrade Path

All contracts use OpenZeppelin's upgradeable proxy pattern for future upgrades:

```solidity
// Deploy implementation
const implementation = await upgrades.deployImplementation(ContestVault);

// Deploy proxy
const proxy = await upgrades.deployProxy(ContestVault, [args]);

// Upgrade proxy
await upgrades.upgradeProxy(proxyAddress, NewContestVault);
```

## Monitoring and Maintenance

### Event Monitoring
- Set up monitoring for critical events
- Alert on failed transactions
- Track gas usage patterns

### Regular Maintenance
- Monitor contract storage usage
- Check for potential optimizations
- Update dependencies regularly

### Emergency Procedures
- Emergency pause procedures
- Fund recovery processes
- Contract upgrade procedures

## Audit Information

### Security Audits
- **Status**: Pending
- **Auditor**: TBD
- **Scope**: All contracts
- **Report**: TBD

### Bug Bounty
- **Program**: TBD
- **Rewards**: Up to $50,000
- **Scope**: Critical vulnerabilities only

## Support

- **Documentation**: [docs.ranqly.com/contracts](https://docs.ranqly.com/contracts)
- **Discord**: [discord.gg/ranqly](https://discord.gg/ranqly)
- **Email**: contracts@ranqly.com
