const { ethers } = require('ethers');
const config = require('../config/config');
const logger = require('../utils/logger');
const TransactionService = require('./transactionService');
const { AppError } = require('../middleware/errorHandler');

/**
 * Payment Service - Handles ERC-20 token payments and escrow management
 */
class PaymentService {
  constructor() {
    // Singleton pattern to prevent duplicates
    if (PaymentService.instance) {
      return PaymentService.instance;
    }
    
    this.provider = null;
    this.signer = null;
    this.tokenContract = null;
    this.contractService = null; // Will be set via ServiceManager
    this.transactionService = new TransactionService();
    this.initialized = false;
    
    PaymentService.instance = this;
    
    // ERC-20 Token ABI (minimal required functions)
    this.tokenABI = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)",
      "function balanceOf(address owner) view returns (uint256)",
      "function transfer(address to, uint256 amount) returns (bool)",
      "function allowance(address owner, address spender) view returns (uint256)",
      "function approve(address spender, uint256 amount) returns (bool)",
      "function transferFrom(address from, address to, uint256 amount) returns (bool)",
      "event Transfer(address indexed from, address indexed to, uint256 value)",
      "event Approval(address indexed owner, address indexed spender, uint256 value)"
    ];
  }

  /**
   * Initialize payment service
   */
  async initialize() {
    try {
      const network = config.blockchain.networks[config.blockchain.defaultNetwork];
      
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(network.rpcUrl);
      
      // Initialize signer
      if (config.blockchain.privateKey) {
        this.signer = new ethers.Wallet(config.blockchain.privateKey, this.provider);
        logger.info(`Payment service wallet: ${this.signer.address}`);
      } else {
        throw new AppError('Private key not configured', 500, 'PAYMENT_CONFIG_ERROR');
      }

      // Initialize token contract
      if (config.blockchain.tokenAddress) {
        this.tokenContract = new ethers.Contract(
          config.blockchain.tokenAddress,
          this.tokenABI,
          this.signer
        );
        
        // Verify token contract
        const tokenName = await this.tokenContract.name();
        const tokenSymbol = await this.tokenContract.symbol();
        const tokenDecimals = await this.tokenContract.decimals();
        
        logger.info(`Token contract initialized: ${tokenName} (${tokenSymbol}) - ${tokenDecimals} decimals`);
      } else {
        logger.warn('Token address not configured - some payment features will be unavailable');
      }

      // Get ContractService from ServiceManager if available
      try {
        const serviceManager = require('./ServiceManager');
        if (serviceManager.hasService('ContractService')) {
          this.contractService = serviceManager.getExistingService('ContractService');
        }
      } catch (error) {
        logger.debug('ServiceManager not available, skipping ContractService dependency');
      }

      this.initialized = true;
      logger.info('Payment service initialized successfully');
      
    } catch (error) {
      logger.warn('Payment service failed to initialize, continuing with fallback mode:', error.message);
      this.initialized = false;
      // Don't throw error, just continue
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo() {
    this._checkInitialized();
    
    if (!this.tokenContract) {
      throw new AppError('Token contract not available', 400, 'TOKEN_NOT_CONFIGURED');
    }

    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.tokenContract.name(),
        this.tokenContract.symbol(),
        this.tokenContract.decimals(),
        this.tokenContract.totalSupply()
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        address: await this.tokenContract.getAddress()
      };
    } catch (error) {
      logger.error('Error getting token info:', error);
      throw new AppError('Failed to get token information', 500, 'TOKEN_INFO_ERROR');
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(address) {
    this._checkInitialized();
    
    if (!this.tokenContract) {
      throw new AppError('Token contract not available', 400, 'TOKEN_NOT_CONFIGURED');
    }

    try {
      const balance = await this.tokenContract.balanceOf(address);
      const decimals = await this.tokenContract.decimals();
      
      return {
        balance: ethers.formatUnits(balance, decimals),
        balanceWei: balance.toString(),
        decimals: Number(decimals)
      };
    } catch (error) {
      logger.error('Error getting token balance:', error);
      throw new AppError('Failed to get token balance', 500, 'TOKEN_BALANCE_ERROR');
    }
  }

  /**
   * Get allowance for spender
   */
  async getAllowance(owner, spender) {
    this._checkInitialized();
    
    if (!this.tokenContract) {
      throw new AppError('Token contract not available', 400, 'TOKEN_NOT_CONFIGURED');
    }

    try {
      const allowance = await this.tokenContract.allowance(owner, spender);
      const decimals = await this.tokenContract.decimals();
      
      return {
        allowance: ethers.formatUnits(allowance, decimals),
        allowanceWei: allowance.toString(),
        decimals: Number(decimals)
      };
    } catch (error) {
      logger.error('Error getting allowance:', error);
      throw new AppError('Failed to get allowance', 500, 'ALLOWANCE_ERROR');
    }
  }

  /**
   * Approve tokens for spending
   */
  async approveTokens(spender, amount) {
    this._checkInitialized();
    
    if (!this.tokenContract) {
      throw new AppError('Token contract not available', 400, 'TOKEN_NOT_CONFIGURED');
    }

    try {
      const decimals = await this.tokenContract.decimals();
      const amountWei = ethers.parseUnits(amount.toString(), decimals);
      
      logger.info(`Approving ${amount} tokens for spender ${spender}`);
      
      const gasEstimate = await this.tokenContract.approve.estimateGas(spender, amountWei);
      const gasPrice = await this.transactionService.getOptimalGasPrice();
      
      const tx = await this.tokenContract.approve(spender, amountWei, {
        gasLimit: Math.floor(gasEstimate * 1.2), // 20% buffer
        ...gasPrice
      });
      
      const receipt = await this.transactionService.waitForConfirmation(tx.hash);
      
      logger.info(`Token approval successful:`, {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });
      
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        amount: amount.toString(),
        spender
      };
      
    } catch (error) {
      logger.error('Error approving tokens:', error);
      throw new AppError('Failed to approve tokens', 500, 'TOKEN_APPROVAL_ERROR');
    }
  }

  /**
   * Transfer tokens
   */
  async transferTokens(to, amount) {
    this._checkInitialized();
    
    if (!this.tokenContract) {
      throw new AppError('Token contract not available', 400, 'TOKEN_NOT_CONFIGURED');
    }

    try {
      const decimals = await this.tokenContract.decimals();
      const amountWei = ethers.parseUnits(amount.toString(), decimals);
      
      logger.info(`Transferring ${amount} tokens to ${to}`);
      
      const gasEstimate = await this.tokenContract.transfer.estimateGas(to, amountWei);
      const gasPrice = await this.transactionService.getOptimalGasPrice();
      
      const tx = await this.tokenContract.transfer(to, amountWei, {
        gasLimit: Math.floor(gasEstimate * 1.2), // 20% buffer
        ...gasPrice
      });
      
      const receipt = await this.transactionService.waitForConfirmation(tx.hash);
      
      logger.info(`Token transfer successful:`, {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });
      
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        amount: amount.toString(),
        to
      };
      
    } catch (error) {
      logger.error('Error transferring tokens:', error);
      throw new AppError('Failed to transfer tokens', 500, 'TOKEN_TRANSFER_ERROR');
    }
  }

  /**
   * Fund job escrow with tokens
   */
  async fundJobEscrow(jobId, amount) {
    this._checkInitialized();
    
    try {
      const decimals = await this.tokenContract.decimals();
      const amountWei = ethers.parseUnits(amount.toString(), decimals);
      
      logger.info(`Funding job ${jobId} escrow with ${amount} tokens`);
      
      // First approve the smart contract to spend tokens
      const contractAddress = await this.contractService.getContractAddress();
      await this.approveTokens(contractAddress, amount);
      
      // Then fund the job via contract service
      const result = await this.contractService.fundJob(jobId, amountWei.toString());
      
      logger.info(`Job escrow funded successfully:`, {
        jobId,
        amount: amount.toString(),
        transactionHash: result.transactionHash
      });
      
      return result;
      
    } catch (error) {
      logger.error('Error funding job escrow:', error);
      throw new AppError('Failed to fund job escrow', 500, 'ESCROW_FUNDING_ERROR');
    }
  }

  /**
   * Release escrowed funds
   */
  async releaseEscrowFunds(jobId, to, amount) {
    this._checkInitialized();
    
    try {
      logger.info(`Releasing ${amount} tokens from job ${jobId} to ${to}`);
      
      const result = await this.contractService.releaseFunds(jobId, to, amount);
      
      logger.info(`Escrow funds released successfully:`, {
        jobId,
        to,
        amount: amount.toString(),
        transactionHash: result.transactionHash
      });
      
      return result;
      
    } catch (error) {
      logger.error('Error releasing escrow funds:', error);
      throw new AppError('Failed to release escrow funds', 500, 'ESCROW_RELEASE_ERROR');
    }
  }

  /**
   * Get gas price in tokens (utility function)
   */
  async getGasPriceInTokens() {
    this._checkInitialized();
    
    try {
      const gasPrice = await this.provider.getFeeData();
      const ethPrice = gasPrice.gasPrice || gasPrice.maxFeePerGas;
      
      // This would typically use a price oracle in production
      // For now, return a rough estimate
      const estimatedGasInETH = ethers.formatEther(ethPrice * BigInt(21000)); // Basic transfer gas
      
      return {
        estimatedGasInETH,
        gasPrice: ethPrice.toString(),
        note: 'Use price oracle for accurate token conversion in production'
      };
      
    } catch (error) {
      logger.error('Error getting gas price in tokens:', error);
      throw new AppError('Failed to get gas price', 500, 'GAS_PRICE_ERROR');
    }
  }

  /**
   * Batch token operations
   */
  async batchTokenOperations(operations) {
    this._checkInitialized();
    
    const results = [];
    
    for (const operation of operations) {
      try {
        let result;
        
        switch (operation.type) {
          case 'transfer':
            result = await this.transferTokens(operation.to, operation.amount);
            break;
          case 'approve':
            result = await this.approveTokens(operation.spender, operation.amount);
            break;
          default:
            throw new AppError(`Unknown operation type: ${operation.type}`, 400, 'INVALID_OPERATION');
        }
        
        results.push({
          operation,
          success: true,
          result
        });
        
      } catch (error) {
        logger.error(`Batch operation failed:`, { operation, error });
        results.push({
          operation,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Private helper to check initialization
   */
  _checkInitialized() {
    if (!this.initialized) {
      throw new AppError('Payment service not initialized', 500, 'PAYMENT_NOT_INITIALIZED');
    }
  }
}

module.exports = PaymentService;
