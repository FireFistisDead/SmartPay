import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import MyTokenModule from "./MyToken";

const MilestoneEscrowModule = buildModule("MilestoneEscrowModule", (m) => {
  // Import MyToken from its module
  const { myToken } = m.useModule(MyTokenModule);
  
  // Get platform wallet address (default to deployer)
  const platformWallet = m.getParameter("platformWallet", "0x0000000000000000000000000000000000000000");
  
  const milestoneEscrow = m.contract("MilestoneEscrow", [myToken, platformWallet]);

  return { milestoneEscrow, myToken };
});

export default MilestoneEscrowModule;
