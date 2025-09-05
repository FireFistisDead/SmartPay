import { expect } from "chai";
const { ethers } = require("hardhat");

describe("MilestoneEscrow", function () {
  async function deployMilestoneEscrowFixture() {
    const [owner, client, freelancer, feeRecipient, disputeResolver, other] = await ethers.getSigners();

    // Deploy a mock ERC20 token for testing
    const MockToken = await ethers.getContractFactory("SmartPayToken");
    const mockToken = await MockToken.deploy(
      "Test Token",
      "TEST",
      18,
      1000000, // 1 million tokens
      owner.address
    );

    // Transfer tokens to client for testing
    await mockToken.transfer(client.address, ethers.parseEther("10000"));

    // Deploy MilestoneEscrow
    const MilestoneEscrow = await ethers.getContractFactory("MilestoneEscrow");
    const milestoneEscrow = await MilestoneEscrow.deploy(
      feeRecipient.address,
      disputeResolver.address
    );

    return {
      milestoneEscrow,
      mockToken,
      owner,
      client,
      freelancer,
      feeRecipient,
      disputeResolver,
      other,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct fee recipient and dispute resolver", async function () {
      const { milestoneEscrow, feeRecipient, disputeResolver } = await deployMilestoneEscrowFixture();
      
      expect(await milestoneEscrow.feeRecipient()).to.equal(feeRecipient.address);
      expect(await milestoneEscrow.disputeResolver()).to.equal(disputeResolver.address);
    });

    it("Should set default platform fee to 2.5%", async function () {
      const { milestoneEscrow } = await deployMilestoneEscrowFixture();
      expect(await milestoneEscrow.defaultPlatformFee()).to.equal(250); // 2.5% in basis points
    });
  });

  describe("Job Creation", function () {
    it("Should create a job with milestones", async function () {
      const { milestoneEscrow, mockToken, client, freelancer } = await deployMilestoneEscrowFixture();

      const descriptions = ["Design mockups", "Development", "Testing"];
      const amounts = [ethers.parseEther("100"), ethers.parseEther("300"), ethers.parseEther("100")];
      const deadlines = [
        Math.floor(Date.now() / 1000) + 86400 * 7,   // 1 week
        Math.floor(Date.now() / 1000) + 86400 * 14,  // 2 weeks
        Math.floor(Date.now() / 1000) + 86400 * 21,  // 3 weeks
      ];

      await expect(
        milestoneEscrow.connect(client).createJob(
          freelancer.address,
          mockToken.target,
          descriptions,
          amounts,
          deadlines
        )
      ).to.emit(milestoneEscrow, "JobCreated")
        .withArgs(0, client.address, freelancer.address, ethers.parseEther("500"), 3);

      const job = await milestoneEscrow.getJob(0);
      expect(job.client).to.equal(client.address);
      expect(job.freelancer).to.equal(freelancer.address);
      expect(job.totalAmount).to.equal(ethers.parseEther("500"));
      expect(await milestoneEscrow.getJobMilestonesCount(0)).to.equal(3);
    });

    it("Should fail if freelancer is the same as client", async function () {
      const { milestoneEscrow, mockToken, client } = await deployMilestoneEscrowFixture();

      const descriptions = ["Test milestone"];
      const amounts = [ethers.parseEther("100")];
      const deadlines = [Math.floor(Date.now() / 1000) + 86400];

      await expect(
        milestoneEscrow.connect(client).createJob(
          client.address, // Same as client
          mockToken.target,
          descriptions,
          amounts,
          deadlines
        )
      ).to.be.revertedWith("Client cannot be freelancer");
    });
  });

  describe("Fund Deposit", function () {
    it("Should allow client to deposit funds", async function () {
      const { milestoneEscrow, mockToken, client, freelancer } = await deployMilestoneEscrowFixture();

      // Create job
      const descriptions = ["Test milestone"];
      const amounts = [ethers.parseEther("100")];
      const deadlines = [Math.floor(Date.now() / 1000) + 86400];

      await milestoneEscrow.connect(client).createJob(
        freelancer.address,
        mockToken.target,
        descriptions,
        amounts,
        deadlines
      );

      // Approve tokens for escrow contract
      const totalAmount = ethers.parseEther("100");
      const feeAmount = (totalAmount * 250n) / 10000n; // 2.5% fee
      const totalRequired = totalAmount + feeAmount;

      await mockToken.connect(client).approve(milestoneEscrow.target, totalRequired);

      await expect(
        milestoneEscrow.connect(client).depositFunds(0)
      ).to.emit(milestoneEscrow, "FundsDeposited")
        .withArgs(0, totalRequired);

      const job = await milestoneEscrow.getJob(0);
      expect(job.fundsDeposited).to.be.true;
    });

    it("Should fail if funds already deposited", async function () {
      const { milestoneEscrow, mockToken, client, freelancer } = await deployMilestoneEscrowFixture();

      // Create job and deposit funds
      const descriptions = ["Test milestone"];
      const amounts = [ethers.parseEther("100")];
      const deadlines = [Math.floor(Date.now() / 1000) + 86400];

      await milestoneEscrow.connect(client).createJob(
        freelancer.address,
        mockToken.target,
        descriptions,
        amounts,
        deadlines
      );

      const totalAmount = ethers.parseEther("100");
      const feeAmount = (totalAmount * 250n) / 10000n;
      const totalRequired = totalAmount + feeAmount;

      await mockToken.connect(client).approve(milestoneEscrow.target, totalRequired);
      await milestoneEscrow.connect(client).depositFunds(0);

      // Try to deposit again
      await expect(
        milestoneEscrow.connect(client).depositFunds(0)
      ).to.be.revertedWith("Funds already deposited");
    });
  });

  describe("Milestone Workflow", function () {
    it("Should allow complete milestone workflow", async function () {
      const { milestoneEscrow, mockToken, client, freelancer, feeRecipient } = await deployMilestoneEscrowFixture();

      // Create job
      const descriptions = ["Test milestone"];
      const amounts = [ethers.parseEther("100")];
      const deadlines = [Math.floor(Date.now() / 1000) + 86400];

      await milestoneEscrow.connect(client).createJob(
        freelancer.address,
        mockToken.target,
        descriptions,
        amounts,
        deadlines
      );

      // Deposit funds
      const totalAmount = ethers.parseEther("100");
      const feeAmount = (totalAmount * 250n) / 10000n;
      const totalRequired = totalAmount + feeAmount;

      await mockToken.connect(client).approve(milestoneEscrow.target, totalRequired);
      await milestoneEscrow.connect(client).depositFunds(0);

      // Start milestone
      await expect(
        milestoneEscrow.connect(freelancer).startMilestone(0, 0)
      ).to.emit(milestoneEscrow, "MilestoneStarted")
        .withArgs(0, 0, freelancer.address);

      // Submit milestone
      await expect(
        milestoneEscrow.connect(freelancer).submitMilestone(0, 0, "ipfs://test-hash")
      ).to.emit(milestoneEscrow, "MilestoneSubmitted")
        .withArgs(0, 0, "ipfs://test-hash");

      // Check balances before approval
      const freelancerBalanceBefore = await mockToken.balanceOf(freelancer.address);
      const feeRecipientBalanceBefore = await mockToken.balanceOf(feeRecipient.address);

      // Approve milestone
      await expect(
        milestoneEscrow.connect(client).approveMilestone(0, 0)
      ).to.emit(milestoneEscrow, "MilestoneApproved")
        .withArgs(0, 0, client.address);

      // Check balances after approval
      const freelancerBalanceAfter = await mockToken.balanceOf(freelancer.address);
      const feeRecipientBalanceAfter = await mockToken.balanceOf(feeRecipient.address);

      const expectedFreelancerPayment = totalAmount - feeAmount;
      expect(freelancerBalanceAfter - freelancerBalanceBefore).to.equal(expectedFreelancerPayment);
      expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(feeAmount);

      // Check job completion
      const job = await milestoneEscrow.getJob(0);
      expect(job.status).to.equal(1); // JobStatus.Completed
    });
  });

  describe("Disputes", function () {
    it("Should allow raising and resolving disputes", async function () {
      const { milestoneEscrow, mockToken, client, freelancer, disputeResolver } = await deployMilestoneEscrowFixture();

      // Create job and deposit funds
      const descriptions = ["Test milestone"];
      const amounts = [ethers.parseEther("100")];
      const deadlines = [Math.floor(Date.now() / 1000) + 86400];

      await milestoneEscrow.connect(client).createJob(
        freelancer.address,
        mockToken.target,
        descriptions,
        amounts,
        deadlines
      );

      const totalAmount = ethers.parseEther("100");
      const feeAmount = (totalAmount * 250n) / 10000n;
      const totalRequired = totalAmount + feeAmount;

      await mockToken.connect(client).approve(milestoneEscrow.target, totalRequired);
      await milestoneEscrow.connect(client).depositFunds(0);

      // Start and submit milestone
      await milestoneEscrow.connect(freelancer).startMilestone(0, 0);
      await milestoneEscrow.connect(freelancer).submitMilestone(0, 0, "ipfs://test-hash");

      // Raise dispute
      await expect(
        milestoneEscrow.connect(client).raiseDispute(0, 0, "Work not satisfactory")
      ).to.emit(milestoneEscrow, "DisputeRaised")
        .withArgs(0, 0, 0, client.address);

      // Resolve dispute in favor of freelancer
      await expect(
        milestoneEscrow.connect(disputeResolver).resolveDispute(0, freelancer.address)
      ).to.emit(milestoneEscrow, "DisputeResolved")
        .withArgs(0, freelancer.address, totalAmount);

      const dispute = await milestoneEscrow.disputes(0);
      expect(dispute.resolved).to.be.true;
      expect(dispute.winner).to.equal(freelancer.address);
    });
  });

  describe("Access Control", function () {
    it("Should only allow client to deposit funds", async function () {
      const { milestoneEscrow, mockToken, client, freelancer, other } = await deployMilestoneEscrowFixture();

      const descriptions = ["Test milestone"];
      const amounts = [ethers.parseEther("100")];
      const deadlines = [Math.floor(Date.now() / 1000) + 86400];

      await milestoneEscrow.connect(client).createJob(
        freelancer.address,
        mockToken.target,
        descriptions,
        amounts,
        deadlines
      );

      await expect(
        milestoneEscrow.connect(other).depositFunds(0)
      ).to.be.revertedWith("Only client can call this");
    });

    it("Should only allow freelancer to start milestones", async function () {
      const { milestoneEscrow, mockToken, client, freelancer, other } = await deployMilestoneEscrowFixture();

      const descriptions = ["Test milestone"];
      const amounts = [ethers.parseEther("100")];
      const deadlines = [Math.floor(Date.now() / 1000) + 86400];

      await milestoneEscrow.connect(client).createJob(
        freelancer.address,
        mockToken.target,
        descriptions,
        amounts,
        deadlines
      );

      const totalAmount = ethers.parseEther("100");
      const feeAmount = (totalAmount * 250n) / 10000n;
      const totalRequired = totalAmount + feeAmount;

      await mockToken.connect(client).approve(milestoneEscrow.target, totalRequired);
      await milestoneEscrow.connect(client).depositFunds(0);

      await expect(
        milestoneEscrow.connect(other).startMilestone(0, 0)
      ).to.be.revertedWith("Only freelancer can call this");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to change platform fee", async function () {
      const { milestoneEscrow, owner } = await deployMilestoneEscrowFixture();

      await milestoneEscrow.connect(owner).setPlatformFee(500); // 5%
      expect(await milestoneEscrow.defaultPlatformFee()).to.equal(500);
    });

    it("Should not allow setting fee above 10%", async function () {
      const { milestoneEscrow, owner } = await deployMilestoneEscrowFixture();

      await expect(
        milestoneEscrow.connect(owner).setPlatformFee(1001) // 10.01%
      ).to.be.revertedWith("Fee cannot exceed 10%");
    });

    it("Should allow owner to pause and unpause", async function () {
      const { milestoneEscrow, owner } = await deployMilestoneEscrowFixture();

      await milestoneEscrow.connect(owner).pause();
      expect(await milestoneEscrow.paused()).to.be.true;

      await milestoneEscrow.connect(owner).unpause();
      expect(await milestoneEscrow.paused()).to.be.false;
    });
  });
});
