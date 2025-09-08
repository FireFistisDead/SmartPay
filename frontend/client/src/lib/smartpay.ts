import { ethers, Signer, Provider, Contract } from 'ethers';

// Minimal ABI for the SmartPay contract methods we need
export const SMARTPAY_MINIMAL_ABI = [
  'function createPayment(address _payee, uint256 _amount, string _description, bytes32 _externalRef) returns (uint256)',
  'function executePayment(uint256 _paymentId)'
];

export function getSmartPayContract(address: string, signerOrProvider: Signer | Provider) {
  return new Contract(address, SMARTPAY_MINIMAL_ABI, signerOrProvider);
}
