const { ethers } = require('ethers');
const config = require('../config/config');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

/**
 * ContractService - Core service for interacting with the AutomatedMilestoneEscrow smart contract
 * Handles all blockchain write operations (transactions)
 */
class ContractService {
  constructor() {
    // Singleton pattern to prevent duplicates
    if (ContractService.instance) {
      return ContractService.instance;
    }
    
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.contractWithSigner = null;
    this.initialized = false;
    
    ContractService.instance = this;
    
    // Contract ABI - Only the methods we need to call
    this.contractABI = [
      // Write methods (transactions)
      "function createJob(address freelancer, address arbiter, uint256 totalAmount, string memory ipfsHash, uint256[] memory milestoneAmounts, uint256[] memory milestoneDueDates) external returns (uint256)",
      "function acceptJob(uint256 jobId) external",
      "function submitMilestone(uint256 jobId, uint256 milestoneIndex, string memory deliverableHash) external",
      "function approveMilestone(uint256 jobId, uint256 milestoneIndex) external",
      "function raiseDispute(uint256 jobId, string memory reason) external",
      "function resolveDispute(uint256 jobId, address winner) external",
      "function cancelJob(uint256 jobId, string memory reason) external",
      
      // Read methods
      "function getJob(uint256 jobId) external view returns (tuple(uint256 id, address client, address freelancer, address arbiter, uint256 totalAmount, string ipfsHash, uint8 status, uint256 createdAt))",
      "function getMilestone(uint256 jobId, uint256 milestoneIndex) external view returns (tuple(uint256 amount, uint256 dueDate, uint8 status, string deliverableHash, uint256 submittedAt, uint256 approvedAt))",
      "function jobCounter() external view returns (uint256)",
      
      // Events (for reference)
      "event JobCreated(uint256 indexed jobId, address indexed client, address indexed arbiter, uint256 totalAmount, string ipfsHash)",
      "event JobAccepted(uint256 indexed jobId, address indexed freelancer)",
      "event MilestoneSubmitted(uint256 indexed jobId, uint256 milestoneIndex, address indexed freelancer, string deliverableHash)",
      "event MilestoneApproved(uint256 indexed jobId, uint256 milestoneIndex, address indexed client, uint256 amount)",
      "event JobCompleted(uint256 indexed jobId, address indexed freelancer, uint256 totalAmount)",
      "event DisputeRaised(uint256 indexed jobId, address indexed raiser, string reason)",
      "event DisputeResolved(uint256 indexed jobId, address indexed arbiter, address winner, uint256 amount)",
      "event JobCancelled(uint256 indexed jobId, address indexed client, string reason)"
    ];
  }

  /**
   * Initialize the contract service with provider, wallet, and contract instances
   */
  async initialize() {
    try {
      if (this.initialized) {
        // Silent return to prevent duplicate logs
        return;
      }

      const network = config.blockchain.networks[config.blockchain.defaultNetwork];
      
      // Validate required configuration
      if (!config.blockchain.privateKey) {
        throw new Error('PRIVATE_KEY not configured');
      }
      
      if (!config.blockchain.contractAddress) {
        throw new Error('CONTRACT_ADDRESS not configured');
      }

      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(network.rpcUrl);
      
      // Test connection
      const networkInfo = await this.provider.getNetwork();
      logger.info(`Connected to ${network.name} (Chain ID: ${networkInfo.chainId})`);
      
      // Initialize wallet
      this.wallet = new ethers.Wallet(config.blockchain.privateKey, this.provider);
      logger.info(`Wallet initialized: ${this.wallet.address}`);
      
      // Check wallet balance
      const balance = await this.provider.getBalance(this.wallet.address);
      const balanceInEth = ethers.formatEther(balance);
      logger.info(`Wallet balance: ${balanceInEth} ETH`);
      
      if (parseFloat(balanceInEth) < 0.01) {
        logger.warn('Low wallet balance! Transactions may fail due to insufficient gas.');
        logger.warn('Consider adding more ETH to wallet:', this.wallet.address);
      }
      
      // Initialize contract instances
      this.contract = new ethers.Contract(
        config.blockchain.contractAddress,
        this.contractABI,
        this.provider
      );
      
      this.contractWithSigner = this.contract.connect(this.wallet);
      
      // Test contract connection (non-blocking)
      try {
        await this.testContractConnection();
        logger.info('Contract connection test passed');
      } catch (contractError) {
        logger.warn('Contract connection test failed, but continuing with limited functionality:', contractError.message);
        // Don't throw error, just warn and continue
      }
      
      this.initialized = true;
      logger.info('ContractService initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize ContractService:', error);
      // Instead of throwing, mark as not initialized but don't crash
      this.initialized = false;
      logger.warn('ContractService running in fallback mode without blockchain connectivity');
    }
  }

