import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("MoodOracle Contract", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployMoodOracleFixture() {
    const [owner, otherAccount, mockExecutor] = await ethers.getSigners();

    const MoodOracle = await ethers.getContractFactory("MoodOracle");
    const oracle = await MoodOracle.deploy(mockExecutor.address);

    return { oracle, owner, otherAccount, mockExecutor };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { oracle, owner } = await loadFixture(deployMoodOracleFixture);
      expect(await oracle.owner()).to.equal(owner.address);
    });

    it("Should set the correct executor", async function () {
      const { oracle, mockExecutor } = await loadFixture(deployMoodOracleFixture);
      expect(await oracle.executor()).to.equal(mockExecutor.address);
    });
  });

  describe("Executor Management", function () {
    it("Should allow the owner to set a new executor", async function () {
      const { oracle, owner, otherAccount } = await loadFixture(
        deployMoodOracleFixture
      );

      const newExecutor = otherAccount.address;
      await expect(oracle.connect(owner).setExecutor(newExecutor))
        .to.not.be.reverted;

      expect(await oracle.executor()).to.equal(newExecutor);
    });

    it("Should fail if a non-owner tries to set a new executor", async function () {
      const { oracle, otherAccount } = await loadFixture(
        deployMoodOracleFixture
      );

      const newExecutor = otherAccount.address;
      await expect(
        oracle.connect(otherAccount).setExecutor(newExecutor)
      ).to.be.revertedWith("Only owner");
    });
  });
});
