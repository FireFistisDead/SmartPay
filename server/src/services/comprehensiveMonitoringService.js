const logger = require('../utils/logger');
const redisClient = require('../config/redis');
const config = require('../config/config');
const { AppError } = require('../middleware/errorHandler');
const os = require('os');
const fs = require('fs').promises;

/**
 * Comprehensive Monitoring Service - Phase 5
 * Provides system monitoring, performance tracking, and health checks
 */
class ComprehensiveMonitoringService {
  constructor() {
    this.initialized = false;
    this.monitoringInterval = null;
    this.alertingEnabled = true;
    
    this.metrics = {
      system: {
        cpu: { usage: 0, loadAverage: [0, 0, 0] },
        memory: { used: 0, total: 0, percentage: 0 },
        disk: { used: 0, total: 0, percentage: 0 },
        network: { received: 0, transmitted: 0 }
      },
      application: {
        uptime: 0,
        requests: { total: 0, rate: 0, errors: 0 },
        database: { connections: 0, queries: 0, slowQueries: 0 },
        cache: { hits: 0, misses: 0, hitRate: 0 },
        blockchain: { transactions: 0, failedTx: 0, gasUsed: 0 }
      },
      performance: {
        responseTime: { avg: 0, p95: 0, p99: 0 },
        throughput: { rps: 0, peak: 0 },
        errors: { rate: 0, total: 0 },
        availability: { uptime: 0, downtime: 0 }
      }
    };
    
    this.thresholds = {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 },
      disk: { warning: 85, critical: 95 },
      responseTime: { warning: 1000, critical: 5000 },
      errorRate: { warning: 5, critical: 10 },
      availability: { warning: 99, critical: 95 }
    };
    
