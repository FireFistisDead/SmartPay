/**
 * Basic test script to verify ContractService setup
 * Run with: node src/scripts/testContractService.js
 */

const ContractService = require('../services/contractService');
const TransactionService = require('../services/transactionService');
const logger = require('../utils/logger');

async function testContractService() {
  try {
    logger.info('=== Testing Contract Service ===');
    
    // Initialize contract service
    const contractService = new ContractService();
    await contractService.initialize();
    
    // Test basic connection
    logger.info('✅ Contract service initialized successfully');
    
    // Test wallet balance
    const balance = await contractService.getWalletBalance();
    logger.info(`💰 Wallet balance: ${balance} ETH`);
    
    // Test gas price
    const gasPrice = await contractService.getCurrentGasPrice();
    logger.info('⛽ Current gas prices:', {
      maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString()
    });
    
    // Test contract read (if contract is deployed)
    try {
      // This will fail if contract is not deployed, which is expected
      const jobData = await contractService.getJobData('1');
      logger.info('📄 Contract read test successful:', jobData);
    } catch (error) {
      logger.warn('📄 Contract read failed (expected if no contract deployed):', error.message);
    }
    
    logger.info('✅ All basic tests passed!');
    logger.info('');
    logger.info('Next steps:');
    logger.info('1. Deploy smart contract and update CONTRACT_ADDRESS in .env');
    logger.info('2. Update PRIVATE_KEY with funded wallet');
    logger.info('3. Test createJob functionality');
    
  } catch (error) {
    logger.error('❌ Contract service test failed:', error);
    logger.info('');
    logger.info('Troubleshooting:');
    logger.info('1. Check PRIVATE_KEY in .env (should start with 0x)');
    logger.info('2. Check RPC_URL is accessible');
    logger.info('3. Ensure wallet has some ETH for gas');
    logger.info('4. Verify CONTRACT_ADDRESS is set (can be dummy for basic tests)');
  }
}

// Run the test
if (require.main === module) {
  testContractService().then(() => {
    process.exit(0);
  }).catch((error) => {
    logger.error('Test script failed:', error);
    process.exit(1);
  });
}

module.exports = testContractService;
