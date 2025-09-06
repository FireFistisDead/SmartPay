import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MyTokenModule = buildModule("MyTokenModule", (m) => {
  // Deploy MyToken with 1 million initial supply
  const initialSupply = m.getParameter("initialSupply", 1_000_000);
  
  const myToken = m.contract("MyToken", [initialSupply]);

  return { myToken };
});

export default MyTokenModule;
