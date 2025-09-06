const { validationResult } = require('express-validator');
const AdvancedContractService = require('../services/advancedContractService');
const CrossChainBridgeService = require('../services/crossChainBridgeService');
const AIRecommendationService = require('../services/aiRecommendationService');
const EnterpriseIntegrationService = require('../services/enterpriseIntegrationService');
const AdvancedSecurityServiceV2 = require('../services/advancedSecurityServiceV2');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

/**
 * Phase 4 Controllers - Enterprise-grade functionality
 * Handles advanced smart contracts, cross-chain operations, 
 * AI recommendations, and enterprise integrations
 */
class Phase4ContractsController {
  constructor() {
    this.contractService = new AdvancedContractService();
    this.initialized = false;
  }

  async initialize() {
    await this.contractService.initialize();
    this.initialized = true;
  }

  // Batch Operations
  async createBatchOperation(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { operations, options } = req.body;
      const userId = req.user.address;

      logger.info(`Creating batch operation for user: ${userId}`);

      const result = await this.contractService.createBatchOperation(
        operations,
        { ...options, userId }
      );

      res.status(201).json({
        success: true,
        message: 'Batch operation created successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error creating batch operation:', error);
      next(error);
    }
  }

  async executeBatchOperation(req, res, next) {
    try {
      const { batchId } = req.params;
      const userId = req.user.address;

      const result = await this.contractService.executeBatchOperation(batchId, userId);

      res.json({
        success: true,
        message: 'Batch operation executed successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error executing batch operation:', error);
      next(error);
    }
  }

  // Upgradeable Contracts
  async deployUpgradeableContract(req, res, next) {
    try {
      const { contractName, initData, proxyAdmin } = req.body;
      const userId = req.user.address;

      const result = await this.contractService.deployUpgradeableContract(
        contractName,
        initData,
        proxyAdmin || userId
      );

      res.status(201).json({
        success: true,
        message: 'Upgradeable contract deployed successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error deploying upgradeable contract:', error);
      next(error);
    }
  }

  async upgradeContract(req, res, next) {
    try {
      const { proxyAddress, newImplementation } = req.body;
      const userId = req.user.address;

      const result = await this.contractService.upgradeContract(
        proxyAddress,
        newImplementation,
        userId
      );

      res.json({
        success: true,
        message: 'Contract upgraded successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error upgrading contract:', error);
      next(error);
    }
  }

  // Multi-signature Wallets
  async createMultiSigWallet(req, res, next) {
    try {
      const { owners, required, name } = req.body;
      const userId = req.user.address;

      const result = await this.contractService.createMultiSigWallet(
        owners,
        required,
        name
      );

      res.status(201).json({
        success: true,
        message: 'Multi-signature wallet created successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error creating multi-sig wallet:', error);
      next(error);
    }
  }

  async proposeTransaction(req, res, next) {
    try {
      const { walletAddress, to, value, data, description } = req.body;
      const userId = req.user.address;

      const result = await this.contractService.proposeTransaction(
        walletAddress,
        to,
        value,
        data,
        { proposer: userId, description }
      );

      res.status(201).json({
        success: true,
        message: 'Transaction proposed successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error proposing transaction:', error);
      next(error);
    }
  }
}

class Phase4CrossChainController {
  constructor() {
    this.bridgeService = new CrossChainBridgeService();
    this.initialized = false;
  }

  async initialize() {
    await this.bridgeService.initialize();
    this.initialized = true;
  }

  async initiateTransfer(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sourceChain, targetChain, token, amount, recipient } = req.body;
      const userId = req.user.address;

      logger.info(`Initiating cross-chain transfer for user: ${userId}`);

      const result = await this.bridgeService.initiateTransfer({
        sourceChain,
        targetChain,
        token,
        amount,
        sender: userId,
        recipient
      });

      res.status(201).json({
        success: true,
        message: 'Cross-chain transfer initiated successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error initiating cross-chain transfer:', error);
      next(error);
    }
  }

  async getTransferStatus(req, res, next) {
    try {
      const { transferId } = req.params;

      const status = await this.bridgeService.getTransferStatus(transferId);

      res.json({
        success: true,
        data: status
      });

    } catch (error) {
      logger.error('Error getting transfer status:', error);
      next(error);
    }
  }

  async getSupportedChains(req, res, next) {
    try {
      const chains = await this.bridgeService.getSupportedChains();

      res.json({
        success: true,
        data: chains
      });

    } catch (error) {
      logger.error('Error getting supported chains:', error);
      next(error);
    }
  }

  async estimateTransferFee(req, res, next) {
    try {
      const { sourceChain, targetChain, token, amount } = req.query;

      const fee = await this.bridgeService.estimateTransferFee(
        sourceChain,
        targetChain,
        token,
        amount
      );

      res.json({
        success: true,
        data: fee
      });

    } catch (error) {
      logger.error('Error estimating transfer fee:', error);
      next(error);
    }
  }
}

class Phase4AIController {
  constructor() {
    this.aiService = new AIRecommendationService();
    this.initialized = false;
  }

  async initialize() {
    await this.aiService.initialize();
    this.initialized = true;
  }

  async getFreelancerRecommendations(req, res, next) {
    try {
      const { jobId } = req.params;
      const { limit = 10, filters } = req.query;

      const recommendations = await this.aiService.getFreelancerRecommendations(
        jobId,
        { limit: parseInt(limit), filters }
      );

      res.json({
        success: true,
        data: recommendations
      });

    } catch (error) {
      logger.error('Error getting freelancer recommendations:', error);
      next(error);
    }
  }

  async getJobRecommendations(req, res, next) {
    try {
      const { freelancerId } = req.params;
      const { limit = 10, filters } = req.query;

      const recommendations = await this.aiService.getJobRecommendations(
        freelancerId,
        { limit: parseInt(limit), filters }
      );

      res.json({
        success: true,
        data: recommendations
      });

    } catch (error) {
      logger.error('Error getting job recommendations:', error);
      next(error);
    }
  }

  async optimizePrice(req, res, next) {
    try {
      const { jobData, marketData } = req.body;

      const optimization = await this.aiService.optimizePrice(jobData, marketData);

      res.json({
        success: true,
        data: optimization
      });

    } catch (error) {
      logger.error('Error optimizing price:', error);
      next(error);
    }
  }

  async generateInsights(req, res, next) {
    try {
      const { type, timeframe = '30d' } = req.query;
      const userId = req.user.address;

      const insights = await this.aiService.generateInsights(userId, type, timeframe);

      res.json({
        success: true,
        data: insights
      });

    } catch (error) {
      logger.error('Error generating insights:', error);
      next(error);
    }
  }

  async trainModel(req, res, next) {
    try {
      const { modelType, trainingData } = req.body;
      const userId = req.user.address;

      // Only admin users can trigger model training
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions for model training'
        });
      }

      const result = await this.aiService.trainModel(modelType, trainingData);

      res.json({
        success: true,
        message: 'Model training initiated successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error training model:', error);
      next(error);
    }
  }
}

class Phase4EnterpriseController {
  constructor() {
    this.integrationService = new EnterpriseIntegrationService();
    this.initialized = false;
  }

  async initialize() {
    await this.integrationService.initialize();
    this.initialized = true;
  }

  async registerIntegration(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, webhookUrl, scopes } = req.body;
      const userId = req.user.address;

      const integration = await this.integrationService.registerIntegration({
        name,
        description,
        webhookUrl,
        scopes,
        userId
      });

      res.status(201).json({
        success: true,
        message: 'Integration registered successfully',
        data: integration
      });

    } catch (error) {
      logger.error('Error registering integration:', error);
      next(error);
    }
  }

