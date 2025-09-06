const logger = require('../utils/logger');
const redisClient = require('../config/redis');
const config = require('../config/config');
const { AppError } = require('../middleware/errorHandler');
const EventEmitter = require('events');

/**
 * Real-time Alerting Service - Phase 5
 * Provides intelligent alerting, escalation, and notification management
 */
class RealTimeAlertingService extends EventEmitter {
  constructor() {
    super();
    this.initialized = false;
    this.alertChannels = new Map();
    this.escalationRules = new Map();
    this.notificationProviders = new Map();
    this.suppressionRules = new Map();
    
    this.alertTypes = {
      SYSTEM: 'system',
      APPLICATION: 'application',
      SECURITY: 'security',
      BUSINESS: 'business',
      PERFORMANCE: 'performance',
      AVAILABILITY: 'availability'
    };
    
    this.severityLevels = {
      CRITICAL: { level: 1, name: 'critical', escalateAfter: 300 }, // 5 minutes
      HIGH: { level: 2, name: 'high', escalateAfter: 900 }, // 15 minutes
      MEDIUM: { level: 3, name: 'medium', escalateAfter: 1800 }, // 30 minutes
      LOW: { level: 4, name: 'low', escalateAfter: 3600 }, // 1 hour
      INFO: { level: 5, name: 'info', escalateAfter: null }
    };
    
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.suppressedAlerts = new Set();
    this.escalationScheduler = null;
  }

  /**
   * Initialize alerting service
   */
  async initialize() {
    try {
      await this.setupNotificationProviders();
      await this.setupAlertChannels();
      await this.setupEscalationRules();
      await this.setupSuppressionRules();
      await this.loadActiveAlerts();
      
      // Start escalation scheduler
      this.startEscalationScheduler();
      
      this.initialized = true;
      logger.info('RealTimeAlertingService initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize RealTimeAlertingService:', error);
      throw error;
    }
  }

  /**
   * Create and process a new alert
   */
  async createAlert(alertData) {
    this._checkInitialized();
    
    try {
      const alert = this.enrichAlert(alertData);
      
      // Check if alert should be suppressed
      if (await this.shouldSuppressAlert(alert)) {
        logger.debug(`Alert suppressed: ${alert.id}`);
        return { suppressed: true, alertId: alert.id };
      }
      
      // Check for duplicate/similar alerts
      const existingAlert = await this.findSimilarAlert(alert);
      if (existingAlert) {
        return await this.updateExistingAlert(existingAlert, alert);
      }
      
      // Store alert
      this.activeAlerts.set(alert.id, alert);
      await this.storeAlert(alert);
      
      // Send initial notifications
      await this.sendNotifications(alert);
      
      // Schedule escalation if applicable
      if (alert.severity.escalateAfter) {
        await this.scheduleEscalation(alert);
      }
      
      // Emit event for real-time updates
      this.emit('alertCreated', alert);
      
      logger.info(`Alert created: ${alert.id} - ${alert.title}`);
      
      return {
        success: true,
        alertId: alert.id,
        severity: alert.severity.name,
        notifications: alert.notificationsSent
      };
      
    } catch (error) {
      logger.error('Error creating alert:', error);
      throw new AppError('Failed to create alert', 500, 'ALERT_CREATE_ERROR');
    }
  }

  /**
   * Enrich alert with metadata and context
   */
  enrichAlert(alertData) {
    const id = this.generateAlertId();
    const timestamp = new Date().toISOString();
    
    return {
      id,
      timestamp,
      title: alertData.title || 'Unnamed Alert',
      description: alertData.description || '',
      type: alertData.type || this.alertTypes.SYSTEM,
      severity: this.severityLevels[alertData.severity?.toUpperCase()] || this.severityLevels.MEDIUM,
      source: alertData.source || 'unknown',
      tags: alertData.tags || [],
      metadata: {
        ...alertData.metadata,
        hostname: require('os').hostname(),
        environment: process.env.NODE_ENV || 'development',
        version: config.version || '1.0.0'
      },
      context: alertData.context || {},
      fingerprint: this.generateFingerprint(alertData),
      status: 'active',
      acknowledged: false,
      resolved: false,
      escalated: false,
      escalationLevel: 0,
      notificationsSent: [],
      escalationHistory: [],
      lastUpdated: timestamp
    };
  }

