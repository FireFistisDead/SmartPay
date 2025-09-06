import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentAddresses {
  myToken: string;
  mockV3Aggregator?: string;
  milestoneEscrow: string;
  smartPay: string;
  automatedMilestoneEscrow: string;
  contractRegistry?: string;
}

interface NetworkConfig {
  chainId: number;
  name: string;
  automationRegistry?: string;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("🚀 SmartPay Testnet Deployment");
  console.log("==============================");
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  console.log("");

  // Network-specific configurations
  const networkConfigs: { [key: string]: NetworkConfig } = {
    "11155111": { // Sepolia
      chainId: 11155111,
      name: "Sepolia",
      automationRegistry: process.env.SEPOLIA_AUTOMATION_REGISTRY || "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad"
    },
    "80001": { // Mumbai
      chainId: 80001,
      name: "Mumbai", 
      automationRegistry: process.env.MUMBAI_AUTOMATION_REGISTRY || "0x02777053d6764996e594c3E88AF1D58D5363a2e6"
    },
    "31337": { // Hardhat local
      chainId: 31337,
      name: "Hardhat",
      automationRegistry: ethers.ZeroAddress
    }
  };

  const networkConfig = networkConfigs[network.chainId.toString()];
  if (!networkConfig) {
    throw new Error(`Unsupported network with chain ID: ${network.chainId}`);
  }

  // Get platform wallet from environment or use deployer
  const platformWallet = process.env.PLATFORM_WALLET || deployer.address;
  console.log(`Platform wallet: ${platformWallet}`);
  console.log("");

  const deploymentAddresses: DeploymentAddresses = {
    myToken: "",
    milestoneEscrow: "",
    smartPay: "",
    automatedMilestoneEscrow: ""
  };

  try {
    // 1. Deploy MyToken
    console.log("📄 Deploying MyToken...");
    const MyToken = await ethers.getContractFactory("MyToken");
    const initialSupply = ethers.parseUnits("1000000", 18); // 1M tokens
    const myToken = await MyToken.deploy(initialSupply);
    await myToken.waitForDeployment();
    deploymentAddresses.myToken = await myToken.getAddress();
    console.log(`✅ MyToken deployed to: ${deploymentAddresses.myToken}`);

    // 2. Deploy MockV3Aggregator (for testing price feeds)
    if (networkConfig.chainId === 31337) {
      console.log("📄 Deploying MockV3Aggregator (local testing)...");
      const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
      const decimals = 8;
      const initialAnswer = 200000000000; // $2000 with 8 decimals
      const mockV3Aggregator = await MockV3Aggregator.deploy(decimals, initialAnswer);
      await mockV3Aggregator.waitForDeployment();
      deploymentAddresses.mockV3Aggregator = await mockV3Aggregator.getAddress();
      console.log(`✅ MockV3Aggregator deployed to: ${deploymentAddresses.mockV3Aggregator}`);
    }

    // 3. Deploy MilestoneEscrow
    console.log("📄 Deploying MilestoneEscrow...");
    const MilestoneEscrow = await ethers.getContractFactory("MilestoneEscrow");
    const milestoneEscrow = await MilestoneEscrow.deploy(deploymentAddresses.myToken, platformWallet);
    await milestoneEscrow.waitForDeployment();
    deploymentAddresses.milestoneEscrow = await milestoneEscrow.getAddress();
    console.log(`✅ MilestoneEscrow deployed to: ${deploymentAddresses.milestoneEscrow}`);

    // 4. Deploy SmartPay
    console.log("📄 Deploying SmartPay...");
    const SmartPay = await ethers.getContractFactory("SmartPay");
    const smartPay = await SmartPay.deploy(deploymentAddresses.myToken, platformWallet);
    await smartPay.waitForDeployment();
    deploymentAddresses.smartPay = await smartPay.getAddress();
    console.log(`✅ SmartPay deployed to: ${deploymentAddresses.smartPay}`);

    // 5. Deploy AutomatedMilestoneEscrow
    console.log("📄 Deploying AutomatedMilestoneEscrow...");
    const AutomatedMilestoneEscrow = await ethers.getContractFactory("AutomatedMilestoneEscrow");
    const automatedMilestoneEscrow = await AutomatedMilestoneEscrow.deploy(
      deploymentAddresses.myToken,
      platformWallet,
      networkConfig.automationRegistry || ethers.ZeroAddress
    );
    await automatedMilestoneEscrow.waitForDeployment();
    deploymentAddresses.automatedMilestoneEscrow = await automatedMilestoneEscrow.getAddress();
    console.log(`✅ AutomatedMilestoneEscrow deployed to: ${deploymentAddresses.automatedMilestoneEscrow}`);

    // 6. Deploy ContractRegistry (optional)
    console.log("📄 Deploying ContractRegistry...");
    const ContractRegistry = await ethers.getContractFactory("ContractRegistry");
    const contractRegistry = await ContractRegistry.deploy();
    await contractRegistry.waitForDeployment();
    deploymentAddresses.contractRegistry = await contractRegistry.getAddress();
    console.log(`✅ ContractRegistry deployed to: ${deploymentAddresses.contractRegistry}`);

    console.log("");
    console.log("🎉 All contracts deployed successfully!");
    console.log("=====================================");

    // Save deployment addresses
    const deploymentData = {
      network: networkConfig.name,
      chainId: networkConfig.chainId,
      deployer: deployer.address,
      platformWallet: platformWallet,
      deploymentTimestamp: new Date().toISOString(),
      contracts: deploymentAddresses,
      transactionHashes: {
        // You can add transaction hashes here if needed
      }
    };

    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, `${networkConfig.name.toLowerCase()}-deployment.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
    console.log(`📝 Deployment addresses saved to: ${deploymentFile}`);

    // Display summary
    console.log("");
    console.log("📋 Deployment Summary:");
    console.log("======================");
    Object.entries(deploymentAddresses).forEach(([contractName, address]) => {
      if (address) {
        console.log(`${contractName}: ${address}`);
      }
    });

    console.log("");
    console.log("🔗 Next Steps:");
    console.log("==============");
    if (networkConfig.chainId !== 31337) {
      console.log("1. Verify contracts on block explorer:");
      console.log(`   npx hardhat verify --network ${network.name.toLowerCase()} ${deploymentAddresses.myToken} "${initialSupply}"`);
      console.log(`   npx hardhat verify --network ${network.name.toLowerCase()} ${deploymentAddresses.milestoneEscrow} "${deploymentAddresses.myToken}" "${platformWallet}"`);
      console.log(`   npx hardhat verify --network ${network.name.toLowerCase()} ${deploymentAddresses.smartPay} "${deploymentAddresses.myToken}" "${platformWallet}"`);
      console.log(`   npx hardhat verify --network ${network.name.toLowerCase()} ${deploymentAddresses.automatedMilestoneEscrow} "${deploymentAddresses.myToken}" "${platformWallet}" "${networkConfig.automationRegistry}"`);
      console.log("");
    }
    console.log("2. Update your frontend configuration with these contract addresses");
    console.log("3. Fund your contracts with tokens if needed");
    console.log("4. Test the deployment with integration tests");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main;
