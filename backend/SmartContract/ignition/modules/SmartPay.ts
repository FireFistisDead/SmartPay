import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SmartPayModule = buildModule("SmartPayModule", (m) => {
  const initialOwner = m.getParameter("initialOwner");

  const smartPay = m.contract("SmartPay", [initialOwner]);

  return { smartPay };
});

export default SmartPayModule;
