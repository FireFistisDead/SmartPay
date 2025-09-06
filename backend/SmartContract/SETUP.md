# Environment Setup Guide

## Quick Setup Instructions

1. **Edit the .env file** with your actual values:
   ```bash
   # Open the .env file in your editor
   code .env
   ```

2. **Required Values to Update:**

   ### 🔑 Private Key (REQUIRED)
   ```env
   PRIVATE_KEY=your_actual_private_key_without_0x_prefix
   ```
   - Get this from MetaMask: Account Details → Export Private Key
   - ⚠️ **IMPORTANT**: Remove the "0x" prefix from the key

   ### 🌐 Alchemy API Key (REQUIRED)
   ```env
   ALCHEMY_API_KEY=your_alchemy_api_key
   ```
   - Sign up at https://dashboard.alchemy.com/
   - Create a new app for Ethereum and Polygon
   - Copy the API key

   ### 💼 Platform Wallet (REQUIRED)
   ```env
   PLATFORM_WALLET=0xYourWalletAddressHere
   ```
   - This is where platform fees will be sent
   - Usually your main wallet address

3. **Optional Values:**
   - `ETHERSCAN_API_KEY` - For contract verification on Ethereum
   - `POLYGONSCAN_API_KEY` - For contract verification on Polygon
   - `REPORT_GAS` - Set to `true` to see gas usage reports

## Getting Testnet Funds

### Sepolia ETH
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)

### Mumbai MATIC
- [Polygon Faucet](https://faucet.polygon.technology/)
- [Alchemy Mumbai Faucet](https://www.alchemy.com/faucets/polygon-mumbai)

## Test Your Setup

Once configured, test your setup:

```bash
# Compile contracts
npm run compile

# Check setup
npm run verify-setup

# Deploy to local network (for testing)
npm run deploy:local
```

## Deploy to Testnets

```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Deploy to Mumbai
npm run deploy:mumbai
```

## Security Reminders

- ✅ .env file is in .gitignore (won't be committed)
- ⚠️ Never share your private key
- 🔒 Use a dedicated wallet for deployments
- 🧪 Always test on testnets first
