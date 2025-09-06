import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { MilestoneEscrow, MyToken } from "../typechain-types";

describe("MilestoneEscrow", function () {
  async function deployMilestoneEscrowFixture() {
    const [owner, client, freelancer, platformWallet, addr4] = await ethers.getSigners();
    
    // Deploy MyToken first
    const MyToken = await ethers.getContractFactory("MyToken");
    const initialSupply = 1000000;
    const myToken = await MyToken.deploy(initialSupply) as MyToken;
    
    // Deploy MilestoneEscrow
    const MilestoneEscrow = await ethers.getContractFactory("MilestoneEscrow");
    const milestoneEscrow = await MilestoneEscrow.deploy(
      myToken.target,
      platformWallet.address
    ) as MilestoneEscrow;
    
    // Give client some tokens
    const clientTokens = ethers.parseEther("10000");
    await myToken.transfer(client.address, clientTokens);
    
    return { 
      milestoneEscrow, 
      myToken, 
      owner, 
      client, 
      freelancer, 
      platformWallet, 
      addr4,
      clientTokens 
    };
  }

  describe("Deployment", function () {
    it("Should set the right payment token and platform wallet", async function () {
      const { milestoneEscrow, myToken, platformWallet } = await loadFixture(deployMilestoneEscrowFixture);
      
      expect(await milestoneEscrow.paymentToken()).to.equal(myToken.target);
      expect(await milestoneEscrow.platformWallet()).to.equal(platformWallet.address);
      expect(await milestoneEscrow.defaultPlatformFee()).to.equal(250); // 2.5%
    });
  });

  describe("Project Management", function () {
    it("Should create a project", async function () {
      const { milestoneEscrow, client, freelancer } = await loadFixture(deployMilestoneEscrowFixture);
      
      const totalBudget = ethers.parseEther("1000");
      const title = "Test Project";
      const description = "A test project";
      
      await expect(milestoneEscrow.connect(client).createProject(
        freelancer.address,
        title,
        description,
        totalBudget
      )).to.emit(milestoneEscrow, "ProjectCreated")
        .withArgs(1, client.address, freelancer.address, totalBudget);

      const project = await milestoneEscrow.getProject(1);
      expect(project.client).to.equal(client.address);
      expect(project.freelancer).to.equal(freelancer.address);
      expect(project.totalBudget).to.equal(totalBudget);
      expect(project.active).to.be.true;
    });

    it("Should fail to create project with invalid freelancer", async function () {
      const { milestoneEscrow, client } = await loadFixture(deployMilestoneEscrowFixture);
      
      await expect(milestoneEscrow.connect(client).createProject(
        ethers.ZeroAddress,
        "Test",
        "Test",
        ethers.parseEther("1000")
      )).to.be.revertedWith("Invalid freelancer address");
    });

    it("Should fail if client and freelancer are the same", async function () {
      const { milestoneEscrow, client } = await loadFixture(deployMilestoneEscrowFixture);
      
      await expect(milestoneEscrow.connect(client).createProject(
        client.address,
        "Test",
        "Test",
        ethers.parseEther("1000")
      )).to.be.revertedWith("Client and freelancer cannot be same");
    });
  });

  describe("Milestone Management", function () {
    async function createProjectFixture() {
      const base = await loadFixture(deployMilestoneEscrowFixture);
      
      // Create a project
      const totalBudget = ethers.parseEther("1000");
      await base.milestoneEscrow.connect(base.client).createProject(
        base.freelancer.address,
        "Test Project",
        "A test project",
        totalBudget
      );
      
      return { ...base, projectId: 1, totalBudget };
    }

    it("Should create a milestone", async function () {
      const { milestoneEscrow, myToken, client, projectId } = await loadFixture(createProjectFixture);
      
      const milestoneAmount = ethers.parseEther("500");
      const description = "Test Milestone";
      const deadline = await time.latest() + 86400; // 1 day from now
      
      // Approve tokens for escrow
      await myToken.connect(client).approve(milestoneEscrow.target, milestoneAmount);
      
      await expect(milestoneEscrow.connect(client).createMilestone(
        projectId,
        milestoneAmount,
        description,
        deadline
      )).to.emit(milestoneEscrow, "MilestoneCreated")
        .withArgs(1, projectId, milestoneAmount, description);

      const milestone = await milestoneEscrow.getMilestone(1);
      expect(milestone.amount).to.equal(milestoneAmount);
      expect(milestone.description).to.equal(description);
      expect(milestone.status).to.equal(0); // Created
    });

    it("Should submit milestone deliverable", async function () {
      const { milestoneEscrow, myToken, client, freelancer, projectId } = await loadFixture(createProjectFixture);
      
      const milestoneAmount = ethers.parseEther("500");
      const deadline = await time.latest() + 86400;
      
      // Create milestone
      await myToken.connect(client).approve(milestoneEscrow.target, milestoneAmount);
      await milestoneEscrow.connect(client).createMilestone(
        projectId,
        milestoneAmount,
        "Test Milestone",
        deadline
      );
      
      const deliverableHash = "QmTest123";
      
      await expect(milestoneEscrow.connect(freelancer).submitMilestone(
        1,
        deliverableHash
      )).to.emit(milestoneEscrow, "MilestoneSubmitted");

      const milestone = await milestoneEscrow.getMilestone(1);
      expect(milestone.status).to.equal(1); // Submitted
      expect(milestone.deliverableHash).to.equal(deliverableHash);
    });

    it("Should approve milestone and process payment", async function () {
      const { milestoneEscrow, myToken, client, freelancer, platformWallet, projectId } = await loadFixture(createProjectFixture);
      
      const milestoneAmount = ethers.parseEther("500");
      const deadline = await time.latest() + 86400;
      
      // Create and submit milestone
      await myToken.connect(client).approve(milestoneEscrow.target, milestoneAmount);
      await milestoneEscrow.connect(client).createMilestone(projectId, milestoneAmount, "Test", deadline);
      await milestoneEscrow.connect(freelancer).submitMilestone(1, "QmTest123");
      
      const freelancerBalanceBefore = await myToken.balanceOf(freelancer.address);
      const platformBalanceBefore = await myToken.balanceOf(platformWallet.address);
      
      await expect(milestoneEscrow.connect(client).approveMilestone(1))
        .to.emit(milestoneEscrow, "MilestoneApproved")
        .and.to.emit(milestoneEscrow, "MilestoneCompleted");

      const milestone = await milestoneEscrow.getMilestone(1);
      expect(milestone.status).to.equal(4); // Completed
      
      // Check payments
      const platformFee = milestoneAmount * 250n / 10000n; // 2.5%
      const freelancerPayment = milestoneAmount - platformFee;
      
      expect(await myToken.balanceOf(freelancer.address)).to.equal(freelancerBalanceBefore + freelancerPayment);
      expect(await myToken.balanceOf(platformWallet.address)).to.equal(platformBalanceBefore + platformFee);
    });

    it("Should cancel milestone and refund client", async function () {
      const { milestoneEscrow, myToken, client, projectId } = await loadFixture(createProjectFixture);
      
      const milestoneAmount = ethers.parseEther("500");
      const deadline = await time.latest() + 86400;
      
      await myToken.connect(client).approve(milestoneEscrow.target, milestoneAmount);
      await milestoneEscrow.connect(client).createMilestone(projectId, milestoneAmount, "Test", deadline);
      
      const clientBalanceBefore = await myToken.balanceOf(client.address);
      
      await expect(milestoneEscrow.connect(client).cancelMilestone(1))
        .to.emit(milestoneEscrow, "FundsWithdrawn")
        .withArgs(client.address, milestoneAmount);

      expect(await myToken.balanceOf(client.address)).to.equal(clientBalanceBefore + milestoneAmount);
      
      const milestone = await milestoneEscrow.getMilestone(1);
      expect(milestone.status).to.equal(5); // Cancelled
    });
  });

  describe("Dispute Management", function () {
    async function createSubmittedMilestoneFixture() {
      const base = await loadFixture(deployMilestoneEscrowFixture);
      
      // Create project
      await base.milestoneEscrow.connect(base.client).createProject(
        base.freelancer.address,
        "Test Project",
        "Test",
        ethers.parseEther("1000")
      );
      
      // Create and submit milestone
      const milestoneAmount = ethers.parseEther("500");
      const deadline = await time.latest() + 86400;
      
      await base.myToken.connect(base.client).approve(base.milestoneEscrow.target, milestoneAmount);
      await base.milestoneEscrow.connect(base.client).createMilestone(1, milestoneAmount, "Test", deadline);
      await base.milestoneEscrow.connect(base.freelancer).submitMilestone(1, "QmTest123");
      
      return { ...base, milestoneId: 1, milestoneAmount };
    }

    it("Should raise a dispute", async function () {
      const { milestoneEscrow, client, milestoneId } = await loadFixture(createSubmittedMilestoneFixture);
      
      const reason = "Work quality is not satisfactory";
      
      await expect(milestoneEscrow.connect(client).raiseDispute(milestoneId, reason))
        .to.emit(milestoneEscrow, "DisputeRaised")
        .withArgs(milestoneId, client.address, reason);

      const milestone = await milestoneEscrow.getMilestone(milestoneId);
      expect(milestone.status).to.equal(3); // Disputed
      
      const dispute = await milestoneEscrow.getDispute(milestoneId);
      expect(dispute.initiator).to.equal(client.address);
      expect(dispute.reason).to.equal(reason);
      expect(dispute.status).to.equal(1); // Raised
    });

    it("Should resolve dispute in client's favor", async function () {
      const { milestoneEscrow, myToken, owner, client, milestoneId, milestoneAmount } = await loadFixture(createSubmittedMilestoneFixture);
      
      // Raise dispute
      await milestoneEscrow.connect(client).raiseDispute(milestoneId, "Quality issue");
      
      const clientBalanceBefore = await myToken.balanceOf(client.address);
      
      await expect(milestoneEscrow.connect(owner).resolveDispute(milestoneId, true))
        .to.emit(milestoneEscrow, "DisputeResolved")
        .withArgs(milestoneId, owner.address, true);

      expect(await myToken.balanceOf(client.address)).to.equal(clientBalanceBefore + milestoneAmount);
      
      const milestone = await milestoneEscrow.getMilestone(milestoneId);
      expect(milestone.status).to.equal(5); // Cancelled
    });

    it("Should resolve dispute in freelancer's favor", async function () {
      const { milestoneEscrow, myToken, owner, client, freelancer, platformWallet, milestoneId, milestoneAmount } = await loadFixture(createSubmittedMilestoneFixture);
      
      // Raise dispute
      await milestoneEscrow.connect(client).raiseDispute(milestoneId, "Quality issue");
      
      const freelancerBalanceBefore = await myToken.balanceOf(freelancer.address);
      const platformBalanceBefore = await myToken.balanceOf(platformWallet.address);
      
      await expect(milestoneEscrow.connect(owner).resolveDispute(milestoneId, false))
        .to.emit(milestoneEscrow, "DisputeResolved")
        .withArgs(milestoneId, owner.address, false);

      const platformFee = milestoneAmount * 250n / 10000n;
      const freelancerPayment = milestoneAmount - platformFee;
      
      expect(await myToken.balanceOf(freelancer.address)).to.equal(freelancerBalanceBefore + freelancerPayment);
      expect(await myToken.balanceOf(platformWallet.address)).to.equal(platformBalanceBefore + platformFee);
      
      const milestone = await milestoneEscrow.getMilestone(milestoneId);
      expect(milestone.status).to.equal(4); // Completed
    });
  });

  describe("Auto-approval", function () {
    it("Should auto-approve milestone after delay", async function () {
      const { milestoneEscrow, myToken, client, freelancer, platformWallet } = await loadFixture(deployMilestoneEscrowFixture);
      
      // Create project and milestone
      await milestoneEscrow.connect(client).createProject(
        freelancer.address,
        "Test Project",
        "Test",
        ethers.parseEther("1000")
      );
      
      const milestoneAmount = ethers.parseEther("500");
      const deadline = await time.latest() + 86400;
      
      await myToken.connect(client).approve(milestoneEscrow.target, milestoneAmount);
      await milestoneEscrow.connect(client).createMilestone(1, milestoneAmount, "Test", deadline);
      await milestoneEscrow.connect(freelancer).submitMilestone(1, "QmTest123");
      
      // Fast forward time beyond auto-approval delay (14 days)
      await time.increase(15 * 24 * 60 * 60); // 15 days
      
      const freelancerBalanceBefore = await myToken.balanceOf(freelancer.address);
      
      await expect(milestoneEscrow.autoApproveMilestone(1))
        .to.emit(milestoneEscrow, "MilestoneApproved");

      const milestone = await milestoneEscrow.getMilestone(1);
      expect(milestone.status).to.equal(4); // Completed
      
      const platformFee = milestoneAmount * 250n / 10000n;
      const freelancerPayment = milestoneAmount - platformFee;
      expect(await myToken.balanceOf(freelancer.address)).to.equal(freelancerBalanceBefore + freelancerPayment);
    });
  });

  describe("View Functions", function () {
    it("Should return correct project and milestone data", async function () {
      const { milestoneEscrow, myToken, client, freelancer } = await loadFixture(deployMilestoneEscrowFixture);
      
      // Create project
      const totalBudget = ethers.parseEther("1000");
      await milestoneEscrow.connect(client).createProject(
        freelancer.address,
        "Test Project",
        "Test Description",
        totalBudget
      );
      
      // Create milestone
      const milestoneAmount = ethers.parseEther("500");
      const deadline = await time.latest() + 86400;
      
      await myToken.connect(client).approve(milestoneEscrow.target, milestoneAmount);
      await milestoneEscrow.connect(client).createMilestone(1, milestoneAmount, "Test Milestone", deadline);
      
      // Test view functions
      const clientProjects = await milestoneEscrow.getClientProjects(client.address);
      expect(clientProjects).to.deep.equal([1n]);
      
      const freelancerProjects = await milestoneEscrow.getFreelancerProjects(freelancer.address);
      expect(freelancerProjects).to.deep.equal([1n]);
      
      const projectMilestones = await milestoneEscrow.getProjectMilestones(1);
      expect(projectMilestones).to.deep.equal([1n]);
    });
  });

  describe("Admin Functions", function () {
    it("Should update platform fee", async function () {
      const { milestoneEscrow, owner } = await loadFixture(deployMilestoneEscrowFixture);
      
      const newFee = 500; // 5%
      await milestoneEscrow.connect(owner).updatePlatformFee(newFee);
      expect(await milestoneEscrow.defaultPlatformFee()).to.equal(newFee);
    });

    it("Should fail to set fee too high", async function () {
      const { milestoneEscrow, owner } = await loadFixture(deployMilestoneEscrowFixture);
      
      await expect(milestoneEscrow.connect(owner).updatePlatformFee(1500))
        .to.be.revertedWith("Fee too high");
    });

    it("Should update platform wallet", async function () {
      const { milestoneEscrow, owner, addr4 } = await loadFixture(deployMilestoneEscrowFixture);
      
      await milestoneEscrow.connect(owner).updatePlatformWallet(addr4.address);
      expect(await milestoneEscrow.platformWallet()).to.equal(addr4.address);
    });
  });
});
