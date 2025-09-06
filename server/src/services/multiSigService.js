const { ethers } = require('ethers');
const config = require('../config/config');
const logger = require('../utils/logger');
const ContractService = require('./contractService');
const TransactionService = require('./transactionService');
const { AppError } = require('../middleware/errorHandler');
const redisClient = require('../config/redis');

/**
 * Multi-signature Wallet Service - Handles multi-sig transactions and approvals
 */
class MultiSigService {
  constructor() {
    this.provider = null;
    this.contractService = new ContractService();
    this.transactionService = new TransactionService();
    this.initialized = false;
    this.cachePrefix = 'multisig:';
    this.pendingTransactions = new Map();
    
    // Multi-sig contract ABI
    this.multiSigABI = [
      "function submitTransaction(address destination, uint256 value, bytes data) returns (uint256)",
      "function confirmTransaction(uint256 transactionId) returns (bool)",
      "function revokeConfirmation(uint256 transactionId) returns (bool)",
      "function executeTransaction(uint256 transactionId) returns (bool)",
      "function getTransactionCount(bool pending, bool executed) view returns (uint256)",
      "function getTransaction(uint256 transactionId) view returns (address destination, uint256 value, bytes data, bool executed)",
      "function getConfirmations(uint256 transactionId) view returns (address[])",
      "function isConfirmed(uint256 transactionId) view returns (bool)",
      "function required() view returns (uint256)",
      "function owners(uint256) view returns (address)",
      "event Submission(uint256 indexed transactionId)",
      "event Confirmation(address indexed sender, uint256 indexed transactionId)",
      "event Revocation(address indexed sender, uint256 indexed transactionId)",
      "event Execution(uint256 indexed transactionId)"
    ];
  }

  /**
   * Initialize multi-sig service
   */
  async initialize() {
    try {
      const network = config.blockchain.networks[config.blockchain.defaultNetwork];
      this.provider = new ethers.JsonRpcProvider(network.rpcUrl);
      
      // Initialize contract service
      await this.contractService.initialize();
      
      this.initialized = true;
      logger.info('Multi-signature service initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize multi-sig service:', error);
      throw new AppError('Multi-sig service initialization failed', 500, 'MULTISIG_INIT_ERROR');
    }
  }

  /**
   * Create a multi-signature transaction proposal
   */
  async proposeTransaction(proposalData) {
    this._checkInitialized();
    
    try {
      const {
        jobId,
        transactionType, // 'release_payment', 'refund', 'dispute_resolution'
        destination,
        amount,
        data = '0x',
        proposer,
        requiredSignatures = 2,
        description
      } = proposalData;

      const proposalId = this._generateProposalId();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const proposal = {
        id: proposalId,
        jobId,
        transactionType,
        destination,
        amount: amount.toString(),
        data,
        proposer,
        requiredSignatures,
        description,
        signatures: [proposer], // Proposer auto-signs
        status: 'pending',
        createdAt: new Date(),
        expiresAt,
        executionHash: null
      };

      // Store in cache and persistent storage
      await this._storeProposal(proposal);
      
      logger.info('Multi-sig transaction proposed:', {
        proposalId,
        jobId,
        transactionType,
        amount,
        proposer
      });

      return {
        success: true,
        proposalId,
        proposal,
        message: 'Multi-signature transaction proposed successfully'
      };

    } catch (error) {
      logger.error('Error proposing multi-sig transaction:', error);
      throw new AppError('Failed to propose multi-sig transaction', 500, 'MULTISIG_PROPOSAL_ERROR');
    }
  }

  /**
   * Sign a multi-signature transaction proposal
   */
  async signProposal(proposalId, signerAddress, signature) {
    this._checkInitialized();
    
    try {
      const proposal = await this._getProposal(proposalId);
      
      if (!proposal) {
        throw new AppError('Proposal not found', 404, 'PROPOSAL_NOT_FOUND');
      }

      if (proposal.status !== 'pending') {
        throw new AppError('Proposal is not in pending status', 400, 'PROPOSAL_NOT_PENDING');
      }

      if (new Date() > new Date(proposal.expiresAt)) {
        throw new AppError('Proposal has expired', 400, 'PROPOSAL_EXPIRED');
      }

      if (proposal.signatures.includes(signerAddress)) {
        throw new AppError('Address has already signed this proposal', 400, 'ALREADY_SIGNED');
      }

      // Verify signature
      const isValidSignature = await this._verifyProposalSignature(proposal, signerAddress, signature);
      if (!isValidSignature) {
        throw new AppError('Invalid signature', 400, 'INVALID_SIGNATURE');
      }

      // Add signature
      proposal.signatures.push(signerAddress);
      proposal.signatureData = proposal.signatureData || {};
      proposal.signatureData[signerAddress] = {
        signature,
        signedAt: new Date()
      };

      // Check if we have enough signatures
      if (proposal.signatures.length >= proposal.requiredSignatures) {
        proposal.status = 'ready_for_execution';
        proposal.readyAt = new Date();
      }

      await this._updateProposal(proposal);

      logger.info('Proposal signed:', {
        proposalId,
        signer: signerAddress,
        signaturesCount: proposal.signatures.length,
        requiredSignatures: proposal.requiredSignatures,
        status: proposal.status
      });

      return {
        success: true,
        proposal,
        signaturesCount: proposal.signatures.length,
        requiredSignatures: proposal.requiredSignatures,
        readyForExecution: proposal.status === 'ready_for_execution'
      };

    } catch (error) {
      logger.error('Error signing proposal:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to sign proposal', 500, 'MULTISIG_SIGN_ERROR');
    }
  }