  /**
   * Check if alert should be suppressed
   */
  async shouldSuppressAlert(alert) {
    try {
      // Check global suppression
      if (this.suppressedAlerts.has(alert.fingerprint)) {
        return true;
      }
      
      // Check suppression rules
      for (const [ruleId, rule] of this.suppressionRules) {
        if (await this.evaluateSuppressionRule(rule, alert)) {
          logger.debug(`Alert suppressed by rule: ${ruleId}`);
          return true;
        }
      }
      
      // Check rate limiting
      if (await this.isRateLimited(alert)) {
        return true;
      }
      
      return false;
      
    } catch (error) {
      logger.error('Error checking alert suppression:', error);
      return false;
    }
  }

  /**
   * Find similar active alerts
   */
  async findSimilarAlert(newAlert) {
    try {
      // Check by fingerprint first
      for (const [id, alert] of this.activeAlerts) {
        if (alert.fingerprint === newAlert.fingerprint && !alert.resolved) {
          return alert;
        }
      }
      
      // Check by similarity threshold
      for (const [id, alert] of this.activeAlerts) {
        if (!alert.resolved && this.calculateSimilarity(alert, newAlert) > 0.8) {
          return alert;
        }
      }
      
      return null;
      
    } catch (error) {
      logger.error('Error finding similar alert:', error);
      return null;
    }
  }

  /**
   * Update existing alert with new occurrence
   */
  async updateExistingAlert(existingAlert, newAlert) {
    try {
      existingAlert.count = (existingAlert.count || 1) + 1;
      existingAlert.lastOccurrence = newAlert.timestamp;
      existingAlert.lastUpdated = newAlert.timestamp;
      
      // Update metadata with latest information
      existingAlert.metadata = { ...existingAlert.metadata, ...newAlert.metadata };
      
      // Store updated alert
      await this.storeAlert(existingAlert);
      
      // Emit update event
      this.emit('alertUpdated', existingAlert);
      
      logger.debug(`Alert updated: ${existingAlert.id} (count: ${existingAlert.count})`);
      
      return {
        success: true,
        alertId: existingAlert.id,
        updated: true,
        count: existingAlert.count
      };
      
    } catch (error) {
      logger.error('Error updating existing alert:', error);
      throw error;
    }
  }

  /**
   * Send notifications for alert
   */
  async sendNotifications(alert) {
    try {
      const channels = this.getNotificationChannels(alert);
      const notificationPromises = [];
      
      for (const channel of channels) {
        const provider = this.notificationProviders.get(channel.provider);
        if (provider) {
          notificationPromises.push(
            this.sendNotification(provider, channel, alert)
          );
        }
      }
      
      const results = await Promise.allSettled(notificationPromises);
      
      // Track notification results
      results.forEach((result, index) => {
        const channel = channels[index];
        if (result.status === 'fulfilled') {
          alert.notificationsSent.push({
            channel: channel.name,
            provider: channel.provider,
            timestamp: new Date().toISOString(),
            success: true
          });
        } else {
          alert.notificationsSent.push({
            channel: channel.name,
            provider: channel.provider,
            timestamp: new Date().toISOString(),
            success: false,
            error: result.reason.message
          });
          logger.error(`Notification failed for ${channel.name}:`, result.reason);
        }
      });
      
    } catch (error) {
      logger.error('Error sending notifications:', error);
    }
  }

