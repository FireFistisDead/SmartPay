const { validationResult } = require('express-validator');
const AdvancedErrorHandlingService = require('../services/advancedErrorHandlingService');
const ComprehensiveMonitoringService = require('../services/comprehensiveMonitoringService');
const RealTimeAlertingService = require('../services/realTimeAlertingService');
const PerformanceAnalyticsService = require('../services/performanceAnalyticsService');
const OperationalDashboardService = require('../services/operationalDashboardService');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

/**
 * Phase 5 Controllers - Error Handling & Monitoring
 * Provides comprehensive error tracking, monitoring, alerting, and operational dashboard
 */
class Phase5ErrorHandlingController {
  constructor() {
    this.errorService = new AdvancedErrorHandlingService();
    this.initialized = false;
  }

  async initialize() {
    await this.errorService.initialize();
    this.initialized = true;
  }

  async handleError(req, res, next) {
    try {
      const { error, context } = req.body;
      const userId = req.user?.address;

      const result = await this.errorService.handleError(error, {
        ...context,
        userId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.headers['x-request-id']
      });

      res.status(201).json({
        success: true,
        message: 'Error handled successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error in error handling controller:', error);
      next(error);
    }
  }

  async getErrorStatistics(req, res, next) {
    try {
      const { timeframe = '24h' } = req.query;

      const statistics = await this.errorService.getErrorStatistics(timeframe);

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      logger.error('Error getting error statistics:', error);
      next(error);
    }
  }

  async getErrorDetails(req, res, next) {
    try {
      const { errorId } = req.params;

      const errorDetails = await this.errorService.getErrorDetails(errorId);

      if (!errorDetails) {
        return res.status(404).json({
          success: false,
          message: 'Error not found'
        });
      }

      res.json({
        success: true,
        data: errorDetails
      });

    } catch (error) {
      logger.error('Error getting error details:', error);
      next(error);
    }
  }

  async getErrorTrends(req, res, next) {
    try {
      const { timeframe = '7d', groupBy = 'category' } = req.query;

      const trends = await this.errorService.getErrorTrends(timeframe, groupBy);

      res.json({
        success: true,
        data: trends
      });

    } catch (error) {
      logger.error('Error getting error trends:', error);
      next(error);
    }
  }
}

class Phase5MonitoringController {
  constructor() {
    this.monitoringService = new ComprehensiveMonitoringService();
    this.initialized = false;
  }

  async initialize() {
    await this.monitoringService.initialize();
    this.initialized = true;
  }

  async getSystemMetrics(req, res, next) {
    try {
      const { timeframe = '1h' } = req.query;

      const metrics = await this.monitoringService.getSystemMetrics(timeframe);

      res.json({
        success: true,
        data: metrics
      });

    } catch (error) {
      logger.error('Error getting system metrics:', error);
      next(error);
    }
  }

  async getDashboardData(req, res, next) {
    try {
      const dashboardData = await this.monitoringService.getDashboardData();

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      next(error);
    }
  }

  async getHealthChecks(req, res, next) {
    try {
      const healthChecks = await this.monitoringService.runHealthChecks();

      res.json({
        success: true,
        data: healthChecks
      });

    } catch (error) {
      logger.error('Error getting health checks:', error);
      next(error);
    }
  }

  async recordMetric(req, res, next) {
    try {
      const { metricType, value, metadata } = req.body;

      await this.monitoringService.recordMetric(metricType, value, metadata);

      res.status(201).json({
        success: true,
        message: 'Metric recorded successfully'
      });

    } catch (error) {
      logger.error('Error recording metric:', error);
      next(error);
    }
  }

  async getAlerts(req, res, next) {
    try {
      const { status = 'active' } = req.query;

      const alerts = await this.monitoringService.getAlerts(status);

      res.json({
        success: true,
        data: alerts
      });

    } catch (error) {
      logger.error('Error getting alerts:', error);
      next(error);
    }
  }
}

class Phase5AlertingController {
  constructor() {
    this.alertingService = new RealTimeAlertingService();
    this.initialized = false;
  }

  async initialize() {
    await this.alertingService.initialize();
    this.initialized = true;
  }

  async createAlert(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const alertData = req.body;
      const userId = req.user?.address;

      const result = await this.alertingService.createAlert({
        ...alertData,
        source: alertData.source || 'api',
        metadata: {
          ...alertData.metadata,
          createdBy: userId,
          apiEndpoint: req.originalUrl
        }
      });

      res.status(201).json({
        success: true,
        message: 'Alert created successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error creating alert:', error);
      next(error);
    }
  }

