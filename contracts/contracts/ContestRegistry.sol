// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./ContestVault.sol";
import "./CommitRevealVoting.sol";

/**
 * @title ContestRegistry
 * @dev Central registry for managing Ranqly contests
 * @notice Handles contest lifecycle, configuration, and coordination between contracts
 */
contract ContestRegistry is ReentrancyGuard, Pausable, Ownable {
    using ECDSA for bytes32;

    // Events
    event ContestCreated(bytes32 indexed contestId, address indexed organizer, uint256 totalReward, address rewardToken);
    event ContestAnnounced(bytes32 indexed contestId, bytes32 configHash);
    event ContestPhaseChanged(bytes32 indexed contestId, uint8 oldPhase, uint8 newPhase);
    event ContestFinalized(bytes32 indexed contestId, bytes32 rankingHash, uint256 totalDistributed);
    event ContestCancelled(bytes32 indexed contestId, string reason);

    // Contest phases
    enum ContestPhase {
        Announced,          // Contest announced, PoI minting open
        SubmissionsOpen,    // Accepting submissions
        SubmissionsClosed,  // Submission period ended
        VotingOpen,         // Community voting active
        VotingClosed,       // Voting period ended
        JudgingOpen,        // Anonymous judging active
        JudgingClosed,      // Judging period ended
        Finalized,          // Contest completed
        Cancelled           // Contest cancelled
    }

    // Structs
    struct Contest {
        bytes32 id;
        address organizer;
        address vault;
        address votingContract;
        uint256 totalReward;
        address rewardToken;
        ContestPhase phase;
        uint256 announcementTime;
        uint256 submissionStartTime;
        uint256 submissionEndTime;
        uint256 votingStartTime;
        uint256 votingEndTime;
        uint256 judgingStartTime;
        uint256 judgingEndTime;
        uint256 finalizedTime;
        bytes32 configHash;
        bytes32 rankingHash;
        bool isActive;
    }

    struct ContestConfig {
        string title;
        string description;
        string rules;
        uint256 algoWeight;
        uint256 communityWeight;
        uint256 judgeWeight;
        uint256 maxSubmissions;
        uint256 minVotesRequired;
        uint256 judgeCount;
    }

    // State variables
    mapping(bytes32 => Contest) public contests;
    mapping(bytes32 => ContestConfig) public contestConfigs;
    mapping(bytes32 => bool) public contestExists;
    mapping(address => bytes32[]) public organizerContests;
    
    ContestVault public contestVault;
    CommitRevealVoting public votingContract;
    
    // Oracle management
    mapping(address => bool) public authorizedOracles;
    mapping(bytes32 => mapping(address => bool)) public oracleSignatures;
    mapping(bytes32 => uint256) public signatureCount;
    
    // Constants
    uint256 public constant MIN_CONTEST_DURATION = 1 days;
    uint256 public constant MAX_CONTEST_DURATION = 30 days;
    uint256 public constant REQUIRED_ORACLE_SIGNATURES = 2;
    
    // Modifiers
    modifier onlyValidContest(bytes32 contestId) {
        require(contestExists[contestId], "Contest does not exist");
        _;
    }
    
    modifier onlyContestOrganizer(bytes32 contestId) {
        require(contests[contestId].organizer == msg.sender, "Not contest organizer");
        _;
    }
    
    modifier onlyOracle() {
        require(authorizedOracles[msg.sender], "Not authorized oracle");
        _;
    }

    constructor(address payable _contestVault, address _votingContract) {
        require(_contestVault != address(0), "Invalid vault address");
        require(_votingContract != address(0), "Invalid voting contract address");
        
        contestVault = ContestVault(_contestVault);
        votingContract = CommitRevealVoting(_votingContract);
    }

    /**
     * @dev Create a new contest
     * @param contestId Unique contest identifier
     * @param config Contest configuration
     * @param totalReward Total reward amount
     * @param rewardToken ERC20 token address (address(0) for ETH)
     * @param submissionStartTime Submission start timestamp
     * @param submissionEndTime Submission end timestamp
     * @param votingStartTime Voting start timestamp
     * @param votingEndTime Voting end timestamp
     * @param judgingStartTime Judging start timestamp
     * @param judgingEndTime Judging end timestamp
     */
    function createContest(
        bytes32 contestId,
        ContestConfig calldata config,
        uint256 totalReward,
        address rewardToken,
        uint256 submissionStartTime,
        uint256 submissionEndTime,
        uint256 votingStartTime,
        uint256 votingEndTime,
        uint256 judgingStartTime,
        uint256 judgingEndTime
    ) external whenNotPaused nonReentrant {
        require(!contestExists[contestId], "Contest already exists");
        require(totalReward > 0, "Invalid reward amount");
        require(submissionStartTime > block.timestamp, "Invalid submission start time");
        require(submissionEndTime > submissionStartTime, "Invalid submission end time");
        require(votingStartTime > submissionEndTime, "Invalid voting start time");
        require(votingEndTime > votingStartTime, "Invalid voting end time");
        require(judgingStartTime > votingEndTime, "Invalid judging start time");
        require(judgingEndTime > judgingStartTime, "Invalid judging end time");
        require(config.algoWeight + config.communityWeight + config.judgeWeight == 100, "Weights must sum to 100");
        require(bytes(config.title).length > 0, "Title required");
        require(bytes(config.description).length > 0, "Description required");

        // Create contest in vault
        contestVault.createContest(contestId, totalReward, rewardToken, judgingEndTime);

        // Store contest data
        contests[contestId] = Contest({
            id: contestId,
            organizer: msg.sender,
            vault: address(contestVault),
            votingContract: address(votingContract),
            totalReward: totalReward,
            rewardToken: rewardToken,
            phase: ContestPhase.Announced,
            announcementTime: block.timestamp,
            submissionStartTime: submissionStartTime,
            submissionEndTime: submissionEndTime,
            votingStartTime: votingStartTime,
            votingEndTime: votingEndTime,
            judgingStartTime: judgingStartTime,
            judgingEndTime: judgingEndTime,
            finalizedTime: 0,
            configHash: keccak256(abi.encode(config)),
            rankingHash: bytes32(0),
            isActive: true
        });

        // Store contest configuration
        contestConfigs[contestId] = config;
        contestExists[contestId] = true;
        organizerContests[msg.sender].push(contestId);

        emit ContestCreated(contestId, msg.sender, totalReward, rewardToken);
        emit ContestAnnounced(contestId, contests[contestId].configHash);
    }

    /**
     * @dev Deposit rewards for contest
     * @param contestId Contest identifier
     * @param amount Amount to deposit
     */
    function depositRewards(
        bytes32 contestId,
        uint256 amount
    ) external payable onlyValidContest(contestId) onlyContestOrganizer(contestId) {
        Contest storage contest = contests[contestId];
        require(contest.phase == ContestPhase.Announced, "Invalid phase for deposit");
        require(contest.isActive, "Contest not active");

        if (contest.rewardToken == address(0)) {
            // ETH deposit
            require(msg.value == amount, "ETH amount mismatch");
        } else {
            // ERC20 deposit - handled by vault
            require(msg.value == 0, "ETH not accepted for token deposits");
        }

        contestVault.depositRewards{value: msg.value}(contestId, amount);
    }

    /**
     * @dev Start submissions phase
     * @param contestId Contest identifier
     */
    function startSubmissions(bytes32 contestId) external onlyValidContest(contestId) onlyContestOrganizer(contestId) {
        Contest storage contest = contests[contestId];
        require(contest.phase == ContestPhase.Announced, "Invalid phase transition");
        require(block.timestamp >= contest.submissionStartTime, "Submission time not reached");

        contest.phase = ContestPhase.SubmissionsOpen;
        emit ContestPhaseChanged(contestId, uint8(ContestPhase.Announced), uint8(ContestPhase.SubmissionsOpen));
    }

    /**
     * @dev Close submissions phase
     * @param contestId Contest identifier
     */
    function closeSubmissions(bytes32 contestId) external onlyValidContest(contestId) onlyContestOrganizer(contestId) {
        Contest storage contest = contests[contestId];
        require(contest.phase == ContestPhase.SubmissionsOpen, "Invalid phase transition");
        require(block.timestamp >= contest.submissionEndTime, "Submission period not ended");

        contest.phase = ContestPhase.SubmissionsClosed;
        emit ContestPhaseChanged(contestId, uint8(ContestPhase.SubmissionsOpen), uint8(ContestPhase.SubmissionsClosed));
    }

    /**
     * @dev Start voting phase
     * @param contestId Contest identifier
     * @param submissionIds Array of valid submission IDs
     */
    function startVoting(
        bytes32 contestId,
        uint256[] calldata submissionIds
    ) external onlyValidContest(contestId) onlyContestOrganizer(contestId) {
        Contest storage contest = contests[contestId];
        require(contest.phase == ContestPhase.SubmissionsClosed, "Invalid phase transition");
        require(block.timestamp >= contest.votingStartTime, "Voting time not reached");
        require(submissionIds.length > 0, "No submissions provided");

        contest.phase = ContestPhase.VotingOpen;
        
        // Create voting contest
        uint256 commitDuration = contest.votingEndTime - contest.votingStartTime;
        uint256 revealDuration = 1 hours; // Fixed reveal period
        
        votingContract.createContest(contestId, contest.organizer, submissionIds, commitDuration, revealDuration);
        
        emit ContestPhaseChanged(contestId, uint8(ContestPhase.SubmissionsClosed), uint8(ContestPhase.VotingOpen));
    }

    /**
     * @dev Close voting phase
     * @param contestId Contest identifier
     */
    function closeVoting(bytes32 contestId) external onlyValidContest(contestId) onlyContestOrganizer(contestId) {
        Contest storage contest = contests[contestId];
        require(contest.phase == ContestPhase.VotingOpen, "Invalid phase transition");
        require(block.timestamp >= contest.votingEndTime, "Voting period not ended");

        contest.phase = ContestPhase.VotingClosed;
        votingContract.endContest(contestId);
        
        emit ContestPhaseChanged(contestId, uint8(ContestPhase.VotingOpen), uint8(ContestPhase.VotingClosed));
    }

    /**
     * @dev Start judging phase
     * @param contestId Contest identifier
     */
    function startJudging(bytes32 contestId) external onlyValidContest(contestId) onlyContestOrganizer(contestId) {
        Contest storage contest = contests[contestId];
        require(contest.phase == ContestPhase.VotingClosed, "Invalid phase transition");
        require(block.timestamp >= contest.judgingStartTime, "Judging time not reached");

        contest.phase = ContestPhase.JudgingOpen;
        emit ContestPhaseChanged(contestId, uint8(ContestPhase.VotingClosed), uint8(ContestPhase.JudgingOpen));
    }

    /**
     * @dev Close judging phase
     * @param contestId Contest identifier
     */
    function closeJudging(bytes32 contestId) external onlyValidContest(contestId) onlyContestOrganizer(contestId) {
        Contest storage contest = contests[contestId];
        require(contest.phase == ContestPhase.JudgingOpen, "Invalid phase transition");
        require(block.timestamp >= contest.judgingEndTime, "Judging period not ended");

        contest.phase = ContestPhase.JudgingClosed;
        emit ContestPhaseChanged(contestId, uint8(ContestPhase.JudgingOpen), uint8(ContestPhase.JudgingClosed));
    }

    /**
     * @dev Finalize contest with oracle signature
     * @param contestId Contest identifier
     * @param rankingHash Hash of final rankings
     * @param distributions Array of reward distributions
     * @param oracleSignature Oracle signature
     */
    function finalizeContest(
        bytes32 contestId,
        bytes32 rankingHash,
        ContestVault.Distribution[] calldata distributions,
        bytes calldata oracleSignature
    ) external onlyValidContest(contestId) onlyOracle {
        Contest storage contest = contests[contestId];
        require(contest.phase == ContestPhase.JudgingClosed, "Invalid phase for finalization");
        require(contest.isActive, "Contest not active");

        // Verify oracle signature
        require(
            _verifyOracleSignature(contestId, rankingHash, oracleSignature),
            "Invalid oracle signature"
        );

        contest.phase = ContestPhase.Finalized;
        contest.finalizedTime = block.timestamp;
        contest.rankingHash = rankingHash;

        // Finalize in vault
        contestVault.finalizeContest(contestId, rankingHash, distributions, oracleSignature);

        emit ContestFinalized(contestId, rankingHash, 0); // Total distributed will be emitted by vault
    }

    /**
     * @dev Cancel contest
     * @param contestId Contest identifier
     * @param reason Reason for cancellation
     */
    function cancelContest(
        bytes32 contestId,
        string calldata reason
    ) external onlyValidContest(contestId) onlyContestOrganizer(contestId) {
        Contest storage contest = contests[contestId];
        require(contest.phase != ContestPhase.Finalized, "Cannot cancel finalized contest");
        require(contest.phase != ContestPhase.Cancelled, "Contest already cancelled");

        contest.phase = ContestPhase.Cancelled;
        contest.isActive = false;

        emit ContestCancelled(contestId, reason);
    }

    /**
     * @dev Verify oracle signature
     * @param contestId Contest identifier
     * @param rankingHash Hash of rankings
     * @param signature Oracle signature
     * @return isValid True if signature is valid
     */
    function _verifyOracleSignature(
        bytes32 contestId,
        bytes32 rankingHash,
        bytes calldata signature
    ) internal returns (bool isValid) {
        bytes32 messageHash = keccak256(abi.encodePacked(contestId, rankingHash));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);

        require(authorizedOracles[signer], "Unauthorized oracle");
        require(!oracleSignatures[contestId][signer], "Already signed");

        oracleSignatures[contestId][signer] = true;
        signatureCount[contestId]++;

        return true;
    }

    /**
     * @dev Add authorized oracle
     * @param oracle Oracle address
     */
    function addOracle(address oracle) external onlyOwner {
        authorizedOracles[oracle] = true;
    }

    /**
     * @dev Remove authorized oracle
     * @param oracle Oracle address
     */
    function removeOracle(address oracle) external onlyOwner {
        authorizedOracles[oracle] = false;
    }

    /**
     * @dev Get contest information
     * @param contestId Contest identifier
     * @return contest Contest data
     * @return config Contest configuration
     */
    function getContest(bytes32 contestId) external view returns (
        Contest memory contest,
        ContestConfig memory config
    ) {
        require(contestExists[contestId], "Contest does not exist");
        
        return (contests[contestId], contestConfigs[contestId]);
    }

    /**
     * @dev Get contests by organizer
     * @param organizer Organizer address
     * @return contestIds Array of contest IDs
     */
    function getContestsByOrganizer(address organizer) external view returns (bytes32[] memory contestIds) {
        return organizerContests[organizer];
    }

    /**
     * @dev Check if contest is in specific phase
     * @param contestId Contest identifier
     * @param phase Phase to check
     * @return isInPhase True if contest is in specified phase
     */
    function isContestInPhase(bytes32 contestId, ContestPhase phase) external view returns (bool isInPhase) {
        require(contestExists[contestId], "Contest does not exist");
        return contests[contestId].phase == phase;
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
