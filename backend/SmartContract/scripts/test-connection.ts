import { ethers } from "hardhat";

async function main() {
  console.log("Testing connection...");
  
  try {
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    const balance = await ethers.provider.getBalance(deployer.address);
    
    console.log("✅ Connection successful!");
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  } catch (error) {
    console.error("❌ Connection failed:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
