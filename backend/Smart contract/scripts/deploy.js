import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("Deploying MyToken contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Deploy the MyToken contract
  const MyToken = await ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy();

  await myToken.waitForDeployment();

  const contractAddress = await myToken.getAddress();
  console.log("MyToken deployed to:", contractAddress);

  // Verify the deployment by checking token details
  const tokenName = await myToken.name();
  const tokenSymbol = await myToken.symbol();
  const totalSupply = await myToken.totalSupply();
  const deployerBalance = await myToken.balanceOf(deployer.address);

  console.log("\nToken Details:");
  console.log("Name:", tokenName);
  console.log("Symbol:", tokenSymbol);
  console.log("Total Supply:", ethers.formatEther(totalSupply), "MTK");
  console.log("Deployer Balance:", ethers.formatEther(deployerBalance), "MTK");

  console.log("\nDeployment Summary:");
  console.log("- Contract Address:", contractAddress);
  console.log("- Network:", network.name);
  console.log("- Deployer:", deployer.address);
  console.log("- Transaction Hash:", myToken.deploymentTransaction()?.hash);

  return {
    contract: myToken,
    address: contractAddress,
    deployer: deployer.address
  };
}

// Handle errors and run the deployment
main()
  .then((result) => {
    console.log("\n✅ Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
