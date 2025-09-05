const express = require('express');
const { query } = require('express-validator');
const { authenticate, requireRole } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const analyticsController = require('../controllers/analyticsController');
const validate = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/analytics/platform
 * @desc    Get platform-wide statistics
 * @access  Public
 */
router.get('/platform',
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y', 'all'])
    .withMessage('Invalid period'),
  validate,
  catchAsync(analyticsController.getPlatformStats)
);

/**
 * @route   GET /api/analytics/jobs
 * @desc    Get job analytics
 * @access  Private
 */
router.get('/jobs',
  authenticate,
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y', 'all'])
    .withMessage('Invalid period'),
  query('role')
    .optional()
    .isIn(['client', 'freelancer'])
    .withMessage('Invalid role'),
  validate,
  catchAsync(analyticsController.getJobAnalytics)
);

/**
 * @route   GET /api/analytics/users
 * @desc    Get user analytics
 * @access  Private (Admin only for platform-wide stats)
 */
router.get('/users',
  authenticate,
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y', 'all'])
    .withMessage('Invalid period'),
  query('scope')
    .optional()
    .isIn(['personal', 'platform'])
    .withMessage('Invalid scope'),
  validate,
  catchAsync(analyticsController.getUserAnalytics)
);

/**
 * @route   GET /api/analytics/disputes
 * @desc    Get dispute analytics
 * @access  Private
 */
router.get('/disputes',
  authenticate,
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y', 'all'])
    .withMessage('Invalid period'),
  validate,
  catchAsync(analyticsController.getDisputeAnalytics)
);

/**
 * @route   GET /api/analytics/earnings
 * @desc    Get earnings analytics for freelancers
 * @access  Private (Freelancers)
 */
router.get('/earnings',
  authenticate,
  requireRole('freelancer'),
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y', 'all'])
    .withMessage('Invalid period'),
  validate,
  catchAsync(analyticsController.getEarningsAnalytics)
);

/**
 * @route   GET /api/analytics/spending
 * @desc    Get spending analytics for clients
 * @access  Private (Clients)
 */
router.get('/spending',
  authenticate,
  requireRole('client'),
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y', 'all'])
    .withMessage('Invalid period'),
  validate,
  catchAsync(analyticsController.getSpendingAnalytics)
);

/**
 * @route   GET /api/analytics/reputation
 * @desc    Get reputation analytics
 * @access  Private
 */
router.get('/reputation',
  authenticate,
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y', 'all'])
    .withMessage('Invalid period'),
  validate,
  catchAsync(analyticsController.getReputationAnalytics)
);

/**
 * @route   GET /api/analytics/market-trends
 * @desc    Get market trends and insights
 * @access  Public
 */
router.get('/market-trends',
  query('category')
    .optional()
    .isIn(['skills', 'budgets', 'completion-rates', 'satisfaction'])
    .withMessage('Invalid category'),
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Invalid period'),
  validate,
  catchAsync(analyticsController.getMarketTrends)
);

/**
 * @route   GET /api/analytics/reports/summary
 * @desc    Get summary report for dashboards
 * @access  Private
 */
router.get('/reports/summary',
  authenticate,
  catchAsync(analyticsController.getSummaryReport)
);

/**
 * @route   GET /api/analytics/performance
 * @desc    Get performance metrics
 * @access  Private
 */
router.get('/performance',
  authenticate,
  query('metric')
    .optional()
    .isIn(['completion-time', 'quality-score', 'client-satisfaction', 'repeat-clients'])
    .withMessage('Invalid metric'),
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y', 'all'])
    .withMessage('Invalid period'),
  validate,
  catchAsync(analyticsController.getPerformanceMetrics)
);

module.exports = router;
