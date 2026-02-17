const hre = require("hardhat");

async function main() {
  const TaskHub = await hre.ethers.deployContract("TaskHub");
  await TaskHub.waitForDeployment();
  console.log(` deployed to ${TaskHub}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// npx hardhat compile
// npx hardhat node
// npx hardhat run scripts/deploy.js --network localhost
