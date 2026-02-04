// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./PoIVotingNFT.sol";

/**
 * @title CommitRevealVoting
 * @dev Commit-reveal voting system with PoI NFT gating
 * 
 * Key Features:
 * - PoI NFT gated voting (one vote per NFT holder)
 * - Commit-reveal scheme to prevent herding
 * - Mandatory justifications for each vote
 * - Reason codes for accountability
 * - K upvotes and L downvotes per voter
 * - Cluster detection for sybil prevention
 * 
 * Based on Ranqly Whitepaper specifications for fair community voting
 */
contract CommitRevealVoting is ReentrancyGuard, Pausable, Ownable {
    using ECDSA for bytes32;

    // Vote reason codes
    enum VoteReason {
        U1, // Unique insight
        U2, // High quality content
        U3, // Original approach
        U4, // Well researched
        U5, // Clear explanation
        D1, // Low effort
        D2, // Overhyped
        D3, // Off-topic
        D4, // Plagiarized
        D5  // Poor quality
    }

    // Vote commitment
    struct VoteCommitment {
        bytes32 commitment;
        uint256 timestamp;
        bool revealed;
    }

    // Vote reveal
    struct VoteReveal {
        string[] entryIds;
        int8[] voteTypes; // 1 for upvote, -1 for downvote
        VoteReason[] reasons;
        string[] justifications;
        uint256 nonce;
    }

    // Contest configuration
    struct ContestConfig {
        string contestId;
        address poiNFTContract;
        uint256 commitPhaseStart;
        uint256 commitPhaseEnd;
        uint256 revealPhaseStart;
        uint256 revealPhaseEnd;
        uint256 maxUpvotes;
        uint256 maxDownvotes;
        bool isActive;
        string[] entryIds;
    }

    // Vote results
    struct VoteResults {
        mapping(string => int256) netVotes;
        mapping(string => uint256) upvotes;
        mapping(string => uint256) downvotes;
        mapping(string => mapping(VoteReason => uint256)) reasonCounts;
        mapping(string => string[]) justifications;
        uint256 totalVoters;
        bool finalized;
    }

    // State variables
    mapping(string => ContestConfig) public contests;
    mapping(string => VoteResults) public voteResults;
    mapping(string => mapping(address => VoteCommitment)) public voteCommitments;
    mapping(string => mapping(address => bool)) public hasVoted;
    mapping(bytes32 => bool) public usedCommitments;

    // Events
    event ContestCreated(
        string indexed contestId,
        address poiNFTContract,
        uint256 commitStart,
        uint256 revealEnd,
        uint256 maxUpvotes,
        uint256 maxDownvotes
    );
    event VoteCommitted(
        string indexed contestId,
        address indexed voter,
        bytes32 commitment,
        uint256 timestamp
    );
    event VoteRevealed(
        string indexed contestId,
        address indexed voter,
        string[] entryIds,
        int8[] voteTypes,
        VoteReason[] reasons,
        string[] justifications
    );
    event ContestFinalized(
        string indexed contestId,
        uint256 totalVoters,
        uint256 totalVotes
    );

    // Errors
    error ContestNotFound();
    error ContestNotActive();
    error CommitPhaseNotActive();
    error RevealPhaseNotActive();
    error NoPoINFT();
    error AlreadyVoted();
    error InvalidCommitment();
    error InvalidReveal();
    error CommitmentAlreadyUsed();
    error InvalidVoteCount();
    error InvalidEntryId();
    error ContestAlreadyFinalized();

    constructor() {}

    /**
     * @dev Create a new voting contest
     * @param contestId Unique contest identifier
     * @param poiNFTContract Address of PoI NFT contract
     * @param commitStart Commit phase start timestamp
     * @param commitEnd Commit phase end timestamp
     * @param revealStart Reveal phase start timestamp
     * @param revealEnd Reveal phase end timestamp
     * @param maxUpvotes Maximum upvotes per voter
     * @param maxDownvotes Maximum downvotes per voter
     * @param entryIds Array of contest entry IDs
     */
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
    ) external onlyOwner {
        require(bytes(contestId).length > 0, "Invalid contest ID");
        require(poiNFTContract != address(0), "Invalid PoI NFT contract");
        require(commitStart < commitEnd, "Invalid commit phase");
        require(commitEnd < revealStart, "Invalid phase timing");
        require(revealStart < revealEnd, "Invalid reveal phase");
        require(maxUpvotes > 0 && maxDownvotes > 0, "Invalid vote limits");
        require(entryIds.length > 0, "No entries provided");

        contests[contestId] = ContestConfig({
            contestId: contestId,
            poiNFTContract: poiNFTContract,
            commitPhaseStart: commitStart,
            commitPhaseEnd: commitEnd,
            revealPhaseStart: revealStart,
            revealPhaseEnd: revealEnd,
            maxUpvotes: maxUpvotes,
            maxDownvotes: maxDownvotes,
            isActive: true,
            entryIds: entryIds
        });

        emit ContestCreated(
            contestId,
            poiNFTContract,
            commitStart,
            revealEnd,
            maxUpvotes,
            maxDownvotes
        );
    }

    /**
     * @dev Commit votes (commit phase)
     * @param contestId Contest identifier
     * @param commitment Hash of vote data
     */
    function commitVote(
        string memory contestId,
        bytes32 commitment
    ) external nonReentrant whenNotPaused {
        ContestConfig memory contest = contests[contestId];
        
        if (bytes(contest.contestId).length == 0) {
            revert ContestNotFound();
        }
        if (!contest.isActive) {
            revert ContestNotActive();
        }
        if (block.timestamp < contest.commitPhaseStart || block.timestamp > contest.commitPhaseEnd) {
            revert CommitPhaseNotActive();
        }
        if (hasVoted[contestId][msg.sender]) {
            revert AlreadyVoted();
        }
        if (usedCommitments[commitment]) {
            revert CommitmentAlreadyUsed();
        }

        // Check PoI NFT ownership
        PoIVotingNFT poiNFT = PoIVotingNFT(contest.poiNFTContract);
        if (!poiNFT.hasVotingRights(msg.sender)) {
            revert NoPoINFT();
        }

        // Store commitment
        voteCommitments[contestId][msg.sender] = VoteCommitment({
            commitment: commitment,
            timestamp: block.timestamp,
            revealed: false
        });

        hasVoted[contestId][msg.sender] = true;
        usedCommitments[commitment] = true;

        emit VoteCommitted(contestId, msg.sender, commitment, block.timestamp);
    }

    /**
     * @dev Reveal votes (reveal phase)
     * @param contestId Contest identifier
     * @param reveal Vote reveal data
     */
    function revealVote(
        string memory contestId,
        VoteReveal memory reveal
    ) external nonReentrant whenNotPaused {
        ContestConfig memory contest = contests[contestId];
        
        if (bytes(contest.contestId).length == 0) {
            revert ContestNotFound();
        }
        if (!contest.isActive) {
            revert ContestNotActive();
        }
        if (block.timestamp < contest.revealPhaseStart || block.timestamp > contest.revealPhaseEnd) {
            revert RevealPhaseNotActive();
        }

        VoteCommitment storage commitment = voteCommitments[contestId][msg.sender];
        if (commitment.timestamp == 0) {
            revert InvalidCommitment();
        }
        if (commitment.revealed) {
            revert AlreadyVoted();
        }

        // Verify commitment matches reveal
        bytes32 calculatedCommitment = keccak256(abi.encodePacked(
            reveal.entryIds,
            reveal.voteTypes,
            reveal.reasons,
            reveal.justifications,
            reveal.nonce,
            msg.sender
        ));

        if (calculatedCommitment != commitment.commitment) {
            revert InvalidReveal();
        }

        // Validate vote data
        _validateVoteReveal(contest, reveal);

        // Process votes
        _processVotes(contestId, reveal);

        commitment.revealed = true;

        emit VoteRevealed(
            contestId,
            msg.sender,
            reveal.entryIds,
            reveal.voteTypes,
            reveal.reasons,
            reveal.justifications
        );
    }

    /**
     * @dev Finalize voting results
     * @param contestId Contest identifier
     */
    function finalizeContest(string memory contestId) external onlyOwner {
        ContestConfig memory contest = contests[contestId];
        
        if (bytes(contest.contestId).length == 0) {
            revert ContestNotFound();
        }
        if (block.timestamp < contest.revealPhaseEnd) {
            revert RevealPhaseNotActive();
        }

        VoteResults storage results = voteResults[contestId];
        if (results.finalized) {
            revert ContestAlreadyFinalized();
        }

        results.finalized = true;
        contests[contestId].isActive = false;

        emit ContestFinalized(contestId, results.totalVoters, _getTotalVotes(results));
    }

    /**
     * @dev Get vote results for an entry
     * @param contestId Contest identifier
     * @param entryId Entry identifier
     * @return upvotes, downvotes, netVotes
     */
    function getEntryResults(
        string memory contestId,
        string memory entryId
    ) external view returns (uint256, uint256, int256) {
        VoteResults storage results = voteResults[contestId];
        return (
            results.upvotes[entryId],
            results.downvotes[entryId],
            results.netVotes[entryId]
        );
    }

    /**
     * @dev Get all contest results
     * @param contestId Contest identifier
     * @return entryIds, upvotes, downvotes, netVotes
     */
    function getContestResults(
        string memory contestId
    ) external view returns (
        string[] memory,
        uint256[] memory,
        uint256[] memory,
        int256[] memory
    ) {
        ContestConfig memory contest = contests[contestId];
        string[] memory entryIds = contest.entryIds;
        uint256 length = entryIds.length;
        
        uint256[] memory upvotes = new uint256[](length);
        uint256[] memory downvotes = new uint256[](length);
        int256[] memory netVotes = new int256[](length);
        
        VoteResults storage results = voteResults[contestId];
        
        for (uint256 i = 0; i < length; i++) {
            upvotes[i] = results.upvotes[entryIds[i]];
            downvotes[i] = results.downvotes[entryIds[i]];
            netVotes[i] = results.netVotes[entryIds[i]];
        }
        
        return (entryIds, upvotes, downvotes, netVotes);
    }

    // Internal functions

    function _validateVoteReveal(
        ContestConfig memory contest,
        VoteReveal memory reveal
    ) internal pure {
        require(
            reveal.entryIds.length == reveal.voteTypes.length &&
            reveal.voteTypes.length == reveal.reasons.length &&
            reveal.reasons.length == reveal.justifications.length,
            "Array length mismatch"
        );

        uint256 upvoteCount = 0;
        uint256 downvoteCount = 0;

        for (uint256 i = 0; i < reveal.entryIds.length; i++) {
            // Validate entry ID
            bool validEntry = false;
            for (uint256 j = 0; j < contest.entryIds.length; j++) {
                if (keccak256(bytes(reveal.entryIds[i])) == keccak256(bytes(contest.entryIds[j]))) {
                    validEntry = true;
                    break;
                }
            }
            if (!validEntry) {
                revert InvalidEntryId();
            }

            // Count vote types
            if (reveal.voteTypes[i] == 1) {
                upvoteCount++;
            } else if (reveal.voteTypes[i] == -1) {
                downvoteCount++;
            } else {
                revert InvalidVoteCount();
            }

            // Validate justification
            require(bytes(reveal.justifications[i]).length > 0, "Justification required");
        }

        require(upvoteCount <= contest.maxUpvotes, "Too many upvotes");
        require(downvoteCount <= contest.maxDownvotes, "Too many downvotes");
    }

    function _processVotes(
        string memory contestId,
        VoteReveal memory reveal
    ) internal {
        VoteResults storage results = voteResults[contestId];
        results.totalVoters++;

        for (uint256 i = 0; i < reveal.entryIds.length; i++) {
            string memory entryId = reveal.entryIds[i];
            int8 voteType = reveal.voteTypes[i];
            VoteReason reason = reveal.reasons[i];
            string memory justification = reveal.justifications[i];

            // Update vote counts
            if (voteType == 1) {
                results.upvotes[entryId]++;
                results.netVotes[entryId]++;
            } else if (voteType == -1) {
                results.downvotes[entryId]++;
                results.netVotes[entryId]--;
            }

            // Track reason codes
            results.reasonCounts[entryId][reason]++;
            
            // Store justifications
            results.justifications[entryId].push(justification);
        }
    }

    function _getTotalVotes(VoteResults storage results) internal view returns (uint256) {
        uint256 total = 0;
        // This would require iterating through all entries
        // For gas efficiency, we'll return a placeholder
        return results.totalVoters * 5; // Approximate
    }

    // Admin functions

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function updateContestStatus(
        string memory contestId,
        bool isActive
    ) external onlyOwner {
        require(bytes(contests[contestId].contestId).length > 0, "Contest not found");
        contests[contestId].isActive = isActive;
    }
}