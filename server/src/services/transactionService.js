const { ethers } = require('ethers');
const config = require('../config/config');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

/**
 * TransactionService - Handles transaction management, retries, and monitoring
 */
class TransactionService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.pendingTransactions = new Map(); // Track pending transactions
    this.retryQueue = []; // Queue for failed transactions
  }

  /**
   * Initialize the transaction service
   */
  async initialize(provider, wallet) {
    this.provider = provider;
    this.wallet = wallet;
    logger.info('TransactionService initialized');
  }

  /**
   * Send a transaction with retry logic and monitoring
   * @param {Function} contractMethod - The contract method to call
   * @param {Array} params - Parameters for the contract method
   * @param {Object} options - Transaction options
   * @returns {Object} Transaction result
   */
  async sendTransaction(contractMethod, params = [], options = {}) {
    const maxRetries = options.maxRetries || config.blockchain.maxRetries || 3;
    const retryDelay = options.retryDelay || config.blockchain.retryDelay || 5000;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Sending transaction (attempt ${attempt}/${maxRetries})`);
        
        // Estimate gas
        const gasEstimate = await contractMethod.estimateGas(...params);
        const gasLimit = gasEstimate * BigInt(120) / BigInt(100); // Add 20% buffer
        
        // Get current gas price
        const feeData = await this.provider.getFeeData();
        
        // Prepare transaction options
        const txOptions = {
          gasLimit,
          maxFeePerGas: feeData.maxFeePerGas,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
          ...options.txOptions
        };
        
        // Send transaction
        const tx = await contractMethod(...params, txOptions);
        
        logger.info(`Transaction sent: ${tx.hash}`, {
          gasLimit: gasLimit.toString(),
          maxFeePerGas: feeData.maxFeePerGas?.toString(),
          attempt
        });
        
        // Track pending transaction
        this.pendingTransactions.set(tx.hash, {
          hash: tx.hash,
          timestamp: Date.now(),
          method: contractMethod.name || 'unknown',
          params,
          attempt
        });
        
        return tx;
        
      } catch (error) {
        lastError = error;
        logger.error(`Transaction attempt ${attempt} failed:`, {
          error: error.message,
          code: error.code,
          reason: error.reason
        });
        
        // Don't retry certain errors
        if (this.isNonRetryableError(error)) {
          throw this.createAppError(error);
        }
        
        // Wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          await this.delay(retryDelay);
        }
      }
    }
    
    // All retries failed
    logger.error(`Transaction failed after ${maxRetries} attempts:`, lastError);
    throw this.createAppError(lastError);
  }

  /**
   * Wait for transaction confirmation with timeout
   * @param {string} txHash - Transaction hash
   * @param {number} confirmations - Number of confirmations to wait for
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Object} Transaction receipt
   */
  async waitForConfirmation(txHash, confirmations = null, timeout = null) {
    const maxConfirmations = confirmations || 
      config.blockchain.networks[config.blockchain.defaultNetwork].blockConfirmations;
    const maxTimeout = timeout || config.blockchain.confirmationTimeout || 300000; // 5 minutes
    
    try {
      logger.info(`Waiting for transaction confirmation: ${txHash}`, {
        confirmations: maxConfirmations,
        timeout: maxTimeout
      });
      
      // Create a promise that races between confirmation and timeout
      const confirmationPromise = this.provider.waitForTransaction(txHash, maxConfirmations);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction confirmation timeout')), maxTimeout)
      );
      
      const receipt = await Promise.race([confirmationPromise, timeoutPromise]);
      
      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }
      
      // Remove from pending transactions
      this.pendingTransactions.delete(txHash);
      
      logger.info(`Transaction confirmed: ${txHash}`, {
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        confirmations: maxConfirmations
      });
      
      return {
        success: true,
        receipt,
        transactionHash: txHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        confirmations: maxConfirmations
      };
      
    } catch (error) {
      // Remove from pending transactions on error
      this.pendingTransactions.delete(txHash);
      
      logger.error(`Transaction confirmation failed: ${txHash}`, error);
      
      if (error.message.includes('timeout')) {
        throw new AppError('Transaction confirmation timeout', 408, 'CONFIRMATION_TIMEOUT');
      }
      
      throw new AppError('Transaction confirmation failed', 500, 'CONFIRMATION_FAILED');
    }
  }

  /**
   * Send transaction and wait for confirmation in one call
   * @param {Function} contractMethod - The contract method to call
   * @param {Array} params - Parameters for the contract method
   * @param {Object} options - Transaction options
   * @returns {Object} Complete transaction result with receipt
   */
  async sendAndWait(contractMethod, params = [], options = {}) {
    try {
      // Send transaction
      const tx = await this.sendTransaction(contractMethod, params, options);
      
      // Wait for confirmation
      const result = await this.waitForConfirmation(
        tx.hash,
        options.confirmations,
        options.timeout
      );
      
      return {
        ...result,
        transaction: tx
      };
      
    } catch (error) {
      logger.error('Send and wait failed:', error);
      throw error;
    }
  }

  /**
   * Retry a failed transaction
   * @param {string} txHash - Original transaction hash
   * @param {Object} retryOptions - Options for retry
   * @returns {Object} New transaction result
   */
  async retryTransaction(txHash, retryOptions = {}) {
    const pendingTx = this.pendingTransactions.get(txHash);
    
    if (!pendingTx) {
      throw new AppError('Transaction not found in pending list', 404, 'TRANSACTION_NOT_FOUND');
    }
    
    logger.info(`Retrying transaction: ${txHash}`);
    
    // Increase gas price for retry
    const feeData = await this.provider.getFeeData();
    const increasedGasPrice = feeData.maxFeePerGas * BigInt(110) / BigInt(100); // 10% increase
    
    const newOptions = {
      ...retryOptions,
      txOptions: {
        maxFeePerGas: increasedGasPrice,
        ...retryOptions.txOptions
      }
    };
    
    // Remove old transaction from tracking
    this.pendingTransactions.delete(txHash);
    
    // Send new transaction (this will be tracked automatically)
    return await this.sendTransaction(
      pendingTx.contractMethod,
      pendingTx.params,
      newOptions
    );
  }

  /**
   * Get gas price estimation
   * @param {string} speed - 'slow', 'standard', 'fast'
   * @returns {Object} Gas price information
   */
  async getGasPrice(speed = 'standard') {
    try {
      const feeData = await this.provider.getFeeData();
      
      const speedMultipliers = {
        slow: 0.9,
        standard: 1.0,
        fast: 1.2
      };
      
      const multiplier = speedMultipliers[speed] || 1.0;
      
      return {
        maxFeePerGas: feeData.maxFeePerGas ? 
          (feeData.maxFeePerGas * BigInt(Math.floor(multiplier * 100)) / BigInt(100)) : null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? 
          (feeData.maxPriorityFeePerGas * BigInt(Math.floor(multiplier * 100)) / BigInt(100)) : null,
        gasPrice: feeData.gasPrice ? 
          (feeData.gasPrice * BigInt(Math.floor(multiplier * 100)) / BigInt(100)) : null,
        speed
      };
    } catch (error) {
      logger.error('Error getting gas price:', error);
      throw new AppError('Failed to get gas price', 500, 'GAS_PRICE_ERROR');
    }
  }

  /**
   * Estimate gas for a transaction
   * @param {Function} contractMethod - The contract method
   * @param {Array} params - Method parameters
   * @returns {Object} Gas estimation
   */
  async estimateGas(contractMethod, params = []) {
    try {
      const gasEstimate = await contractMethod.estimateGas(...params);
      const gasWithBuffer = gasEstimate * BigInt(120) / BigInt(100); // 20% buffer
      
      return {
        estimated: gasEstimate.toString(),
        withBuffer: gasWithBuffer.toString(),
        bufferPercentage: 20
      };
    } catch (error) {
      logger.error('Gas estimation failed:', error);
      throw new AppError('Gas estimation failed', 400, 'GAS_ESTIMATION_ERROR');
    }
  }

  /**
   * Get transaction status
   * @param {string} txHash - Transaction hash
   * @returns {Object} Transaction status
   */
  async getTransactionStatus(txHash) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      
      if (!tx) {
        return { status: 'not_found' };
      }
      
      if (tx.blockNumber) {
        const receipt = await this.provider.getTransactionReceipt(txHash);
        const currentBlock = await this.provider.getBlockNumber();
        const confirmations = currentBlock - tx.blockNumber + 1;
        
        return {
          status: receipt.status === 1 ? 'confirmed' : 'failed',
          blockNumber: tx.blockNumber,
          confirmations,
          gasUsed: receipt.gasUsed.toString()
        };
      } else {
        return { status: 'pending' };
      }
    } catch (error) {
      logger.error('Error getting transaction status:', error);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Get pending transactions
   * @returns {Array} List of pending transactions
   */
  getPendingTransactions() {
    return Array.from(this.pendingTransactions.values());
  }

  /**
   * Clean up old pending transactions
   * @param {number} maxAge - Maximum age in milliseconds
   */
  cleanupPendingTransactions(maxAge = 3600000) { // 1 hour default
    const now = Date.now();
    
    for (const [hash, tx] of this.pendingTransactions) {
      if (now - tx.timestamp > maxAge) {
        logger.warn(`Removing stale pending transaction: ${hash}`);
        this.pendingTransactions.delete(hash);
      }
    }
  }

  /**
   * Check if an error should not be retried
   * @param {Error} error - The error to check
   * @returns {boolean} True if error should not be retried
   */
  isNonRetryableError(error) {
    const nonRetryableCodes = [
      'INSUFFICIENT_FUNDS',
      'INVALID_ARGUMENT',
      'CALL_EXCEPTION',
      'UNPREDICTABLE_GAS_LIMIT'
    ];
    
    const nonRetryableMessages = [
      'execution reverted',
      'invalid address',
      'invalid signature'
    ];
    
    return nonRetryableCodes.includes(error.code) ||
           nonRetryableMessages.some(msg => error.message.toLowerCase().includes(msg));
  }

  /**
   * Create appropriate AppError from blockchain error
   * @param {Error} error - Original error
   * @returns {AppError} Formatted application error
   */
  createAppError(error) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return new AppError('Insufficient funds for transaction', 400, 'INSUFFICIENT_FUNDS');
    }
    
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      return new AppError('Transaction would fail - check contract conditions', 400, 'TRANSACTION_WOULD_FAIL');
    }
    
    if (error.message.includes('execution reverted')) {
      return new AppError('Smart contract execution failed', 400, 'CONTRACT_EXECUTION_FAILED');
    }
    
    return new AppError('Blockchain transaction failed', 500, 'BLOCKCHAIN_ERROR');
  }

  /**
   * Utility function to delay execution
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = TransactionService;