  /**
   * Test contract connection by calling a read-only method
   */
  async testContractConnection() {
    try {
      const jobCounter = await this.contract.jobCounter();
      logger.info(`Contract connection successful. Total jobs: ${jobCounter}`);
      return true;
    } catch (error) {
      logger.warn('Contract connection test failed:', error.message);
      // Don't throw error, just return false
      return false;
    }
  }

  /**
   * Ensure the service is initialized before any operation
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Create a new job on the blockchain
   * @param {Object} jobData - Job creation data
   * @returns {Object} Transaction result with job ID and transaction hash
   */
  async createJob(jobData) {
    try {
      await this.ensureInitialized();
      
      const {
        freelancerAddress,
        arbiterAddress,
        totalAmount,
        ipfsHash,
        milestoneAmounts,
        milestoneDueDates
      } = jobData;

      // Validate input data
      if (!ethers.isAddress(freelancerAddress)) {
        throw new AppError('Invalid freelancer address', 400, 'INVALID_ADDRESS');
      }
      
      if (!ethers.isAddress(arbiterAddress)) {
        throw new AppError('Invalid arbiter address', 400, 'INVALID_ADDRESS');
      }

      // Convert amounts to Wei (assuming they come in as strings representing token amounts)
      const totalAmountWei = ethers.parseUnits(totalAmount.toString(), 18);
      const milestoneAmountsWei = milestoneAmounts.map(amount => 
        ethers.parseUnits(amount.toString(), 18)
      );

      // Convert due dates to timestamps
      const dueDateTimestamps = milestoneDueDates.map(date => 
        Math.floor(new Date(date).getTime() / 1000)
      );

      logger.info(`Creating job on blockchain:`, {
        freelancer: freelancerAddress,
        arbiter: arbiterAddress,
        totalAmount: totalAmountWei.toString(),
        milestones: milestoneAmountsWei.length,
        ipfsHash
      });

      // Estimate gas
      const gasEstimate = await this.contractWithSigner.createJob.estimateGas(
        freelancerAddress,
        arbiterAddress,
        totalAmountWei,
        ipfsHash,
        milestoneAmountsWei,
        dueDateTimestamps
      );

      // Add 20% buffer to gas estimate
      const gasLimit = gasEstimate * BigInt(120) / BigInt(100);

      // Send transaction
      const tx = await this.contractWithSigner.createJob(
        freelancerAddress,
        arbiterAddress,
        totalAmountWei,
        ipfsHash,
        milestoneAmountsWei,
        dueDateTimestamps,
        { gasLimit }
      );

      logger.info(`Job creation transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait(config.blockchain.networks[config.blockchain.defaultNetwork].blockConfirmations);
      
      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      // Extract job ID from events
      const jobCreatedEvent = receipt.logs.find(log => {
        try {
          const parsedLog = this.contract.interface.parseLog(log);
          return parsedLog.name === 'JobCreated';
        } catch {
          return false;
        }
      });

      let jobId = null;
      if (jobCreatedEvent) {
        const parsedLog = this.contract.interface.parseLog(jobCreatedEvent);
        jobId = parsedLog.args.jobId.toString();
      }

      const result = {
        success: true,
        jobId,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        events: receipt.logs.length
      };

      logger.info('Job created successfully on blockchain:', result);
      return result;

    } catch (error) {
      logger.error('Error creating job on blockchain:', error);
      
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new AppError('Insufficient funds for transaction', 400, 'INSUFFICIENT_FUNDS');
      }
      
      if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        throw new AppError('Transaction would fail - check contract conditions', 400, 'TRANSACTION_WOULD_FAIL');
      }
      
      throw new AppError('Failed to create job on blockchain', 500, 'BLOCKCHAIN_TRANSACTION_ERROR');
    }
  }

  /**
   * Accept a job as a freelancer
   * @param {string} jobId - The job ID
   * @param {string} freelancerAddress - Address of the freelancer accepting the job
   * @returns {Object} Transaction result
   */
  async acceptJob(jobId, freelancerAddress) {
    try {
      await this.ensureInitialized();

      logger.info(`Accepting job ${jobId} by freelancer ${freelancerAddress}`);

      // Estimate gas
      const gasEstimate = await this.contractWithSigner.acceptJob.estimateGas(jobId);
      const gasLimit = gasEstimate * BigInt(120) / BigInt(100);

      // Send transaction
      const tx = await this.contractWithSigner.acceptJob(jobId, { gasLimit });
      logger.info(`Job acceptance transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait(config.blockchain.networks[config.blockchain.defaultNetwork].blockConfirmations);
      
      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      const result = {
        success: true,
        jobId,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

      logger.info('Job accepted successfully on blockchain:', result);
      return result;

    } catch (error) {
      logger.error('Error accepting job on blockchain:', error);
      throw new AppError('Failed to accept job on blockchain', 500, 'BLOCKCHAIN_TRANSACTION_ERROR');
    }
  }

  /**
   * Submit a milestone deliverable
   * @param {string} jobId - The job ID
   * @param {number} milestoneIndex - Index of the milestone
   * @param {string} deliverableHash - IPFS hash of the deliverable
   * @returns {Object} Transaction result
   */
  async submitMilestone(jobId, milestoneIndex, deliverableHash) {
    try {
      await this.ensureInitialized();

      logger.info(`Submitting milestone ${milestoneIndex} for job ${jobId}:`, {
        deliverableHash
      });

      // Estimate gas
      const gasEstimate = await this.contractWithSigner.submitMilestone.estimateGas(
        jobId,
        milestoneIndex,
        deliverableHash
      );
      const gasLimit = gasEstimate * BigInt(120) / BigInt(100);

      // Send transaction
      const tx = await this.contractWithSigner.submitMilestone(
        jobId,
        milestoneIndex,
        deliverableHash,
        { gasLimit }
      );
      
      logger.info(`Milestone submission transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait(config.blockchain.networks[config.blockchain.defaultNetwork].blockConfirmations);
      
      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      const result = {
        success: true,
        jobId,
        milestoneIndex,
        deliverableHash,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

      logger.info('Milestone submitted successfully on blockchain:', result);
      return result;

    } catch (error) {
      logger.error('Error submitting milestone on blockchain:', error);
      throw new AppError('Failed to submit milestone on blockchain', 500, 'BLOCKCHAIN_TRANSACTION_ERROR');
    }
  }

  /**
   * Approve a milestone and release payment
   * @param {string} jobId - The job ID
   * @param {number} milestoneIndex - Index of the milestone to approve
   * @returns {Object} Transaction result
   */
  async approveMilestone(jobId, milestoneIndex) {
    try {
      await this.ensureInitialized();

      logger.info(`Approving milestone ${milestoneIndex} for job ${jobId}`);

      // Estimate gas
      const gasEstimate = await this.contractWithSigner.approveMilestone.estimateGas(
        jobId,
        milestoneIndex
      );
      const gasLimit = gasEstimate * BigInt(120) / BigInt(100);

      // Send transaction
      const tx = await this.contractWithSigner.approveMilestone(
        jobId,
        milestoneIndex,
        { gasLimit }
      );
      
      logger.info(`Milestone approval transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait(config.blockchain.networks[config.blockchain.defaultNetwork].blockConfirmations);
      
      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      const result = {
        success: true,
        jobId,
        milestoneIndex,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

      logger.info('Milestone approved successfully on blockchain:', result);
      return result;

    } catch (error) {
      logger.error('Error approving milestone on blockchain:', error);
      throw new AppError('Failed to approve milestone on blockchain', 500, 'BLOCKCHAIN_TRANSACTION_ERROR');
    }
  }

  /**
   * Raise a dispute for a job
   * @param {string} jobId - The job ID
   * @param {string} reason - Reason for the dispute
   * @returns {Object} Transaction result
   */
  async raiseDispute(jobId, reason) {
    try {
      await this.ensureInitialized();

      logger.info(`Raising dispute for job ${jobId}:`, { reason });

      // Estimate gas
      const gasEstimate = await this.contractWithSigner.raiseDispute.estimateGas(jobId, reason);
      const gasLimit = gasEstimate * BigInt(120) / BigInt(100);

      // Send transaction
      const tx = await this.contractWithSigner.raiseDispute(jobId, reason, { gasLimit });
      logger.info(`Dispute transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait(config.blockchain.networks[config.blockchain.defaultNetwork].blockConfirmations);
      
      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      const result = {
        success: true,
        jobId,
        reason,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

      logger.info('Dispute raised successfully on blockchain:', result);
      return result;

    } catch (error) {
      logger.error('Error raising dispute on blockchain:', error);
      throw new AppError('Failed to raise dispute on blockchain', 500, 'BLOCKCHAIN_TRANSACTION_ERROR');
    }
  }

  /**
   * Cancel a job
   * @param {string} jobId - The job ID
   * @param {string} reason - Reason for cancellation
   * @returns {Object} Transaction result
   */
  async cancelJob(jobId, reason) {
    try {
      await this.ensureInitialized();

      logger.info(`Cancelling job ${jobId}:`, { reason });

      // Estimate gas
      const gasEstimate = await this.contractWithSigner.cancelJob.estimateGas(jobId, reason);
      const gasLimit = gasEstimate * BigInt(120) / BigInt(100);

      // Send transaction
      const tx = await this.contractWithSigner.cancelJob(jobId, reason, { gasLimit });
      logger.info(`Job cancellation transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait(config.blockchain.networks[config.blockchain.defaultNetwork].blockConfirmations);
      
      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      const result = {
        success: true,
        jobId,
        reason,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

      logger.info('Job cancelled successfully on blockchain:', result);
      return result;

    } catch (error) {
      logger.error('Error cancelling job on blockchain:', error);
      throw new AppError('Failed to cancel job on blockchain', 500, 'BLOCKCHAIN_TRANSACTION_ERROR');
    }
  }

  /**
   * Get current gas price
   * @returns {BigInt} Current gas price
   */
  async getCurrentGasPrice() {
    await this.ensureInitialized();
    return await this.provider.getFeeData();
  }

  /**
   * Get wallet balance
   * @returns {string} Balance in ETH
   */
  async getWalletBalance() {
    await this.ensureInitialized();
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  /**
   * Get contract data (read-only)
   * @param {string} jobId - Job ID to fetch
   * @returns {Object} Job data from blockchain
   */
  async getJobData(jobId) {
    try {
      await this.ensureInitialized();
      const jobData = await this.contract.getJob(jobId);
      return {
        id: jobData.id.toString(),
        client: jobData.client,
        freelancer: jobData.freelancer,
        arbiter: jobData.arbiter,
        totalAmount: ethers.formatUnits(jobData.totalAmount, 18),
        ipfsHash: jobData.ipfsHash,
        status: jobData.status,
        createdAt: jobData.createdAt.toString()
      };
    } catch (error) {
      logger.error('Error fetching job data from blockchain:', error);
      throw new AppError('Failed to fetch job data from blockchain', 500, 'BLOCKCHAIN_READ_ERROR');
    }
  }

  /**
   * Fund job escrow with tokens
   * @param {string} jobId - Job ID to fund
   * @param {string} amountWei - Amount in Wei to fund
   * @returns {Object} Transaction result
   */
  async fundJob(jobId, amountWei) {
    try {
      await this.ensureInitialized();

      logger.info(`Funding job ${jobId} with amount: ${amountWei}`);

      // Estimate gas for funding transaction
      const gasEstimate = await this.contractWithSigner.fundJob.estimateGas(jobId, amountWei);
      const gasLimit = gasEstimate * BigInt(120) / BigInt(100);

      // Send transaction
      const tx = await this.contractWithSigner.fundJob(jobId, amountWei, { gasLimit });
      logger.info(`Job funding transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait(config.blockchain.networks[config.blockchain.defaultNetwork].blockConfirmations);
      
      if (receipt.status !== 1) {
        throw new Error('Job funding transaction failed');
      }

      const result = {
        success: true,
        jobId,
        amount: amountWei,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

      logger.info('Job funded successfully on blockchain:', result);
      return result;

    } catch (error) {
      logger.error('Error funding job on blockchain:', error);
      throw new AppError('Failed to fund job on blockchain', 500, 'BLOCKCHAIN_FUNDING_ERROR');
    }
  }

  /**
   * Release escrowed funds
   * @param {string} jobId - Job ID
   * @param {string} to - Recipient address
   * @param {string} amount - Amount to release
   * @returns {Object} Transaction result
   */
  async releaseFunds(jobId, to, amount) {
    try {
      await this.ensureInitialized();

      logger.info(`Releasing funds from job ${jobId} to ${to}, amount: ${amount}`);

      // Convert amount to Wei if it's not already
      const amountWei = typeof amount === 'string' && amount.includes('.') 
        ? ethers.parseUnits(amount, 18) 
        : BigInt(amount);

      // Estimate gas
      const gasEstimate = await this.contractWithSigner.releaseFunds.estimateGas(
        jobId, 
        to, 
        amountWei
      );
      const gasLimit = gasEstimate * BigInt(120) / BigInt(100);

      // Send transaction
      const tx = await this.contractWithSigner.releaseFunds(
        jobId, 
        to, 
        amountWei, 
        { gasLimit }
      );
      
      logger.info(`Funds release transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait(config.blockchain.networks[config.blockchain.defaultNetwork].blockConfirmations);
      
      if (receipt.status !== 1) {
        throw new Error('Funds release transaction failed');
      }

      const result = {
        success: true,
        jobId,
        to,
        amount: amountWei.toString(),
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

      logger.info('Funds released successfully on blockchain:', result);
      return result;

    } catch (error) {
      logger.error('Error releasing funds on blockchain:', error);
      throw new AppError('Failed to release funds on blockchain', 500, 'BLOCKCHAIN_RELEASE_ERROR');
    }
  }

  /**
   * Get escrow balance for a job
   * @param {string} jobId - Job ID
   * @returns {Object} Escrow balance information
   */
  async getEscrowBalance(jobId) {
    try {
      await this.ensureInitialized();

      const balance = await this.contract.getEscrowBalance(jobId);
      
      return {
        jobId,
        balance: ethers.formatUnits(balance, 18),
        balanceWei: balance.toString()
      };

    } catch (error) {
      logger.error('Error getting escrow balance:', error);
      throw new AppError('Failed to get escrow balance', 500, 'BLOCKCHAIN_READ_ERROR');
    }
  }

  /**
   * Get total platform fees collected
   * @returns {Object} Platform fee information
   */
  async getPlatformFees() {
    try {
      await this.ensureInitialized();

      const totalFees = await this.contract.getTotalPlatformFees();
      
      return {
        totalFees: ethers.formatUnits(totalFees, 18),
        totalFeesWei: totalFees.toString()
      };

    } catch (error) {
      logger.error('Error getting platform fees:', error);
      throw new AppError('Failed to get platform fees', 500, 'BLOCKCHAIN_READ_ERROR');
    }
  }

  /**
   * Withdraw platform fees (admin only)
   * @param {string} to - Address to withdraw fees to
   * @returns {Object} Transaction result
   */
  async withdrawPlatformFees(to) {
    try {
      await this.ensureInitialized();

      logger.info(`Withdrawing platform fees to ${to}`);

      // Estimate gas
      const gasEstimate = await this.contractWithSigner.withdrawPlatformFees.estimateGas(to);
      const gasLimit = gasEstimate * BigInt(120) / BigInt(100);

      // Send transaction
      const tx = await this.contractWithSigner.withdrawPlatformFees(to, { gasLimit });
      logger.info(`Platform fee withdrawal transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait(config.blockchain.networks[config.blockchain.defaultNetwork].blockConfirmations);
      
      if (receipt.status !== 1) {
        throw new Error('Platform fee withdrawal failed');
      }

      const result = {
        success: true,
        to,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

      logger.info('Platform fees withdrawn successfully:', result);
      return result;

    } catch (error) {
      logger.error('Error withdrawing platform fees:', error);
      throw new AppError('Failed to withdraw platform fees', 500, 'BLOCKCHAIN_WITHDRAWAL_ERROR');
    }
  }

  /**
   * Update platform fee percentage (admin only)
   * @param {number} feePercentage - New fee percentage (in basis points, e.g., 250 = 2.5%)
   * @returns {Object} Transaction result
   */
  async updatePlatformFee(feePercentage) {
    try {
      await this.ensureInitialized();

      logger.info(`Updating platform fee to ${feePercentage} basis points`);

      // Convert percentage to basis points if needed
      const feeBasisPoints = feePercentage > 100 ? feePercentage : feePercentage * 100;

      // Estimate gas
      const gasEstimate = await this.contractWithSigner.updatePlatformFee.estimateGas(feeBasisPoints);
      const gasLimit = gasEstimate * BigInt(120) / BigInt(100);

      // Send transaction
      const tx = await this.contractWithSigner.updatePlatformFee(feeBasisPoints, { gasLimit });
      logger.info(`Platform fee update transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait(config.blockchain.networks[config.blockchain.defaultNetwork].blockConfirmations);
      
      if (receipt.status !== 1) {
        throw new Error('Platform fee update failed');
      }

      const result = {
        success: true,
        newFeePercentage: feeBasisPoints,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

      logger.info('Platform fee updated successfully:', result);
      return result;

    } catch (error) {
      logger.error('Error updating platform fee:', error);
      throw new AppError('Failed to update platform fee', 500, 'BLOCKCHAIN_UPDATE_ERROR');
    }
  }

  /**
   * Get contract address
   * @returns {string} Contract address
   */
  async getContractAddress() {
    await this.ensureInitialized();
    return await this.contract.getAddress();
  }

  /**
   * Check if address has sufficient token balance for transaction
   * @param {string} address - Address to check
   * @param {string} amount - Amount needed
   * @returns {Object} Balance check result
   */
  async checkSufficientBalance(address, amount) {
    try {
      await this.ensureInitialized();

      // If no token contract is configured, return basic check
      if (!config.blockchain.tokenAddress) {
        logger.warn('Token address not configured - cannot check token balance');
        return {
          address,
          requiredAmount: amount,
          hasBalance: false,
          currentBalance: '0',
          error: 'Token contract not configured'
        };
      }

      // Create token contract instance
      const tokenContract = new ethers.Contract(
        config.blockchain.tokenAddress,
        [
          "function balanceOf(address owner) view returns (uint256)",
          "function decimals() view returns (uint8)"
        ],
        this.provider
      );

      // Get token balance and decimals
      const [balance, decimals] = await Promise.all([
        tokenContract.balanceOf(address),
        tokenContract.decimals()
      ]);

      // Convert amounts for comparison
      const requiredAmountWei = typeof amount === 'string' && amount.includes('.') 
        ? ethers.parseUnits(amount, decimals)
        : BigInt(amount);

      const hasBalance = balance >= requiredAmountWei;
      
      const result = {
        address,
        requiredAmount: amount,
        requiredAmountWei: requiredAmountWei.toString(),
        currentBalance: ethers.formatUnits(balance, decimals),
        currentBalanceWei: balance.toString(),
        hasBalance,
        decimals: Number(decimals),
        tokenAddress: config.blockchain.tokenAddress
      };

      logger.debug('Balance check result:', {
        address,
        requiredAmount: amount,
        currentBalance: result.currentBalance,
        hasBalance
      });

      return result;

    } catch (error) {
      logger.error('Error checking balance:', error);
      
      // Return error details for debugging
      return {
        address,
        requiredAmount: amount,
        hasBalance: false,
        currentBalance: '0',
        error: error.message,
        errorCode: 'BALANCE_CHECK_ERROR'
      };
    }
  }
}

module.exports = ContractService;
