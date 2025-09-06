# Deployment Files

This directory contains deployment information for different networks.

## Files Structure

- `sepolia-deployment.json` - Sepolia testnet deployment addresses
- `mumbai-deployment.json` - Mumbai testnet deployment addresses  
- `hardhat-deployment.json` - Local hardhat network deployment addresses

## File Format

Each deployment file contains:

```json
{
  "network": "Network Name",
  "chainId": 12345,
  "deployer": "0x...",
  "platformWallet": "0x...",
  "deploymentTimestamp": "2025-09-06T...",
  "contracts": {
    "myToken": "0x...",
    "milestoneEscrow": "0x...",
    "smartPay": "0x...",
    "automatedMilestoneEscrow": "0x...",
    "contractRegistry": "0x..."
  }
}
```

## Usage

These files are automatically generated during deployment and used by:
- Verification scripts
- Status check scripts  
- Frontend configuration
- Integration tests

## Security Note

These files contain public contract addresses and are safe to commit to version control.
