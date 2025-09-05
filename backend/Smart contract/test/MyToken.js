import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("MyToken", function () {
  let myToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Deploy the contract
    myToken = await ethers.deployContract("MyToken");
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await myToken.getAddress()).to.be.properAddress;
    });

    it("Should set the right token name", async function () {
      expect(await myToken.name()).to.equal("MyToken");
    });

    it("Should set the right token symbol", async function () {
      expect(await myToken.symbol()).to.equal("MTK");
    });

    it("Should set the right decimals", async function () {
      expect(await myToken.decimals()).to.equal(18);
    });

    it("Should mint 1000 tokens to the deployer", async function () {
      const deployerBalance = await myToken.balanceOf(owner.address);
      const expectedBalance = ethers.parseEther("1000"); // 1000 tokens with 18 decimals
      expect(deployerBalance).to.equal(expectedBalance);
    });

    it("Should set the total supply to 1000 tokens", async function () {
      const totalSupply = await myToken.totalSupply();
      const expectedSupply = ethers.parseEther("1000");
      expect(totalSupply).to.equal(expectedSupply);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("50"); // 50 tokens

      // Transfer 50 tokens from owner to addr1
      await myToken.transfer(addr1.address, transferAmount);

      // Check balances
      const addr1Balance = await myToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount);

      const ownerBalance = await myToken.balanceOf(owner.address);
      const expectedOwnerBalance = ethers.parseEther("950"); // 1000 - 50
      expect(ownerBalance).to.equal(expectedOwnerBalance);
    });

    it("Should emit Transfer event on successful transfer", async function () {
      const transferAmount = ethers.parseEther("100");

      await expect(myToken.transfer(addr1.address, transferAmount))
        .to.emit(myToken, "Transfer")
        .withArgs(owner.address, addr1.address, transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const transferAmount = ethers.parseEther("1001"); // More than total supply

      await expect(myToken.transfer(addr1.address, transferAmount))
        .to.be.revertedWithCustomError(myToken, "ERC20InsufficientBalance");
    });

    it("Should allow transfers between non-owner accounts", async function () {
      const transferAmount = ethers.parseEther("100");

      // First, owner transfers to addr1
      await myToken.transfer(addr1.address, transferAmount);

      // Then addr1 transfers to addr2
      const transferAmount2 = ethers.parseEther("30");
      await myToken.connect(addr1).transfer(addr2.address, transferAmount2);

      // Check balances
      const addr1Balance = await myToken.balanceOf(addr1.address);
      const addr2Balance = await myToken.balanceOf(addr2.address);

      expect(addr1Balance).to.equal(ethers.parseEther("70")); // 100 - 30
      expect(addr2Balance).to.equal(transferAmount2);
    });

    it("Should handle zero amount transfers", async function () {
      await expect(myToken.transfer(addr1.address, 0))
        .to.emit(myToken, "Transfer")
        .withArgs(owner.address, addr1.address, 0);

      // Balances should remain unchanged
      const ownerBalance = await myToken.balanceOf(owner.address);
      const addr1Balance = await myToken.balanceOf(addr1.address);

      expect(ownerBalance).to.equal(ethers.parseEther("1000"));
      expect(addr1Balance).to.equal(0);
    });
  });

  describe("Allowances", function () {
    it("Should approve and transfer via allowance", async function () {
      const approveAmount = ethers.parseEther("200");
      const transferAmount = ethers.parseEther("150");

      // Owner approves addr1 to spend tokens
      await myToken.approve(addr1.address, approveAmount);

      // Check allowance
      const allowance = await myToken.allowance(owner.address, addr1.address);
      expect(allowance).to.equal(approveAmount);

      // addr1 transfers from owner to addr2
      await myToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);

      // Check balances
      const ownerBalance = await myToken.balanceOf(owner.address);
      const addr2Balance = await myToken.balanceOf(addr2.address);
      const remainingAllowance = await myToken.allowance(owner.address, addr1.address);

      expect(ownerBalance).to.equal(ethers.parseEther("850")); // 1000 - 150
      expect(addr2Balance).to.equal(transferAmount);
      expect(remainingAllowance).to.equal(ethers.parseEther("50")); // 200 - 150
    });

    it("Should fail transferFrom without sufficient allowance", async function () {
      const transferAmount = ethers.parseEther("100");

      // Try to transfer without approval
      await expect(
        myToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
      ).to.be.revertedWithCustomError(myToken, "ERC20InsufficientAllowance");
    });
  });
});
