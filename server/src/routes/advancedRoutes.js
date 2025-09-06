const express = require('express');
const router = express.Router();
const advancedController = require('../controllers/advancedController');
const { authenticate } = require('../middleware/auth');
const RBACService = require('../services/rbacService');

// Initialize RBAC service for middleware
const rbacService = new RBACService();

// Authentication middleware for all routes
router.use(authenticate);

/**
 * Multi-signature Routes
 * @route /api/advanced/multisig
 */
router.post('/multisig/propose', 
  rbacService.requirePermission('multisig:propose'),
  advancedController.proposeMultiSigTransaction
);

router.post('/multisig/:proposalId/sign',
  rbacService.requirePermission('multisig:sign'),
  advancedController.signMultiSigProposal
);

router.post('/multisig/:proposalId/execute',
  rbacService.requirePermission('multisig:execute'),
  advancedController.executeMultiSigProposal
);

router.get('/multisig/:proposalId',
  rbacService.requirePermission('multisig:propose'),
  advancedController.getMultiSigProposal
);

router.get('/multisig',
  rbacService.requirePermission('multisig:propose'),
  advancedController.listMultiSigProposals
);

router.delete('/multisig/:proposalId',
  rbacService.requirePermission('multisig:propose'),
  advancedController.cancelMultiSigProposal
);

/**
 * Automated Payment Routes
 * @route /api/advanced/automation
 */
router.post('/automation/rules',
  rbacService.requirePermission('automation:create'),
  advancedController.createAutomationRule
);

router.get('/automation/jobs/:jobId/status',
  rbacService.requirePermission('automation:read', { allowOwner: true, resourceParam: 'jobId' }),
  advancedController.getAutomationStatus
);

router.post('/automation/schedule',
  rbacService.requirePermission('automation:create'),
  advancedController.schedulePaymentRelease
);

router.post('/automation/check',
  rbacService.requireRole(['admin', 'super_admin']),
  advancedController.checkAutomatedPayments
);

router.post('/automation/execute',
  rbacService.requirePermission('automation:manage'),
  advancedController.executeAutomaticPayment
);

/**
 * Advanced Analytics Routes
 * @route /api/advanced/analytics
 */
router.get('/analytics/platform',
  rbacService.requirePermission('analytics:read'),
  advancedController.getPlatformAnalytics
);

router.post('/analytics/predict/project-success',
  rbacService.requirePermission('analytics:read'),
  advancedController.predictProjectSuccess
);

router.post('/analytics/analyze/payment-risk',
  rbacService.requirePermission('analytics:read'),
  advancedController.analyzePaymentRisk
);

router.get('/analytics/forecast/token-price',
  rbacService.requirePermission('analytics:read'),
  advancedController.forecastTokenPrice
);

router.get('/analytics/users/:userId/behavior',
  rbacService.requirePermission('analytics:read', { allowOwner: true, resourceParam: 'userId' }),
  advancedController.analyzeUserBehavior
);

router.get('/analytics/market-insights',
  rbacService.requirePermission('analytics:read'),
  advancedController.getMarketInsights
);

router.get('/analytics/dashboard/realtime',
  rbacService.requirePermission('analytics:read'),
  advancedController.getRealTimeDashboard
);

/**
 * RBAC Management Routes
 * @route /api/advanced/rbac
 */
router.post('/rbac/users/:userId/roles',
  rbacService.requirePermission('users:manage'),
  advancedController.assignRole
);

router.delete('/rbac/users/:userId/roles',
  rbacService.requirePermission('users:manage'),
  advancedController.removeRole
);

router.post('/rbac/permissions',
  rbacService.requireRole(['super_admin']),
  advancedController.createPermission
);

router.post('/rbac/roles',
  rbacService.requireRole(['super_admin']),
  advancedController.createRole
);

router.get('/rbac/users/:userId/permissions',
  rbacService.requirePermission('users:read', { allowOwner: true, resourceParam: 'userId' }),
  advancedController.getUserPermissions
);

router.get('/rbac/roles',
  rbacService.requirePermission('users:read'),
  advancedController.getAllRoles
);

router.get('/rbac/permissions',
  rbacService.requirePermission('users:read'),
  advancedController.getAllPermissions
);

/**
 * Security Routes
 * @route /api/advanced/security
 */
router.get('/security/report',
  rbacService.requireRole(['admin', 'super_admin']),
  advancedController.getSecurityReport
);

router.post('/security/validate',
  rbacService.requirePermission('users:read'),
  advancedController.validateInput
);

router.post('/security/password/strength',
  advancedController.checkPasswordStrength
);

router.post('/security/encrypt',
  rbacService.requirePermission('system:admin'),
  advancedController.encryptData
);

router.post('/security/decrypt',
  rbacService.requirePermission('system:admin'),
  advancedController.decryptData
);

router.get('/security/token/generate',
  rbacService.requirePermission('system:admin'),
  advancedController.generateSecureToken
);

/**
 * Health Check for Advanced Features
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        multiSig: 'operational',
        automation: 'operational',
        analytics: 'operational',
        rbac: 'operational',
        security: 'operational'
      }
    };

    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

/**
 * Feature Discovery Endpoint
 */
router.get('/features', 
  rbacService.requirePermission('users:read'),
  async (req, res) => {
    try {
      const features = {
        multiSignature: {
          enabled: true,
          description: 'Multi-signature transaction support',
          endpoints: [
            'POST /multisig/propose',
            'POST /multisig/:id/sign',
            'POST /multisig/:id/execute',
            'GET /multisig',
            'GET /multisig/:id'
          ]
        },
        automatedPayments: {
          enabled: true,
          description: 'Automated payment processing and scheduling',
          endpoints: [
            'POST /automation/rules',
            'GET /automation/jobs/:id/status',
            'POST /automation/schedule',
            'POST /automation/execute'
          ]
        },
        advancedAnalytics: {
          enabled: true,
          description: 'ML-powered analytics and insights',
          endpoints: [
            'GET /analytics/platform',
            'POST /analytics/predict/project-success',
            'POST /analytics/analyze/payment-risk',
            'GET /analytics/forecast/token-price'
          ]
        },
        rbac: {
          enabled: true,
          description: 'Role-based access control',
          endpoints: [
            'POST /rbac/users/:id/roles',
            'GET /rbac/roles',
            'GET /rbac/permissions'
          ]
        },
        security: {
          enabled: true,
          description: 'Advanced security features',
          endpoints: [
            'GET /security/report',
            'POST /security/validate',
            'POST /security/password/strength'
          ]
        }
      };

      res.status(200).json({
        success: true,
        data: features
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get features',
        error: error.message
      });
    }
  }
);

module.exports = router;