  /**
   * Execute a multi-signature transaction
   */
  async executeProposal(proposalId, executorAddress) {
    this._checkInitialized();
    
    try {
      const proposal = await this._getProposal(proposalId);
      
      if (!proposal) {
        throw new AppError('Proposal not found', 404, 'PROPOSAL_NOT_FOUND');
      }

      if (proposal.status !== 'ready_for_execution') {
        throw new AppError('Proposal is not ready for execution', 400, 'PROPOSAL_NOT_READY');
      }

      if (proposal.signatures.length < proposal.requiredSignatures) {
        throw new AppError('Insufficient signatures', 400, 'INSUFFICIENT_SIGNATURES');
      }

      // Execute the transaction based on type
      let executionResult;
      
      switch (proposal.transactionType) {
        case 'release_payment':
          executionResult = await this._executePaymentRelease(proposal);
          break;
        case 'refund':
          executionResult = await this._executeRefund(proposal);
          break;
        case 'dispute_resolution':
          executionResult = await this._executeDisputeResolution(proposal);
          break;
        default:
          throw new AppError('Unknown transaction type', 400, 'UNKNOWN_TRANSACTION_TYPE');
      }

      // Update proposal status
      proposal.status = 'executed';
      proposal.executedAt = new Date();
      proposal.executedBy = executorAddress;
      proposal.executionHash = executionResult.transactionHash;
      proposal.executionResult = executionResult;

      await this._updateProposal(proposal);

      logger.info('Multi-sig proposal executed:', {
        proposalId,
        transactionType: proposal.transactionType,
        executedBy: executorAddress,
        transactionHash: executionResult.transactionHash
      });

      return {
        success: true,
        proposal,
        executionResult,
        message: 'Multi-signature transaction executed successfully'
      };

    } catch (error) {
      logger.error('Error executing proposal:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to execute proposal', 500, 'MULTISIG_EXECUTION_ERROR');
    }
  }

  /**
   * Get proposal details
   */
  async getProposal(proposalId) {
    this._checkInitialized();
    
    try {
      const proposal = await this._getProposal(proposalId);
      
      if (!proposal) {
        throw new AppError('Proposal not found', 404, 'PROPOSAL_NOT_FOUND');
      }

      return proposal;

    } catch (error) {
      logger.error('Error getting proposal:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get proposal', 500, 'MULTISIG_GET_ERROR');
    }
  }

  /**
   * List proposals with filtering
   */
  async listProposals(filters = {}) {
    this._checkInitialized();
    
    try {
      const {
        jobId,
        status,
        proposer,
        transactionType,
        limit = 50,
        offset = 0
      } = filters;

      const cacheKey = `${this.cachePrefix}proposals:${JSON.stringify(filters)}`;
      
      // Try cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get proposals from storage (this would be from database in real implementation)
      const proposals = await this._listProposalsFromStorage(filters);
      
      const result = {
        proposals,
        total: proposals.length,
        limit,
        offset
      };

      // Cache results for 5 minutes
      await redisClient.setex(cacheKey, 300, JSON.stringify(result));
      
      return result;

    } catch (error) {
      logger.error('Error listing proposals:', error);
      throw new AppError('Failed to list proposals', 500, 'MULTISIG_LIST_ERROR');
    }
  }