  /**
   * Get appropriate notification channels for alert
   */
  getNotificationChannels(alert) {
    const channels = [];
    
    // Determine channels based on severity and type
    if (alert.severity.level <= 2) { // Critical and High
      channels.push(
        ...this.alertChannels.get('immediate') || []
      );
    }
    
    if (alert.severity.level <= 3) { // Critical, High, and Medium
      channels.push(
        ...this.alertChannels.get('standard') || []
      );
    }
    
    // Add type-specific channels
    const typeChannels = this.alertChannels.get(alert.type) || [];
    channels.push(...typeChannels);
    
    // Remove duplicates
    return channels.filter((channel, index, self) => 
      index === self.findIndex(c => c.name === channel.name)
    );
  }

  /**
   * Send individual notification
   */
  async sendNotification(provider, channel, alert) {
    try {
      const message = this.formatAlertMessage(alert, channel.format);
      
      switch (provider.type) {
        case 'email':
          return await this.sendEmailNotification(provider, channel, alert, message);
        case 'slack':
          return await this.sendSlackNotification(provider, channel, alert, message);
        case 'webhook':
          return await this.sendWebhookNotification(provider, channel, alert, message);
        case 'sms':
          return await this.sendSMSNotification(provider, channel, alert, message);
        default:
          throw new Error(`Unknown notification provider type: ${provider.type}`);
      }
      
    } catch (error) {
      logger.error(`Error sending ${provider.type} notification:`, error);
      throw error;
    }
  }

  /**
   * Format alert message for different channels
   */
  formatAlertMessage(alert, format = 'text') {
    switch (format) {
      case 'text':
        return `🚨 ${alert.severity.name.toUpperCase()} ALERT: ${alert.title}\n\n` +
               `Description: ${alert.description}\n` +
               `Source: ${alert.source}\n` +
               `Time: ${alert.timestamp}\n` +
               `Alert ID: ${alert.id}`;
      
      case 'html':
        return `<h2>🚨 ${alert.severity.name.toUpperCase()} ALERT</h2>` +
               `<h3>${alert.title}</h3>` +
               `<p><strong>Description:</strong> ${alert.description}</p>` +
               `<p><strong>Source:</strong> ${alert.source}</p>` +
               `<p><strong>Time:</strong> ${alert.timestamp}</p>` +
               `<p><strong>Alert ID:</strong> ${alert.id}</p>`;
      
      case 'json':
        return JSON.stringify(alert, null, 2);
      
      case 'slack':
        return {
          text: `🚨 ${alert.severity.name.toUpperCase()} ALERT: ${alert.title}`,
          attachments: [{
            color: this.getSeverityColor(alert.severity.name),
            fields: [
              { title: 'Description', value: alert.description, short: false },
              { title: 'Source', value: alert.source, short: true },
              { title: 'Time', value: alert.timestamp, short: true },
              { title: 'Alert ID', value: alert.id, short: true }
            ]
          }]
        };
      
      default:
        return alert.title;
    }
  }

  /**
   * Schedule alert escalation
   */
  async scheduleEscalation(alert) {
    try {
      const escalationTime = Date.now() + (alert.severity.escalateAfter * 1000);
      
      await redisClient.zadd('alert_escalations', escalationTime, JSON.stringify({
        alertId: alert.id,
        escalationLevel: alert.escalationLevel + 1,
        scheduledFor: new Date(escalationTime).toISOString()
      }));
      
      logger.debug(`Escalation scheduled for alert ${alert.id} at ${new Date(escalationTime).toISOString()}`);
      
    } catch (error) {
      logger.error('Error scheduling escalation:', error);
    }
  }

  /**
   * Start escalation scheduler
   */
  startEscalationScheduler() {
    this.escalationScheduler = setInterval(async () => {
      try {
        await this.processEscalations();
      } catch (error) {
        logger.error('Error in escalation scheduler:', error);
      }
    }, 60000); // Check every minute
  }

