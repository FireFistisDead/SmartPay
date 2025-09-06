const logger = require('../utils/logger');
const redisClient = require('../config/redis');
const config = require('../config/config');
const { AppError } = require('../middleware/errorHandler');
const ComprehensiveMonitoringService = require('./comprehensiveMonitoringService');
const PerformanceAnalyticsService = require('./performanceAnalyticsService');
const RealTimeAlertingService = require('./realTimeAlertingService');
const AdvancedErrorHandlingService = require('./advancedErrorHandlingService');

/**
 * Operational Dashboard Service - Phase 5
 * Provides unified operational visibility and control center
 */
class OperationalDashboardService {
  constructor() {
    this.initialized = false;
    this.dashboardData = {};
    this.updateInterval = null;
    
    // Initialize dependent services
    this.monitoringService = new ComprehensiveMonitoringService();
    this.performanceService = new PerformanceAnalyticsService();
    this.alertingService = new RealTimeAlertingService();
    this.errorService = new AdvancedErrorHandlingService();
    
    this.dashboardConfig = {
      refreshInterval: 30000, // 30 seconds
      dataRetention: 86400, // 24 hours
      maxDataPoints: 1000,
      realTimeEnabled: true
    };
    
    this.widgets = new Map();
    this.customMetrics = new Map();
    this.userPreferences = new Map();
    
    this.systemStatus = {
      overall: 'unknown',
      services: {},
      lastUpdated: null
    };
  }

