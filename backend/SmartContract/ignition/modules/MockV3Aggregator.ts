import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MockV3AggregatorModule = buildModule("MockV3AggregatorModule", (m) => {
  // Deploy MockV3Aggregator with 8 decimals and $2000 initial price
  const decimals = m.getParameter("decimals", 8);
  const initialAnswer = m.getParameter("initialAnswer", 200000000000); // $2000 with 8 decimals
  
  const mockV3Aggregator = m.contract("MockV3Aggregator", [decimals, initialAnswer]);

  return { mockV3Aggregator };
});

export default MockV3AggregatorModule;