  /**
   * Process pending escalations
   */
  async processEscalations() {
    try {
      const now = Date.now();
      const escalations = await redisClient.zrangebyscore('alert_escalations', 0, now);
      
      for (const escalationStr of escalations) {
        const escalation = JSON.parse(escalationStr);
        const alert = this.activeAlerts.get(escalation.alertId);
        
        if (alert && !alert.resolved && !alert.acknowledged) {
          await this.escalateAlert(alert, escalation.escalationLevel);
        }
        
        // Remove processed escalation
        await redisClient.zrem('alert_escalations', escalationStr);
      }
      
    } catch (error) {
      logger.error('Error processing escalations:', error);
    }
  }

  /**
   * Escalate alert to higher level
   */
  async escalateAlert(alert, escalationLevel) {
    try {
      alert.escalated = true;
      alert.escalationLevel = escalationLevel;
      alert.lastUpdated = new Date().toISOString();
      
      alert.escalationHistory.push({
        level: escalationLevel,
        timestamp: new Date().toISOString(),
        reason: 'Automatic escalation due to timeout'
      });
      
      // Get escalation rules
      const escalationRule = this.escalationRules.get(alert.type) || 
                           this.escalationRules.get('default');
      
      if (escalationRule && escalationRule.levels[escalationLevel]) {
        const levelConfig = escalationRule.levels[escalationLevel];
        
        // Send escalation notifications
        await this.sendEscalationNotifications(alert, levelConfig);
        
        // Schedule next escalation if configured
        if (levelConfig.escalateAfter && escalationLevel < escalationRule.maxLevel) {
          setTimeout(() => {
            this.scheduleEscalation({
              ...alert,
              severity: { escalateAfter: levelConfig.escalateAfter }
            });
          }, 1000);
        }
      }
      
      // Store updated alert
      await this.storeAlert(alert);
      
      // Emit escalation event
      this.emit('alertEscalated', alert);
      
      logger.warn(`Alert escalated: ${alert.id} to level ${escalationLevel}`);
      
    } catch (error) {
      logger.error('Error escalating alert:', error);
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId, acknowledgedBy) {
    this._checkInitialized();
    
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert) {
        throw new AppError('Alert not found', 404, 'ALERT_NOT_FOUND');
      }
      
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date().toISOString();
      alert.lastUpdated = new Date().toISOString();
      
      // Remove from escalation queue
      await this.removeFromEscalation(alertId);
      
      // Store updated alert
      await this.storeAlert(alert);
      
      // Emit acknowledgment event
      this.emit('alertAcknowledged', alert);
      
      logger.info(`Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
      
      return { success: true, alertId, acknowledgedBy };
      
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId, resolvedBy, resolution) {
    this._checkInitialized();
    
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert) {
        throw new AppError('Alert not found', 404, 'ALERT_NOT_FOUND');
      }
      
      alert.resolved = true;
      alert.resolvedBy = resolvedBy;
      alert.resolvedAt = new Date().toISOString();
      alert.resolution = resolution;
      alert.status = 'resolved';
      alert.lastUpdated = new Date().toISOString();
      
      // Remove from active alerts
      this.activeAlerts.delete(alertId);
      
      // Add to history
      this.alertHistory.push(alert);
      
      // Remove from escalation queue
      await this.removeFromEscalation(alertId);
      
      // Store resolved alert
      await this.storeAlert(alert);
      
      // Emit resolution event
      this.emit('alertResolved', alert);
      
      logger.info(`Alert resolved: ${alertId} by ${resolvedBy}`);
      
      return { success: true, alertId, resolvedBy };
      
    } catch (error) {
      logger.error('Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(filters = {}) {
    this._checkInitialized();
    
    try {
      let alerts = Array.from(this.activeAlerts.values());
      
      // Apply filters
      if (filters.severity) {
        alerts = alerts.filter(alert => alert.severity.name === filters.severity);
      }
      
      if (filters.type) {
        alerts = alerts.filter(alert => alert.type === filters.type);
      }
      
      if (filters.acknowledged !== undefined) {
        alerts = alerts.filter(alert => alert.acknowledged === filters.acknowledged);
      }
      
      if (filters.source) {
        alerts = alerts.filter(alert => alert.source === filters.source);
      }
      
      // Sort by severity and timestamp
      alerts.sort((a, b) => {
        if (a.severity.level !== b.severity.level) {
          return a.severity.level - b.severity.level;
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      return alerts;
      
    } catch (error) {
      logger.error('Error getting active alerts:', error);
      throw new AppError('Failed to get active alerts', 500, 'ALERTS_GET_ERROR');
    }
  }

  // Setup methods
  async setupNotificationProviders() {
    // Email provider
    this.notificationProviders.set('email', {
      type: 'email',
      config: {
        smtp: config.email?.smtp || {},
        from: config.email?.from || 'alerts@smartpay.com'
      }
    });

    // Slack provider
    this.notificationProviders.set('slack', {
      type: 'slack',
      config: {
        webhookUrl: config.slack?.webhookUrl || '',
        channel: config.slack?.channel || '#alerts'
      }
    });

    // Webhook provider
    this.notificationProviders.set('webhook', {
      type: 'webhook',
      config: {
        url: config.webhook?.url || '',
        headers: config.webhook?.headers || {}
      }
    });
  }

  async setupAlertChannels() {
    // Immediate notification channels (Critical/High alerts)
    this.alertChannels.set('immediate', [
      { name: 'admin-email', provider: 'email', format: 'html' },
      { name: 'ops-slack', provider: 'slack', format: 'slack' },
      { name: 'pagerduty', provider: 'webhook', format: 'json' }
    ]);

    // Standard notification channels
    this.alertChannels.set('standard', [
      { name: 'team-email', provider: 'email', format: 'html' },
      { name: 'monitoring-slack', provider: 'slack', format: 'slack' }
    ]);

    // Security-specific channels
    this.alertChannels.set('security', [
      { name: 'security-team', provider: 'email', format: 'html' },
      { name: 'security-slack', provider: 'slack', format: 'slack' }
    ]);
  }

  async setupEscalationRules() {
    // Default escalation rule
    this.escalationRules.set('default', {
      maxLevel: 3,
      levels: {
        1: { escalateAfter: 900, channels: ['team-lead'] }, // 15 minutes
        2: { escalateAfter: 1800, channels: ['manager'] }, // 30 minutes
        3: { escalateAfter: null, channels: ['executive'] } // Final escalation
      }
    });

    // Critical system escalation
    this.escalationRules.set('system', {
      maxLevel: 2,
      levels: {
        1: { escalateAfter: 300, channels: ['ops-team'] }, // 5 minutes
        2: { escalateAfter: null, channels: ['cto'] } // Immediate executive escalation
      }
    });
  }

  async setupSuppressionRules() {
    // Suppress duplicate alerts within 5 minutes
    this.suppressionRules.set('duplicate-suppression', {
      timeWindow: 300,
      maxOccurrences: 1,
      condition: (rule, alert) => {
        // Implementation for duplicate detection
        return false;
      }
    });
  }

  // Utility methods
  generateAlertId() {
    return require('crypto').randomBytes(8).toString('hex');
  }

  generateFingerprint(alertData) {
    const crypto = require('crypto');
    const fingerprintData = {
      title: alertData.title,
      source: alertData.source,
      type: alertData.type
    };
    return crypto.createHash('md5').update(JSON.stringify(fingerprintData)).digest('hex');
  }

  getSeverityColor(severity) {
    const colors = {
      critical: '#ff0000',
      high: '#ff9900',
      medium: '#ffff00',
      low: '#00ff00',
      info: '#0099ff'
    };
    return colors[severity] || '#cccccc';
  }

  _checkInitialized() {
    if (!this.initialized) {
      throw new AppError('RealTimeAlertingService not initialized', 500, 'SERVICE_NOT_INITIALIZED');
    }
  }
}

module.exports = RealTimeAlertingService;
