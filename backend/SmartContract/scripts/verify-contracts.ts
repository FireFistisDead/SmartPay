import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentData {
  network: string;
  chainId: number;
  deployer: string;
  platformWallet: string;
  contracts: {
    myToken: string;
    mockV3Aggregator?: string;
    milestoneEscrow: string;
    smartPay: string;
    automatedMilestoneEscrow: string;
    contractRegistry?: string;
  };
}

async function verifyContract(address: string, constructorArguments: any[]) {
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: constructorArguments,
    });
    console.log(`✅ Contract at ${address} verified successfully`);
  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log(`ℹ️  Contract at ${address} is already verified`);
    } else {
      console.error(`❌ Failed to verify contract at ${address}:`, error.message);
    }
  }
}

async function main() {
  const networkName = process.env.HARDHAT_NETWORK || "localhost";
  
  console.log("🔍 SmartPay Contract Verification");
  console.log("=================================");
  console.log(`Network: ${networkName}`);
  console.log("");

  // Load deployment data
  const deploymentFile = path.join(__dirname, "..", "deployments", `${networkName.toLowerCase()}-deployment.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ Deployment file not found: ${deploymentFile}`);
    console.log("Please run deployment first: npm run deploy:sepolia or npm run deploy:mumbai");
    process.exit(1);
  }

  const deploymentData: DeploymentData = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
  console.log("📄 Loaded deployment data from:", deploymentFile);
  console.log("");

  const { contracts, platformWallet } = deploymentData;

  try {
    // Verify MyToken
    console.log("🔍 Verifying MyToken...");
    const initialSupply = "1000000000000000000000000"; // 1M tokens with 18 decimals
    await verifyContract(contracts.myToken, [initialSupply]);

    // Verify MockV3Aggregator (if deployed)
    if (contracts.mockV3Aggregator) {
      console.log("🔍 Verifying MockV3Aggregator...");
      await verifyContract(contracts.mockV3Aggregator, [8, "200000000000"]);
    }

    // Verify MilestoneEscrow
    console.log("🔍 Verifying MilestoneEscrow...");
    await verifyContract(contracts.milestoneEscrow, [contracts.myToken, platformWallet]);

    // Verify SmartPay
    console.log("🔍 Verifying SmartPay...");
    await verifyContract(contracts.smartPay, [contracts.myToken, platformWallet]);

    // Verify AutomatedMilestoneEscrow
    console.log("🔍 Verifying AutomatedMilestoneEscrow...");
    const automationRegistry = getAutomationRegistry(deploymentData.chainId);
    await verifyContract(contracts.automatedMilestoneEscrow, [
      contracts.myToken,
      platformWallet,
      automationRegistry
    ]);

    // Verify ContractRegistry (if deployed)
    if (contracts.contractRegistry) {
      console.log("🔍 Verifying ContractRegistry...");
      await verifyContract(contracts.contractRegistry, []);
    }

    console.log("");
    console.log("🎉 Contract verification completed!");
    console.log("");
    console.log("🔗 Block Explorer Links:");
    console.log("========================");
    
    const explorerUrl = getExplorerUrl(deploymentData.chainId);
    Object.entries(contracts).forEach(([contractName, address]) => {
      if (address) {
        console.log(`${contractName}: ${explorerUrl}/address/${address}`);
      }
    });

  } catch (error) {
    console.error("❌ Verification process failed:", error);
    process.exit(1);
  }
}

function getAutomationRegistry(chainId: number): string {
  const automationRegistries: { [key: number]: string } = {
    11155111: "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad", // Sepolia
    80001: "0x02777053d6764996e594c3E88AF1D58D5363a2e6",   // Mumbai
    31337: "0x0000000000000000000000000000000000000000"    // Hardhat
  };
  return automationRegistries[chainId] || "0x0000000000000000000000000000000000000000";
}

function getExplorerUrl(chainId: number): string {
  const explorers: { [key: number]: string } = {
    11155111: "https://sepolia.etherscan.io",    // Sepolia
    80001: "https://mumbai.polygonscan.com",     // Mumbai
    31337: "http://localhost:8545"               // Hardhat (no explorer)
  };
  return explorers[chainId] || "https://etherscan.io";
}

// Execute verification
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;
