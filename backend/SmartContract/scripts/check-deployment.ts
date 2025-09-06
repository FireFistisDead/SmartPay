import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentData {
  network: string;
  chainId: number;
  deployer: string;
  platformWallet: string;
  deploymentTimestamp: string;
  contracts: {
    myToken: string;
    mockV3Aggregator?: string;
    milestoneEscrow: string;
    smartPay: string;
    automatedMilestoneEscrow: string;
    contractRegistry?: string;
  };
}

async function checkContractStatus(address: string, contractName: string) {
  try {
    const code = await ethers.provider.getCode(address);
    const isDeployed = code !== "0x";
    
    console.log(`${contractName}:`);
    console.log(`  Address: ${address}`);
    console.log(`  Status: ${isDeployed ? "✅ Deployed" : "❌ Not Deployed"}`);
    
    if (isDeployed) {
      const balance = await ethers.provider.getBalance(address);
      console.log(`  Balance: ${ethers.formatEther(balance)} ETH`);
      console.log(`  Code Size: ${(code.length - 2) / 2} bytes`);
    }
    
    console.log("");
    return isDeployed;
  } catch (error) {
    console.log(`${contractName}:`);
    console.log(`  Address: ${address}`);
    console.log(`  Status: ❌ Error checking status`);
    console.log(`  Error: ${error}`);
    console.log("");
    return false;
  }
}

async function getTokenInfo(tokenAddress: string) {
  try {
    const MyToken = await ethers.getContractFactory("MyToken");
    const token = MyToken.attach(tokenAddress) as any;
    
    const name = await token.name();
    const symbol = await token.symbol();
    const decimals = await token.decimals();
    const totalSupply = await token.totalSupply();
    
    console.log("📊 Token Information:");
    console.log(`  Name: ${name}`);
    console.log(`  Symbol: ${symbol}`);
    console.log(`  Decimals: ${decimals}`);
    console.log(`  Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);
    console.log("");
  } catch (error) {
    console.log("❌ Failed to fetch token information:", error);
    console.log("");
  }
}

async function main() {
  const networkName = process.env.HARDHAT_NETWORK || "localhost";
  const network = await ethers.provider.getNetwork();
  
  console.log("📊 SmartPay Deployment Status Check");
  console.log("===================================");
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Checking network: ${networkName}`);
  console.log("");

  // Load deployment data
  const deploymentFile = path.join(__dirname, "..", "deployments", `${networkName.toLowerCase()}-deployment.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ Deployment file not found: ${deploymentFile}`);
    console.log("");
    console.log("Available deployment files:");
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (fs.existsSync(deploymentsDir)) {
      const files = fs.readdirSync(deploymentsDir);
      files.forEach(file => console.log(`  - ${file}`));
    } else {
      console.log("  No deployments directory found");
    }
    console.log("");
    console.log("To deploy contracts, run:");
    console.log("  npm run deploy:sepolia");
    console.log("  npm run deploy:mumbai");
    console.log("  npm run deploy:local");
    process.exit(1);
  }

  const deploymentData: DeploymentData = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
  
  console.log("📄 Deployment Information:");
  console.log(`  Network: ${deploymentData.network}`);
  console.log(`  Chain ID: ${deploymentData.chainId}`);
  console.log(`  Deployer: ${deploymentData.deployer}`);
  console.log(`  Platform Wallet: ${deploymentData.platformWallet}`);
  console.log(`  Deployment Time: ${deploymentData.deploymentTimestamp}`);
  console.log("");

  console.log("🔍 Contract Status Check:");
  console.log("========================");

  const { contracts } = deploymentData;
  let allDeployed = true;

  // Check each contract
  allDeployed = allDeployed && await checkContractStatus(contracts.myToken, "MyToken");
  
  if (contracts.mockV3Aggregator) {
    allDeployed = allDeployed && await checkContractStatus(contracts.mockV3Aggregator, "MockV3Aggregator");
  }
  
  allDeployed = allDeployed && await checkContractStatus(contracts.milestoneEscrow, "MilestoneEscrow");
  allDeployed = allDeployed && await checkContractStatus(contracts.smartPay, "SmartPay");
  allDeployed = allDeployed && await checkContractStatus(contracts.automatedMilestoneEscrow, "AutomatedMilestoneEscrow");
  
  if (contracts.contractRegistry) {
    allDeployed = allDeployed && await checkContractStatus(contracts.contractRegistry, "ContractRegistry");
  }

  // Get token information if MyToken is deployed
  const tokenCode = await ethers.provider.getCode(contracts.myToken);
  if (tokenCode !== "0x") {
    await getTokenInfo(contracts.myToken);
  }

  console.log("📋 Summary:");
  console.log("==========");
  if (allDeployed) {
    console.log("✅ All contracts are successfully deployed!");
  } else {
    console.log("❌ Some contracts are missing or failed to deploy");
  }

  console.log("");
  console.log("🔗 Block Explorer Links:");
  console.log("========================");
  const explorerUrl = getExplorerUrl(deploymentData.chainId);
  Object.entries(contracts).forEach(([contractName, address]) => {
    if (address) {
      console.log(`${contractName}: ${explorerUrl}/address/${address}`);
    }
  });

  console.log("");
  console.log("⚡ Quick Commands:");
  console.log("=================");
  console.log("Deploy to testnets:");
  console.log("  npm run deploy:sepolia");
  console.log("  npm run deploy:mumbai");
  console.log("");
  console.log("Verify contracts:");
  console.log("  npm run verify:sepolia");
  console.log("  npm run verify:mumbai");
  console.log("");
  console.log("Run tests:");
  console.log("  npm test");
  console.log("  npm run test:coverage");
}

function getExplorerUrl(chainId: number): string {
  const explorers: { [key: number]: string } = {
    11155111: "https://sepolia.etherscan.io",    // Sepolia
    80001: "https://mumbai.polygonscan.com",     // Mumbai
    31337: "http://localhost:8545"               // Hardhat (no explorer)
  };
  return explorers[chainId] || "https://etherscan.io";
}

// Execute status check
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;
