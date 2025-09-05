import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SmartPayTokenModule = buildModule("SmartPayTokenModule", (m) => {
  const name = m.getParameter("name", "SmartPay Token");
  const symbol = m.getParameter("symbol", "SPT");
  const decimals = m.getParameter("decimals", 18);
  const initialSupply = m.getParameter("initialSupply", 1000000); // 1 million tokens
  const initialOwner = m.getParameter("initialOwner");

  const smartPayToken = m.contract("SmartPayToken", [
    name,
    symbol,
    decimals,
    initialSupply,
    initialOwner,
  ]);

  return { smartPayToken };
});

export default SmartPayTokenModule;