  async generateAPIKey(req, res, next) {
    try {
      const { integrationId } = req.params;
      const { permissions, expiresIn } = req.body;
      const userId = req.user.address;

      const apiKey = await this.integrationService.generateAPIKey(
        integrationId,
        permissions,
        expiresIn,
        userId
      );

      res.status(201).json({
        success: true,
        message: 'API key generated successfully',
        data: apiKey
      });

    } catch (error) {
      logger.error('Error generating API key:', error);
      next(error);
    }
  }

  async handleAPIRequest(req, res, next) {
    try {
      const { operation, params } = req.body;
      const apiKey = req.headers['x-api-key'];

      const result = await this.integrationService.handleAPIRequest(
        operation,
        params,
        apiKey
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error handling API request:', error);
      next(error);
    }
  }

  async getIntegrationStats(req, res, next) {
    try {
      const { integrationId } = req.params;
      const { timeframe = '7d' } = req.query;
      const userId = req.user.address;

      const stats = await this.integrationService.getIntegrationStats(
        integrationId,
        timeframe,
        userId
      );

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error getting integration stats:', error);
      next(error);
    }
  }

  async manageWebhook(req, res, next) {
    try {
      const { integrationId } = req.params;
      const { action, webhookUrl, events } = req.body;
      const userId = req.user.address;

      const result = await this.integrationService.manageWebhook(
        integrationId,
        action,
        { webhookUrl, events },
        userId
      );

      res.json({
        success: true,
        message: `Webhook ${action} completed successfully`,
        data: result
      });

    } catch (error) {
      logger.error('Error managing webhook:', error);
      next(error);
    }
  }
}

class Phase4SecurityController {
  constructor() {
    this.securityService = new AdvancedSecurityServiceV2();
    this.initialized = false;
  }

