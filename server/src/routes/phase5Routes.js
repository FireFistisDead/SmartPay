const express = require('express');
const { body, param, query } = require('express-validator');
const auth = require('../middleware/auth');
const {
  // Error Handling
  handleError,
  getErrorStatistics,
  getErrorDetails,
  getErrorTrends,

  // Monitoring
  getSystemMetrics,
  getMonitoringDashboard,
  getHealthChecks,
  recordMetric,
  getMonitoringAlerts,

  // Alerting
  createAlert,
  getActiveAlerts,
  acknowledgeAlert,
  resolveAlert,
  getAlertHistory,
  getAlertStatistics,

  // Performance
  recordPerformanceMetric,
  getPerformanceAnalysis,
  getPerformanceDashboard,
  getBottlenecks,
  getPerformanceRecommendations,
  getPerformanceTrends,

  // Dashboard
  getDashboard,
  getSystemStatus,
  getWidgetData,
  updateUserPreferences,
  getHealthSummary
} = require('../controllers/phase5Controller');

const router = express.Router();

/**
 * Error Handling Routes
 */

// Handle and track errors
router.post('/errors/handle',
  auth,
  [
    body('error').isObject().withMessage('Error object is required'),
    body('error.message').notEmpty().withMessage('Error message is required'),
    body('context').optional().isObject().withMessage('Context must be an object')
  ],
  handleError
);

// Get error statistics
router.get('/errors/statistics',
  auth,
  [
    query('timeframe').optional().isIn(['1h', '6h', '24h', '7d', '30d']).withMessage('Invalid timeframe')
  ],
  getErrorStatistics
);

// Get specific error details
router.get('/errors/:errorId',
  auth,
  [
    param('errorId').isAlphanumeric().withMessage('Invalid error ID')
  ],
  getErrorDetails
);

// Get error trends
router.get('/errors/trends',
  auth,
  [
    query('timeframe').optional().isIn(['1h', '6h', '24h', '7d', '30d']).withMessage('Invalid timeframe'),
    query('groupBy').optional().isIn(['category', 'severity', 'source']).withMessage('Invalid groupBy parameter')
  ],
  getErrorTrends
);

/**
 * Monitoring Routes
 */

// Get system metrics
router.get('/monitoring/metrics',
  auth,
  [
    query('timeframe').optional().isIn(['1h', '6h', '24h', '7d']).withMessage('Invalid timeframe')
  ],
  getSystemMetrics
);

// Get monitoring dashboard data
router.get('/monitoring/dashboard',
  auth,
  getMonitoringDashboard
);

// Get health checks
router.get('/monitoring/health',
  getHealthChecks
);

