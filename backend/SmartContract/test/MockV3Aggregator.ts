import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { MockV3Aggregator } from "../typechain-types";

describe("MockV3Aggregator", function () {
  async function deployMockV3AggregatorFixture() {
    const [owner, addr1] = await ethers.getSigners();
    
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    const decimals = 8;
    const initialAnswer = 200000000000; // $2000 with 8 decimals
    const mockV3Aggregator = await MockV3Aggregator.deploy(decimals, initialAnswer) as MockV3Aggregator;
    
    return { mockV3Aggregator, owner, addr1, decimals, initialAnswer };
  }

  describe("Deployment", function () {
    it("Should set the right decimals and initial answer", async function () {
      const { mockV3Aggregator, decimals, initialAnswer } = await loadFixture(deployMockV3AggregatorFixture);
      
      expect(await mockV3Aggregator.decimals()).to.equal(decimals);
      expect(await mockV3Aggregator.latestAnswer()).to.equal(initialAnswer);
      expect(await mockV3Aggregator.version()).to.equal(4);
    });

    it("Should set initial round data correctly", async function () {
      const { mockV3Aggregator, initialAnswer } = await loadFixture(deployMockV3AggregatorFixture);
      
      const latestRound = await mockV3Aggregator.latestRound();
      expect(latestRound).to.equal(1);
      
      const answer = await mockV3Aggregator.getAnswer(latestRound);
      expect(answer).to.equal(initialAnswer);
    });
  });

  describe("Update Functions", function () {
    it("Should update answer and increment round", async function () {
      const { mockV3Aggregator, initialAnswer } = await loadFixture(deployMockV3AggregatorFixture);
      
      const newAnswer = 210000000000; // $2100 with 8 decimals
      await mockV3Aggregator.updateAnswer(newAnswer);
      
      expect(await mockV3Aggregator.latestAnswer()).to.equal(newAnswer);
      expect(await mockV3Aggregator.latestRound()).to.equal(2);
      
      // Check that old answer is still accessible
      const oldAnswer = await mockV3Aggregator.getAnswer(1);
      expect(oldAnswer).to.equal(initialAnswer);
    });

    it("Should update round data manually", async function () {
      const { mockV3Aggregator } = await loadFixture(deployMockV3AggregatorFixture);
      
      const roundId = 5;
      const answer = 190000000000; // $1900 with 8 decimals
      const timestamp = Math.floor(Date.now() / 1000);
      const startedAt = timestamp - 3600; // 1 hour ago
      
      await mockV3Aggregator.updateRoundData(roundId, answer, timestamp, startedAt);
      
      expect(await mockV3Aggregator.latestRound()).to.equal(roundId);
      expect(await mockV3Aggregator.latestAnswer()).to.equal(answer);
      expect(await mockV3Aggregator.latestTimestamp()).to.equal(timestamp);
    });
  });

  describe("Data Retrieval", function () {
    it("Should return latest round data correctly", async function () {
      const { mockV3Aggregator, initialAnswer } = await loadFixture(deployMockV3AggregatorFixture);
      
      const latestRoundData = await mockV3Aggregator.latestRoundData();
      
      expect(latestRoundData.roundId).to.equal(1);
      expect(latestRoundData.answer).to.equal(initialAnswer);
      expect(latestRoundData.answeredInRound).to.equal(1);
      expect(latestRoundData.startedAt).to.be.greaterThan(0);
      expect(latestRoundData.updatedAt).to.be.greaterThan(0);
    });

    it("Should return specific round data correctly", async function () {
      const { mockV3Aggregator, initialAnswer } = await loadFixture(deployMockV3AggregatorFixture);
      
      // Add another round
      const newAnswer = 210000000000;
      await mockV3Aggregator.updateAnswer(newAnswer);
      
      // Get data for first round
      const roundData = await mockV3Aggregator.getRoundData(1);
      
      expect(roundData.roundId).to.equal(1);
      expect(roundData.answer).to.equal(initialAnswer);
      expect(roundData.answeredInRound).to.equal(1);
    });

    it("Should return correct description", async function () {
      const { mockV3Aggregator } = await loadFixture(deployMockV3AggregatorFixture);
      
      const description = await mockV3Aggregator.description();
      expect(description).to.equal("v0.6/tests/MockV3Aggregator.sol");
    });
  });

  describe("Multiple Updates", function () {
    it("Should handle multiple answer updates", async function () {
      const { mockV3Aggregator } = await loadFixture(deployMockV3AggregatorFixture);
      
      const prices = [210000000000, 220000000000, 215000000000]; // $2100, $2200, $2150
      
      for (let i = 0; i < prices.length; i++) {
        await mockV3Aggregator.updateAnswer(prices[i]);
        
        expect(await mockV3Aggregator.latestAnswer()).to.equal(prices[i]);
        expect(await mockV3Aggregator.latestRound()).to.equal(i + 2); // Started at round 1
      }
      
      // Verify all historical data is preserved
      for (let i = 0; i < prices.length; i++) {
        const answer = await mockV3Aggregator.getAnswer(i + 2);
        expect(answer).to.equal(prices[i]);
      }
    });

    it("Should update timestamps correctly", async function () {
      const { mockV3Aggregator } = await loadFixture(deployMockV3AggregatorFixture);
      
      const timestamp1 = await mockV3Aggregator.latestTimestamp();
      
      // Wait a moment and update
      await new Promise(resolve => setTimeout(resolve, 1000));
      await mockV3Aggregator.updateAnswer(210000000000);
      
      const timestamp2 = await mockV3Aggregator.latestTimestamp();
      expect(timestamp2).to.be.greaterThan(timestamp1);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero answer", async function () {
      const { mockV3Aggregator } = await loadFixture(deployMockV3AggregatorFixture);
      
      await mockV3Aggregator.updateAnswer(0);
      
      expect(await mockV3Aggregator.latestAnswer()).to.equal(0);
      
      const latestRoundData = await mockV3Aggregator.latestRoundData();
      expect(latestRoundData.answer).to.equal(0);
    });

    it("Should handle negative answer", async function () {
      const { mockV3Aggregator } = await loadFixture(deployMockV3AggregatorFixture);
      
      const negativeAnswer = -100000000; // -$1 with 8 decimals
      await mockV3Aggregator.updateAnswer(negativeAnswer);
      
      expect(await mockV3Aggregator.latestAnswer()).to.equal(negativeAnswer);
      
      const latestRoundData = await mockV3Aggregator.latestRoundData();
      expect(latestRoundData.answer).to.equal(negativeAnswer);
    });

    it("Should handle very large numbers", async function () {
      const { mockV3Aggregator } = await loadFixture(deployMockV3AggregatorFixture);
      
      const largeAnswer = ethers.MaxInt256;
      await mockV3Aggregator.updateAnswer(largeAnswer);
      
      expect(await mockV3Aggregator.latestAnswer()).to.equal(largeAnswer);
    });
  });

  describe("Compatibility with Chainlink Interface", function () {
    it("Should implement IAggregatorV3Interface correctly", async function () {
      const { mockV3Aggregator } = await loadFixture(deployMockV3AggregatorFixture);
      
      // Test that all required interface methods exist and work
      const latestRoundData = await mockV3Aggregator.latestRoundData();
      
      expect(latestRoundData.roundId).to.be.a('bigint');
      expect(latestRoundData.answer).to.be.a('bigint');
      expect(latestRoundData.startedAt).to.be.a('bigint');
      expect(latestRoundData.updatedAt).to.be.a('bigint');
      expect(latestRoundData.answeredInRound).to.be.a('bigint');
    });

    it("Should maintain round ID consistency", async function () {
      const { mockV3Aggregator } = await loadFixture(deployMockV3AggregatorFixture);
      
      // Update several times
      for (let i = 0; i < 5; i++) {
        await mockV3Aggregator.updateAnswer(200000000000 + i * 10000000000);
      }
      
      const latestRoundData = await mockV3Aggregator.latestRoundData();
      const specificRoundData = await mockV3Aggregator.getRoundData(latestRoundData.roundId);
      
      // Latest round data should match specific round data for the same round
      expect(latestRoundData.roundId).to.equal(specificRoundData.roundId);
      expect(latestRoundData.answer).to.equal(specificRoundData.answer);
      expect(latestRoundData.startedAt).to.equal(specificRoundData.startedAt);
      expect(latestRoundData.updatedAt).to.equal(specificRoundData.updatedAt);
      expect(latestRoundData.answeredInRound).to.equal(specificRoundData.answeredInRound);
    });
  });
});