  async initialize() {
    await this.securityService.initialize();
    this.initialized = true;
  }

  async validateZeroTrust(req, res, next) {
    try {
      const userId = req.user.address;
      const requestContext = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        deviceFingerprint: req.headers['x-device-fingerprint'],
        timestamp: new Date().toISOString()
      };

      const validation = await this.securityService.validateZeroTrust(
        req.user,
        requestContext
      );

      res.json({
        success: true,
        data: validation
      });

    } catch (error) {
      logger.error('Error in zero-trust validation:', error);
      next(error);
    }
  }

  async generateSecurityRecommendations(req, res, next) {
    try {
      const userId = req.user.address;

      const recommendations = await this.securityService.generateSecurityRecommendations(userId);

      res.json({
        success: true,
        data: recommendations
      });

    } catch (error) {
      logger.error('Error generating security recommendations:', error);
      next(error);
    }
  }

  async validateCompliance(req, res, next) {
    try {
      const { operation, data } = req.body;

      const validation = await this.securityService.validateCompliance(operation, data);

      res.json({
        success: true,
        data: validation
      });

    } catch (error) {
      logger.error('Error validating compliance:', error);
      next(error);
    }
  }

  async createAuditTrail(req, res, next) {
    try {
      const { event } = req.body;
      const userId = req.user.address;

      const auditId = await this.securityService.createAuditTrail({
        ...event,
        userId,
        timestamp: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Audit trail created successfully',
        data: { auditId }
      });

    } catch (error) {
      logger.error('Error creating audit trail:', error);
      next(error);
    }
  }
}

// Initialize controllers
const contractsController = new Phase4ContractsController();
const crossChainController = new Phase4CrossChainController();
const aiController = new Phase4AIController();
const enterpriseController = new Phase4EnterpriseController();
const securityController = new Phase4SecurityController();

// Initialize all controllers
Promise.all([
  contractsController.initialize(),
  crossChainController.initialize(),
  aiController.initialize(),
  enterpriseController.initialize(),
  securityController.initialize()
]).then(() => {
  logger.info('All Phase 4 controllers initialized successfully');
}).catch(error => {
  logger.error('Error initializing Phase 4 controllers:', error);
});

module.exports = {
  // Contract Operations
  createBatchOperation: contractsController.createBatchOperation.bind(contractsController),
  executeBatchOperation: contractsController.executeBatchOperation.bind(contractsController),
  deployUpgradeableContract: contractsController.deployUpgradeableContract.bind(contractsController),
  upgradeContract: contractsController.upgradeContract.bind(contractsController),
  createMultiSigWallet: contractsController.createMultiSigWallet.bind(contractsController),
  proposeTransaction: contractsController.proposeTransaction.bind(contractsController),

  // Cross-chain Operations
  initiateTransfer: crossChainController.initiateTransfer.bind(crossChainController),
  getTransferStatus: crossChainController.getTransferStatus.bind(crossChainController),
  getSupportedChains: crossChainController.getSupportedChains.bind(crossChainController),
  estimateTransferFee: crossChainController.estimateTransferFee.bind(crossChainController),

  // AI Recommendations
  getFreelancerRecommendations: aiController.getFreelancerRecommendations.bind(aiController),
  getJobRecommendations: aiController.getJobRecommendations.bind(aiController),
  optimizePrice: aiController.optimizePrice.bind(aiController),
  generateInsights: aiController.generateInsights.bind(aiController),
  trainModel: aiController.trainModel.bind(aiController),

  // Enterprise Integration
  registerIntegration: enterpriseController.registerIntegration.bind(enterpriseController),
  generateAPIKey: enterpriseController.generateAPIKey.bind(enterpriseController),
  handleAPIRequest: enterpriseController.handleAPIRequest.bind(enterpriseController),
  getIntegrationStats: enterpriseController.getIntegrationStats.bind(enterpriseController),
  manageWebhook: enterpriseController.manageWebhook.bind(enterpriseController),

  // Advanced Security
  validateZeroTrust: securityController.validateZeroTrust.bind(securityController),
  generateSecurityRecommendations: securityController.generateSecurityRecommendations.bind(securityController),
  validateCompliance: securityController.validateCompliance.bind(securityController),
  createAuditTrail: securityController.createAuditTrail.bind(securityController)
};
