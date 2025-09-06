import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import MyTokenModule from "./MyToken";

const AutomatedMilestoneEscrowModule = buildModule("AutomatedMilestoneEscrowModule", (m) => {
  // Import MyToken from its module
  const { myToken } = m.useModule(MyTokenModule);
  
  // Get platform wallet address (default to deployer)
  const platformWallet = m.getParameter("platformWallet", "0x0000000000000000000000000000000000000000");
  
  // Get automation registry address (can be zero address for testing)
  const automationRegistry = m.getParameter("automationRegistry", "0x0000000000000000000000000000000000000000");
  
  const automatedMilestoneEscrow = m.contract("AutomatedMilestoneEscrow", [
    myToken, 
    platformWallet, 
    automationRegistry
  ]);

  return { automatedMilestoneEscrow, myToken };
});

export default AutomatedMilestoneEscrowModule;
