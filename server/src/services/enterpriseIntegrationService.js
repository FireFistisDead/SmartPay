const config = require('../config/config');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const redisClient = require('../config/redis');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Enterprise Integration API Service
 * Provides enterprise-grade APIs for third-party integrations
 */
class EnterpriseIntegrationService {
  constructor() {
    this.initialized = false;
    this.integrations = new Map();
    this.webhookEndpoints = new Map();
    this.apiKeys = new Map();
    
    // Supported integration types
    this.integrationTypes = {
      WEBHOOK: 'webhook',
      REST_API: 'rest_api',
      GRAPHQL: 'graphql',
      WEBSOCKET: 'websocket',
      BATCH_API: 'batch_api'
    };
    
    // Rate limiting configurations
    this.rateLimits = {
      basic: { requests: 1000, window: 3600 }, // 1000 per hour
      premium: { requests: 10000, window: 3600 }, // 10k per hour
      enterprise: { requests: 100000, window: 3600 } // 100k per hour
    };
    
    // API versioning
    this.apiVersions = ['v1', 'v2'];
    this.currentVersion = 'v2';
  }

  /**
   * Initialize enterprise integration service
   */
  async initialize() {
    try {
      // Load existing integrations and API keys
      await this.loadIntegrations();
      await this.loadAPIKeys();
      
      // Initialize webhook infrastructure
      await this.initializeWebhooks();
      
      this.initialized = true;
      logger.info('EnterpriseIntegrationService initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize EnterpriseIntegrationService:', error);
      throw error;
    }
  }

  /**
   * Load existing integrations from storage
   */
  async loadIntegrations() {
    try {
      // In a real implementation, this would load from database
      // For now, initialize empty
      logger.debug('Loading existing integrations...');
      // this.integrations = await database.getIntegrations();
    } catch (error) {
      logger.error('Error loading integrations:', error);
      throw error;
    }
  }

  /**
   * Load existing API keys from storage
   */
  async loadAPIKeys() {
    try {
      // In a real implementation, this would load from database
      // For now, initialize empty
      logger.debug('Loading existing API keys...');
      // this.apiKeys = await database.getAPIKeys();
    } catch (error) {
      logger.error('Error loading API keys:', error);
      throw error;
    }
  }

  /**
   * Initialize webhook infrastructure
   */
  async initializeWebhooks() {
    try {
      // In a real implementation, this would set up webhook endpoints
      logger.debug('Initializing webhook infrastructure...');
      // Setup webhook endpoints, verify configurations, etc.
    } catch (error) {
      logger.error('Error initializing webhooks:', error);
      throw error;
    }
  }

