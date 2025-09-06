# SmartPay - Testnet Deployment Guide

This guide will help you deploy the SmartPay contracts to Ethereum Sepolia and Polygon Mumbai testnets.

## Prerequisites

1. **Node.js** (v16 or later)
2. **npm** or **yarn**
3. **Metamask** or another Ethereum wallet
4. **Testnet ETH/MATIC** for gas fees
5. **Alchemy account** for RPC endpoints

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the environment template and fill in your values:

```bash
copy .env.example .env
```

Edit `.env` file with your actual values:

```env
# Private Key (without 0x prefix) - KEEP THIS SECURE!
PRIVATE_KEY=your_private_key_here

# Alchemy API Key (get from https://dashboard.alchemy.com/)
ALCHEMY_API_KEY=your_alchemy_api_key_here

# Platform wallet address (will receive fees)
PLATFORM_WALLET=your_platform_wallet_address_here

# Etherscan API Keys for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
```

### 3. Get Testnet Funds

#### Sepolia Testnet ETH
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)

#### Mumbai Testnet MATIC
- [Polygon Faucet](https://faucet.polygon.technology/)
- [Alchemy Mumbai Faucet](https://mumbaifaucet.com/)

## Deployment

### Deploy to Sepolia

```bash
npm run deploy:sepolia
```

### Deploy to Mumbai

```bash
npm run deploy:mumbai
```

### Deploy Locally (for testing)

```bash
npm run deploy:local
```

## Contract Verification

After deployment, verify your contracts on block explorers:

### Verify on Sepolia

```bash
npm run verify:sepolia
```

### Verify on Mumbai

```bash
npm run verify:mumbai
```

## Check Deployment Status

### Check Sepolia Deployment

```bash
npm run status:sepolia
```

### Check Mumbai Deployment

```bash
npm run status:mumbai
```

### Check Local Deployment

```bash
npm run status:local
```

## Manual Verification Commands

If automatic verification fails, you can verify contracts manually:

### Sepolia Manual Verification

```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS "constructor_arg1" "constructor_arg2"
```

### Mumbai Manual Verification

```bash
npx hardhat verify --network mumbai CONTRACT_ADDRESS "constructor_arg1" "constructor_arg2"
```

## Contract Addresses

After successful deployment, contract addresses will be saved in:
- `deployments/sepolia-deployment.json`
- `deployments/mumbai-deployment.json`

## Testing

Run the test suite to ensure everything works:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Compile contracts
npm run compile
```

## Deployment Architecture

The deployment script deploys the following contracts in order:

1. **MyToken** - ERC20 token for the platform
2. **MockV3Aggregator** - Price feed mock (local only)
3. **MilestoneEscrow** - Basic escrow functionality
4. **SmartPay** - Payment processing
5. **AutomatedMilestoneEscrow** - Main contract with automation
6. **ContractRegistry** - Registry for contract management

## Network Configuration

### Sepolia Configuration
- **Chain ID**: 11155111
- **RPC URL**: Uses Alchemy
- **Explorer**: https://sepolia.etherscan.io
- **Automation Registry**: 0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad

### Mumbai Configuration
- **Chain ID**: 80001
- **RPC URL**: Uses Alchemy
- **Explorer**: https://mumbai.polygonscan.com
- **Automation Registry**: 0x02777053d6764996e594c3E88AF1D58D5363a2e6

## Troubleshooting

### Common Issues

1. **Insufficient Funds**
   - Ensure you have enough testnet ETH/MATIC for gas fees
   - Get more funds from faucets

2. **Network Connection Issues**
   - Check your Alchemy API key
   - Verify RPC URLs in hardhat.config.ts

3. **Verification Failures**
   - Ensure Etherscan/Polygonscan API keys are correct
   - Wait a few minutes after deployment before verifying
   - Try manual verification commands

4. **Private Key Issues**
   - Ensure private key is without '0x' prefix
   - Check that the wallet has sufficient funds
   - Verify the wallet address matches your expectations

### Getting Help

1. Check the deployment logs for error messages
2. Use `npm run status:network` to check contract deployment status
3. Verify environment variables are set correctly
4. Ensure you're using the correct network name

## Security Notes

- **Never commit your `.env` file** to version control
- **Use a dedicated deployment wallet** for testnet deployments
- **Verify all contract addresses** after deployment
- **Test thoroughly** on testnets before mainnet deployment

## Next Steps After Deployment

1. **Update Frontend Configuration**
   - Copy contract addresses from deployment files
   - Update your frontend app with the new addresses

2. **Fund Contracts (if needed)**
   - Transfer tokens to contracts if they need initial balances

3. **Integration Testing**
   - Test contract interactions from your frontend
   - Verify all functionality works as expected

4. **Documentation**
   - Document the deployed contract addresses
   - Share the information with your team

## Useful Commands

```bash
# Clean build artifacts
npm run clean

# Verify setup without deploying
npm run verify-setup

# Check gas usage
REPORT_GAS=true npm test

# Run specific test files
npx hardhat test test/SmartPay.ts
```

## Support

For additional support or questions about deployment:
1. Check the Hardhat documentation
2. Review the contract source code
3. Test on local network first
4. Verify all environment variables are set correctly
