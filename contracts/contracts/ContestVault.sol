// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ContestVault
 * @dev Multi-signature escrow contract for contest funds
 * 
 * Key Features:
 * - Multi-signature fund release (organizer + Ranqly oracle)
 * - Automatic payout distribution based on rankings
 * - Support for both ETH and ERC20 tokens
 * - Contest finalization verification
 * - Emergency pause functionality
 * 
 * Based on Ranqly Whitepaper specifications for secure fund custody
 */
contract ContestVault is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using Counters for Counters.Counter;

    // Contest configuration
    struct ContestConfig {
        string contestId;
        address rewardToken; // address(0) for ETH
        uint256 totalReward;
        uint256[] rewardDistribution; // Percentage of total reward per rank
        uint256 finalizationDeadline;
        bool isFinalized;
        uint256 createdAt;
    }

    // Winner information
    struct Winner {
        address winner;
        uint256 rank;
        uint256 rewardAmount;
        bool claimed;
    }

    // Signature verification
    struct ContestFinalization {
        string contestId;
        bytes32 resultsHash;
        Winner[] winners;
        uint256 timestamp;
        bytes organizerSignature;
        bytes ranqlySignature;
    }

    // State variables
    mapping(string => ContestConfig) public contests;
    mapping(string => Winner[]) public contestWinners;
    mapping(string => mapping(address => bool)) public hasSigned;
    mapping(bytes32 => bool) public usedSignatures;
    
    address public ranqlyOracle;
    address public organizer;
    uint256 public signatureTimeout;
    
    Counters.Counter private _contestCounter;

    // Events
    event ContestCreated(
        string indexed contestId,
        address rewardToken,
        uint256 totalReward,
        uint256 finalizationDeadline
    );
    event ContestFinalized(
        string indexed contestId,
        bytes32 resultsHash,
        uint256 winnerCount
    );
    event RewardClaimed(
        string indexed contestId,
        address indexed winner,
        uint256 amount,
        uint256 rank
    );
    event EmergencyWithdraw(
        string indexed contestId,
        uint256 amount,
        address to
    );

    // Errors
    error ContestNotFound();
    error ContestAlreadyFinalized();
    error ContestNotFinalized();
    error FinalizationDeadlinePassed();
    error InvalidSignature();
    error SignatureAlreadyUsed();
    error UnauthorizedSigner();
    error RewardAlreadyClaimed();
    error NoRewardToClaim();
    error InvalidRewardDistribution();
    error InsufficientFunds();
    error InvalidWinnerData();

    constructor(
        address _ranqlyOracle,
        address _organizer,
        uint256 _signatureTimeout
    ) {
        ranqlyOracle = _ranqlyOracle;
        organizer = _organizer;
        signatureTimeout = _signatureTimeout;
    }

    /**
     * @dev Create a new contest vault
     * @param contestId Unique contest identifier
     * @param rewardToken Token address for rewards (address(0) for ETH)
     * @param totalReward Total reward amount
     * @param rewardDistribution Percentage distribution per rank
     * @param finalizationDeadline Deadline for contest finalization
     */
    function createContest(
        string memory contestId,
        address rewardToken,
        uint256 totalReward,
        uint256[] memory rewardDistribution,
        uint256 finalizationDeadline
    ) external payable nonReentrant {
        require(bytes(contestId).length > 0, "Invalid contest ID");
        require(totalReward > 0, "Invalid reward amount");
        require(rewardDistribution.length > 0, "Invalid distribution");
        require(finalizationDeadline > block.timestamp, "Invalid deadline");

        // Verify reward distribution percentages
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < rewardDistribution.length; i++) {
            totalPercentage += rewardDistribution[i];
        }
        if (totalPercentage != 10000) { // 100% = 10000 basis points
            revert InvalidRewardDistribution();
        }

        // Check if contest already exists
        if (contests[contestId].createdAt != 0) {
            revert ContestNotFound();
        }

        // Handle ETH deposits
        if (rewardToken == address(0)) {
            require(msg.value >= totalReward, "Insufficient ETH deposit");
        } else {
            // Handle ERC20 token deposits
            IERC20(rewardToken).safeTransferFrom(
                msg.sender,
                address(this),
                totalReward
            );
        }

        // Create contest configuration
        contests[contestId] = ContestConfig({
            contestId: contestId,
            rewardToken: rewardToken,
            totalReward: totalReward,
            rewardDistribution: rewardDistribution,
            finalizationDeadline: finalizationDeadline,
            isFinalized: false,
            createdAt: block.timestamp
        });

        emit ContestCreated(
            contestId,
            rewardToken,
            totalReward,
            finalizationDeadline
        );
    }

    /**
     * @dev Finalize contest with multi-signature verification
     * @param finalization Contest finalization data with signatures
     */
    function finalizeContest(
        ContestFinalization memory finalization
    ) external nonReentrant {
        ContestConfig storage contest = contests[finalization.contestId];
        
        if (contest.createdAt == 0) {
            revert ContestNotFound();
        }
        if (contest.isFinalized) {
            revert ContestAlreadyFinalized();
        }
        if (block.timestamp > contest.finalizationDeadline) {
            revert FinalizationDeadlinePassed();
        }

        // Verify signatures
        _verifySignatures(finalization);

        // Validate winner data
        _validateWinners(finalization.contestId, finalization.winners, contest);

        // Store winners and mark contest as finalized
        contestWinners[finalization.contestId] = finalization.winners;
        contest.isFinalized = true;

        emit ContestFinalized(
            finalization.contestId,
            finalization.resultsHash,
            finalization.winners.length
        );
    }

    /**
     * @dev Claim reward for a winner
     * @param contestId Contest identifier
     * @param winnerIndex Index of winner in the winners array
     */
    function claimReward(
        string memory contestId,
        uint256 winnerIndex
    ) external nonReentrant {
        ContestConfig memory contest = contests[contestId];
        
        if (contest.createdAt == 0) {
            revert ContestNotFound();
        }
        if (!contest.isFinalized) {
            revert ContestNotFinalized();
        }

        Winner[] memory winners = contestWinners[contestId];
        require(winnerIndex < winners.length, "Invalid winner index");

        Winner storage winner = contestWinners[contestId][winnerIndex];
        
        if (winner.winner != msg.sender) {
            revert UnauthorizedSigner();
        }
        if (winner.claimed) {
            revert RewardAlreadyClaimed();
        }
        if (winner.rewardAmount == 0) {
            revert NoRewardToClaim();
        }

        winner.claimed = true;

        // Transfer reward
        if (contest.rewardToken == address(0)) {
            // ETH transfer
            payable(msg.sender).transfer(winner.rewardAmount);
        } else {
            // ERC20 transfer
            IERC20(contest.rewardToken).safeTransfer(
                msg.sender,
                winner.rewardAmount
            );
        }

        emit RewardClaimed(
            contestId,
            msg.sender,
            winner.rewardAmount,
            winner.rank
        );
    }

    /**
     * @dev Emergency withdraw (only before finalization)
     * @param contestId Contest identifier
     * @param to Recipient address
     */
    function emergencyWithdraw(
        string memory contestId,
        address to
    ) external onlyOwner nonReentrant {
        ContestConfig storage contest = contests[contestId];
        
        if (contest.createdAt == 0) {
            revert ContestNotFound();
        }
        if (contest.isFinalized) {
            revert ContestAlreadyFinalized();
        }

        uint256 amount = contest.totalReward;
        contest.totalReward = 0;

        if (contest.rewardToken == address(0)) {
            payable(to).transfer(amount);
        } else {
            IERC20(contest.rewardToken).safeTransfer(to, amount);
        }

        emit EmergencyWithdraw(contestId, amount, to);
    }

    /**
     * @dev Update Ranqly oracle address
     * @param newOracle New oracle address
     */
    function updateRanqlyOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle address");
        ranqlyOracle = newOracle;
    }

    /**
     * @dev Update organizer address
     * @param newOrganizer New organizer address
     */
    function updateOrganizer(address newOrganizer) external onlyOwner {
        require(newOrganizer != address(0), "Invalid organizer address");
        organizer = newOrganizer;
    }

    /**
     * @dev Pause contract for emergency
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

    // Internal functions

    function _verifySignatures(
        ContestFinalization memory finalization
    ) internal {
        // Create message hash for signature verification
        bytes32 messageHash = keccak256(abi.encodePacked(
            finalization.contestId,
            finalization.resultsHash,
            finalization.timestamp,
            address(this),
            block.chainid
        ));

        // Verify organizer signature
        bytes32 organizerHash = messageHash.toEthSignedMessageHash();
        address organizerSigner = organizerHash.recover(finalization.organizerSignature);
        if (organizerSigner != organizer) {
            revert UnauthorizedSigner();
        }

        // Verify Ranqly oracle signature
        bytes32 ranqlyHash = messageHash.toEthSignedMessageHash();
        address ranqlySigner = ranqlyHash.recover(finalization.ranqlySignature);
        if (ranqlySigner != ranqlyOracle) {
            revert UnauthorizedSigner();
        }

        // Check signature timeout
        if (block.timestamp > finalization.timestamp + signatureTimeout) {
            revert InvalidSignature();
        }

        // Prevent signature reuse
        bytes32 signatureHash = keccak256(
            abi.encodePacked(
                finalization.organizerSignature,
                finalization.ranqlySignature
            )
        );
        if (usedSignatures[signatureHash]) {
            revert SignatureAlreadyUsed();
        }
        usedSignatures[signatureHash] = true;
    }

    function _validateWinners(
        string memory contestId,
        Winner[] memory winners,
        ContestConfig memory contest
    ) internal pure {
        if (winners.length == 0) {
            revert InvalidWinnerData();
        }

        uint256 totalRewardCalculated = 0;
        for (uint256 i = 0; i < winners.length; i++) {
            Winner memory winner = winners[i];
            
            if (winner.winner == address(0)) {
                revert InvalidWinnerData();
            }
            if (winner.rank == 0 || winner.rank > contest.rewardDistribution.length) {
                revert InvalidWinnerData();
            }

            // Calculate reward amount based on distribution
            uint256 rewardPercentage = contest.rewardDistribution[winner.rank - 1];
            uint256 expectedReward = (contest.totalReward * rewardPercentage) / 10000;
            
            if (winner.rewardAmount != expectedReward) {
                revert InvalidWinnerData();
            }

            totalRewardCalculated += winner.rewardAmount;
        }

        if (totalRewardCalculated != contest.totalReward) {
            revert InvalidWinnerData();
        }
    }

    // View functions

    /**
     * @dev Get contest information
     * @param contestId Contest identifier
     * @return Contest configuration
     */
    function getContest(string memory contestId) external view returns (ContestConfig memory) {
        return contests[contestId];
    }

    /**
     * @dev Get winners for a contest
     * @param contestId Contest identifier
     * @return Array of winners
     */
    function getContestWinners(string memory contestId) external view returns (Winner[] memory) {
        return contestWinners[contestId];
    }

    /**
     * @dev Check if address can claim reward
     * @param contestId Contest identifier
     * @param winner Address to check
     * @return True if can claim, amount, and rank
     */
    function canClaimReward(
        string memory contestId,
        address winner
    ) external view returns (bool, uint256, uint256) {
        Winner[] memory winners = contestWinners[contestId];
        
        for (uint256 i = 0; i < winners.length; i++) {
            if (winners[i].winner == winner && !winners[i].claimed) {
                return (true, winners[i].rewardAmount, winners[i].rank);
            }
        }
        
        return (false, 0, 0);
    }
}