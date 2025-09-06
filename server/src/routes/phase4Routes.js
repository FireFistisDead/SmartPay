const express = require('express');
const { body, param, query } = require('express-validator');
const auth = require('../middleware/auth');
const {
  // Contract Operations
  createBatchOperation,
  executeBatchOperation,
  deployUpgradeableContract,
  upgradeContract,
  createMultiSigWallet,
  proposeTransaction,

  // Cross-chain Operations
  initiateTransfer,
  getTransferStatus,
  getSupportedChains,
  estimateTransferFee,

  // AI Recommendations
  getFreelancerRecommendations,
  getJobRecommendations,
  optimizePrice,
  generateInsights,
  trainModel,

  // Enterprise Integration
  registerIntegration,
  generateAPIKey,
  handleAPIRequest,
  getIntegrationStats,
  manageWebhook,

  // Advanced Security
  validateZeroTrust,
  generateSecurityRecommendations,
  validateCompliance,
  createAuditTrail
} = require('../controllers/phase4Controller');

const router = express.Router();

/**
 * Advanced Contract Routes
 */

// Batch Operations
router.post('/contracts/batch', 
  auth,
  [
    body('operations').isArray().withMessage('Operations must be an array'),
    body('operations.*.type').notEmpty().withMessage('Operation type is required'),
    body('operations.*.params').isObject().withMessage('Operation params must be an object')
  ],
  createBatchOperation
);

router.post('/contracts/batch/:batchId/execute',
  auth,
  [
    param('batchId').isAlphanumeric().withMessage('Invalid batch ID')
  ],
  executeBatchOperation
);

// Upgradeable Contracts
router.post('/contracts/upgradeable',
  auth,
  [
    body('contractName').notEmpty().withMessage('Contract name is required'),
    body('initData').optional().isObject(),
    body('proxyAdmin').optional().isEthereumAddress().withMessage('Invalid proxy admin address')
  ],
  deployUpgradeableContract
);

router.post('/contracts/upgrade',
  auth,
  [
    body('proxyAddress').isEthereumAddress().withMessage('Invalid proxy address'),
    body('newImplementation').isEthereumAddress().withMessage('Invalid implementation address')
  ],
  upgradeContract
);

// Multi-signature Wallets
router.post('/contracts/multisig',
  auth,
  [
    body('owners').isArray().withMessage('Owners must be an array'),
    body('owners.*').isEthereumAddress().withMessage('Invalid owner address'),
    body('required').isInt({ min: 1 }).withMessage('Required signatures must be at least 1'),
    body('name').notEmpty().withMessage('Wallet name is required')
  ],
  createMultiSigWallet
);

router.post('/contracts/multisig/propose',
  auth,
  [
    body('walletAddress').isEthereumAddress().withMessage('Invalid wallet address'),
    body('to').isEthereumAddress().withMessage('Invalid recipient address'),
    body('value').isNumeric().withMessage('Invalid value'),
    body('data').optional().isHexadecimal(),
    body('description').notEmpty().withMessage('Description is required')
  ],
  proposeTransaction
);

/**
 * Cross-chain Bridge Routes
 */

router.post('/bridge/transfer',
  auth,
  [
    body('sourceChain').notEmpty().withMessage('Source chain is required'),
    body('targetChain').notEmpty().withMessage('Target chain is required'),
    body('token').isEthereumAddress().withMessage('Invalid token address'),
    body('amount').isNumeric().withMessage('Invalid amount'),
    body('recipient').isEthereumAddress().withMessage('Invalid recipient address')
  ],
  initiateTransfer
);

router.get('/bridge/transfer/:transferId',
  auth,
  [
    param('transferId').isAlphanumeric().withMessage('Invalid transfer ID')
  ],
  getTransferStatus
);

router.get('/bridge/chains', getSupportedChains);

router.get('/bridge/fee',
  [
    query('sourceChain').notEmpty().withMessage('Source chain is required'),
    query('targetChain').notEmpty().withMessage('Target chain is required'),
    query('token').isEthereumAddress().withMessage('Invalid token address'),
    query('amount').isNumeric().withMessage('Invalid amount')
  ],
  estimateTransferFee
);

/**
 * AI Recommendation Routes
 */

