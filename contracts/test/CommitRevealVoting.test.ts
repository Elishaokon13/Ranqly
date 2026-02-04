import { expect } from "chai";
import { ethers } from "hardhat";
import { CommitRevealVoting, PoIVotingNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("CommitRevealVoting", function () {
  let voting: CommitRevealVoting;
  let poiNFT: PoIVotingNFT;
  let owner: SignerWithAddress;
  let organizer: SignerWithAddress;
  let voter1: SignerWithAddress;
  let voter2: SignerWithAddress;
  let voter3: SignerWithAddress;

  const MINT_PRICE = ethers.utils.parseEther("0.001");
  const CONTEST_ID = ethers.utils.id("test-contest");
  const SUBMISSION_IDS = [1, 2, 3];
  const COMMIT_DURATION = 3600; // 1 hour
  const REVEAL_DURATION = 3600; // 1 hour

  beforeEach(async function () {
    [owner, organizer, voter1, voter2, voter3] = await ethers.getSigners();

    // Deploy PoI NFT
    const PoIVotingNFTFactory = await ethers.getContractFactory("PoIVotingNFT");
    poiNFT = await PoIVotingNFTFactory.deploy(owner.address, MINT_PRICE);
    await poiNFT.deployed();

    // Deploy CommitRevealVoting
    const CommitRevealVotingFactory = await ethers.getContractFactory("CommitRevealVoting");
    voting = await CommitRevealVotingFactory.deploy(poiNFT.address);
    await voting.deployed();

    // Mint PoI NFTs for voters
    const emptyProof: string[] = [];
    await poiNFT.connect(voter1).mintPoI(voter1.address, emptyProof, { value: MINT_PRICE });
    await poiNFT.connect(voter2).mintPoI(voter2.address, emptyProof, { value: MINT_PRICE });
    await poiNFT.connect(voter3).mintPoI(voter3.address, emptyProof, { value: MINT_PRICE });
  });

  describe("Contest Creation", function () {
    it("Should create a contest successfully", async function () {
      await expect(
        voting.connect(owner).createContest(
          CONTEST_ID,
          organizer.address,
          SUBMISSION_IDS,
          COMMIT_DURATION,
          REVEAL_DURATION
        )
      ).to.emit(voting, "VotingPhaseStarted");

      const contestInfo = await voting.getContestInfo(CONTEST_ID);
      expect(contestInfo.organizer).to.equal(organizer.address);
      expect(contestInfo.isActive).to.be.true;
    });

    it("Should reject contest creation with invalid duration", async function () {
      await expect(
        voting.connect(owner).createContest(
          CONTEST_ID,
          organizer.address,
          SUBMISSION_IDS,
          1800, // Less than MIN_COMMIT_DURATION
          REVEAL_DURATION
        )
      ).to.be.revertedWith("Commit duration too short");

      await expect(
        voting.connect(owner).createContest(
          CONTEST_ID,
          organizer.address,
          SUBMISSION_IDS,
          COMMIT_DURATION,
          1800 // Less than MIN_REVEAL_DURATION
        )
      ).to.be.revertedWith("Reveal duration too short");
    });

    it("Should reject contest creation with no submissions", async function () {
      await expect(
        voting.connect(owner).createContest(
          CONTEST_ID,
          organizer.address,
          [], // Empty submissions
          COMMIT_DURATION,
          REVEAL_DURATION
        )
      ).to.be.revertedWith("No submissions provided");
    });

    it("Should reject duplicate contest creation", async function () {
      await voting.connect(owner).createContest(
        CONTEST_ID,
        organizer.address,
        SUBMISSION_IDS,
        COMMIT_DURATION,
        REVEAL_DURATION
      );

      await expect(
        voting.connect(owner).createContest(
          CONTEST_ID,
          organizer.address,
          SUBMISSION_IDS,
          COMMIT_DURATION,
          REVEAL_DURATION
        )
      ).to.be.revertedWith("Contest already exists");
    });
  });

  describe("Vote Committing", function () {
    beforeEach(async function () {
      await voting.connect(owner).createContest(
        CONTEST_ID,
        organizer.address,
        SUBMISSION_IDS,
        COMMIT_DURATION,
        REVEAL_DURATION
      );
    });

    it("Should allow vote commitment", async function () {
      const submissionId = SUBMISSION_IDS[0];
      const voteType = 1; // upvote
      const justification = "Great submission!";
      const salt = 12345;
      
      const commitHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["uint256", "uint8", "string", "uint256"],
          [submissionId, voteType, justification, salt]
        )
      );

      await expect(
        voting.connect(voter1).commitVote(CONTEST_ID, commitHash)
      ).to.emit(voting, "VoteCommitted");

      const commit = await voting.getVoteCommit(CONTEST_ID, voter1.address);
      expect(commit.commitHash).to.equal(commitHash);
      expect(commit.revealed).to.be.false;
    });

    it("Should reject commitment without PoI NFT", async function () {
      const commitHash = ethers.utils.keccak256("test");
      
      await expect(
        voting.connect(organizer).commitVote(CONTEST_ID, commitHash)
      ).to.be.revertedWith("PoI NFT required");
    });

    it("Should reject duplicate commitment", async function () {
      const commitHash = ethers.utils.keccak256("test");
      
      await voting.connect(voter1).commitVote(CONTEST_ID, commitHash);
      
      await expect(
        voting.connect(voter1).commitVote(CONTEST_ID, commitHash)
      ).to.be.revertedWith("Already committed");
    });

    it("Should reject commitment after commit phase ends", async function () {
      // Fast forward past commit phase
      await ethers.provider.send("evm_increaseTime", [COMMIT_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);

      const commitHash = ethers.utils.keccak256("test");
      
      await expect(
        voting.connect(voter1).commitVote(CONTEST_ID, commitHash)
      ).to.be.revertedWith("Commit phase ended");
    });
  });

  describe("Vote Revealing", function () {
    beforeEach(async function () {
      await voting.connect(owner).createContest(
        CONTEST_ID,
        organizer.address,
        SUBMISSION_IDS,
        COMMIT_DURATION,
        REVEAL_DURATION
      );

      // Commit votes
      const submissionId = SUBMISSION_IDS[0];
      const voteType = 1;
      const justification = "Great submission!";
      const salt = 12345;
      
      const commitHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["uint256", "uint8", "string", "uint256"],
          [submissionId, voteType, justification, salt]
        )
      );

      await voting.connect(voter1).commitVote(CONTEST_ID, commitHash);
      await voting.connect(voter2).commitVote(CONTEST_ID, commitHash);

      // Fast forward to reveal phase
      await ethers.provider.send("evm_increaseTime", [COMMIT_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);
    });

    it("Should allow vote revelation", async function () {
      const submissionId = SUBMISSION_IDS[0];
      const voteType = 1;
      const justification = "Great submission!";
      const salt = 12345;

      await expect(
        voting.connect(voter1).revealVote(CONTEST_ID, submissionId, voteType, justification, salt)
      ).to.emit(voting, "VoteRevealed");

      const reveal = await voting.getVoteReveal(CONTEST_ID, voter1.address);
      expect(reveal.submissionId).to.equal(submissionId);
      expect(reveal.voteType).to.equal(voteType);
      expect(reveal.justification).to.equal(justification);
    });

    it("Should reject revelation with invalid hash", async function () {
      const submissionId = SUBMISSION_IDS[0];
      const voteType = 1;
      const justification = "Great submission!";
      const salt = 54321; // Wrong salt

      await expect(
        voting.connect(voter1).revealVote(CONTEST_ID, submissionId, voteType, justification, salt)
      ).to.be.revertedWith("Invalid reveal");
    });

    it("Should reject revelation before commit phase ends", async function () {
      // Reset time to before commit phase ends
      await ethers.provider.send("evm_increaseTime", [-COMMIT_DURATION]);
      await ethers.provider.send("evm_mine", []);

      const submissionId = SUBMISSION_IDS[0];
      const voteType = 1;
      const justification = "Great submission!";
      const salt = 12345;

      await expect(
        voting.connect(voter1).revealVote(CONTEST_ID, submissionId, voteType, justification, salt)
      ).to.be.revertedWith("Commit phase not ended");
    });

    it("Should reject revelation after reveal phase ends", async function () {
      // Fast forward past reveal phase
      await ethers.provider.send("evm_increaseTime", [REVEAL_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);

      const submissionId = SUBMISSION_IDS[0];
      const voteType = 1;
      const justification = "Great submission!";
      const salt = 12345;

      await expect(
        voting.connect(voter1).revealVote(CONTEST_ID, submissionId, voteType, justification, salt)
      ).to.be.revertedWith("Reveal phase ended");
    });

    it("Should update vote counts correctly", async function () {
      const submissionId = SUBMISSION_IDS[0];
      const justification = "Great submission!";
      const salt = 12345;

      // Reveal upvote from voter1
      await voting.connect(voter1).revealVote(CONTEST_ID, submissionId, 1, justification, salt);
      
      // Reveal downvote from voter2
      await voting.connect(voter2).revealVote(CONTEST_ID, submissionId, 2, justification, salt);

      const votes = await voting.getSubmissionVotes(CONTEST_ID, submissionId);
      expect(votes.upvotes).to.equal(1);
      expect(votes.downvotes).to.equal(1);
      expect(votes.netVotes).to.equal(0);
    });
  });

  describe("Sybil Detection", function () {
    beforeEach(async function () {
      await voting.connect(owner).createContest(
        CONTEST_ID,
        organizer.address,
        SUBMISSION_IDS,
        COMMIT_DURATION,
        REVEAL_DURATION
      );
    });

    it("Should allow marking sybil voters", async function () {
      await expect(
        voting.connect(owner).markSybilVoter(CONTEST_ID, voter1.address, "Suspicious behavior")
      ).to.emit(voting, "SybilVoteDetected");

      const isSybil = await voting.isSybilVoter(CONTEST_ID, voter1.address);
      expect(isSybil).to.be.true;
    });

    it("Should reject marking same voter as sybil twice", async function () {
      await voting.connect(owner).markSybilVoter(CONTEST_ID, voter1.address, "Suspicious behavior");
      
      await expect(
        voting.connect(owner).markSybilVoter(CONTEST_ID, voter1.address, "Another reason")
      ).to.be.revertedWith("Already marked as sybil");
    });

    it("Should exclude sybil votes from counts", async function () {
      // Commit and reveal vote
      const submissionId = SUBMISSION_IDS[0];
      const voteType = 1;
      const justification = "Great submission!";
      const salt = 12345;
      
      const commitHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["uint256", "uint8", "string", "uint256"],
          [submissionId, voteType, justification, salt]
        )
      );

      await voting.connect(voter1).commitVote(CONTEST_ID, commitHash);
      
      // Fast forward to reveal phase
      await ethers.provider.send("evm_increaseTime", [COMMIT_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);

      await voting.connect(voter1).revealVote(CONTEST_ID, submissionId, voteType, justification, salt);

      // Mark as sybil
      await voting.connect(owner).markSybilVoter(CONTEST_ID, voter1.address, "Suspicious behavior");

      const votes = await voting.getSubmissionVotes(CONTEST_ID, submissionId);
      expect(votes.upvotes).to.equal(0);
      expect(votes.downvotes).to.equal(0);
      expect(votes.netVotes).to.equal(0);
    });
  });

  describe("Contest Management", function () {
    beforeEach(async function () {
      await voting.connect(owner).createContest(
        CONTEST_ID,
        organizer.address,
        SUBMISSION_IDS,
        COMMIT_DURATION,
        REVEAL_DURATION
      );
    });

    it("Should allow ending contest", async function () {
      // Fast forward past all phases
      await ethers.provider.send("evm_increaseTime", [COMMIT_DURATION + REVEAL_DURATION + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        voting.connect(owner).endContest(CONTEST_ID)
      ).to.emit(voting, "VotingPhaseEnded");

      const contestInfo = await voting.getContestInfo(CONTEST_ID);
      expect(contestInfo.isActive).to.be.false;
    });

    it("Should reject ending contest before time", async function () {
      await expect(
        voting.connect(owner).endContest(CONTEST_ID)
      ).to.be.revertedWith("Voting not finished");
    });

    it("Should check submission validity", async function () {
      const isValid = await voting.isValidSubmission(CONTEST_ID, SUBMISSION_IDS[0]);
      expect(isValid).to.be.true;

      const isInvalid = await voting.isValidSubmission(CONTEST_ID, 999);
      expect(isInvalid).to.be.false;
    });
  });

  describe("Access Control", function () {
    it("Should reject non-owner operations", async function () {
      await expect(
        voting.connect(voter1).createContest(
          CONTEST_ID,
          organizer.address,
          SUBMISSION_IDS,
          COMMIT_DURATION,
          REVEAL_DURATION
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow pausing and unpausing", async function () {
      await voting.connect(owner).pause();
      
      await expect(
        voting.connect(voter1).commitVote(CONTEST_ID, ethers.utils.keccak256("test"))
      ).to.be.revertedWith("Pausable: paused");

      await voting.connect(owner).unpause();
      
      // Should work after unpause
      await voting.connect(owner).createContest(
        CONTEST_ID,
        organizer.address,
        SUBMISSION_IDS,
        COMMIT_DURATION,
        REVEAL_DURATION
      );
    });
  });
});
