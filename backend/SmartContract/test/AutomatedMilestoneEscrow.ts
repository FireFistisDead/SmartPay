import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { AutomatedMilestoneEscrow, MyToken } from "../typechain-types";

describe("AutomatedMilestoneEscrow", function () {
  async function deployAutomatedMilestoneEscrowFixture() {
    const [owner, client, freelancer, platformWallet, automationRegistry, addr5] = await ethers.getSigners();
    
    // Deploy MyToken first
    const MyToken = await ethers.getContractFactory("MyToken");
    const initialSupply = 1000000;
    const myToken = await MyToken.deploy(initialSupply) as MyToken;
    
    // Deploy AutomatedMilestoneEscrow
    const AutomatedMilestoneEscrow = await ethers.getContractFactory("AutomatedMilestoneEscrow");
    const automatedMilestoneEscrow = await AutomatedMilestoneEscrow.deploy(
      myToken.target,
      platformWallet.address,
      automationRegistry.address
    ) as AutomatedMilestoneEscrow;
    
    // Give client some tokens
    const clientTokens = ethers.parseEther("10000");
    await myToken.transfer(client.address, clientTokens);
    
    return { 
      automatedMilestoneEscrow, 
      myToken, 
      owner, 
      client, 
      freelancer, 
      platformWallet,
      automationRegistry,
      addr5,
      clientTokens 
    };
  }

  describe("Deployment", function () {
    it("Should set the right payment token, platform wallet, and automation registry", async function () {
      const { automatedMilestoneEscrow, myToken, platformWallet, automationRegistry } = await loadFixture(deployAutomatedMilestoneEscrowFixture);
      
      expect(await automatedMilestoneEscrow.paymentToken()).to.equal(myToken.target);
      expect(await automatedMilestoneEscrow.platformWallet()).to.equal(platformWallet.address);
      expect(await automatedMilestoneEscrow.automationRegistry()).to.equal(automationRegistry.address);
      expect(await automatedMilestoneEscrow.defaultPlatformFee()).to.equal(250); // 2.5%
      expect(await automatedMilestoneEscrow.paused()).to.be.false;
    });
  });

  describe("Project Management with Client-Only Verification", function () {
    it("Should create a project with client-only verification", async function () {
      const { automatedMilestoneEscrow, client, freelancer } = await loadFixture(deployAutomatedMilestoneEscrowFixture);
      
      const totalBudget = ethers.parseEther("1000");
      const title = "Test Project";
      const description = "A test project";
      const verificationMethod = 0; // ClientOnly
      
      await expect(automatedMilestoneEscrow.connect(client).createProject(
        freelancer.address,
        title,
        description,
        totalBudget,
        verificationMethod
      )).to.emit(automatedMilestoneEscrow, "ProjectCreated")
        .withArgs(1, client.address, freelancer.address, totalBudget)
        .and.to.emit(automatedMilestoneEscrow, "AutomationConfigured");

      const project = await automatedMilestoneEscrow.getProject(1);
      expect(project.client).to.equal(client.address);
      expect(project.freelancer).to.equal(freelancer.address);
      expect(project.totalBudget).to.equal(totalBudget);
      expect(project.defaultVerificationMethod).to.equal(0); // ClientOnly
      expect(project.active).to.be.true;
      
      // Check automation configuration
      const automation = await automatedMilestoneEscrow.getProjectAutomation(1);
      expect(automation.enabled).to.be.true;
      expect(automation.checkInterval).to.equal(3600); // 1 hour
    });

    it("Should fail to create project when paused", async function () {
      const { automatedMilestoneEscrow, owner, client, freelancer } = await loadFixture(deployAutomatedMilestoneEscrowFixture);
      
      await automatedMilestoneEscrow.connect(owner).setPaused(true);
      
      await expect(automatedMilestoneEscrow.connect(client).createProject(
        freelancer.address,
        "Test",
        "Test",
        ethers.parseEther("1000"),
        0
      )).to.be.revertedWith("Contract paused");
    });
  });

  describe("Milestone Management", function () {
    async function createProjectFixture() {
      const base = await loadFixture(deployAutomatedMilestoneEscrowFixture);
      
      // Create a project with client-only verification
      const totalBudget = ethers.parseEther("1000");
      await base.automatedMilestoneEscrow.connect(base.client).createProject(
        base.freelancer.address,
        "Test Project",
        "A test project",
        totalBudget,
        0 // ClientOnly
      );
      
      return { ...base, projectId: 1, totalBudget };
    }

    it("Should create a milestone with auto-approval enabled", async function () {
      const { automatedMilestoneEscrow, myToken, client, projectId } = await loadFixture(createProjectFixture);
      
      const milestoneAmount = ethers.parseEther("500");
      const description = "Test Milestone";
      const deadline = await time.latest() + 86400; // 1 day from now
      const autoApprovalEnabled = true;
      
      // Approve tokens for escrow
      await myToken.connect(client).approve(automatedMilestoneEscrow.target, milestoneAmount);
      
      await expect(automatedMilestoneEscrow.connect(client).createMilestone(
        projectId,
        milestoneAmount,
        description,
        deadline,
        autoApprovalEnabled
      )).to.emit(automatedMilestoneEscrow, "MilestoneCreated")
        .withArgs(1, projectId, milestoneAmount, 0); // 0 = ClientOnly

      const milestone = await automatedMilestoneEscrow.getMilestone(1);
      expect(milestone.amount).to.equal(milestoneAmount);
      expect(milestone.description).to.equal(description);
      expect(milestone.status).to.equal(0); // Created
      expect(milestone.verificationMethod).to.equal(0); // ClientOnly
      expect(milestone.autoApprovalEnabled).to.be.true;
    });

    it("Should submit milestone deliverable", async function () {
      const { automatedMilestoneEscrow, myToken, client, freelancer, projectId } = await loadFixture(createProjectFixture);
      
      const milestoneAmount = ethers.parseEther("500");
      const deadline = await time.latest() + 86400;
      
      // Create milestone
      await myToken.connect(client).approve(automatedMilestoneEscrow.target, milestoneAmount);
      await automatedMilestoneEscrow.connect(client).createMilestone(
        projectId,
        milestoneAmount,
        "Test Milestone",
        deadline,
        true
      );
      
      const deliverableHash = "QmTest123";
      
      await expect(automatedMilestoneEscrow.connect(freelancer).submitMilestone(
        1,
        deliverableHash
      )).to.emit(automatedMilestoneEscrow, "MilestoneSubmitted");

      const milestone = await automatedMilestoneEscrow.getMilestone(1);
      expect(milestone.status).to.equal(1); // Submitted
      expect(milestone.deliverableHash).to.equal(deliverableHash);
    });

    it("Should approve milestone manually by client", async function () {
      const { automatedMilestoneEscrow, myToken, client, freelancer, platformWallet, projectId } = await loadFixture(createProjectFixture);
      
      const milestoneAmount = ethers.parseEther("500");
      const deadline = await time.latest() + 86400;
      
      // Create and submit milestone
      await myToken.connect(client).approve(automatedMilestoneEscrow.target, milestoneAmount);
      await automatedMilestoneEscrow.connect(client).createMilestone(projectId, milestoneAmount, "Test", deadline, true);
      await automatedMilestoneEscrow.connect(freelancer).submitMilestone(1, "QmTest123");
      
      const freelancerBalanceBefore = await myToken.balanceOf(freelancer.address);
      const platformBalanceBefore = await myToken.balanceOf(platformWallet.address);
      
      await expect(automatedMilestoneEscrow.connect(client).approveMilestone(1))
        .to.emit(automatedMilestoneEscrow, "MilestoneApproved")
        .withArgs(1, await time.latest() + 1, false) // false = not automated
        .and.to.emit(automatedMilestoneEscrow, "MilestoneCompleted");

      const milestone = await automatedMilestoneEscrow.getMilestone(1);
      expect(milestone.status).to.equal(4); // Completed
      expect(milestone.qualityScore).to.equal(100); // Client approval assumes full quality
      
      // Check payments
      const platformFee = milestoneAmount * 250n / 10000n; // 2.5%
      const freelancerPayment = milestoneAmount - platformFee;
      
      expect(await myToken.balanceOf(freelancer.address)).to.equal(freelancerBalanceBefore + freelancerPayment);
      expect(await myToken.balanceOf(platformWallet.address)).to.equal(platformBalanceBefore + platformFee);
    });

    it("Should auto-approve milestone after delay", async function () {
      const { automatedMilestoneEscrow, myToken, client, freelancer, platformWallet, projectId } = await loadFixture(createProjectFixture);
      
      const milestoneAmount = ethers.parseEther("500");
      const deadline = await time.latest() + 86400;
      
      // Create and submit milestone
      await myToken.connect(client).approve(automatedMilestoneEscrow.target, milestoneAmount);
      await automatedMilestoneEscrow.connect(client).createMilestone(projectId, milestoneAmount, "Test", deadline, true);
      await automatedMilestoneEscrow.connect(freelancer).submitMilestone(1, "QmTest123");
      
      // Fast forward time beyond auto-approval delay (14 days)
      await time.increase(15 * 24 * 60 * 60); // 15 days
      
      const freelancerBalanceBefore = await myToken.balanceOf(freelancer.address);
      
      await expect(automatedMilestoneEscrow.autoApproveMilestone(1))
        .to.emit(automatedMilestoneEscrow, "MilestoneApproved")
        .and.to.emit(automatedMilestoneEscrow, "AutomatedApproval")
        .and.to.emit(automatedMilestoneEscrow, "MilestoneCompleted");

      const milestone = await automatedMilestoneEscrow.getMilestone(1);
      expect(milestone.status).to.equal(4); // Completed
      expect(milestone.qualityScore).to.equal(80); // minAutoApprovalScore
      
      const platformFee = milestoneAmount * 250n / 10000n;
      const freelancerPayment = milestoneAmount - platformFee;
      expect(await myToken.balanceOf(freelancer.address)).to.equal(freelancerBalanceBefore + freelancerPayment);
    });

    it("Should batch auto-approve eligible milestones", async function () {
      const { automatedMilestoneEscrow, myToken, client, freelancer, projectId } = await loadFixture(createProjectFixture);
      
      const milestoneAmount = ethers.parseEther("250");
      const deadline = await time.latest() + 86400;
      
      // Create and submit multiple milestones
      for (let i = 0; i < 3; i++) {
        await myToken.connect(client).approve(automatedMilestoneEscrow.target, milestoneAmount);
        await automatedMilestoneEscrow.connect(client).createMilestone(projectId, milestoneAmount, `Test ${i}`, deadline, true);
        await automatedMilestoneEscrow.connect(freelancer).submitMilestone(i + 1, `QmTest${i}`);
      }
      
      // Fast forward time
      await time.increase(15 * 24 * 60 * 60); // 15 days
      
      const freelancerBalanceBefore = await myToken.balanceOf(freelancer.address);
      
      // Batch auto-approve
      await automatedMilestoneEscrow.batchAutoApprove([1, 2, 3]);
      
      // Check all milestones are completed
      for (let i = 1; i <= 3; i++) {
        const milestone = await automatedMilestoneEscrow.getMilestone(i);
        expect(milestone.status).to.equal(4); // Completed
      }
      
      const totalPayment = milestoneAmount * 3n;
      const totalPlatformFee = totalPayment * 250n / 10000n;
      const totalFreelancerPayment = totalPayment - totalPlatformFee;
      
      expect(await myToken.balanceOf(freelancer.address)).to.equal(freelancerBalanceBefore + totalFreelancerPayment);
    });
  });

  describe("Dispute Management", function () {
    async function createSubmittedMilestoneFixture() {
      const base = await loadFixture(deployAutomatedMilestoneEscrowFixture);
      
      // Create project
      await base.automatedMilestoneEscrow.connect(base.client).createProject(
        base.freelancer.address,
        "Test Project",
        "Test",
        ethers.parseEther("1000"),
        0 // ClientOnly
      );
      
      // Create and submit milestone
      const milestoneAmount = ethers.parseEther("500");
      const deadline = await time.latest() + 86400;
      
      await base.myToken.connect(base.client).approve(base.automatedMilestoneEscrow.target, milestoneAmount);
      await base.automatedMilestoneEscrow.connect(base.client).createMilestone(1, milestoneAmount, "Test", deadline, true);
      await base.automatedMilestoneEscrow.connect(base.freelancer).submitMilestone(1, "QmTest123");
      
      return { ...base, milestoneId: 1, milestoneAmount };
    }

    it("Should raise a dispute with detailed resolution", async function () {
      const { automatedMilestoneEscrow, client, milestoneId } = await loadFixture(createSubmittedMilestoneFixture);
      
      const reason = "Work quality is not satisfactory";
      
      await expect(automatedMilestoneEscrow.connect(client).raiseDispute(milestoneId, reason))
        .to.emit(automatedMilestoneEscrow, "DisputeRaised")
        .withArgs(milestoneId, client.address, reason);

      const milestone = await automatedMilestoneEscrow.getMilestone(milestoneId);
      expect(milestone.status).to.equal(3); // Disputed
    });

    it("Should resolve dispute with detailed resolution", async function () {
      const { automatedMilestoneEscrow, myToken, owner, client, freelancer, platformWallet, milestoneId, milestoneAmount } = await loadFixture(createSubmittedMilestoneFixture);
      
      // Raise dispute
      await automatedMilestoneEscrow.connect(client).raiseDispute(milestoneId, "Quality issue");
      
      const resolution = "After review, freelancer delivered as promised";
      const freelancerBalanceBefore = await myToken.balanceOf(freelancer.address);
      
      await expect(automatedMilestoneEscrow.connect(owner).resolveDispute(milestoneId, false, resolution))
        .to.emit(automatedMilestoneEscrow, "DisputeResolved")
        .withArgs(milestoneId, owner.address, false, resolution);

      const dispute = await automatedMilestoneEscrow.getDispute(milestoneId);
      expect(dispute.resolution).to.equal(resolution);
      expect(dispute.clientFavor).to.be.false;
      
      const platformFee = milestoneAmount * 250n / 10000n;
      const freelancerPayment = milestoneAmount - platformFee;
      expect(await myToken.balanceOf(freelancer.address)).to.equal(freelancerBalanceBefore + freelancerPayment);
    });
  });

  describe("Automation Features", function () {
    it("Should configure project automation", async function () {
      const { automatedMilestoneEscrow, client, freelancer } = await loadFixture(deployAutomatedMilestoneEscrowFixture);
      
      // Create project
      await automatedMilestoneEscrow.connect(client).createProject(
        freelancer.address,
        "Test Project",
        "Test",
        ethers.parseEther("1000"),
        0 // ClientOnly
      );
      
      const checkInterval = 7200; // 2 hours
      const autoApprovalDelay = 864000; // 10 days
      const minQualityScore = 90;
      
      await expect(automatedMilestoneEscrow.connect(client).configureAutomation(
        1,
        true,
        checkInterval,
        autoApprovalDelay,
        minQualityScore
      )).to.emit(automatedMilestoneEscrow, "AutomationConfigured")
        .withArgs(1, true, checkInterval, autoApprovalDelay);

      const automation = await automatedMilestoneEscrow.getProjectAutomation(1);
      expect(automation.enabled).to.be.true;
      expect(automation.checkInterval).to.equal(checkInterval);
      expect(automation.autoApprovalDelay).to.equal(autoApprovalDelay);
      expect(automation.minQualityScore).to.equal(minQualityScore);
    });

    it("Should get eligible milestones for auto-approval", async function () {
      const { automatedMilestoneEscrow, myToken, client, freelancer } = await loadFixture(deployAutomatedMilestoneEscrowFixture);
      
      // Create project
      await automatedMilestoneEscrow.connect(client).createProject(
        freelancer.address,
        "Test Project",
        "Test",
        ethers.parseEther("1000"),
        0 // ClientOnly
      );
      
      // Create and submit milestone
      const milestoneAmount = ethers.parseEther("500");
      const deadline = await time.latest() + 86400;
      
      await myToken.connect(client).approve(automatedMilestoneEscrow.target, milestoneAmount);
      await automatedMilestoneEscrow.connect(client).createMilestone(1, milestoneAmount, "Test", deadline, true);
      await automatedMilestoneEscrow.connect(freelancer).submitMilestone(1, "QmTest123");
      
      // Before delay - should be empty
      let eligibleMilestones = await automatedMilestoneEscrow.getEligibleMilestones();
      expect(eligibleMilestones.length).to.equal(0);
      
      // After delay - should include milestone
      await time.increase(15 * 24 * 60 * 60); // 15 days
      eligibleMilestones = await automatedMilestoneEscrow.getEligibleMilestones();
      expect(eligibleMilestones.length).to.equal(1);
      expect(eligibleMilestones[0]).to.equal(1);
    });

    it("Should check multiple milestones efficiently", async function () {
      const { automatedMilestoneEscrow, myToken, client, freelancer } = await loadFixture(deployAutomatedMilestoneEscrowFixture);
      
      // Create project
      await automatedMilestoneEscrow.connect(client).createProject(
        freelancer.address,
        "Test Project",
        "Test",
        ethers.parseEther("1000"),
        0 // ClientOnly
      );
      
      // Create and submit multiple milestones
      const milestoneAmount = ethers.parseEther("250");
      const deadline = await time.latest() + 86400;
      
      for (let i = 0; i < 3; i++) {
        await myToken.connect(client).approve(automatedMilestoneEscrow.target, milestoneAmount);
        await automatedMilestoneEscrow.connect(client).createMilestone(1, milestoneAmount, `Test ${i}`, deadline, i < 2); // Only first 2 have auto-approval
        await automatedMilestoneEscrow.connect(freelancer).submitMilestone(i + 1, `QmTest${i}`);
      }
      
      // Fast forward time
      await time.increase(15 * 24 * 60 * 60); // 15 days
      
      const canAutoApprove = await automatedMilestoneEscrow.checkMultipleMilestones([1, 2, 3]);
      expect(canAutoApprove[0]).to.be.true;  // Milestone 1 - eligible
      expect(canAutoApprove[1]).to.be.true;  // Milestone 2 - eligible
      expect(canAutoApprove[2]).to.be.false; // Milestone 3 - auto-approval disabled
    });
  });

  describe("Pause/Unpause", function () {
    it("Should pause and unpause contract", async function () {
      const { automatedMilestoneEscrow, owner, client, freelancer } = await loadFixture(deployAutomatedMilestoneEscrowFixture);
      
      await expect(automatedMilestoneEscrow.connect(owner).setPaused(true))
        .to.emit(automatedMilestoneEscrow, "ContractPaused")
        .withArgs(true);
      
      expect(await automatedMilestoneEscrow.paused()).to.be.true;
      
      // Should fail to create project when paused
      await expect(automatedMilestoneEscrow.connect(client).createProject(
        freelancer.address,
        "Test",
        "Test",
        ethers.parseEther("1000"),
        0
      )).to.be.revertedWith("Contract paused");
      
      // Unpause
      await automatedMilestoneEscrow.connect(owner).setPaused(false);
      expect(await automatedMilestoneEscrow.paused()).to.be.false;
      
      // Should work again
      await expect(automatedMilestoneEscrow.connect(client).createProject(
        freelancer.address,
        "Test",
        "Test",
        ethers.parseEther("1000"),
        0
      )).to.emit(automatedMilestoneEscrow, "ProjectCreated");
    });
  });

  describe("View Functions", function () {
    it("Should return correct automated projects", async function () {
      const { automatedMilestoneEscrow, client, freelancer } = await loadFixture(deployAutomatedMilestoneEscrowFixture);
      
      // Create project with client-only verification (should be automated)
      await automatedMilestoneEscrow.connect(client).createProject(
        freelancer.address,
        "Test Project",
        "Test",
        ethers.parseEther("1000"),
        0 // ClientOnly
      );
      
      const automatedProjects = await automatedMilestoneEscrow.getAutomatedProjects();
      expect(automatedProjects).to.deep.equal([1n]);
    });
  });

  describe("Admin Functions", function () {
    it("Should update automation settings", async function () {
      const { automatedMilestoneEscrow, owner } = await loadFixture(deployAutomatedMilestoneEscrowFixture);
      
      const newDelay = 604800; // 7 days
      const newScore = 90;
      
      await automatedMilestoneEscrow.connect(owner).updateAutoApprovalDelay(newDelay);
      expect(await automatedMilestoneEscrow.defaultAutoApprovalDelay()).to.equal(newDelay);
      
      await automatedMilestoneEscrow.connect(owner).updateMinAutoApprovalScore(newScore);
      expect(await automatedMilestoneEscrow.minAutoApprovalScore()).to.equal(newScore);
    });

    it("Should update automation registry", async function () {
      const { automatedMilestoneEscrow, owner, addr5 } = await loadFixture(deployAutomatedMilestoneEscrowFixture);
      
      await automatedMilestoneEscrow.connect(owner).updateAutomationRegistry(addr5.address);
      expect(await automatedMilestoneEscrow.automationRegistry()).to.equal(addr5.address);
    });
  });
});