  /**
   * Cancel a pending proposal
   */
  async cancelProposal(proposalId, cancelerAddress) {
    this._checkInitialized();
    
    try {
      const proposal = await this._getProposal(proposalId);
      
      if (!proposal) {
        throw new AppError('Proposal not found', 404, 'PROPOSAL_NOT_FOUND');
      }

      if (proposal.status !== 'pending') {
        throw new AppError('Only pending proposals can be cancelled', 400, 'PROPOSAL_NOT_PENDING');
      }

      if (proposal.proposer !== cancelerAddress) {
        throw new AppError('Only proposer can cancel the proposal', 403, 'UNAUTHORIZED_CANCELLATION');
      }

      proposal.status = 'cancelled';
      proposal.cancelledAt = new Date();
      proposal.cancelledBy = cancelerAddress;

      await this._updateProposal(proposal);

      logger.info('Proposal cancelled:', {
        proposalId,
        cancelledBy: cancelerAddress
      });

      return {
        success: true,
        proposal,
        message: 'Proposal cancelled successfully'
      };

    } catch (error) {
      logger.error('Error cancelling proposal:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cancel proposal', 500, 'MULTISIG_CANCEL_ERROR');
    }
  }

  /**
   * Private helper methods
   */
  
  _generateProposalId() {
    return `multisig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async _storeProposal(proposal) {
    const key = `${this.cachePrefix}proposal:${proposal.id}`;
    await redisClient.setex(key, 86400, JSON.stringify(proposal)); // 24 hours
    
    // Also store in database (in real implementation)
    // await ProposalModel.create(proposal);
  }

  async _getProposal(proposalId) {
    const key = `${this.cachePrefix}proposal:${proposalId}`;
    const cached = await redisClient.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Search in active proposals
    for (const proposal of this.activeProposals.values()) {
      if (proposal.id === proposalId) {
        // Cache it for faster access
        await redisClient.setex(key, 86400, JSON.stringify(proposal));
        return proposal;
      }
    }
    
    return null;
  }

  async _updateProposal(proposal) {
    const key = `${this.cachePrefix}proposal:${proposal.id}`;
    await redisClient.setex(key, 86400, JSON.stringify(proposal));
    
    // Update in memory storage
    this.activeProposals.set(proposal.id, proposal);
    
    // Emit update event
    if (global.webSocketService) {
      global.webSocketService.broadcastToRoom('multisig', 'proposal_updated', {
        proposalId: proposal.id,
        status: proposal.status,
        signaturesCount: proposal.signatures.length,
        requiredSignatures: proposal.requiredSignatures
      });
    }
  }

  async _listProposalsFromStorage(filters = {}) {
    try {
      const allProposals = Array.from(this.activeProposals.values());
      
      let filteredProposals = allProposals;
      
      // Apply filters
      if (filters.status) {
        filteredProposals = filteredProposals.filter(p => p.status === filters.status);
      }
      
      if (filters.proposer) {
        filteredProposals = filteredProposals.filter(p => p.proposer.toLowerCase() === filters.proposer.toLowerCase());
      }
      
      if (filters.destination) {
        filteredProposals = filteredProposals.filter(p => p.destination.toLowerCase() === filters.destination.toLowerCase());
      }
      
      if (filters.minAmount) {
        filteredProposals = filteredProposals.filter(p => parseFloat(p.amount) >= parseFloat(filters.minAmount));
      }
      
      if (filters.maxAmount) {
        filteredProposals = filteredProposals.filter(p => parseFloat(p.amount) <= parseFloat(filters.maxAmount));
      }
      
      // Sort by creation date (newest first)
      filteredProposals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return filteredProposals;
    } catch (error) {
      logger.error('Error listing proposals from storage:', error);
      return [];
    }
  }

  async _verifyProposalSignature(proposal, signerAddress, signature) {
    try {
      // Create message hash for the proposal
      const messageHash = ethers.solidityPackedKeccak256(
        ['string', 'string', 'address', 'uint256', 'bytes'],
        [proposal.id, proposal.transactionType, proposal.destination, proposal.amount, proposal.data]
      );

      // Recover signer address from signature
      const recoveredAddress = ethers.verifyMessage(ethers.getBytes(messageHash), signature);
      
      return recoveredAddress.toLowerCase() === signerAddress.toLowerCase();

    } catch (error) {
      logger.error('Error verifying signature:', error);
      return false;
    }
  }

  async _executePaymentRelease(proposal) {
    return await this.contractService.releaseFunds(
      proposal.jobId,
      proposal.destination,
      proposal.amount
    );
  }

  async _executeRefund(proposal) {
    return await this.contractService.releaseFunds(
      proposal.jobId,
      proposal.destination,
      proposal.amount
    );
  }

  async _executeDisputeResolution(proposal) {
    // Custom dispute resolution logic
    return await this.contractService.releaseFunds(
      proposal.jobId,
      proposal.destination,
      proposal.amount
    );
  }

  _checkInitialized() {
    if (!this.initialized) {
      throw new AppError('Multi-sig service not initialized', 500, 'MULTISIG_NOT_INITIALIZED');
    }
  }
}

module.exports = MultiSigService;
