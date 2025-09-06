import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import MyTokenModule from "./MyToken";

const SmartPayModule = buildModule("SmartPayModule", (m) => {
  // Import MyToken from its module
  const { myToken } = m.useModule(MyTokenModule);
  
  // Get platform wallet address (default to deployer)
  const platformWallet = m.getParameter("platformWallet", "0x0000000000000000000000000000000000000000");
  
  const smartPay = m.contract("SmartPay", [myToken, platformWallet]);

  return { smartPay, myToken };
});

export default SmartPayModule;
