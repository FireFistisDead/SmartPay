const express = require('express');
const router = express.Router();
const advancedController = require('../controllers/advancedController');
const { authenticate } = require('../middleware/auth');

// RBAC service will be available through middleware auth
let rbacService = null;

// Get RBAC service when needed (lazy loading)
function getRBACService() {
  if (!rbacService) {
    try {
      const serviceManager = require('../services/ServiceManager');
      if (serviceManager.hasService('RBACService')) {
        rbacService = serviceManager.getExistingService('RBACService');
      } else {
        // Fallback to singleton
        const RBACService = require('../services/rbacService');
        rbacService = RBACService.getInstance();
      }
    } catch (error) {
      console.warn('Could not get RBAC service:', error.message);
    }
  }
  return rbacService;
}

/**
 * Health Check for Advanced Features (Public endpoint)
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

// Authentication middleware for all other routes
router.use(authenticate);

/**
 * Multi-signature Routes
 * @route /api/advanced/multisig
 */
router.post('/multisig/propose', 
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('multisig:propose')(req, res, next);
    }
    next();
  },
  advancedController.proposeMultiSigTransaction
);

router.post('/multisig/:proposalId/sign',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('multisig:sign')(req, res, next);
    }
    next();
  },
  advancedController.signMultiSigProposal
);

router.post('/multisig/:proposalId/execute',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('multisig:execute')(req, res, next);
    }
    next();
  },
  advancedController.executeMultiSigProposal
);

router.get('/multisig/:proposalId',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('multisig:propose')(req, res, next);
    }
    next();
  },
  advancedController.getMultiSigProposal
);

router.get('/multisig',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('multisig:propose')(req, res, next);
    }
    next();
  },
  advancedController.listMultiSigProposals
);

router.delete('/multisig/:proposalId',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('multisig:propose')(req, res, next);
    }
    next();
  },
  advancedController.cancelMultiSigProposal
);

/**
 * Automated Payment Routes
 * @route /api/advanced/automation
 */
router.post('/automation/rules',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('automation:create')(req, res, next);
    }
    next();
  },
  advancedController.createAutomationRule
);

router.get('/automation/jobs/:jobId/status',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('automation:read', { allowOwner: true, resourceParam: 'jobId' })(req, res, next);
    }
    next();
  },
  advancedController.getAutomationStatus
);

router.post('/automation/schedule',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('automation:create')(req, res, next);
    }
    next();
  },
  advancedController.schedulePaymentRelease
);

router.post('/automation/check',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requireRole) {
      return rbac.requireRole(['admin', 'super_admin'])(req, res, next);
    }
    next();
  },
  advancedController.checkAutomatedPayments
);

router.post('/automation/execute',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('automation:manage')(req, res, next);
    }
    next();
  },
  advancedController.executeAutomaticPayment
);

/**
 * Advanced Analytics Routes
 * @route /api/advanced/analytics
 */
router.get('/analytics/platform',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('analytics:read')(req, res, next);
    }
    next();
  },
  advancedController.getPlatformAnalytics
);

router.post('/analytics/predict/project-success',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('analytics:read')(req, res, next);
    }
    next();
  },
  advancedController.predictProjectSuccess
);

router.post('/analytics/analyze/payment-risk',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('analytics:read')(req, res, next);
    }
    next();
  },
  advancedController.analyzePaymentRisk
);

router.get('/analytics/forecast/token-price',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('analytics:read')(req, res, next);
    }
    next();
  },
  advancedController.forecastTokenPrice
);

router.get('/analytics/users/:userId/behavior',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('analytics:read', { allowOwner: true, resourceParam: 'userId' })(req, res, next);
    }
    next();
  },
  advancedController.analyzeUserBehavior
);

router.get('/analytics/market-insights',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('analytics:read')(req, res, next);
    }
    next();
  },
  advancedController.getMarketInsights
);

router.get('/analytics/dashboard/realtime',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('analytics:read')(req, res, next);
    }
    next();
  },
  advancedController.getRealTimeDashboard
);

/**
 * RBAC Management Routes
 * @route /api/advanced/rbac
 */
router.post('/rbac/users/:userId/roles',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('users:manage')(req, res, next);
    }
    next();
  },
  advancedController.assignRole
);

router.delete('/rbac/users/:userId/roles',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('users:manage')(req, res, next);
    }
    next();
  },
  advancedController.removeRole
);

router.post('/rbac/permissions',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requireRole) {
      return rbac.requireRole(['super_admin'])(req, res, next);
    }
    next();
  },
  advancedController.createPermission
);

router.post('/rbac/roles',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requireRole) {
      return rbac.requireRole(['super_admin'])(req, res, next);
    }
    next();
  },
  advancedController.createRole
);

router.get('/rbac/users/:userId/permissions',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('users:read', { allowOwner: true, resourceParam: 'userId' })(req, res, next);
    }
    next();
  },
  advancedController.getUserPermissions
);

router.get('/rbac/roles',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('users:read')(req, res, next);
    }
    next();
  },
  advancedController.getAllRoles
);

router.get('/rbac/permissions',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('users:read')(req, res, next);
    }
    next();
  },
  advancedController.getAllPermissions
);

/**
 * Security Routes
 * @route /api/advanced/security
 */
router.get('/security/report',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requireRole) {
      return rbac.requireRole(['admin', 'super_admin'])(req, res, next);
    }
    next();
  },
  advancedController.getSecurityReport
);

router.post('/security/validate',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('users:read')(req, res, next);
    }
    next();
  },
  advancedController.validateInput
);

router.post('/security/password/strength',
  advancedController.checkPasswordStrength
);

router.post('/security/encrypt',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('system:admin')(req, res, next);
    }
    next();
  },
  advancedController.encryptData
);

router.post('/security/decrypt',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('system:admin')(req, res, next);
    }
    next();
  },
  advancedController.decryptData
);

router.get('/security/token/generate',
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('system:admin')(req, res, next);
    }
    next();
  },
  advancedController.generateSecureToken
);

/**
 * Feature Discovery Endpoint
 */
router.get('/features', 
  (req, res, next) => {
    const rbac = getRBACService();
    if (rbac && rbac.requirePermission) {
      return rbac.requirePermission('users:read')(req, res, next);
    }
    next();
  },
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