  /**
   * Register a new enterprise integration
   */
  async registerIntegration(config) {
    this._checkInitialized();
    
    try {
      const {
        name,
        type,
        description,
        company,
        contactEmail,
        tier = 'basic',
        endpoints = [],
        webhookUrl,
        authentication = {}
      } = config;
      
      // Validate integration config
      this.validateIntegrationConfig(config);
      
      // Generate unique integration ID and API key
      const integrationId = this.generateIntegrationId();
      const apiKey = this.generateAPIKey();
      const secretKey = this.generateSecretKey();
      
      const integration = {
        id: integrationId,
        name,
        type,
        description,
        company,
        contactEmail,
        tier,
        endpoints,
        webhookUrl,
        authentication,
        apiKey,
        secretKey,
        status: 'pending',
        createdAt: new Date().toISOString(),
        lastUsed: null,
        usageStats: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          lastRequest: null
        }
      };
      
      // Store integration
      await this.storeIntegration(integration);
      
      // Setup rate limiting
      await this.setupRateLimiting(integrationId, tier);
      
      logger.info(`Enterprise integration registered: ${name} (${integrationId})`);
      
      return {
        success: true,
        integrationId,
        apiKey,
        secretKey,
        status: 'pending',
        endpoints: this.getIntegrationEndpoints(type),
        documentation: this.getDocumentationUrl(type),
        testCredentials: this.generateTestCredentials(integrationId)
      };
      
    } catch (error) {
      logger.error('Error registering enterprise integration:', error);
      throw new AppError('Integration registration failed', 500, 'INTEGRATION_REGISTRATION_ERROR');
    }
  }

  /**
   * Approve or reject integration
   */
  async updateIntegrationStatus(integrationId, status, notes = '') {
    this._checkInitialized();
    
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        throw new AppError('Integration not found', 404, 'INTEGRATION_NOT_FOUND');
      }
      
      integration.status = status;
      integration.statusNotes = notes;
      integration.updatedAt = new Date().toISOString();
      
      if (status === 'approved') {
        integration.approvedAt = new Date().toISOString();
        // Setup production resources
        await this.setupProductionResources(integration);
      }
      
      await this.storeIntegration(integration);
      
      // Send notification
      await this.notifyIntegrationStatusUpdate(integration);
      
      logger.info(`Integration ${integrationId} status updated to: ${status}`);
      
      return { success: true, status, updatedAt: integration.updatedAt };
      
    } catch (error) {
      logger.error('Error updating integration status:', error);
      throw new AppError('Status update failed', 500, 'STATUS_UPDATE_ERROR');
    }
  }

  /**
   * Handle enterprise API requests
   */
  async handleAPIRequest(integrationId, apiKey, endpoint, method, data, headers = {}) {
    this._checkInitialized();
    
    try {
      // Authenticate and validate
      const integration = await this.authenticateRequest(integrationId, apiKey);
      
      // Check rate limits
      await this.checkRateLimit(integrationId);
      
      // Log request
      await this.logAPIRequest(integrationId, endpoint, method, headers);
      
      // Route to appropriate handler
      const result = await this.routeAPIRequest(integration, endpoint, method, data, headers);
      
      // Update usage stats
      await this.updateUsageStats(integrationId, true);
      
      return result;
      
    } catch (error) {
      // Update failure stats
      await this.updateUsageStats(integrationId, false);
      
      logger.error('Enterprise API request failed:', error);
      throw error;
    }
  }

  /**
   * Setup webhook for enterprise integration
   */
  async setupWebhook(integrationId, webhookConfig) {
    this._checkInitialized();
    
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        throw new AppError('Integration not found', 404, 'INTEGRATION_NOT_FOUND');
      }
      
      const {
        url,
        events = [],
        secret,
        retryPolicy = { maxRetries: 3, backoffMultiplier: 2 }
      } = webhookConfig;
      
      // Validate webhook URL
      await this.validateWebhookURL(url);
      
      const webhook = {
        id: this.generateWebhookId(),
        integrationId,
        url,
        events,
        secret: secret || this.generateWebhookSecret(),
        retryPolicy,
        status: 'active',
        createdAt: new Date().toISOString(),
        stats: {
          totalDeliveries: 0,
          successfulDeliveries: 0,
          failedDeliveries: 0,
          lastDelivery: null
        }
      };
      
      // Store webhook
      await this.storeWebhook(webhook);
      
      // Test webhook
      await this.testWebhookDelivery(webhook);
      
      logger.info(`Webhook setup for integration ${integrationId}: ${url}`);
      
      return {
        success: true,
        webhookId: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret
      };
      
    } catch (error) {
      logger.error('Error setting up webhook:', error);
      throw new AppError('Webhook setup failed', 500, 'WEBHOOK_SETUP_ERROR');
    }
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(integrationId, eventType, payload) {
    this._checkInitialized();
    
    try {
      const webhooks = await this.getWebhooksByIntegration(integrationId);
      const relevantWebhooks = webhooks.filter(w => 
        w.status === 'active' && w.events.includes(eventType)
      );
      
      if (relevantWebhooks.length === 0) {
        logger.debug(`No active webhooks for event ${eventType} in integration ${integrationId}`);
        return;
      }
      
      const deliveryPromises = relevantWebhooks.map(webhook =>
        this.deliverWebhook(webhook, eventType, payload)
      );
      
      await Promise.allSettled(deliveryPromises);
      
    } catch (error) {
      logger.error('Error sending webhooks:', error);
    }
  }

  /**
   * Get integration analytics
   */
  async getIntegrationAnalytics(integrationId, timeframe = '30d') {
    this._checkInitialized();
    
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        throw new AppError('Integration not found', 404, 'INTEGRATION_NOT_FOUND');
      }
      
      // Get usage analytics
      const analytics = await this.calculateIntegrationAnalytics(integrationId, timeframe);
      
      return {
        integrationId,
        timeframe,
        analytics: {
          requests: analytics.requests,
          errors: analytics.errors,
          latency: analytics.latency,
          uptime: analytics.uptime,
          webhookDeliveries: analytics.webhookDeliveries
        },
        trends: analytics.trends,
        recommendations: this.generateOptimizationRecommendations(analytics)
      };
      
    } catch (error) {
      logger.error('Error getting integration analytics:', error);
      throw new AppError('Analytics retrieval failed', 500, 'ANALYTICS_ERROR');
    }
  }

  /**
   * Generate batch API token
   */
  async generateBatchAPIToken(integrationId, operations, expiresIn = '1h') {
    this._checkInitialized();
    
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        throw new AppError('Integration not found', 404, 'INTEGRATION_NOT_FOUND');
      }
      
      if (integration.tier === 'basic') {
        throw new AppError('Batch API not available for basic tier', 403, 'BATCH_API_NOT_AVAILABLE');
      }
      
      // Validate batch operations
      this.validateBatchOperations(operations);
      
      const batchToken = jwt.sign({
        integrationId,
        operations,
        type: 'batch',
        iat: Math.floor(Date.now() / 1000)
      }, integration.secretKey, { expiresIn });
      
      logger.info(`Batch API token generated for integration ${integrationId}`);
      
      return {
        success: true,
        batchToken,
        expiresIn,
        operations: operations.length,
        batchEndpoint: `/api/enterprise/v2/batch/${integrationId}`
      };
      
    } catch (error) {
      logger.error('Error generating batch API token:', error);
      throw new AppError('Batch token generation failed', 500, 'BATCH_TOKEN_ERROR');
    }
  }

  /**
   * Execute batch operations
   */
  async executeBatchOperations(integrationId, batchToken, operations) {
    this._checkInitialized();
    
    try {
      // Verify batch token
      const integration = await this.getIntegration(integrationId);
      const decoded = jwt.verify(batchToken, integration.secretKey);
      
      if (decoded.type !== 'batch' || decoded.integrationId !== integrationId) {
        throw new AppError('Invalid batch token', 401, 'INVALID_BATCH_TOKEN');
      }
      
      logger.info(`Executing batch operations for integration ${integrationId}: ${operations.length} operations`);
      
      // Execute operations in parallel with concurrency control
      const results = await this.executeBatchWithConcurrencyControl(operations, integration);
      
      return {
        success: true,
        totalOperations: operations.length,
        successfulOperations: results.filter(r => r.success).length,
        failedOperations: results.filter(r => !r.success).length,
        results,
        executedAt: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('Error executing batch operations:', error);
      throw new AppError('Batch execution failed', 500, 'BATCH_EXECUTION_ERROR');
    }
  }

  // Helper Methods
  validateIntegrationConfig(config) {
    const required = ['name', 'type', 'company', 'contactEmail'];
    for (const field of required) {
      if (!config[field]) {
        throw new AppError(`Missing required field: ${field}`, 400, 'INVALID_CONFIG');
      }
    }
    
    if (!Object.values(this.integrationTypes).includes(config.type)) {
      throw new AppError('Invalid integration type', 400, 'INVALID_TYPE');
    }
  }

  generateIntegrationId() {
    return 'ent_' + Date.now() + '_' + crypto.randomBytes(8).toString('hex');
  }

  generateAPIKey() {
    return 'ak_' + crypto.randomBytes(32).toString('hex');
  }

  generateSecretKey() {
    return crypto.randomBytes(64).toString('hex');
  }

  generateWebhookId() {
    return 'wh_' + crypto.randomBytes(16).toString('hex');
  }

  generateWebhookSecret() {
    return 'whsec_' + crypto.randomBytes(32).toString('hex');
  }

  getIntegrationEndpoints(type) {
    const baseUrl = process.env.API_BASE_URL || 'https://api.smartpay.com';
    
    return {
      [this.integrationTypes.REST_API]: [
        `${baseUrl}/api/enterprise/v2/jobs`,
        `${baseUrl}/api/enterprise/v2/users`,
        `${baseUrl}/api/enterprise/v2/payments`,
        `${baseUrl}/api/enterprise/v2/analytics`
      ],
      [this.integrationTypes.WEBHOOK]: [
        `${baseUrl}/api/enterprise/webhooks`
      ],
      [this.integrationTypes.BATCH_API]: [
        `${baseUrl}/api/enterprise/v2/batch`
      ]
    }[type] || [];
  }

  async storeIntegration(integration) {
    await redisClient.set(`integration:${integration.id}`, JSON.stringify(integration), { ttl: 86400 * 30 });
    this.integrations.set(integration.id, integration);
  }

  async getIntegration(integrationId) {
    if (this.integrations.has(integrationId)) {
      return this.integrations.get(integrationId);
    }
    
    const data = await redisClient.get(`integration:${integrationId}`);
    if (data) {
      const integration = JSON.parse(data);
      this.integrations.set(integrationId, integration);
      return integration;
    }
    
    return null;
  }

  async authenticateRequest(integrationId, apiKey) {
    const integration = await this.getIntegration(integrationId);
    
    if (!integration) {
      throw new AppError('Integration not found', 404, 'INTEGRATION_NOT_FOUND');
    }
    
    if (integration.status !== 'approved') {
      throw new AppError('Integration not approved', 403, 'INTEGRATION_NOT_APPROVED');
    }
    
    if (integration.apiKey !== apiKey) {
      throw new AppError('Invalid API key', 401, 'INVALID_API_KEY');
    }
    
    return integration;
  }

  async checkRateLimit(integrationId) {
    const integration = await this.getIntegration(integrationId);
    const limit = this.rateLimits[integration.tier];
    
    const key = `rate_limit:${integrationId}`;
    const current = await redisClient.get(key) || 0;
    
    if (parseInt(current) >= limit.requests) {
      throw new AppError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    }
    
    await redisClient.incr(key);
    await redisClient.expire(key, limit.window);
  }

  _checkInitialized() {
    if (!this.initialized) {
      throw new AppError('EnterpriseIntegrationService not initialized', 500, 'SERVICE_NOT_INITIALIZED');
    }
  }
}

module.exports = EnterpriseIntegrationService;