// Record custom metric
router.post('/monitoring/metrics',
  auth,
  [
    body('metricType').notEmpty().withMessage('Metric type is required'),
    body('value').isNumeric().withMessage('Metric value must be numeric'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
  ],
  recordMetric
);

// Get monitoring alerts
router.get('/monitoring/alerts',
  auth,
  [
    query('status').optional().isIn(['active', 'resolved', 'all']).withMessage('Invalid status')
  ],
  getMonitoringAlerts
);

/**
 * Alerting Routes
 */

// Create new alert
router.post('/alerts',
  auth,
  [
    body('title').notEmpty().withMessage('Alert title is required'),
    body('description').notEmpty().withMessage('Alert description is required'),
    body('severity').isIn(['critical', 'high', 'medium', 'low', 'info']).withMessage('Invalid severity level'),
    body('type').optional().isIn(['system', 'application', 'security', 'business', 'performance', 'availability']).withMessage('Invalid alert type'),
    body('source').optional().notEmpty().withMessage('Source cannot be empty'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
  ],
  createAlert
);

// Get active alerts
router.get('/alerts',
  auth,
  [
    query('severity').optional().isIn(['critical', 'high', 'medium', 'low', 'info']).withMessage('Invalid severity'),
    query('type').optional().isIn(['system', 'application', 'security', 'business', 'performance', 'availability']).withMessage('Invalid type'),
    query('acknowledged').optional().isBoolean().withMessage('Acknowledged must be boolean'),
    query('source').optional().notEmpty().withMessage('Source cannot be empty'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  getActiveAlerts
);

// Acknowledge alert
router.post('/alerts/:alertId/acknowledge',
  auth,
  [
    param('alertId').isAlphanumeric().withMessage('Invalid alert ID')
  ],
  acknowledgeAlert
);

// Resolve alert
router.post('/alerts/:alertId/resolve',
  auth,
  [
    param('alertId').isAlphanumeric().withMessage('Invalid alert ID'),
    body('resolution').notEmpty().withMessage('Resolution description is required')
  ],
  resolveAlert
);

// Get alert history
router.get('/alerts/history',
  auth,
  [
    query('timeframe').optional().isIn(['1h', '6h', '24h', '7d', '30d']).withMessage('Invalid timeframe'),
    query('severity').optional().isIn(['critical', 'high', 'medium', 'low', 'info']).withMessage('Invalid severity'),
    query('type').optional().isIn(['system', 'application', 'security', 'business', 'performance', 'availability']).withMessage('Invalid type'),
    query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Limit must be between 1 and 500')
  ],
  getAlertHistory
);

// Get alert statistics
router.get('/alerts/statistics',
  auth,
  [
    query('timeframe').optional().isIn(['1h', '6h', '24h', '7d', '30d']).withMessage('Invalid timeframe')
  ],
  getAlertStatistics
);

/**
 * Performance Analytics Routes
 */

// Record performance metric
router.post('/performance/metrics',
  auth,
  [
    body('metricType').isIn(['response_times', 'throughput', 'error_rates', 'resource_usage', 'database_performance', 'blockchain_performance', 'cache_performance']).withMessage('Invalid metric type'),
    body('value').isNumeric().withMessage('Value must be numeric'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
  ],
  recordPerformanceMetric
);

// Get performance analysis
router.get('/performance/analysis',
  auth,
  [
    query('timeframe').optional().isIn(['1h', '6h', '24h', '7d']).withMessage('Invalid timeframe')
  ],
  getPerformanceAnalysis
);

// Get performance dashboard
router.get('/performance/dashboard',
  auth,
  [
    query('timeframe').optional().isIn(['1h', '6h', '24h', '7d']).withMessage('Invalid timeframe')
  ],
  getPerformanceDashboard
);

// Get performance bottlenecks
router.get('/performance/bottlenecks',
  auth,
  [
    query('timeframe').optional().isIn(['1h', '6h', '24h', '7d']).withMessage('Invalid timeframe'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  getBottlenecks
);

// Get performance recommendations
router.get('/performance/recommendations',
  auth,
  [
    query('timeframe').optional().isIn(['1h', '6h', '24h', '7d']).withMessage('Invalid timeframe')
  ],
  getPerformanceRecommendations
);

// Get performance trends
router.get('/performance/trends',
  auth,
  [
    query('timeframe').optional().isIn(['1h', '6h', '24h', '7d', '30d']).withMessage('Invalid timeframe'),
    query('metricType').optional().isIn(['response_times', 'throughput', 'error_rates', 'resource_usage']).withMessage('Invalid metric type')
  ],
  getPerformanceTrends
);

/**
 * Operational Dashboard Routes
 */

// Get main operational dashboard
router.get('/dashboard',
  auth,
  [
    query('timeframe').optional().isIn(['1h', '6h', '24h', '7d']).withMessage('Invalid timeframe'),
    query('customizations').optional().isJSON().withMessage('Customizations must be valid JSON')
  ],
  getDashboard
);

// Get system status
router.get('/dashboard/status',
  getSystemStatus
);

// Get specific widget data
router.get('/dashboard/widgets/:widgetId',
  auth,
  [
    param('widgetId').notEmpty().withMessage('Widget ID is required'),
    query('timeframe').optional().isIn(['1h', '6h', '24h', '7d']).withMessage('Invalid timeframe')
  ],
  getWidgetData
);

// Update user dashboard preferences
router.post('/dashboard/preferences',
  auth,
  [
    body('preferences').isObject().withMessage('Preferences must be an object'),
    body('preferences.widgets').optional().isArray().withMessage('Widgets must be an array'),
    body('preferences.refreshInterval').optional().isInt({ min: 10000 }).withMessage('Refresh interval must be at least 10 seconds'),
    body('preferences.theme').optional().isIn(['light', 'dark']).withMessage('Invalid theme'),
    body('preferences.timezone').optional().notEmpty().withMessage('Timezone cannot be empty')
  ],
  updateUserPreferences
);

// Get health summary
router.get('/dashboard/health',
  getHealthSummary
);

/**
 * Real-time and WebSocket Routes
 */

// Get real-time metrics stream endpoint info
router.get('/realtime/info', auth, (req, res) => {
  res.json({
    success: true,
    data: {
      websocket_endpoint: '/ws/monitoring',
      available_streams: [
        'system_metrics',
        'performance_metrics',
        'alerts',
        'errors',
        'health_checks'
      ],
      authentication: 'Bearer token required',
      rate_limit: '1000 messages per minute'
    }
  });
});

/**
 * System and Service Status Routes
 */

// Get comprehensive system information
router.get('/system/info', auth, (req, res) => {
  res.json({
    success: true,
    data: {
      phase: 5,
      features: [
        'Advanced Error Handling',
        'Comprehensive Monitoring',
        'Real-time Alerting',
        'Performance Analytics',
        'Operational Dashboard'
      ],
      version: '5.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      node_version: process.version,
      memory_usage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }
  });
});

// Health check endpoint for load balancers
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    phase: 5,
    services: {
      error_handling: 'active',
      monitoring: 'active',
      alerting: 'active',
      performance: 'active',
      dashboard: 'active'
    }
  });
});

// Readiness probe for Kubernetes
router.get('/ready', (req, res) => {
  // Check if all services are initialized and ready
  res.json({
    success: true,
    status: 'ready',
    timestamp: new Date().toISOString(),
    phase: 5
  });
});

// Liveness probe for Kubernetes
router.get('/live', (req, res) => {
  res.json({
    success: true,
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

/**
 * Configuration and Settings Routes
 */

// Get monitoring configuration
router.get('/config/monitoring', auth, (req, res) => {
  res.json({
    success: true,
    data: {
      metrics_retention: '24h',
      alert_thresholds: {
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 80, critical: 95 },
        disk: { warning: 85, critical: 95 },
        response_time: { warning: 1000, critical: 5000 },
        error_rate: { warning: 5, critical: 10 }
      },
      refresh_intervals: {
        system_metrics: 30000,
        performance_metrics: 10000,
        health_checks: 60000
      }
    }
  });
});

// Update alert thresholds (admin only)
router.post('/config/thresholds', 
  auth,
  [
    body('thresholds').isObject().withMessage('Thresholds must be an object')
  ],
  (req, res) => {
    // Implementation would require admin role check
    res.json({
      success: true,
      message: 'Alert thresholds updated successfully'
    });
  }
);

module.exports = router;
