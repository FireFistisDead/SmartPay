import { expect } from "chai";
const { ethers } = require("hardhat");

describe("AutomatedMilestoneEscrow", function () {
  async function deployAutomatedMilestoneEscrowFixture() {
    const [owner, client, freelancer, feeRecipient, disputeResolver, verifier1, verifier2] = await ethers.getSigners();

    // Deploy mock price feed for testing
    const MockPriceFeed = await ethers.getContractFactory("MockV3Aggregator");
    const mockPriceFeed = await MockPriceFeed.deploy(8, 200000000000); // $2000 with 8 decimals

    // Deploy mock ERC20 token
    const MockToken = await ethers.getContractFactory("MyToken");
    const mockToken = await MockToken.deploy();

    // Transfer tokens to client for testing
    await mockToken.transfer(client.address, ethers.parseEther("10000"));

    // Deploy AutomatedMilestoneEscrow
    const AutomatedMilestoneEscrow = await ethers.getContractFactory("AutomatedMilestoneEscrow");
    const escrow = await AutomatedMilestoneEscrow.deploy(
      feeRecipient.address,
      disputeResolver.address,
      mockPriceFeed.target
    );

    return {
      escrow,
      mockToken,
      mockPriceFeed,
      owner,
      client,
      freelancer,
      feeRecipient,
      disputeResolver,
      verifier1,
      verifier2,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct parameters", async function () {
      const { escrow, feeRecipient, disputeResolver } = await deployAutomatedMilestoneEscrowFixture();
      
      expect(await escrow.feeRecipient()).to.equal(feeRecipient.address);
      expect(await escrow.disputeResolver()).to.equal(disputeResolver.address);
      expect(await escrow.defaultPlatformFee()).to.equal(250); // 2.5%
      expect(await escrow.defaultAutoApprovalDelay()).to.equal(48 * 3600); // 48 hours
    });
  });

  describe("Off-Chain Verifier Management", function () {
    it("Should allow owner to add off-chain verifiers", async function () {
      const { escrow, owner, verifier1 } = await deployAutomatedMilestoneEscrowFixture();

      await expect(
        escrow.connect(owner).addOffChainVerifier(
          verifier1.address,
          "Professional Code Reviewer",
          85
        )
      ).to.emit(escrow, "OffChainVerifierAdded")
        .withArgs(verifier1.address, "Professional Code Reviewer");

      const verifier = await escrow.getOffChainVerifier(verifier1.address);
      expect(verifier.verifierName).to.equal("Professional Code Reviewer");
      expect(verifier.isActive).to.be.true;
      expect(verifier.reputation).to.equal(85);
    });

    it("Should allow updating verifier status", async function () {
      const { escrow, owner, verifier1 } = await deployAutomatedMilestoneEscrowFixture();

      await escrow.connect(owner).addOffChainVerifier(
        verifier1.address,
        "Test Verifier",
        75
      );

      await expect(
        escrow.connect(owner).updateOffChainVerifier(
          verifier1.address,
          false,
          90
        )
      ).to.emit(escrow, "OffChainVerifierUpdated")
        .withArgs(verifier1.address, false, 90);

      const verifier = await escrow.getOffChainVerifier(verifier1.address);
      expect(verifier.isActive).to.be.false;
      expect(verifier.reputation).to.equal(90);
    });
  });

  describe("Automated Job Creation", function () {
    it("Should create job with automation settings", async function () {
      const { escrow, mockToken, client, freelancer } = await deployAutomatedMilestoneEscrowFixture();

      const descriptions = ["Design wireframes", "Implement frontend", "Testing and deployment"];
      const amounts = [ethers.parseEther("100"), ethers.parseEther("300"), ethers.parseEther("100")];
      const deadlines = [
        Math.floor(Date.now() / 1000) + 86400 * 7,   // 1 week
        Math.floor(Date.now() / 1000) + 86400 * 14,  // 2 weeks
        Math.floor(Date.now() / 1000) + 86400 * 21,  // 3 weeks
      ];
      const verificationMethods = [0, 1, 2]; // ClientOnly, OracleOnly, Hybrid
      const verificationCriteria = [
        '{"type":"manual","requirements":["wireframes complete"]}',
        '{"type":"automated","tests":["unit tests pass","integration tests pass"]}',
        '{"type":"hybrid","automated_checks":["deployment successful"],"manual_review":true}'
      ];
      const autoApprovalDelays = [0, 24 * 3600, 48 * 3600]; // 0, 24h, 48h
      const metadataHash = "QmTestMetadataHash123";

      await expect(
        escrow.connect(client).createJobWithAutomation(
          freelancer.address,
          mockToken.target,
          descriptions,
          amounts,
          deadlines,
          verificationMethods,
          verificationCriteria,
          autoApprovalDelays,
          metadataHash
        )
      ).to.emit(escrow, "JobCreated")
        .withArgs(0, client.address, freelancer.address, ethers.parseEther("500"), 3, metadataHash);

      const job = await escrow.getJob(0);
      expect(job.metadataHash).to.equal(metadataHash);
      expect(job.client).to.equal(client.address);
      expect(job.freelancer).to.equal(freelancer.address);
      expect(job.totalAmount).to.equal(ethers.parseEther("500"));

      // Check milestone automation settings
      const milestone1 = await escrow.getMilestone(0, 1);
      expect(milestone1.verificationMethod).to.equal(1); // OracleOnly
      expect(milestone1.verificationCriteria).to.equal(verificationCriteria[1]);
      expect(milestone1.autoApprovalDelay).to.equal(24 * 3600);
    });
  });

  describe("Off-Chain Verification", function () {
    it("Should allow off-chain verifier to approve milestones", async function () {
      const { escrow, mockToken, client, freelancer, verifier1, owner, feeRecipient } = await deployAutomatedMilestoneEscrowFixture();

      // Add verifier
      await escrow.connect(owner).addOffChainVerifier(
        verifier1.address,
        "Code Reviewer",
        90
      );

      // Create job with off-chain verification
      const descriptions = ["Code review task"];
      const amounts = [ethers.parseEther("200")];
      const deadlines = [Math.floor(Date.now() / 1000) + 86400 * 7];
      const verificationMethods = [3]; // OffChainVerifier
      const verificationCriteria = ['{"type":"code_review","standards":["clean code","security"]}'];
      const autoApprovalDelays = [0];
      const metadataHash = "QmCodeReviewJob";

      await escrow.connect(client).createJobWithAutomation(
        freelancer.address,
        mockToken.target,
        descriptions,
        amounts,
        deadlines,
        verificationMethods,
        verificationCriteria,
        autoApprovalDelays,
        metadataHash
      );

      // Deposit funds
      const totalAmount = ethers.parseEther("200");
      const feeAmount = (totalAmount * 250n) / 10000n;
      const totalRequired = totalAmount + feeAmount;

      await mockToken.connect(client).approve(escrow.target, totalRequired);
      await escrow.connect(client).depositFunds(0);

      // Start milestone
      await escrow.connect(freelancer).startMilestone(0, 0);

      // Submit milestone
      await escrow.connect(freelancer).submitMilestoneWithAutoVerification(
        0, 0, "QmSubmissionHash123"
      );

      // Check balances before verification
      const freelancerBalanceBefore = await mockToken.balanceOf(freelancer.address);
      const feeRecipientBalanceBefore = await mockToken.balanceOf(feeRecipient.address);

      // Off-chain verifier approves
      await expect(
        escrow.connect(verifier1).offChainVerifierApprove(
          0, 0, "Code review passed. High quality implementation."
        )
      ).to.emit(escrow, "MilestoneOracleVerified")
        .withArgs(0, 0, verifier1.address);

      // Check balances after verification
      const freelancerBalanceAfter = await mockToken.balanceOf(freelancer.address);
      const feeRecipientBalanceAfter = await mockToken.balanceOf(feeRecipient.address);

      const expectedFreelancerPayment = totalAmount - feeAmount;
      expect(freelancerBalanceAfter - freelancerBalanceBefore).to.equal(expectedFreelancerPayment);
      expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(feeAmount);

      // Check milestone status
      const milestone = await escrow.getMilestone(0, 0);
      expect(milestone.status).to.equal(2); // AutoVerified
    });

    it("Should not allow non-verifiers to approve", async function () {
      const { escrow, mockToken, client, freelancer, verifier1 } = await deployAutomatedMilestoneEscrowFixture();

      // Create basic job
      const descriptions = ["Test task"];
      const amounts = [ethers.parseEther("100")];
      const deadlines = [Math.floor(Date.now() / 1000) + 86400];
      const verificationMethods = [3]; // OffChainVerifier
      const verificationCriteria = ['{"type":"basic"}'];
      const autoApprovalDelays = [0];

      await escrow.connect(client).createJobWithAutomation(
        freelancer.address,
        mockToken.target,
        descriptions,
        amounts,
        deadlines,
        verificationMethods,
        verificationCriteria,
        autoApprovalDelays,
        "QmTest"
      );

      // Try to approve without being a verifier
      await expect(
        escrow.connect(verifier1).offChainVerifierApprove(0, 0, "Unauthorized approval")
      ).to.be.revertedWith("Not an active off-chain verifier");
    });
  });

  describe("Automated Approval System", function () {
    it("Should mark milestones for auto-approval", async function () {
      const { escrow, mockToken, client, freelancer } = await deployAutomatedMilestoneEscrowFixture();

      // Create job with oracle verification
      const descriptions = ["Auto-approval test"];
      const amounts = [ethers.parseEther("100")];
      const deadlines = [Math.floor(Date.now() / 1000) + 86400];
      const verificationMethods = [1]; // OracleOnly
      const verificationCriteria = ['{"type":"automated","checks":["tests_pass"]}'];
      const autoApprovalDelays = [3600]; // 1 hour

      await escrow.connect(client).createJobWithAutomation(
        freelancer.address,
        mockToken.target,
        descriptions,
        amounts,
        deadlines,
        verificationMethods,
        verificationCriteria,
        autoApprovalDelays,
        "QmAutoTest"
      );

      // Deposit and start
      const totalAmount = ethers.parseEther("100");
      const feeAmount = (totalAmount * 250n) / 10000n;
      await mockToken.connect(client).approve(escrow.target, totalAmount + feeAmount);
      await escrow.connect(client).depositFunds(0);
      await escrow.connect(freelancer).startMilestone(0, 0);

      // Submit milestone
      await escrow.connect(freelancer).submitMilestoneWithAutoVerification(
        0, 0, "QmAutoSubmission"
      );

      // Check that it's marked for auto-approval
      expect(await escrow.isPendingAutoApproval(0, 0)).to.be.true;
    });

    it("Should handle checkUpkeep correctly", async function () {
      const { escrow, mockToken, client, freelancer } = await deployAutomatedMilestoneEscrowFixture();

      // Create job with short auto-approval delay for testing
      const descriptions = ["Quick approval test"];
      const amounts = [ethers.parseEther("50")];
      const deadlines = [Math.floor(Date.now() / 1000) + 86400];
      const verificationMethods = [1]; // OracleOnly
      const verificationCriteria = ['{"type":"time_based"}'];
      const autoApprovalDelays = [1]; // 1 second for testing

      await escrow.connect(client).createJobWithAutomation(
        freelancer.address,
        mockToken.target,
        descriptions,
        amounts,
        deadlines,
        verificationMethods,
        verificationCriteria,
        autoApprovalDelays,
        "QmQuickTest"
      );

      // Setup and submit
      const totalAmount = ethers.parseEther("50");
      const feeAmount = (totalAmount * 250n) / 10000n;
      await mockToken.connect(client).approve(escrow.target, totalAmount + feeAmount);
      await escrow.connect(client).depositFunds(0);
      await escrow.connect(freelancer).startMilestone(0, 0);
      await escrow.connect(freelancer).submitMilestoneWithAutoVerification(0, 0, "QmQuickSubmission");

      // Wait for auto-approval delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check upkeep
      const [upkeepNeeded, performData] = await escrow.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.true;
      expect(performData).to.not.equal("0x");
    });
  });

  describe("Enhanced Dispute System", function () {
    it("Should allow disputes with evidence", async function () {
      const { escrow, mockToken, client, freelancer } = await deployAutomatedMilestoneEscrowFixture();

      // Create and setup job
      const descriptions = ["Dispute test"];
      const amounts = [ethers.parseEther("100")];
      const deadlines = [Math.floor(Date.now() / 1000) + 86400];
      const verificationMethods = [0]; // ClientOnly
      const verificationCriteria = ['{"type":"manual"}'];
      const autoApprovalDelays = [0];

      await escrow.connect(client).createJobWithAutomation(
        freelancer.address,
        mockToken.target,
        descriptions,
        amounts,
        deadlines,
        verificationMethods,
        verificationCriteria,
        autoApprovalDelays,
        "QmDisputeTest"
      );

      const totalAmount = ethers.parseEther("100");
      const feeAmount = (totalAmount * 250n) / 10000n;
      await mockToken.connect(client).approve(escrow.target, totalAmount + feeAmount);
      await escrow.connect(client).depositFunds(0);
      await escrow.connect(freelancer).startMilestone(0, 0);
      await escrow.connect(freelancer).submitMilestoneWithAutoVerification(0, 0, "QmDisputeSubmission");

      // Raise dispute with evidence
      await expect(
        escrow.connect(client).raiseDisputeWithEvidence(
          0, 0,
          "Work does not meet requirements",
          "QmEvidenceHash123"
        )
      ).to.emit(escrow, "DisputeRaised")
        .withArgs(0, 0, 0, client.address, "QmEvidenceHash123");

      const dispute = await escrow.disputes(0);
      expect(dispute.reason).to.equal("Work does not meet requirements");
      expect(dispute.evidenceHash).to.equal("QmEvidenceHash123");
      expect(dispute.initiator).to.equal(client.address);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update automation settings", async function () {
      const { escrow, owner } = await deployAutomatedMilestoneEscrowFixture();

      await escrow.connect(owner).setUpkeepInterval(7200); // 2 hours
      expect(await escrow.upkeepInterval()).to.equal(7200);

      await escrow.connect(owner).setDefaultAutoApprovalDelay(86400); // 24 hours
      expect(await escrow.defaultAutoApprovalDelay()).to.equal(86400);
    });

    it("Should prevent non-owners from changing settings", async function () {
      const { escrow, client } = await deployAutomatedMilestoneEscrowFixture();

      await expect(
        escrow.connect(client).setUpkeepInterval(3600)
      ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
    });

    it("Should enforce minimum values for automation settings", async function () {
      const { escrow, owner } = await deployAutomatedMilestoneEscrowFixture();

      await expect(
        escrow.connect(owner).setUpkeepInterval(300) // 5 minutes (too short)
      ).to.be.revertedWith("Interval too short");

      await expect(
        escrow.connect(owner).setDefaultAutoApprovalDelay(1800) // 30 minutes (too short)
      ).to.be.revertedWith("Delay too short");
    });
  });
});
