import { expect } from "chai";
const { ethers } = require("hardhat");

describe("SmartPayToken", function () {
  async function deploySmartPayTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const SmartPayToken = await ethers.getContractFactory("SmartPayToken");
    const smartPayToken = await SmartPayToken.deploy(
      "SmartPay Token",
      "SPT",
      18,
      1000000, // 1 million tokens
      owner.address
    );

    return { smartPayToken, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { smartPayToken, owner } = await deploySmartPayTokenFixture();
      expect(await smartPayToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const { smartPayToken, owner } = await deploySmartPayTokenFixture();
      const ownerBalance = await smartPayToken.balanceOf(owner.address);
      expect(await smartPayToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should set the correct name, symbol, and decimals", async function () {
      const { smartPayToken } = await deploySmartPayTokenFixture();
      expect(await smartPayToken.name()).to.equal("SmartPay Token");
      expect(await smartPayToken.symbol()).to.equal("SPT");
      expect(await smartPayToken.decimals()).to.equal(18);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const { smartPayToken, owner, addr1 } = await deploySmartPayTokenFixture();
      await smartPayToken.mint(addr1.address, 1000);
      expect(await smartPayToken.balanceOf(addr1.address)).to.equal(1000);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const { smartPayToken, addr1, addr2 } = await deploySmartPayTokenFixture();
      await expect(
        smartPayToken.connect(addr1).mint(addr2.address, 1000)
      ).to.be.reverted;
    });
  });

  describe("Burning", function () {
    it("Should allow users to burn their own tokens", async function () {
      const { smartPayToken, owner } = await deploySmartPayTokenFixture();
      const initialBalance = await smartPayToken.balanceOf(owner.address);
      await smartPayToken.burn(1000);
      expect(await smartPayToken.balanceOf(owner.address)).to.equal(initialBalance - 1000n);
    });

    it("Should allow burning from approved accounts", async function () {
      const { smartPayToken, owner, addr1 } = await deploySmartPayTokenFixture();
      await smartPayToken.approve(addr1.address, 1000);
      await smartPayToken.connect(addr1).burnFrom(owner.address, 500);
      expect(await smartPayToken.allowance(owner.address, addr1.address)).to.equal(500);
    });
  });
});