router.get('/ai/freelancer-recommendations/:jobId',
  auth,
  [
    param('jobId').isMongoId().withMessage('Invalid job ID'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('filters').optional().isJSON().withMessage('Filters must be valid JSON')
  ],
  getFreelancerRecommendations
);

router.get('/ai/job-recommendations/:freelancerId',
  auth,
  [
    param('freelancerId').isMongoId().withMessage('Invalid freelancer ID'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('filters').optional().isJSON().withMessage('Filters must be valid JSON')
  ],
  getJobRecommendations
);

router.post('/ai/optimize-price',
  auth,
  [
    body('jobData').isObject().withMessage('Job data must be an object'),
    body('jobData.title').notEmpty().withMessage('Job title is required'),
    body('jobData.description').notEmpty().withMessage('Job description is required'),
    body('marketData').optional().isObject()
  ],
  optimizePrice
);

router.get('/ai/insights',
  auth,
  [
    query('type').optional().isIn(['performance', 'market', 'recommendations']).withMessage('Invalid insight type'),
    query('timeframe').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid timeframe')
  ],
  generateInsights
);

router.post('/ai/train-model',
  auth,
  [
    body('modelType').isIn(['recommendation', 'pricing', 'matching']).withMessage('Invalid model type'),
    body('trainingData').isArray().withMessage('Training data must be an array')
  ],
  trainModel
);

/**
 * Enterprise Integration Routes
 */

router.post('/enterprise/integrations',
  auth,
  [
    body('name').notEmpty().withMessage('Integration name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('webhookUrl').optional().isURL().withMessage('Invalid webhook URL'),
    body('scopes').isArray().withMessage('Scopes must be an array')
  ],
  registerIntegration
);

router.post('/enterprise/integrations/:integrationId/api-keys',
  auth,
  [
    param('integrationId').isMongoId().withMessage('Invalid integration ID'),
    body('permissions').isArray().withMessage('Permissions must be an array'),
    body('expiresIn').optional().isInt({ min: 3600 }).withMessage('Expiration must be at least 1 hour')
  ],
  generateAPIKey
);

router.post('/enterprise/api',
  [
    body('operation').notEmpty().withMessage('Operation is required'),
    body('params').isObject().withMessage('Params must be an object')
  ],
  handleAPIRequest
);

router.get('/enterprise/integrations/:integrationId/stats',
  auth,
  [
    param('integrationId').isMongoId().withMessage('Invalid integration ID'),
    query('timeframe').optional().isIn(['1d', '7d', '30d', '90d']).withMessage('Invalid timeframe')
  ],
  getIntegrationStats
);

router.post('/enterprise/integrations/:integrationId/webhooks',
  auth,
  [
    param('integrationId').isMongoId().withMessage('Invalid integration ID'),
    body('action').isIn(['create', 'update', 'delete']).withMessage('Invalid action'),
    body('webhookUrl').optional().isURL().withMessage('Invalid webhook URL'),
    body('events').optional().isArray().withMessage('Events must be an array')
  ],
  manageWebhook
);

/**
 * Advanced Security Routes
 */

router.post('/security/zero-trust/validate',
  auth,
  validateZeroTrust
);

router.get('/security/recommendations',
  auth,
  generateSecurityRecommendations
);

router.post('/security/compliance/validate',
  auth,
  [
    body('operation').notEmpty().withMessage('Operation is required'),
    body('data').isObject().withMessage('Data must be an object')
  ],
  validateCompliance
);

router.post('/security/audit',
  auth,
  [
    body('event').isObject().withMessage('Event must be an object'),
    body('event.type').notEmpty().withMessage('Event type is required'),
    body('event.description').notEmpty().withMessage('Event description is required')
  ],
  createAuditTrail
);

/**
 * Health Check and Status Routes
 */

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Phase 4 services are operational',
    timestamp: new Date().toISOString(),
    services: {
      contracts: 'active',
      crossChain: 'active',
      ai: 'active',
      enterprise: 'active',
      security: 'active'
    }
  });
});

router.get('/status', auth, (req, res) => {
  res.json({
    success: true,
    phase: 4,
    features: [
      'Advanced Smart Contracts',
      'Cross-chain Bridge',
      'AI Recommendations',
      'Enterprise Integration',
      'Advanced Security'
    ],
    version: '4.0.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
