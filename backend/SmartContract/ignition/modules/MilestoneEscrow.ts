import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MilestoneEscrowModule = buildModule("MilestoneEscrowModule", (m) => {
  const feeRecipient = m.getParameter("feeRecipient");
  const disputeResolver = m.getParameter("disputeResolver");

  const milestoneEscrow = m.contract("MilestoneEscrow", [
    feeRecipient,
    disputeResolver,
  ]);

  return { milestoneEscrow };
});

export default MilestoneEscrowModule;
