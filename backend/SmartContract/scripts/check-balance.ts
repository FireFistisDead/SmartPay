import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("💰 Wallet Balance Check");
  console.log("=======================");
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Wallet: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceInEth = ethers.formatEther(balance);
  
  console.log(`Balance: ${balanceInEth} ETH`);
  
  if (parseFloat(balanceInEth) > 0) {
    console.log("✅ You have sufficient funds for deployment!");
    console.log("\nYou can now run:");
    console.log("npm run deploy:sepolia");
  } else {
    console.log("❌ Insufficient funds for deployment");
    console.log("\nPlease get test ETH from:");
    console.log("- https://www.alchemy.com/faucets/ethereum-sepolia");
    console.log("- https://sepoliafaucet.com/");
    console.log(`\nYour wallet address: ${deployer.address}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