  /**
   * Initialize operational dashboard service
   */
  async initialize() {
    try {
      // Initialize dependent services
      await Promise.all([
        this.monitoringService.initialize(),
        this.performanceService.initialize(),
        this.alertingService.initialize(),
        this.errorService.initialize()
      ]);
      
      // Setup dashboard widgets
      await this.setupDashboardWidgets();
      
      // Setup real-time data updates
      await this.setupRealTimeUpdates();
      
      // Load user preferences
      await this.loadUserPreferences();
      
      // Start dashboard data collection
      this.startDataCollection();
      
      this.initialized = true;
      logger.info('OperationalDashboardService initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize OperationalDashboardService:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(userId, timeframe = '1h', customizations = {}) {
    this._checkInitialized();
    
    try {
      const startTime = Date.now();
      
      // Get user preferences
      const preferences = this.userPreferences.get(userId) || this.getDefaultPreferences();
      
      // Collect data from all services
      const [
        systemMetrics,
        performanceData,
        activeAlerts,
        errorStatistics,
        healthChecks,
        systemStatus
      ] = await Promise.all([
        this.monitoringService.getDashboardData(),
        this.performanceService.getDashboardData(timeframe),
        this.alertingService.getActiveAlerts(),
        this.errorService.getErrorStatistics(timeframe),
        this.getHealthCheckSummary(),
        this.getSystemStatus()
      ]);
      
      // Build dashboard structure
      const dashboardData = {
        metadata: {
          timestamp: new Date().toISOString(),
          timeframe,
          userId,
          generationTime: Date.now() - startTime,
          version: '5.0.0'
        },
        overview: {
          system_status: systemStatus,
          health_score: this.calculateOverallHealthScore(systemMetrics, performanceData),
          active_alerts: activeAlerts.length,
          critical_alerts: activeAlerts.filter(a => a.severity.name === 'critical').length,
          error_rate: errorStatistics.errorRate || 0,
          uptime: systemMetrics.application?.uptime || 0
        },
        system: {
          metrics: systemMetrics.system,
          application: systemMetrics.application,
          health_checks: healthChecks
        },
        performance: {
          current: performanceData.current_performance,
          trends: performanceData.trends,
          health_score: performanceData.health_score,
          bottlenecks: performanceData.bottlenecks.slice(0, 5)
        },
        alerts: {
          active: activeAlerts.filter(a => !a.resolved),
          recent: activeAlerts.slice(0, 10),
          by_severity: this.groupAlertsBySeverity(activeAlerts),
          by_type: this.groupAlertsByType(activeAlerts)
        },
        errors: {
          statistics: errorStatistics,
          top_errors: errorStatistics.topErrors || [],
          recovery_rate: errorStatistics.recoveryRate || 0
        },
        widgets: await this.getActiveWidgets(preferences.widgets),
        recommendations: await this.generateDashboardRecommendations(
          systemMetrics, 
          performanceData, 
          activeAlerts, 
          errorStatistics
        ),
        real_time: {
          enabled: this.dashboardConfig.realTimeEnabled,
          last_update: this.dashboardData.lastUpdated,
          next_update: new Date(Date.now() + this.dashboardConfig.refreshInterval).toISOString()
        }
      };
      
      // Apply customizations
      if (customizations.widgets) {
        dashboardData.widgets = await this.applyWidgetCustomizations(
          dashboardData.widgets, 
          customizations.widgets
        );
      }
      
      // Cache dashboard data
      await this.cacheDashboardData(userId, dashboardData);
      
      return dashboardData;
      
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      throw new AppError('Failed to get dashboard data', 500, 'DASHBOARD_ERROR');
    }
  }

  /**
   * Get real-time system status
   */
  async getSystemStatus() {
    try {
      const services = {
        database: await this.checkServiceHealth('database'),
        redis: await this.checkServiceHealth('redis'),
        blockchain: await this.checkServiceHealth('blockchain'),
        external_apis: await this.checkServiceHealth('external_apis'),
        monitoring: await this.checkServiceHealth('monitoring'),
        alerting: await this.checkServiceHealth('alerting')
      };
      
      // Calculate overall status
      const healthyServices = Object.values(services).filter(s => s.status === 'healthy').length;
      const totalServices = Object.keys(services).length;
      const healthPercentage = (healthyServices / totalServices) * 100;
      
      let overall = 'unknown';
      if (healthPercentage >= 90) overall = 'healthy';
      else if (healthPercentage >= 70) overall = 'degraded';
      else if (healthPercentage >= 50) overall = 'partial';
      else overall = 'critical';
      
      const status = {
        overall,
        health_percentage: healthPercentage,
        services,
        last_updated: new Date().toISOString()
      };
      
      this.systemStatus = status;
      return status;
      
    } catch (error) {
      logger.error('Error getting system status:', error);
      return {
        overall: 'unknown',
        health_percentage: 0,
        services: {},
        last_updated: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Get health check summary
   */
  async getHealthCheckSummary() {
    try {
      const healthChecksStr = await redisClient.get('health_checks');
      if (!healthChecksStr) return {};
      
      const healthChecks = JSON.parse(healthChecksStr);
      const summary = {
        total: Object.keys(healthChecks).length,
        healthy: 0,
        unhealthy: 0,
        error: 0,
        checks: healthChecks
      };
      
      Object.values(healthChecks).forEach(check => {
        summary[check.status]++;
      });
      
      return summary;
      
    } catch (error) {
      logger.error('Error getting health check summary:', error);
      return { total: 0, healthy: 0, unhealthy: 0, error: 0, checks: {} };
    }
  }

  /**
   * Generate dashboard recommendations
   */
  async generateDashboardRecommendations(systemMetrics, performanceData, activeAlerts, errorStats) {
    try {
      const recommendations = [];
      
      // System resource recommendations
      if (systemMetrics.system?.memory?.percentage > 80) {
        recommendations.push({
          type: 'resource',
          priority: 'high',
          title: 'High Memory Usage',
          description: 'System memory usage is above 80%',
          action: 'Consider scaling up or optimizing memory usage',
          icon: '⚠️'
        });
      }
      
      if (systemMetrics.system?.cpu?.usage > 70) {
        recommendations.push({
          type: 'resource',
          priority: 'medium',
          title: 'High CPU Usage',
          description: 'CPU usage is consistently high',
          action: 'Monitor CPU-intensive processes and optimize',
          icon: '🔥'
        });
      }
      
      // Performance recommendations
      if (performanceData.health_score < 70) {
        recommendations.push({
          type: 'performance',
          priority: 'high',
          title: 'Performance Degradation',
          description: `Performance health score is ${performanceData.health_score}`,
          action: 'Review performance bottlenecks and optimize',
          icon: '⚡'
        });
      }
      
      // Alert recommendations
      const criticalAlerts = activeAlerts.filter(a => a.severity.name === 'critical');
      if (criticalAlerts.length > 0) {
        recommendations.push({
          type: 'alerts',
          priority: 'critical',
          title: 'Critical Alerts Pending',
          description: `${criticalAlerts.length} critical alerts require attention`,
          action: 'Review and resolve critical alerts immediately',
          icon: '🚨'
        });
      }
      
      // Error rate recommendations
      if (errorStats.errorRate > 5) {
        recommendations.push({
          type: 'errors',
          priority: 'high',
          title: 'High Error Rate',
          description: `Error rate is ${errorStats.errorRate.toFixed(2)}%`,
          action: 'Investigate and fix recurring errors',
          icon: '❌'
        });
      }
      
      // Sort by priority
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      
      return recommendations.slice(0, 5); // Return top 5 recommendations
      
    } catch (error) {
      logger.error('Error generating dashboard recommendations:', error);
      return [];
    }
  }

  /**
   * Setup dashboard widgets
   */
  async setupDashboardWidgets() {
    // System Overview Widget
    this.widgets.set('system_overview', {
      id: 'system_overview',
      title: 'System Overview',
      type: 'metrics',
      size: 'large',
      dataSource: 'monitoring',
      config: {
        metrics: ['cpu', 'memory', 'disk', 'network'],
        refreshInterval: 30000
      }
    });
    
    // Performance Widget
    this.widgets.set('performance', {
      id: 'performance',
      title: 'Performance Metrics',
      type: 'chart',
      size: 'medium',
      dataSource: 'performance',
      config: {
        chartType: 'line',
        metrics: ['response_time', 'throughput', 'error_rate'],
        timeframe: '1h'
      }
    });
    
    // Active Alerts Widget
    this.widgets.set('active_alerts', {
      id: 'active_alerts',
      title: 'Active Alerts',
      type: 'list',
      size: 'medium',
      dataSource: 'alerts',
      config: {
        maxItems: 10,
        showSeverity: true,
        autoRefresh: true
      }
    });
    
    // Error Summary Widget
    this.widgets.set('error_summary', {
      id: 'error_summary',
      title: 'Error Summary',
      type: 'table',
      size: 'medium',
      dataSource: 'errors',
      config: {
        columns: ['error_type', 'count', 'last_occurrence'],
        maxRows: 10
      }
    });
    
    // Health Checks Widget
    this.widgets.set('health_checks', {
      id: 'health_checks',
      title: 'Health Checks',
      type: 'status',
      size: 'small',
      dataSource: 'health',
      config: {
        showDetails: true,
        groupByStatus: true
      }
    });
    
    // Blockchain Metrics Widget
    this.widgets.set('blockchain_metrics', {
      id: 'blockchain_metrics',
      title: 'Blockchain Metrics',
      type: 'metrics',
      size: 'medium',
      dataSource: 'blockchain',
      config: {
        metrics: ['transactions', 'gas_usage', 'block_time'],
        refreshInterval: 60000
      }
    });
  }

  /**
   * Setup real-time data updates
   */
  async setupRealTimeUpdates() {
    if (!this.dashboardConfig.realTimeEnabled) return;
    
    // Listen to service events
    this.alertingService.on('alertCreated', (alert) => {
      this.broadcastUpdate('alert_created', alert);
    });
    
    this.alertingService.on('alertResolved', (alert) => {
      this.broadcastUpdate('alert_resolved', alert);
    });
    
    this.monitoringService.on('metricUpdate', (metric) => {
      this.broadcastUpdate('metric_update', metric);
    });
    
    // Setup periodic updates
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateDashboardData();
      } catch (error) {
        logger.error('Error in dashboard update interval:', error);
      }
    }, this.dashboardConfig.refreshInterval);
  }

  /**
   * Start data collection
   */
  startDataCollection() {
    // Collect system metrics
    setInterval(async () => {
      try {
        const systemStatus = await this.getSystemStatus();
        await this.updateSystemStatusCache(systemStatus);
      } catch (error) {
        logger.error('Error collecting system status:', error);
      }
    }, 30000);
    
    // Collect performance metrics
    setInterval(async () => {
      try {
        const performanceData = await this.performanceService.getDashboardData();
        await this.updatePerformanceCache(performanceData);
      } catch (error) {
        logger.error('Error collecting performance data:', error);
      }
    }, 60000);
  }

  /**
   * Get active widgets based on user preferences
   */
  async getActiveWidgets(preferredWidgets = []) {
    try {
      const activeWidgets = [];
      
      // If no preferences, return default widgets
      if (preferredWidgets.length === 0) {
        preferredWidgets = ['system_overview', 'performance', 'active_alerts', 'health_checks'];
      }
      
      for (const widgetId of preferredWidgets) {
        const widget = this.widgets.get(widgetId);
        if (widget) {
          const widgetData = await this.getWidgetData(widget);
          activeWidgets.push({
            ...widget,
            data: widgetData,
            lastUpdated: new Date().toISOString()
          });
        }
      }
      
      return activeWidgets;
      
    } catch (error) {
      logger.error('Error getting active widgets:', error);
      return [];
    }
  }

  /**
   * Get data for specific widget
   */
  async getWidgetData(widget) {
    try {
      switch (widget.dataSource) {
        case 'monitoring':
          return await this.getMonitoringWidgetData(widget);
        case 'performance':
          return await this.getPerformanceWidgetData(widget);
        case 'alerts':
          return await this.getAlertsWidgetData(widget);
        case 'errors':
          return await this.getErrorsWidgetData(widget);
        case 'health':
          return await this.getHealthWidgetData(widget);
        case 'blockchain':
          return await this.getBlockchainWidgetData(widget);
        default:
          return {};
      }
    } catch (error) {
      logger.error(`Error getting widget data for ${widget.id}:`, error);
      return { error: error.message };
    }
  }

  /**
   * Calculate overall health score
   */
  calculateOverallHealthScore(systemMetrics, performanceData) {
    try {
      const scores = [];
      
      // System health (CPU, Memory, Disk)
      if (systemMetrics.system) {
        const cpuScore = Math.max(0, 100 - (systemMetrics.system.cpu?.usage || 0));
        const memoryScore = Math.max(0, 100 - (systemMetrics.system.memory?.percentage || 0));
        scores.push(cpuScore, memoryScore);
      }
      
      // Performance health
      if (performanceData.health_score) {
        scores.push(performanceData.health_score);
      }
      
      // Default score if no data
      if (scores.length === 0) return 75;
      
      return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
      
    } catch (error) {
      logger.error('Error calculating health score:', error);
      return 50;
    }
  }

  /**
   * Group alerts by severity
   */
  groupAlertsBySeverity(alerts) {
    const grouped = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };
    
    alerts.forEach(alert => {
      const severity = alert.severity?.name || 'info';
      if (grouped.hasOwnProperty(severity)) {
        grouped[severity]++;
      }
    });
    
    return grouped;
  }

  /**
   * Group alerts by type
   */
  groupAlertsByType(alerts) {
    const grouped = {};
    
    alerts.forEach(alert => {
      const type = alert.type || 'unknown';
      grouped[type] = (grouped[type] || 0) + 1;
    });
    
    return grouped;
  }

  /**
   * Check service health
   */
  async checkServiceHealth(serviceName) {
    try {
      switch (serviceName) {
        case 'database':
          // Implement database health check
          return { status: 'healthy', response_time: 50 };
        case 'redis':
          const ping = await redisClient.ping();
          return { status: ping === 'PONG' ? 'healthy' : 'unhealthy', response_time: 10 };
        case 'blockchain':
          // Implement blockchain health check
          return { status: 'healthy', response_time: 200 };
        case 'external_apis':
          // Implement external API health checks
          return { status: 'healthy', response_time: 150 };
        case 'monitoring':
          return { status: this.monitoringService.initialized ? 'healthy' : 'unhealthy', response_time: 5 };
        case 'alerting':
          return { status: this.alertingService.initialized ? 'healthy' : 'unhealthy', response_time: 5 };
        default:
          return { status: 'unknown', response_time: 0 };
      }
    } catch (error) {
      logger.error(`Error checking ${serviceName} health:`, error);
      return { status: 'error', response_time: 0, error: error.message };
    }
  }

  /**
   * Cache dashboard data
   */
  async cacheDashboardData(userId, data) {
    try {
      const cacheKey = `dashboard:${userId}`;
      await redisClient.setex(cacheKey, 300, JSON.stringify(data)); // Cache for 5 minutes
    } catch (error) {
      logger.error('Error caching dashboard data:', error);
    }
  }

  /**
   * Broadcast real-time updates
   */
  broadcastUpdate(type, data) {
    // In production, this would broadcast to WebSocket connections
    logger.debug(`Broadcasting update: ${type}`, { data });
  }

  /**
   * Get default user preferences
   */
  getDefaultPreferences() {
    return {
      widgets: ['system_overview', 'performance', 'active_alerts', 'health_checks'],
      refreshInterval: 30000,
      theme: 'dark',
      timezone: 'UTC'
    };
  }

  _checkInitialized() {
    if (!this.initialized) {
      throw new AppError('OperationalDashboardService not initialized', 500, 'SERVICE_NOT_INITIALIZED');
    }
  }
}

module.exports = OperationalDashboardService;
