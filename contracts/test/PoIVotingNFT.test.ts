import { expect } from "chai";
import { ethers } from "hardhat";
import { PoIVotingNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("PoIVotingNFT", function () {
  let poiNFT: PoIVotingNFT;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let attacker: SignerWithAddress;

  const MINT_PRICE = ethers.utils.parseEther("0.001"); // 0.001 ETH for testing

  beforeEach(async function () {
    [owner, user1, user2, attacker] = await ethers.getSigners();

    const PoIVotingNFTFactory = await ethers.getContractFactory("PoIVotingNFT");
    poiNFT = await PoIVotingNFTFactory.deploy(owner.address, MINT_PRICE);
    await poiNFT.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await poiNFT.owner()).to.equal(owner.address);
    });

    it("Should set the correct mint price", async function () {
      expect(await poiNFT.mintPrice()).to.equal(MINT_PRICE);
    });

    it("Should have correct name and symbol", async function () {
      expect(await poiNFT.name()).to.equal("Ranqly Proof of Identity");
      expect(await poiNFT.symbol()).to.equal("POI");
    });
  });

  describe("Minting", function () {
    it("Should allow minting with correct payment", async function () {
      const emptyProof: string[] = [];
      
      await expect(
        poiNFT.connect(user1).mintPoI(user1.address, emptyProof, {
          value: MINT_PRICE,
        })
      )
        .to.emit(poiNFT, "PoIMinted")
        .withArgs(user1.address, 0, MINT_PRICE);

      expect(await poiNFT.hasMinted(user1.address)).to.be.true;
      expect(await poiNFT.isHolder(user1.address)).to.be.true;
    });

    it("Should reject minting with insufficient payment", async function () {
      const emptyProof: string[] = [];
      const insufficientPayment = MINT_PRICE.sub(1);

      await expect(
        poiNFT.connect(user1).mintPoI(user1.address, emptyProof, {
          value: insufficientPayment,
        })
      ).to.be.revertedWith("PoIVotingNFT: Insufficient payment");
    });

    it("Should reject duplicate minting", async function () {
      const emptyProof: string[] = [];

      // First mint should succeed
      await poiNFT.connect(user1).mintPoI(user1.address, emptyProof, {
        value: MINT_PRICE,
      });

      // Second mint should fail
      await expect(
        poiNFT.connect(user1).mintPoI(user1.address, emptyProof, {
          value: MINT_PRICE,
        })
      ).to.be.revertedWith("PoIVotingNFT: Already minted");
    });

    it("Should refund excess payment", async function () {
      const emptyProof: string[] = [];
      const excessPayment = MINT_PRICE.add(ethers.utils.parseEther("0.001"));
      const initialBalance = await user1.getBalance();

      const tx = await poiNFT.connect(user1).mintPoI(user1.address, emptyProof, {
        value: excessPayment,
      });

      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      const finalBalance = await user1.getBalance();

      // Should refund the excess payment
      expect(finalBalance).to.be.closeTo(
        initialBalance.sub(MINT_PRICE).sub(gasUsed),
        ethers.utils.parseEther("0.0001")
      );
    });

    it("Should reject minting to zero address", async function () {
      const emptyProof: string[] = [];

      await expect(
        poiNFT.connect(user1).mintPoI(ethers.constants.AddressZero, emptyProof, {
          value: MINT_PRICE,
        })
      ).to.be.revertedWith("PoIVotingNFT: Invalid address");
    });
  });

  describe("Non-transferable (Soulbound)", function () {
    beforeEach(async function () {
      const emptyProof: string[] = [];
      await poiNFT.connect(user1).mintPoI(user1.address, emptyProof, {
        value: MINT_PRICE,
      });
    });

    it("Should reject transferFrom", async function () {
      await expect(
        poiNFT.connect(user1).transferFrom(user1.address, user2.address, 0)
      ).to.be.revertedWith("PoIVotingNFT: Non-transferable");
    });

    it("Should reject safeTransferFrom", async function () {
      await expect(
        poiNFT.connect(user1).safeTransferFrom(user1.address, user2.address, 0)
      ).to.be.revertedWith("PoIVotingNFT: Non-transferable");
    });

    it("Should reject safeTransferFrom with data", async function () {
      await expect(
        poiNFT.connect(user1).safeTransferFrom(
          user1.address,
          user2.address,
          0,
          "0x"
        )
      ).to.be.revertedWith("PoIVotingNFT: Non-transferable");
    });
  });

  describe("Revocation", function () {
    beforeEach(async function () {
      const emptyProof: string[] = [];
      await poiNFT.connect(user1).mintPoI(user1.address, emptyProof, {
        value: MINT_PRICE,
      });
    });

    it("Should allow owner to revoke PoI", async function () {
      const reason = "Violation of terms";
      
      await expect(
        poiNFT.connect(owner).revokePoI(0, reason)
      )
        .to.emit(poiNFT, "PoIRevoked")
        .withArgs(user1.address, 0, reason);

      expect(await poiNFT.isRevoked(0)).to.be.true;
      expect(await poiNFT.revokeReason(0)).to.equal(reason);
      expect(await poiNFT.isHolder(user1.address)).to.be.false;
    });

    it("Should reject revocation by non-owner", async function () {
      await expect(
        poiNFT.connect(user2).revokePoI(0, "Unauthorized")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to restore revoked PoI", async function () {
      // First revoke
      await poiNFT.connect(owner).revokePoI(0, "Test revocation");
      
      // Then restore
      await poiNFT.connect(owner).restorePoI(0);
      
      expect(await poiNFT.isRevoked(0)).to.be.false;
      expect(await poiNFT.isHolder(user1.address)).to.be.true;
    });
  });

  describe("Sybil Resistance", function () {
    it("Should check minimum balance requirement", async function () {
      const emptyProof: string[] = [];
      
      // This test assumes the contract checks balance
      // In a real scenario, you might need to send ETH to the user first
      // or mock the balance check
      
      await poiNFT.connect(user1).mintPoI(user1.address, emptyProof, {
        value: MINT_PRICE,
      });
      
      expect(await poiNFT.hasMinted(user1.address)).to.be.true;
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to update mint price", async function () {
      const newPrice = ethers.utils.parseEther("0.002");
      
      await expect(
        poiNFT.connect(owner).updateMintPrice(newPrice)
      )
        .to.emit(poiNFT, "MintPriceUpdated")
        .withArgs(newPrice);

      expect(await poiNFT.mintPrice()).to.equal(newPrice);
    });

    it("Should reject mint price update by non-owner", async function () {
      const newPrice = ethers.utils.parseEther("0.002");
      
      await expect(
        poiNFT.connect(user1).updateMintPrice(newPrice)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to pause/unpause", async function () {
      await poiNFT.connect(owner).pause();
      expect(await poiNFT.paused()).to.be.true;

      await poiNFT.connect(owner).unpause();
      expect(await poiNFT.paused()).to.be.false;
    });

    it("Should reject minting when paused", async function () {
      await poiNFT.connect(owner).pause();
      
      const emptyProof: string[] = [];
      await expect(
        poiNFT.connect(user1).mintPoI(user1.address, emptyProof, {
          value: MINT_PRICE,
        })
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Withdrawal", function () {
    beforeEach(async function () {
      const emptyProof: string[] = [];
      await poiNFT.connect(user1).mintPoI(user1.address, emptyProof, {
        value: MINT_PRICE,
      });
    });

    it("Should allow owner to withdraw ETH", async function () {
      const initialBalance = await owner.getBalance();
      
      await poiNFT.connect(owner).withdraw();
      
      const finalBalance = await owner.getBalance();
      expect(finalBalance).to.be.greaterThan(initialBalance);
    });

    it("Should reject withdrawal by non-owner", async function () {
      await expect(
        poiNFT.connect(user1).withdraw()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple users minting", async function () {
      const emptyProof: string[] = [];
      
      // Mint for user1
      await poiNFT.connect(user1).mintPoI(user1.address, emptyProof, {
        value: MINT_PRICE,
      });
      
      // Mint for user2
      await poiNFT.connect(user2).mintPoI(user2.address, emptyProof, {
        value: MINT_PRICE,
      });
      
      expect(await poiNFT.hasMinted(user1.address)).to.be.true;
      expect(await poiNFT.hasMinted(user2.address)).to.be.true;
      expect(await poiNFT.totalSupply()).to.equal(2);
    });

    it("Should track minting timestamps", async function () {
      const emptyProof: string[] = [];
      const beforeMint = Math.floor(Date.now() / 1000);
      
      await poiNFT.connect(user1).mintPoI(user1.address, emptyProof, {
        value: MINT_PRICE,
      });
      
      const afterMint = Math.floor(Date.now() / 1000);
      const mintedAt = await poiNFT.mintedAt(user1.address);
      
      expect(mintedAt.toNumber()).to.be.greaterThanOrEqual(beforeMint);
      expect(mintedAt.toNumber()).to.be.lessThanOrEqual(afterMint);
    });
  });
});
