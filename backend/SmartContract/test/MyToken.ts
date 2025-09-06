import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { MyToken } from "../typechain-types";

describe("MyToken", function () {
  async function deployMyTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    
    const MyToken = await ethers.getContractFactory("MyToken");
    const initialSupply = 1000000; // 1 million tokens
    const myToken = await MyToken.deploy(initialSupply) as MyToken;
    
    return { myToken, owner, addr1, addr2, initialSupply };
  }

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      const { myToken } = await loadFixture(deployMyTokenFixture);
      expect(await myToken.name()).to.equal("SmartPay Token");
      expect(await myToken.symbol()).to.equal("SPT");
    });

    it("Should set the right decimals", async function () {
      const { myToken } = await loadFixture(deployMyTokenFixture);
      expect(await myToken.decimals()).to.equal(18);
    });

    it("Should assign the total supply to the owner", async function () {
      const { myToken, owner, initialSupply } = await loadFixture(deployMyTokenFixture);
      const expectedSupply = ethers.parseEther(initialSupply.toString());
      expect(await myToken.totalSupply()).to.equal(expectedSupply);
      expect(await myToken.balanceOf(owner.address)).to.equal(expectedSupply);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const { myToken, owner, addr1 } = await loadFixture(deployMyTokenFixture);
      const transferAmount = ethers.parseEther("100");

      await expect(myToken.transfer(addr1.address, transferAmount))
        .to.changeTokenBalances(myToken, [owner, addr1], [-transferAmount, transferAmount]);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { myToken, addr1, addr2 } = await loadFixture(deployMyTokenFixture);
      const transferAmount = ethers.parseEther("1");

      await expect(myToken.connect(addr1).transfer(addr2.address, transferAmount))
        .to.be.revertedWith("Insufficient balance");
    });

    it("Should fail if transferring to zero address", async function () {
      const { myToken } = await loadFixture(deployMyTokenFixture);
      const transferAmount = ethers.parseEther("100");

      await expect(myToken.transfer(ethers.ZeroAddress, transferAmount))
        .to.be.revertedWith("Invalid recipient");
    });
  });

  describe("Allowances", function () {
    it("Should approve and transferFrom", async function () {
      const { myToken, owner, addr1, addr2 } = await loadFixture(deployMyTokenFixture);
      const approveAmount = ethers.parseEther("100");
      const transferAmount = ethers.parseEther("50");

      await myToken.approve(addr1.address, approveAmount);
      expect(await myToken.allowance(owner.address, addr1.address)).to.equal(approveAmount);

      await expect(myToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount))
        .to.changeTokenBalances(myToken, [owner, addr2], [-transferAmount, transferAmount]);

      expect(await myToken.allowance(owner.address, addr1.address)).to.equal(approveAmount - transferAmount);
    });

    it("Should fail transferFrom without sufficient allowance", async function () {
      const { myToken, owner, addr1, addr2 } = await loadFixture(deployMyTokenFixture);
      const transferAmount = ethers.parseEther("100");

      await expect(myToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount))
        .to.be.revertedWith("Insufficient allowance");
    });

    it("Should increase and decrease allowance", async function () {
      const { myToken, owner, addr1 } = await loadFixture(deployMyTokenFixture);
      const initialAllowance = ethers.parseEther("100");
      const increaseAmount = ethers.parseEther("50");
      const decreaseAmount = ethers.parseEther("25");

      await myToken.approve(addr1.address, initialAllowance);
      
      await myToken.increaseAllowance(addr1.address, increaseAmount);
      expect(await myToken.allowance(owner.address, addr1.address)).to.equal(initialAllowance + increaseAmount);

      await myToken.decreaseAllowance(addr1.address, decreaseAmount);
      expect(await myToken.allowance(owner.address, addr1.address)).to.equal(initialAllowance + increaseAmount - decreaseAmount);
    });
  });

  describe("Minting and Burning", function () {
    it("Should mint new tokens", async function () {
      const { myToken, addr1 } = await loadFixture(deployMyTokenFixture);
      const mintAmount = ethers.parseEther("1000");
      const initialSupply = await myToken.totalSupply();

      await myToken.mint(addr1.address, mintAmount);

      expect(await myToken.balanceOf(addr1.address)).to.equal(mintAmount);
      expect(await myToken.totalSupply()).to.equal(initialSupply + mintAmount);
    });

    it("Should burn tokens", async function () {
      const { myToken, owner } = await loadFixture(deployMyTokenFixture);
      const burnAmount = ethers.parseEther("1000");
      const initialBalance = await myToken.balanceOf(owner.address);
      const initialSupply = await myToken.totalSupply();

      await myToken.burn(burnAmount);

      expect(await myToken.balanceOf(owner.address)).to.equal(initialBalance - burnAmount);
      expect(await myToken.totalSupply()).to.equal(initialSupply - burnAmount);
    });

    it("Should fail to burn more than balance", async function () {
      const { myToken, addr1 } = await loadFixture(deployMyTokenFixture);
      const burnAmount = ethers.parseEther("1000");

      await expect(myToken.connect(addr1).burn(burnAmount))
        .to.be.revertedWith("Insufficient balance");
    });
  });
});
