import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AutomatedMilestoneEscrowModule = buildModule("AutomatedMilestoneEscrowModule", (m) => {
  const feeRecipient = m.getParameter("feeRecipient");
  const disputeResolver = m.getParameter("disputeResolver");
  // Chainlink ETH/USD price feed address (Sepolia testnet)
  const priceFeed = m.getParameter("priceFeed", "0x694AA1769357215DE4FAC081bf1f309aDC325306");

  const automatedMilestoneEscrow = m.contract("AutomatedMilestoneEscrow", [
    feeRecipient,
    disputeResolver,
    priceFeed,
  ]);

  return { automatedMilestoneEscrow };
});

export default AutomatedMilestoneEscrowModule;
