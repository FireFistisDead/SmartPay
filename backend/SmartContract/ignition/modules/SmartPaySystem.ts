import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SmartPaySystemModule = buildModule("SmartPaySystemModule", (m) => {
  // Deploy MyToken first
  const initialSupply = m.getParameter("initialSupply", 1_000_000);
  const myToken = m.contract("MyToken", [initialSupply]);

  // Deploy MockV3Aggregator for testing
  const decimals = m.getParameter("decimals", 8);
  const initialAnswer = m.getParameter("initialAnswer", 200000000000); // $2000 with 8 decimals
  const mockV3Aggregator = m.contract("MockV3Aggregator", [decimals, initialAnswer]);

  // Get platform wallet address (default to deployer if not provided)
  const platformWallet = m.getParameter("platformWallet", "0x0000000000000000000000000000000000000000");
  
  // Get automation registry address (can be zero address for testing)
  const automationRegistry = m.getParameter("automationRegistry", "0x0000000000000000000000000000000000000000");

  // Deploy MilestoneEscrow
  const milestoneEscrow = m.contract("MilestoneEscrow", [myToken, platformWallet]);

  // Deploy SmartPay
  const smartPay = m.contract("SmartPay", [myToken, platformWallet]);

  // Deploy AutomatedMilestoneEscrow (main contract)
  const automatedMilestoneEscrow = m.contract("AutomatedMilestoneEscrow", [
    myToken, 
    platformWallet, 
    automationRegistry
  ]);

  return { 
    myToken,
    mockV3Aggregator,
    milestoneEscrow,
    smartPay,
    automatedMilestoneEscrow
  };
});

export default SmartPaySystemModule;