  async getActiveAlerts(req, res, next) {
    try {
      const { 
        severity, 
        type, 
        acknowledged, 
        source,
        limit = 50,
        offset = 0 
      } = req.query;

      const filters = {};
      if (severity) filters.severity = severity;
      if (type) filters.type = type;
      if (acknowledged !== undefined) filters.acknowledged = acknowledged === 'true';
      if (source) filters.source = source;

      const alerts = await this.alertingService.getActiveAlerts(filters);

      // Apply pagination
      const startIndex = parseInt(offset);
      const endIndex = startIndex + parseInt(limit);
      const paginatedAlerts = alerts.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          alerts: paginatedAlerts,
          total: alerts.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      logger.error('Error getting active alerts:', error);
      next(error);
    }
  }

  async acknowledgeAlert(req, res, next) {
    try {
      const { alertId } = req.params;
      const userId = req.user?.address;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const result = await this.alertingService.acknowledgeAlert(alertId, userId);

      res.json({
        success: true,
        message: 'Alert acknowledged successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      next(error);
    }
  }

  async resolveAlert(req, res, next) {
    try {
      const { alertId } = req.params;
      const { resolution } = req.body;
      const userId = req.user?.address;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const result = await this.alertingService.resolveAlert(alertId, userId, resolution);

      res.json({
        success: true,
        message: 'Alert resolved successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error resolving alert:', error);
      next(error);
    }
  }

  async getAlertHistory(req, res, next) {
    try {
      const { 
        timeframe = '7d',
        severity,
        type,
        limit = 100
      } = req.query;

      const history = await this.alertingService.getAlertHistory({
        timeframe,
        severity,
        type,
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: history
      });

    } catch (error) {
      logger.error('Error getting alert history:', error);
      next(error);
    }
  }

  async getAlertStatistics(req, res, next) {
    try {
      const { timeframe = '24h' } = req.query;

      const statistics = await this.alertingService.getAlertStatistics(timeframe);

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      logger.error('Error getting alert statistics:', error);
      next(error);
    }
  }
}

class Phase5PerformanceController {
  constructor() {
    this.performanceService = new PerformanceAnalyticsService();
    this.initialized = false;
  }

  async initialize() {
    await this.performanceService.initialize();
    this.initialized = true;
  }

  async recordPerformanceMetric(req, res, next) {
    try {
      const { metricType, value, metadata } = req.body;

      await this.performanceService.recordMetric(metricType, value, metadata);

      res.status(201).json({
        success: true,
        message: 'Performance metric recorded successfully'
      });

    } catch (error) {
      logger.error('Error recording performance metric:', error);
      next(error);
    }
  }

  async getPerformanceAnalysis(req, res, next) {
    try {
      const { timeframe = '1h' } = req.query;

      const analysis = await this.performanceService.performAnalysis(timeframe);

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      logger.error('Error getting performance analysis:', error);
      next(error);
    }
  }

  async getDashboardData(req, res, next) {
    try {
      const { timeframe = '1h' } = req.query;

      const dashboardData = await this.performanceService.getDashboardData(timeframe);

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      logger.error('Error getting performance dashboard data:', error);
      next(error);
    }
  }

  async getBottlenecks(req, res, next) {
    try {
      const { timeframe = '1h', limit = 10 } = req.query;

      const bottlenecks = await this.performanceService.detectBottlenecks(timeframe);

      res.json({
        success: true,
        data: bottlenecks.slice(0, parseInt(limit))
      });

    } catch (error) {
      logger.error('Error getting performance bottlenecks:', error);
      next(error);
    }
  }

  async getRecommendations(req, res, next) {
    try {
      const { timeframe = '1h' } = req.query;

      const recommendations = await this.performanceService.generateRecommendations(timeframe);

      res.json({
        success: true,
        data: recommendations
      });

    } catch (error) {
      logger.error('Error getting performance recommendations:', error);
      next(error);
    }
  }

  async getTrends(req, res, next) {
    try {
      const { timeframe = '24h', metricType } = req.query;

      const trends = await this.performanceService.analyzeTrends(timeframe, metricType);

      res.json({
        success: true,
        data: trends
      });

    } catch (error) {
      logger.error('Error getting performance trends:', error);
      next(error);
    }
  }
}

class Phase5DashboardController {
  constructor() {
    this.dashboardService = new OperationalDashboardService();
    this.initialized = false;
  }

  async initialize() {
    await this.dashboardService.initialize();
    this.initialized = true;
  }

  async getDashboard(req, res, next) {
    try {
      const { timeframe = '1h', customizations } = req.query;
      const userId = req.user?.address || 'anonymous';

      let parsedCustomizations = {};
      if (customizations) {
        try {
          parsedCustomizations = JSON.parse(customizations);
        } catch (error) {
          logger.warn('Invalid customizations JSON:', error);
        }
      }

      const dashboardData = await this.dashboardService.getDashboardData(
        userId, 
        timeframe, 
        parsedCustomizations
      );

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      logger.error('Error getting dashboard:', error);
      next(error);
    }
  }

  async getSystemStatus(req, res, next) {
    try {
      const systemStatus = await this.dashboardService.getSystemStatus();

      res.json({
        success: true,
        data: systemStatus
      });

    } catch (error) {
      logger.error('Error getting system status:', error);
      next(error);
    }
  }

  async getWidgetData(req, res, next) {
    try {
      const { widgetId } = req.params;
      const { timeframe = '1h' } = req.query;

      const widgetData = await this.dashboardService.getWidgetData(widgetId, timeframe);

      res.json({
        success: true,
        data: widgetData
      });

    } catch (error) {
      logger.error('Error getting widget data:', error);
      next(error);
    }
  }

  async updateUserPreferences(req, res, next) {
    try {
      const userId = req.user?.address;
      const { preferences } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      await this.dashboardService.updateUserPreferences(userId, preferences);

      res.json({
        success: true,
        message: 'User preferences updated successfully'
      });

    } catch (error) {
      logger.error('Error updating user preferences:', error);
      next(error);
    }
  }

  async getHealthSummary(req, res, next) {
    try {
      const healthSummary = await this.dashboardService.getHealthCheckSummary();

      res.json({
        success: true,
        data: healthSummary
      });

    } catch (error) {
      logger.error('Error getting health summary:', error);
      next(error);
    }
  }
}

// Initialize controllers
const errorController = new Phase5ErrorHandlingController();
const monitoringController = new Phase5MonitoringController();
const alertingController = new Phase5AlertingController();
const performanceController = new Phase5PerformanceController();
const dashboardController = new Phase5DashboardController();

// Initialize all controllers
Promise.all([
  errorController.initialize(),
  monitoringController.initialize(),
  alertingController.initialize(),
  performanceController.initialize(),
  dashboardController.initialize()
]).then(() => {
  logger.info('All Phase 5 controllers initialized successfully');
}).catch(error => {
  logger.error('Error initializing Phase 5 controllers:', error);
});

module.exports = {
  // Error Handling
  handleError: errorController.handleError.bind(errorController),
  getErrorStatistics: errorController.getErrorStatistics.bind(errorController),
  getErrorDetails: errorController.getErrorDetails.bind(errorController),
  getErrorTrends: errorController.getErrorTrends.bind(errorController),

  // Monitoring
  getSystemMetrics: monitoringController.getSystemMetrics.bind(monitoringController),
  getMonitoringDashboard: monitoringController.getDashboardData.bind(monitoringController),
  getHealthChecks: monitoringController.getHealthChecks.bind(monitoringController),
  recordMetric: monitoringController.recordMetric.bind(monitoringController),
  getMonitoringAlerts: monitoringController.getAlerts.bind(monitoringController),

  // Alerting
  createAlert: alertingController.createAlert.bind(alertingController),
  getActiveAlerts: alertingController.getActiveAlerts.bind(alertingController),
  acknowledgeAlert: alertingController.acknowledgeAlert.bind(alertingController),
  resolveAlert: alertingController.resolveAlert.bind(alertingController),
  getAlertHistory: alertingController.getAlertHistory.bind(alertingController),
  getAlertStatistics: alertingController.getAlertStatistics.bind(alertingController),

  // Performance
  recordPerformanceMetric: performanceController.recordPerformanceMetric.bind(performanceController),
  getPerformanceAnalysis: performanceController.getPerformanceAnalysis.bind(performanceController),
  getPerformanceDashboard: performanceController.getDashboardData.bind(performanceController),
  getBottlenecks: performanceController.getBottlenecks.bind(performanceController),
  getPerformanceRecommendations: performanceController.getRecommendations.bind(performanceController),
  getPerformanceTrends: performanceController.getTrends.bind(performanceController),

  // Dashboard
  getDashboard: dashboardController.getDashboard.bind(dashboardController),
  getSystemStatus: dashboardController.getSystemStatus.bind(dashboardController),
  getWidgetData: dashboardController.getWidgetData.bind(dashboardController),
  updateUserPreferences: dashboardController.updateUserPreferences.bind(dashboardController),
  getHealthSummary: dashboardController.getHealthSummary.bind(dashboardController)
};