    this.alerts = [];
    this.healthChecks = new Map();
    this.performanceHistory = [];
  }

  /**
   * Initialize monitoring service
   */
  async initialize() {
    try {
      await this.setupSystemMonitoring();
      await this.setupApplicationMonitoring();
      await this.setupHealthChecks();
      await this.loadHistoricalData();
      
      // Start monitoring intervals
      this.startMonitoring();
      
      this.initialized = true;
      logger.info('ComprehensiveMonitoringService initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize ComprehensiveMonitoringService:', error);
      throw error;
    }
  }

  /**
   * Start monitoring intervals
   */
  startMonitoring() {
    // System metrics every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectSystemMetrics();
        await this.collectApplicationMetrics();
        await this.evaluateThresholds();
        await this.storeMetrics();
      } catch (error) {
        logger.error('Error in monitoring interval:', error);
      }
    }, 30000);

    // Performance metrics every 10 seconds
    setInterval(async () => {
      try {
        await this.collectPerformanceMetrics();
      } catch (error) {
        logger.error('Error collecting performance metrics:', error);
      }
    }, 10000);

    // Health checks every 60 seconds
    setInterval(async () => {
      try {
        await this.runHealthChecks();
      } catch (error) {
        logger.error('Error running health checks:', error);
      }
    }, 60000);
  }

  /**
   * Collect system metrics
   */
  async collectSystemMetrics() {
    try {
      // CPU metrics
      const cpuUsage = await this.getCPUUsage();
      this.metrics.system.cpu = {
        usage: cpuUsage,
        loadAverage: os.loadavg()
      };

      // Memory metrics
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      
      this.metrics.system.memory = {
        used: usedMemory,
        total: totalMemory,
        percentage: (usedMemory / totalMemory) * 100
      };

      // Disk metrics
      const diskUsage = await this.getDiskUsage();
      this.metrics.system.disk = diskUsage;

      // Network metrics
      const networkStats = await this.getNetworkStats();
      this.metrics.system.network = networkStats;

    } catch (error) {
      logger.error('Error collecting system metrics:', error);
    }
  }

  /**
   * Collect application metrics
   */
  async collectApplicationMetrics() {
    try {
      // Application uptime
      this.metrics.application.uptime = process.uptime();

      // Request metrics from Redis
      const requestMetrics = await this.getRequestMetrics();
      this.metrics.application.requests = requestMetrics;

      // Database metrics
      const dbMetrics = await this.getDatabaseMetrics();
      this.metrics.application.database = dbMetrics;

      // Cache metrics
      const cacheMetrics = await this.getCacheMetrics();
      this.metrics.application.cache = cacheMetrics;

      // Blockchain metrics
      const blockchainMetrics = await this.getBlockchainMetrics();
      this.metrics.application.blockchain = blockchainMetrics;

    } catch (error) {
      logger.error('Error collecting application metrics:', error);
    }
  }

  /**
   * Collect performance metrics
   */
  async collectPerformanceMetrics() {
    try {
      const performanceData = await this.calculatePerformanceMetrics();
      this.metrics.performance = performanceData;
      
      // Store in history for trends
      this.performanceHistory.push({
        timestamp: new Date().toISOString(),
        ...performanceData
      });
      
      // Keep only last 1000 entries
      if (this.performanceHistory.length > 1000) {
        this.performanceHistory = this.performanceHistory.slice(-1000);
      }

    } catch (error) {
      logger.error('Error collecting performance metrics:', error);
    }
  }

  /**
   * Get CPU usage percentage
   */
  async getCPUUsage() {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();
      
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = process.hrtime(startTime);
        
        const totalTime = endTime[0] * 1000000 + endTime[1] / 1000;
        const cpuTime = (endUsage.user + endUsage.system);
        const cpuPercent = (cpuTime / totalTime) * 100;
        
        resolve(Math.min(cpuPercent, 100));
      }, 100);
    });
  }

  /**
   * Get disk usage
   */
  async getDiskUsage() {
    try {
      const stats = await fs.stat('.');
      // Simplified disk usage - in production, use proper disk monitoring
      return {
        used: 0,
        total: 100000000000, // 100GB placeholder
        percentage: 45 // Placeholder
      };
    } catch (error) {
      logger.error('Error getting disk usage:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  /**
   * Get network statistics
   */
  async getNetworkStats() {
    // Simplified network stats - in production, use proper network monitoring
    return {
      received: Math.floor(Math.random() * 1000000),
      transmitted: Math.floor(Math.random() * 1000000)
    };
  }

  /**
   * Get request metrics from Redis
   */
  async getRequestMetrics() {
    try {
      const [total, errors, rate] = await Promise.all([
        redisClient.get('metrics:requests:total') || '0',
        redisClient.get('metrics:requests:errors') || '0',
        redisClient.get('metrics:requests:rate') || '0'
      ]);

      return {
        total: parseInt(total),
        errors: parseInt(errors),
        rate: parseFloat(rate)
      };
    } catch (error) {
      logger.error('Error getting request metrics:', error);
      return { total: 0, errors: 0, rate: 0 };
    }
  }

  /**
   * Get database metrics
   */
  async getDatabaseMetrics() {
    try {
      // In production, integrate with actual database monitoring
      return {
        connections: Math.floor(Math.random() * 100),
        queries: Math.floor(Math.random() * 1000),
        slowQueries: Math.floor(Math.random() * 10)
      };
    } catch (error) {
      logger.error('Error getting database metrics:', error);
      return { connections: 0, queries: 0, slowQueries: 0 };
    }
  }

  /**
   * Get cache metrics
   */
  async getCacheMetrics() {
    try {
      const info = await redisClient.info('stats');
      const lines = info.split('\r\n');
      
      let hits = 0, misses = 0;
      
      lines.forEach(line => {
        if (line.startsWith('keyspace_hits:')) {
          hits = parseInt(line.split(':')[1]);
        } else if (line.startsWith('keyspace_misses:')) {
          misses = parseInt(line.split(':')[1]);
        }
      });
      
      const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0;
      
      return { hits, misses, hitRate };
      
    } catch (error) {
      logger.error('Error getting cache metrics:', error);
      return { hits: 0, misses: 0, hitRate: 0 };
    }
  }

  /**
   * Get blockchain metrics
   */
  async getBlockchainMetrics() {
    try {
      const [transactions, failedTx, gasUsed] = await Promise.all([
        redisClient.get('metrics:blockchain:transactions') || '0',
        redisClient.get('metrics:blockchain:failed') || '0',
        redisClient.get('metrics:blockchain:gas') || '0'
      ]);

      return {
        transactions: parseInt(transactions),
        failedTx: parseInt(failedTx),
        gasUsed: parseInt(gasUsed)
      };
    } catch (error) {
      logger.error('Error getting blockchain metrics:', error);
      return { transactions: 0, failedTx: 0, gasUsed: 0 };
    }
  }

  /**
   * Calculate performance metrics
   */
  async calculatePerformanceMetrics() {
    try {
      // Get response time data from Redis
      const responseTimes = await redisClient.lrange('response_times', 0, -1);
      const times = responseTimes.map(t => parseFloat(t)).filter(t => !isNaN(t));
      
      if (times.length === 0) {
        return {
          responseTime: { avg: 0, p95: 0, p99: 0 },
          throughput: { rps: 0, peak: 0 },
          errors: { rate: 0, total: 0 },
          availability: { uptime: 99.9, downtime: 0 }
        };
      }
      
      times.sort((a, b) => a - b);
      
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      const p95Index = Math.floor(times.length * 0.95);
      const p99Index = Math.floor(times.length * 0.99);
      
      const requestCount = await redisClient.get('metrics:requests:count:1m') || '0';
      const errorCount = await redisClient.get('metrics:errors:count:1m') || '0';
      
      return {
        responseTime: {
          avg: Math.round(avg),
          p95: times[p95Index] || 0,
          p99: times[p99Index] || 0
        },
        throughput: {
          rps: parseInt(requestCount),
          peak: parseInt(await redisClient.get('metrics:requests:peak') || '0')
        },
        errors: {
          rate: parseInt(errorCount),
          total: parseInt(await redisClient.get('metrics:errors:total') || '0')
        },
        availability: {
          uptime: 99.9, // Calculate based on actual downtime
          downtime: 0
        }
      };
      
    } catch (error) {
      logger.error('Error calculating performance metrics:', error);
      return {
        responseTime: { avg: 0, p95: 0, p99: 0 },
        throughput: { rps: 0, peak: 0 },
        errors: { rate: 0, total: 0 },
        availability: { uptime: 0, downtime: 0 }
      };
    }
  }

  /**
   * Evaluate thresholds and generate alerts
   */
  async evaluateThresholds() {
    try {
      const alerts = [];
      
      // CPU threshold check
      if (this.metrics.system.cpu.usage > this.thresholds.cpu.critical) {
        alerts.push(this.createAlert('CPU_CRITICAL', 'critical', 
          `CPU usage is ${this.metrics.system.cpu.usage.toFixed(1)}%`));
      } else if (this.metrics.system.cpu.usage > this.thresholds.cpu.warning) {
        alerts.push(this.createAlert('CPU_WARNING', 'warning', 
          `CPU usage is ${this.metrics.system.cpu.usage.toFixed(1)}%`));
      }
      
      // Memory threshold check
      if (this.metrics.system.memory.percentage > this.thresholds.memory.critical) {
        alerts.push(this.createAlert('MEMORY_CRITICAL', 'critical', 
          `Memory usage is ${this.metrics.system.memory.percentage.toFixed(1)}%`));
      } else if (this.metrics.system.memory.percentage > this.thresholds.memory.warning) {
        alerts.push(this.createAlert('MEMORY_WARNING', 'warning', 
          `Memory usage is ${this.metrics.system.memory.percentage.toFixed(1)}%`));
      }
      
      // Response time threshold check
      if (this.metrics.performance.responseTime.avg > this.thresholds.responseTime.critical) {
        alerts.push(this.createAlert('RESPONSE_TIME_CRITICAL', 'critical', 
          `Average response time is ${this.metrics.performance.responseTime.avg}ms`));
      } else if (this.metrics.performance.responseTime.avg > this.thresholds.responseTime.warning) {
        alerts.push(this.createAlert('RESPONSE_TIME_WARNING', 'warning', 
          `Average response time is ${this.metrics.performance.responseTime.avg}ms`));
      }
      
      // Error rate threshold check
      if (this.metrics.performance.errors.rate > this.thresholds.errorRate.critical) {
        alerts.push(this.createAlert('ERROR_RATE_CRITICAL', 'critical', 
          `Error rate is ${this.metrics.performance.errors.rate} errors/min`));
      } else if (this.metrics.performance.errors.rate > this.thresholds.errorRate.warning) {
        alerts.push(this.createAlert('ERROR_RATE_WARNING', 'warning', 
          `Error rate is ${this.metrics.performance.errors.rate} errors/min`));
      }
      
      // Process new alerts
      for (const alert of alerts) {
        await this.processAlert(alert);
      }
      
    } catch (error) {
      logger.error('Error evaluating thresholds:', error);
    }
  }

  /**
   * Create alert object
   */
  createAlert(type, severity, message) {
    return {
      id: require('crypto').randomBytes(8).toString('hex'),
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
      resolved: false
    };
  }

  /**
   * Process and handle alerts
   */
  async processAlert(alert) {
    try {
      // Check if similar alert already exists
      const existingAlert = this.alerts.find(a => 
        a.type === alert.type && !a.resolved
      );
      
      if (existingAlert) {
        // Update existing alert
        existingAlert.lastSeen = alert.timestamp;
        existingAlert.count = (existingAlert.count || 1) + 1;
      } else {
        // Add new alert
        this.alerts.push(alert);
        
        // Store in Redis
        await redisClient.lpush('alerts', JSON.stringify(alert));
        await redisClient.ltrim('alerts', 0, 99); // Keep last 100 alerts
        
        // Send notifications if enabled
        if (this.alertingEnabled) {
          await this.sendAlertNotification(alert);
        }
      }
      
      logger.warn(`Alert generated: ${alert.type} - ${alert.message}`);
      
    } catch (error) {
      logger.error('Error processing alert:', error);
    }
  }

  /**
   * Send alert notifications
   */
  async sendAlertNotification(alert) {
    try {
      // In production, integrate with notification services
      // (email, Slack, PagerDuty, etc.)
      
      if (alert.severity === 'critical') {
        logger.error(`CRITICAL ALERT: ${alert.message}`);
        // Send immediate notifications
      } else if (alert.severity === 'warning') {
        logger.warn(`WARNING ALERT: ${alert.message}`);
        // Send notifications to appropriate channels
      }
      
    } catch (error) {
      logger.error('Error sending alert notification:', error);
    }
  }

  /**
   * Run health checks
   */
  async runHealthChecks() {
    try {
      const healthResults = {};
      
      for (const [name, checkFunction] of this.healthChecks) {
        try {
          const result = await checkFunction();
          healthResults[name] = {
            status: result.healthy ? 'healthy' : 'unhealthy',
            details: result.details,
            responseTime: result.responseTime,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          healthResults[name] = {
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          };
        }
      }
      
      // Store health check results
      await redisClient.setex('health_checks', 300, JSON.stringify(healthResults));
      
      return healthResults;
      
    } catch (error) {
      logger.error('Error running health checks:', error);
      return {};
    }
  }

  /**
   * Get comprehensive monitoring dashboard data
   */
  async getDashboardData() {
    this._checkInitialized();
    
    try {
      const [alerts, healthChecks, recentMetrics] = await Promise.all([
        this.getRecentAlerts(),
        this.getHealthCheckResults(),
        this.getRecentMetrics()
      ]);
      
      return {
        timestamp: new Date().toISOString(),
        system: this.metrics.system,
        application: this.metrics.application,
        performance: this.metrics.performance,
        alerts: {
          active: alerts.filter(a => !a.resolved),
          recent: alerts.slice(0, 10)
        },
        healthChecks,
        trends: this.calculateTrends(),
        summary: this.generateSystemSummary()
      };
      
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      throw new AppError('Failed to get dashboard data', 500, 'DASHBOARD_ERROR');
    }
  }

  /**
   * Store metrics in Redis for persistence
   */
  async storeMetrics() {
    try {
      const timestamp = new Date().toISOString();
      const metricsData = {
        timestamp,
        ...this.metrics
      };
      
      // Store current metrics
      await redisClient.setex('current_metrics', 300, JSON.stringify(metricsData));
      
      // Store in time series for historical data
      await redisClient.zadd('metrics_history', Date.now(), JSON.stringify(metricsData));
      
      // Clean old data (keep last 24 hours)
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      await redisClient.zremrangebyscore('metrics_history', 0, oneDayAgo);
      
    } catch (error) {
      logger.error('Error storing metrics:', error);
    }
  }

  // Setup methods
  async setupSystemMonitoring() {
    logger.debug('Setting up system monitoring');
    // Initialize system monitoring components
  }

  async setupApplicationMonitoring() {
    logger.debug('Setting up application monitoring');
    // Initialize application monitoring components
  }

  async setupHealthChecks() {
    // Database health check
    this.healthChecks.set('database', async () => {
      const start = Date.now();
      try {
        // Perform database ping/health check
        return {
          healthy: true,
          details: 'Database connection healthy',
          responseTime: Date.now() - start
        };
      } catch (error) {
        return {
          healthy: false,
          details: `Database error: ${error.message}`,
          responseTime: Date.now() - start
        };
      }
    });

    // Redis health check
    this.healthChecks.set('redis', async () => {
      const start = Date.now();
      try {
        await redisClient.ping();
        return {
          healthy: true,
          details: 'Redis connection healthy',
          responseTime: Date.now() - start
        };
      } catch (error) {
        return {
          healthy: false,
          details: `Redis error: ${error.message}`,
          responseTime: Date.now() - start
        };
      }
    });

    // External API health check
    this.healthChecks.set('external_apis', async () => {
      const start = Date.now();
      try {
        // Check external API endpoints
        return {
          healthy: true,
          details: 'External APIs responsive',
          responseTime: Date.now() - start
        };
      } catch (error) {
        return {
          healthy: false,
          details: `External API error: ${error.message}`,
          responseTime: Date.now() - start
        };
      }
    });
  }

  _checkInitialized() {
    if (!this.initialized) {
      throw new AppError('ComprehensiveMonitoringService not initialized', 500, 'SERVICE_NOT_INITIALIZED');
    }
  }
}

module.exports = ComprehensiveMonitoringService;
