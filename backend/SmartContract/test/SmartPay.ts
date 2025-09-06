import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { SmartPay, MyToken } from "../typechain-types";

describe("SmartPay", function () {
  async function deploySmartPayFixture() {
    const [owner, payer, payee, platformWallet, addr4] = await ethers.getSigners();
    
    // Deploy MyToken first
    const MyToken = await ethers.getContractFactory("MyToken");
    const initialSupply = 1000000;
    const myToken = await MyToken.deploy(initialSupply) as MyToken;
    
    // Deploy SmartPay
    const SmartPay = await ethers.getContractFactory("SmartPay");
    const smartPay = await SmartPay.deploy(
      myToken.target,
      platformWallet.address
    ) as SmartPay;
    
    // Give payer some tokens
    const payerTokens = ethers.parseEther("10000");
    await myToken.transfer(payer.address, payerTokens);
    
    return { 
      smartPay, 
      myToken, 
      owner, 
      payer, 
      payee, 
      platformWallet, 
      addr4,
      payerTokens 
    };
  }

  describe("Deployment", function () {
    it("Should set the right payment token and platform wallet", async function () {
      const { smartPay, myToken, platformWallet } = await loadFixture(deploySmartPayFixture);
      
      expect(await smartPay.paymentToken()).to.equal(myToken.target);
      expect(await smartPay.platformWallet()).to.equal(platformWallet.address);
      expect(await smartPay.platformFee()).to.equal(100); // 1%
    });
  });

  describe("One-time Payments", function () {
    it("Should create a one-time payment", async function () {
      const { smartPay, payer, payee } = await loadFixture(deploySmartPayFixture);
      
      const amount = ethers.parseEther("100");
      const description = "Payment for services";
      const externalRef = ethers.keccak256(ethers.toUtf8Bytes("REF123"));
      
      await expect(smartPay.connect(payer).createPayment(
        payee.address,
        amount,
        description,
        externalRef
      )).to.emit(smartPay, "PaymentCreated")
        .withArgs(1, payer.address, payee.address, amount);

      const payment = await smartPay.getPayment(1);
      expect(payment.payer).to.equal(payer.address);
      expect(payment.payee).to.equal(payee.address);
      expect(payment.amount).to.equal(amount);
      expect(payment.paymentType).to.equal(0); // OneTime
      expect(payment.status).to.equal(0); // Pending
      expect(payment.description).to.equal(description);
      expect(payment.externalRef).to.equal(externalRef);
    });

    it("Should execute a one-time payment", async function () {
      const { smartPay, myToken, payer, payee, platformWallet } = await loadFixture(deploySmartPayFixture);
      
      const amount = ethers.parseEther("100");
      const description = "Payment for services";
      const externalRef = ethers.keccak256(ethers.toUtf8Bytes("REF123"));
      
      // Create payment
      await smartPay.connect(payer).createPayment(payee.address, amount, description, externalRef);
      
      // Approve tokens
      await myToken.connect(payer).approve(smartPay.target, amount);
      
      const payeeBalanceBefore = await myToken.balanceOf(payee.address);
      const platformBalanceBefore = await myToken.balanceOf(platformWallet.address);
      
      await expect(smartPay.connect(payer).executePayment(1))
        .to.emit(smartPay, "PaymentExecuted");

      const payment = await smartPay.getPayment(1);
      expect(payment.status).to.equal(1); // Completed
      
      // Check balances
      const platformFee = amount * 100n / 10000n; // 1%
      const payeeAmount = amount - platformFee;
      
      expect(await myToken.balanceOf(payee.address)).to.equal(payeeBalanceBefore + payeeAmount);
      expect(await myToken.balanceOf(platformWallet.address)).to.equal(platformBalanceBefore + platformFee);
    });

    it("Should cancel a pending payment", async function () {
      const { smartPay, payer, payee } = await loadFixture(deploySmartPayFixture);
      
      const amount = ethers.parseEther("100");
      
      // Create payment
      await smartPay.connect(payer).createPayment(payee.address, amount, "Test", ethers.ZeroHash);
      
      await expect(smartPay.connect(payer).cancelPayment(1))
        .to.emit(smartPay, "PaymentCancelled")
        .withArgs(1);

      const payment = await smartPay.getPayment(1);
      expect(payment.status).to.equal(2); // Cancelled
    });

    it("Should fail to create payment to zero address", async function () {
      const { smartPay, payer } = await loadFixture(deploySmartPayFixture);
      
      await expect(smartPay.connect(payer).createPayment(
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        "Test",
        ethers.ZeroHash
      )).to.be.revertedWith("Invalid payee address");
    });

    it("Should fail to create payment to self", async function () {
      const { smartPay, payer } = await loadFixture(deploySmartPayFixture);
      
      await expect(smartPay.connect(payer).createPayment(
        payer.address,
        ethers.parseEther("100"),
        "Test",
        ethers.ZeroHash
      )).to.be.revertedWith("Cannot pay yourself");
    });
  });

  describe("Recurring Payments", function () {
    it("Should create a recurring payment", async function () {
      const { smartPay, payer, payee } = await loadFixture(deploySmartPayFixture);
      
      const amount = ethers.parseEther("50");
      const interval = 86400; // 1 day
      const startTime = await time.latest() + 3600; // 1 hour from now
      const endTime = startTime + (30 * 86400); // 30 days later
      const maxExecutions = 30;
      const description = "Monthly subscription";
      
      await expect(smartPay.connect(payer).createRecurringPayment(
        payee.address,
        amount,
        interval,
        startTime,
        endTime,
        maxExecutions,
        description
      )).to.emit(smartPay, "RecurringPaymentCreated")
        .withArgs(1, payer.address, payee.address, amount, interval);

      const recurring = await smartPay.getRecurringPayment(1);
      expect(recurring.payer).to.equal(payer.address);
      expect(recurring.payee).to.equal(payee.address);
      expect(recurring.amount).to.equal(amount);
      expect(recurring.interval).to.equal(interval);
      expect(recurring.startTime).to.equal(startTime);
      expect(recurring.endTime).to.equal(endTime);
      expect(recurring.maxExecutions).to.equal(maxExecutions);
      expect(recurring.status).to.equal(0); // Pending
      expect(recurring.description).to.equal(description);
    });

    it("Should execute a recurring payment", async function () {
      const { smartPay, myToken, payer, payee, platformWallet } = await loadFixture(deploySmartPayFixture);
      
      const amount = ethers.parseEther("50");
      const interval = 86400; // 1 day
      const startTime = await time.latest() + 100; // Start soon
      
      // Create recurring payment
      await smartPay.connect(payer).createRecurringPayment(
        payee.address,
        amount,
        interval,
        startTime,
        0, // No end time
        0, // No max executions
        "Subscription"
      );
      
      // Fast forward to start time
      await time.increaseTo(startTime + 1);
      
      // Approve tokens for multiple payments
      await myToken.connect(payer).approve(smartPay.target, amount * 10n);
      
      const payeeBalanceBefore = await myToken.balanceOf(payee.address);
      const platformBalanceBefore = await myToken.balanceOf(platformWallet.address);
      
      await expect(smartPay.executeRecurringPayment(1))
        .to.emit(smartPay, "RecurringPaymentExecuted")
        .withArgs(1, 1, amount - (amount * 100n / 10000n)); // execution number, net amount

      const recurring = await smartPay.getRecurringPayment(1);
      expect(recurring.totalExecutions).to.equal(1);
      expect(recurring.lastExecuted).to.be.closeTo(startTime + 1, 5);
      
      // Check balances
      const platformFee = amount * 100n / 10000n; // 1%
      const payeeAmount = amount - platformFee;
      
      expect(await myToken.balanceOf(payee.address)).to.equal(payeeBalanceBefore + payeeAmount);
      expect(await myToken.balanceOf(platformWallet.address)).to.equal(platformBalanceBefore + platformFee);
    });

    it("Should execute multiple recurring payments in sequence", async function () {
      const { smartPay, myToken, payer, payee } = await loadFixture(deploySmartPayFixture);
      
      const amount = ethers.parseEther("50");
      const interval = 86400; // 1 day
      const startTime = await time.latest() + 100;
      
      // Create recurring payment
      await smartPay.connect(payer).createRecurringPayment(
        payee.address,
        amount,
        interval,
        startTime,
        0, // No end time
        3, // Max 3 executions
        "Limited subscription"
      );
      
      // Approve tokens
      await myToken.connect(payer).approve(smartPay.target, amount * 5n);
      
      // Execute first payment
      await time.increaseTo(startTime + 1);
      await smartPay.executeRecurringPayment(1);
      
      // Execute second payment
      await time.increase(interval + 1);
      await smartPay.executeRecurringPayment(1);
      
      // Execute third payment
      await time.increase(interval + 1);
      await expect(smartPay.executeRecurringPayment(1))
        .to.emit(smartPay, "RecurringPaymentStopped")
        .withArgs(1, 3);
      
      const recurring = await smartPay.getRecurringPayment(1);
      expect(recurring.totalExecutions).to.equal(3);
      expect(recurring.status).to.equal(1); // Completed
    });

    it("Should stop a recurring payment", async function () {
      const { smartPay, payer, payee } = await loadFixture(deploySmartPayFixture);
      
      const amount = ethers.parseEther("50");
      const interval = 86400;
      const startTime = await time.latest() + 3600;
      
      // Create recurring payment
      await smartPay.connect(payer).createRecurringPayment(
        payee.address,
        amount,
        interval,
        startTime,
        0,
        0,
        "Subscription"
      );
      
      await expect(smartPay.connect(payer).stopRecurringPayment(1))
        .to.emit(smartPay, "RecurringPaymentStopped")
        .withArgs(1, 0); // 0 executions

      const recurring = await smartPay.getRecurringPayment(1);
      expect(recurring.status).to.equal(2); // Cancelled
    });

    it("Should check if recurring payment is due", async function () {
      const { smartPay, payer, payee } = await loadFixture(deploySmartPayFixture);
      
      const amount = ethers.parseEther("50");
      const interval = 86400;
      const startTime = await time.latest() + 3600;
      
      // Create recurring payment
      await smartPay.connect(payer).createRecurringPayment(
        payee.address,
        amount,
        interval,
        startTime,
        0,
        0,
        "Subscription"
      );
      
      // Not due yet
      expect(await smartPay.isRecurringPaymentDue(1)).to.be.false;
      
      // Fast forward to start time
      await time.increaseTo(startTime + 1);
      expect(await smartPay.isRecurringPaymentDue(1)).to.be.true;
    });

    it("Should batch execute recurring payments", async function () {
      const { smartPay, myToken, payer, payee } = await loadFixture(deploySmartPayFixture);
      
      const amount = ethers.parseEther("25");
      const interval = 86400;
      const startTime = await time.latest() + 100;
      
      // Create multiple recurring payments
      for (let i = 0; i < 3; i++) {
        await smartPay.connect(payer).createRecurringPayment(
          payee.address,
          amount,
          interval,
          startTime,
          0,
          0,
          `Subscription ${i}`
        );
      }
      
      // Approve tokens
      await myToken.connect(payer).approve(smartPay.target, amount * 10n);
      
      // Fast forward to start time
      await time.increaseTo(startTime + 1);
      
      const payeeBalanceBefore = await myToken.balanceOf(payee.address);
      
      // Batch execute
      await smartPay.batchExecuteRecurringPayments([1, 2, 3]);
      
      // Check that all payments were executed
      for (let i = 1; i <= 3; i++) {
        const recurring = await smartPay.getRecurringPayment(i);
        expect(recurring.totalExecutions).to.equal(1);
      }
      
      const totalNetAmount = (amount * 3n) - ((amount * 3n * 100n) / 10000n);
      expect(await myToken.balanceOf(payee.address)).to.equal(payeeBalanceBefore + totalNetAmount);
    });

    it("Should get next payment time", async function () {
      const { smartPay, payer, payee } = await loadFixture(deploySmartPayFixture);
      
      const amount = ethers.parseEther("50");
      const interval = 86400;
      const startTime = await time.latest() + 3600;
      
      // Create recurring payment
      await smartPay.connect(payer).createRecurringPayment(
        payee.address,
        amount,
        interval,
        startTime,
        0,
        0,
        "Subscription"
      );
      
      // Before any execution
      expect(await smartPay.getNextPaymentTime(1)).to.equal(startTime);
    });
  });

  describe("View Functions", function () {
    it("Should return user payments and recurring payments", async function () {
      const { smartPay, payer, payee } = await loadFixture(deploySmartPayFixture);
      
      const amount = ethers.parseEther("100");
      
      // Create one-time payment
      await smartPay.connect(payer).createPayment(payee.address, amount, "Test", ethers.ZeroHash);
      
      // Create recurring payment
      const startTime = await time.latest() + 3600;
      await smartPay.connect(payer).createRecurringPayment(
        payee.address,
        amount,
        86400,
        startTime,
        0,
        0,
        "Subscription"
      );
      
      // Check view functions
      const payerPayments = await smartPay.getUserPayments(payer.address);
      expect(payerPayments).to.deep.equal([1n]);
      
      const payeePayments = await smartPay.getUserPayments(payee.address);
      expect(payeePayments).to.deep.equal([1n]);
      
      const payerRecurring = await smartPay.getUserRecurringPayments(payer.address);
      expect(payerRecurring).to.deep.equal([1n]);
      
      const payeeRecurring = await smartPay.getUserRecurringPayments(payee.address);
      expect(payeeRecurring).to.deep.equal([1n]);
    });
  });

  describe("Admin Functions", function () {
    it("Should update platform fee", async function () {
      const { smartPay, owner } = await loadFixture(deploySmartPayFixture);
      
      const newFee = 200; // 2%
      await smartPay.connect(owner).updatePlatformFee(newFee);
      expect(await smartPay.platformFee()).to.equal(newFee);
    });

    it("Should fail to set fee too high", async function () {
      const { smartPay, owner } = await loadFixture(deploySmartPayFixture);
      
      await expect(smartPay.connect(owner).updatePlatformFee(1500))
        .to.be.revertedWith("Fee too high");
    });

    it("Should update platform wallet", async function () {
      const { smartPay, owner, addr4 } = await loadFixture(deploySmartPayFixture);
      
      await smartPay.connect(owner).updatePlatformWallet(addr4.address);
      expect(await smartPay.platformWallet()).to.equal(addr4.address);
    });

    it("Should emergency withdraw", async function () {
      const { smartPay, myToken, owner } = await loadFixture(deploySmartPayFixture);
      
      // Send some tokens to contract
      const amount = ethers.parseEther("100");
      await myToken.transfer(smartPay.target, amount);
      
      const ownerBalanceBefore = await myToken.balanceOf(owner.address);
      
      await smartPay.connect(owner).emergencyWithdraw(myToken.target, amount);
      
      expect(await myToken.balanceOf(owner.address)).to.equal(ownerBalanceBefore + amount);
    });
  });

  describe("Error Cases", function () {
    it("Should fail to execute payment without approval", async function () {
      const { smartPay, payer, payee } = await loadFixture(deploySmartPayFixture);
      
      const amount = ethers.parseEther("100");
      await smartPay.connect(payer).createPayment(payee.address, amount, "Test", ethers.ZeroHash);
      
      await expect(smartPay.connect(payer).executePayment(1))
        .to.be.revertedWith("Insufficient allowance");
    });

    it("Should fail to execute recurring payment too early", async function () {
      const { smartPay, myToken, payer, payee } = await loadFixture(deploySmartPayFixture);
      
      const amount = ethers.parseEther("50");
      const interval = 86400;
      const startTime = await time.latest() + 100;
      
      await smartPay.connect(payer).createRecurringPayment(
        payee.address,
        amount,
        interval,
        startTime,
        0,
        0,
        "Subscription"
      );
      
      await myToken.connect(payer).approve(smartPay.target, amount * 5n);
      
      // Execute first payment
      await time.increaseTo(startTime + 1);
      await smartPay.executeRecurringPayment(1);
      
      // Try to execute too early
      await expect(smartPay.executeRecurringPayment(1))
        .to.be.revertedWith("Too early for next payment");
    });

    it("Should fail to execute recurring payment after expiry", async function () {
      const { smartPay, payer, payee } = await loadFixture(deploySmartPayFixture);
      
      const amount = ethers.parseEther("50");
      const interval = 86400;
      const startTime = await time.latest() + 100;
      const endTime = startTime + 86400; // 1 day duration
      
      await smartPay.connect(payer).createRecurringPayment(
        payee.address,
        amount,
        interval,
        startTime,
        endTime,
        0,
        "Limited subscription"
      );
      
      // Fast forward past end time
      await time.increaseTo(endTime + 1);
      
      await expect(smartPay.executeRecurringPayment(1))
        .to.be.revertedWith("Recurring payment expired");
    });
  });
});
