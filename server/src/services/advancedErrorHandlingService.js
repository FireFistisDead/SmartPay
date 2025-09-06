const logger = require('../utils/logger');
const redisClient = require('../config/redis');
const config = require('../config/config');
const { AppError } = require('../middleware/errorHandler');

/**
 * Advanced Error Handling Service - Phase 5
 * Provides comprehensive error tracking, categorization, and recovery mechanisms
 */
class AdvancedErrorHandlingService {
  constructor() {
    this.initialized = false;
    this.errorCategories = {
      BLOCKCHAIN: 'blockchain',
      DATABASE: 'database',
      EXTERNAL_API: 'external_api',
      VALIDATION: 'validation',
      AUTHENTICATION: 'authentication',
      AUTHORIZATION: 'authorization',
      BUSINESS_LOGIC: 'business_logic',
      NETWORK: 'network',
      SYSTEM: 'system',
      UNKNOWN: 'unknown'
    };
    
    this.severityLevels = {
      CRITICAL: 'critical',
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low',
      INFO: 'info'
    };
    
    this.errorPatterns = new Map();
    this.recoveryStrategies = new Map();
    this.errorMetrics = {
      totalErrors: 0,
      categorizedErrors: {},
      recentErrors: [],
      recoveryAttempts: 0,
      successfulRecoveries: 0
    };
    
    this.alertThresholds = {
      errorRate: 10, // errors per minute
      criticalErrors: 1, // immediate alert
      systemErrors: 5, // system errors in 5 minutes
      recoveryFailures: 3 // consecutive recovery failures
    };
  }

  /**
   * Initialize error handling service
   */
  async initialize() {
    try {
      await this.loadErrorPatterns();
      await this.setupRecoveryStrategies();
      await this.initializeMetrics();
      
      this.initialized = true;
      logger.info('AdvancedErrorHandlingService initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize AdvancedErrorHandlingService:', error);
      throw error;
    }
  }

  /**
   * Handle and categorize errors
   */
  async handleError(error, context = {}) {
    this._checkInitialized();
    
    try {
      // Enrich error with context
      const enrichedError = await this.enrichError(error, context);
      
      // Categorize error
      const category = this.categorizeError(enrichedError);
      
      // Determine severity
      const severity = this.determineSeverity(enrichedError, category);
      
      // Create error record
      const errorRecord = {
        id: this.generateErrorId(),
        timestamp: new Date().toISOString(),
        error: {
          message: enrichedError.message,
          stack: enrichedError.stack,
          code: enrichedError.code || 'UNKNOWN',
          name: enrichedError.name
        },
        category,
        severity,
        context,
        metadata: this.extractMetadata(enrichedError),
        fingerprint: this.generateFingerprint(enrichedError)
      };
      
      // Store error
      await this.storeError(errorRecord);
      
      // Update metrics
      await this.updateErrorMetrics(errorRecord);
      
      // Check for patterns
      await this.checkErrorPatterns(errorRecord);
      
      // Attempt recovery if applicable
      const recoveryResult = await this.attemptRecovery(errorRecord);
      
      // Send alerts if necessary
      await this.checkAlertConditions(errorRecord);
      
      // Log structured error
      this.logStructuredError(errorRecord, recoveryResult);
      
      return {
        errorId: errorRecord.id,
        category: errorRecord.category,
        severity: errorRecord.severity,
        recovery: recoveryResult,
        handled: true
      };
      
    } catch (handlingError) {
      logger.error('Error in error handling:', handlingError);
      // Fallback error handling
      return this.fallbackErrorHandling(error, handlingError);
    }
  }

  /**
   * Categorize error based on type and context
   */
  categorizeError(error) {
    // Blockchain errors
    if (this.isBlockchainError(error)) {
      return this.errorCategories.BLOCKCHAIN;
    }
    
    // Database errors
    if (this.isDatabaseError(error)) {
      return this.errorCategories.DATABASE;
    }
    
    // External API errors
    if (this.isExternalAPIError(error)) {
      return this.errorCategories.EXTERNAL_API;
    }
    
    // Validation errors
    if (this.isValidationError(error)) {
      return this.errorCategories.VALIDATION;
    }
    
    // Authentication errors
    if (this.isAuthenticationError(error)) {
      return this.errorCategories.AUTHENTICATION;
    }
    
    // Authorization errors
    if (this.isAuthorizationError(error)) {
      return this.errorCategories.AUTHORIZATION;
    }
    
    // Network errors
    if (this.isNetworkError(error)) {
      return this.errorCategories.NETWORK;
    }
    
    // System errors
    if (this.isSystemError(error)) {
      return this.errorCategories.SYSTEM;
    }
    
    return this.errorCategories.UNKNOWN;
  }

  /**
   * Determine error severity
   */
  determineSeverity(error, category) {
    // Critical errors that require immediate attention
    if (this.isCriticalError(error, category)) {
      return this.severityLevels.CRITICAL;
    }
    
    // High severity errors
    if (this.isHighSeverityError(error, category)) {
      return this.severityLevels.HIGH;
    }
    
    // Medium severity errors
    if (this.isMediumSeverityError(error, category)) {
      return this.severityLevels.MEDIUM;
    }
    
    // Low severity errors
    if (this.isLowSeverityError(error, category)) {
      return this.severityLevels.LOW;
    }
    
    return this.severityLevels.INFO;
  }

  /**
   * Attempt error recovery
   */
  async attemptRecovery(errorRecord) {
    try {
      const recoveryStrategy = this.recoveryStrategies.get(errorRecord.category);
      
      if (!recoveryStrategy) {
        return { attempted: false, reason: 'No recovery strategy available' };
      }
      
      logger.info(`Attempting recovery for error: ${errorRecord.id}`);
      
      const recoveryResult = await recoveryStrategy(errorRecord);
      
      // Update recovery metrics
      this.errorMetrics.recoveryAttempts++;
      if (recoveryResult.success) {
        this.errorMetrics.successfulRecoveries++;
      }
      
      return {
        attempted: true,
        success: recoveryResult.success,
        strategy: recoveryResult.strategy,
        details: recoveryResult.details,
        timestamp: new Date().toISOString()
      };
      
    } catch (recoveryError) {
      logger.error('Error during recovery attempt:', recoveryError);
      return {
        attempted: true,
        success: false,
        error: recoveryError.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check for error patterns and anomalies
   */
  async checkErrorPatterns(errorRecord) {
    const patternKey = `error_pattern:${errorRecord.fingerprint}`;
    const timeWindow = 300; // 5 minutes
    
    try {
      // Increment pattern counter
      const count = await redisClient.incr(patternKey);
      await redisClient.expire(patternKey, timeWindow);
      
      // Check for repeated errors
      if (count >= 5) {
        await this.handleRepeatedError(errorRecord, count);
      }
      
      // Check for error spikes
      await this.checkErrorSpike(errorRecord);
      
      // Analyze error trends
      await this.analyzeErrorTrends(errorRecord);
      
    } catch (error) {
      logger.error('Error checking patterns:', error);
    }
  }

  /**
   * Enhanced error enrichment
   */
  async enrichError(error, context) {
    const enriched = {
      ...error,
      enrichedAt: new Date().toISOString(),
      context: {
        ...context,
        userAgent: context.userAgent || 'unknown',
        ip: context.ip || 'unknown',
        userId: context.userId || 'anonymous',
        sessionId: context.sessionId || 'unknown',
        requestId: context.requestId || this.generateRequestId(),
        service: context.service || 'unknown',
        version: config.version || '1.0.0'
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    };
    
    // Add blockchain context if applicable
    if (context.blockchain) {
      enriched.blockchain = {
        network: context.blockchain.network,
        blockNumber: context.blockchain.blockNumber,
        gasPrice: context.blockchain.gasPrice,
        transactionHash: context.blockchain.transactionHash
      };
    }
    
    return enriched;
  }

  /**
   * Generate error fingerprint for deduplication
   */
  generateFingerprint(error) {
    const crypto = require('crypto');
    const fingerprintData = {
      message: error.message,
      stack: error.stack ? error.stack.split('\n')[0] : '',
      code: error.code || '',
      name: error.name || ''
    };
    
    return crypto
      .createHash('md5')
      .update(JSON.stringify(fingerprintData))
      .digest('hex');
  }

  /**
   * Store error in database and cache
   */
  async storeError(errorRecord) {
    try {
      // Store in Redis for quick access
      const errorKey = `error:${errorRecord.id}`;
      await redisClient.setex(errorKey, 86400, JSON.stringify(errorRecord));
      
      // Store in recent errors list
      await redisClient.lpush('recent_errors', JSON.stringify(errorRecord));
      await redisClient.ltrim('recent_errors', 0, 99); // Keep last 100 errors
      
      // Store error metrics
      await this.updateErrorMetrics(errorRecord);
      
    } catch (error) {
      logger.error('Error storing error record:', error);
    }
  }

  /**
   * Update error metrics
   */
  async updateErrorMetrics(errorRecord) {
    try {
      this.errorMetrics.totalErrors++;
      
      if (!this.errorMetrics.categorizedErrors[errorRecord.category]) {
        this.errorMetrics.categorizedErrors[errorRecord.category] = 0;
      }
      this.errorMetrics.categorizedErrors[errorRecord.category]++;
      
      // Store in Redis
      await redisClient.hmset('error_metrics', {
        totalErrors: this.errorMetrics.totalErrors,
        lastUpdated: new Date().toISOString()
      });
      
      // Update category metrics
      await redisClient.hincrby('error_categories', errorRecord.category, 1);
      
    } catch (error) {
      logger.error('Error updating metrics:', error);
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStatistics(timeframe = '24h') {
    this._checkInitialized();
    
    try {
      const now = new Date();
      const timeframMs = this.parseTimeframe(timeframe);
      const startTime = new Date(now.getTime() - timeframMs);
      
      // Get recent errors
      const recentErrorsStr = await redisClient.lrange('recent_errors', 0, -1);
      const recentErrors = recentErrorsStr.map(str => JSON.parse(str));
      
      // Filter by timeframe
      const filteredErrors = recentErrors.filter(error => 
        new Date(error.timestamp) >= startTime
      );
      
      // Calculate statistics
      const stats = {
        timeframe,
        totalErrors: filteredErrors.length,
        errorsByCategory: {},
        errorsBySeverity: {},
        errorRate: filteredErrors.length / (timeframMs / 3600000), // errors per hour
        topErrors: this.getTopErrors(filteredErrors),
        trends: await this.calculateErrorTrends(filteredErrors),
        recoveryRate: this.calculateRecoveryRate()
      };
      
      // Group by category
      filteredErrors.forEach(error => {
        stats.errorsByCategory[error.category] = 
          (stats.errorsByCategory[error.category] || 0) + 1;
        stats.errorsBySeverity[error.severity] = 
          (stats.errorsBySeverity[error.severity] || 0) + 1;
      });
      
      return stats;
      
    } catch (error) {
      logger.error('Error getting error statistics:', error);
      throw new AppError('Failed to get error statistics', 500, 'ERROR_STATS_ERROR');
    }
  }

  // Helper methods for error classification
  isBlockchainError(error) {
    const blockchainKeywords = ['gas', 'revert', 'transaction', 'block', 'ethereum', 'web3'];
    return blockchainKeywords.some(keyword => 
      error.message.toLowerCase().includes(keyword) ||
      error.stack?.toLowerCase().includes(keyword)
    );
  }

  isDatabaseError(error) {
    return error.name === 'MongoError' || 
           error.name === 'ValidationError' ||
           error.message.includes('database') ||
           error.message.includes('connection');
  }

  isExternalAPIError(error) {
    return error.code === 'ECONNREFUSED' ||
           error.code === 'ENOTFOUND' ||
           error.message.includes('API') ||
           error.message.includes('HTTP');
  }

  isValidationError(error) {
    return error.name === 'ValidationError' ||
           error.code === 'VALIDATION_ERROR' ||
           error.message.includes('validation');
  }

  isAuthenticationError(error) {
    return error.code === 'AUTHENTICATION_ERROR' ||
           error.message.includes('authentication') ||
           error.message.includes('unauthorized');
  }

  isAuthorizationError(error) {
    return error.code === 'AUTHORIZATION_ERROR' ||
           error.message.includes('authorization') ||
           error.message.includes('forbidden');
  }

  isNetworkError(error) {
    return error.code === 'ECONNREFUSED' ||
           error.code === 'ENOTFOUND' ||
           error.code === 'ETIMEDOUT';
  }

  isSystemError(error) {
    return error.code === 'ENOENT' ||
           error.code === 'ENOMEM' ||
           error.message.includes('system');
  }

  // Severity determination helpers
  isCriticalError(error, category) {
    return category === this.errorCategories.SYSTEM ||
           error.message.includes('critical') ||
           error.message.includes('fatal');
  }

  isHighSeverityError(error, category) {
    return category === this.errorCategories.BLOCKCHAIN ||
           category === this.errorCategories.DATABASE ||
           error.message.includes('high');
  }

  isMediumSeverityError(error, category) {
    return category === this.errorCategories.EXTERNAL_API ||
           category === this.errorCategories.AUTHENTICATION;
  }

  isLowSeverityError(error, category) {
    return category === this.errorCategories.VALIDATION ||
           category === this.errorCategories.AUTHORIZATION;
  }

  // Utility methods
  generateErrorId() {
    return require('crypto').randomBytes(16).toString('hex');
  }

  generateRequestId() {
    return require('crypto').randomBytes(8).toString('hex');
  }

  parseTimeframe(timeframe) {
    const timeframes = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000,
      '30d': 2592000000
    };
    return timeframes[timeframe] || 86400000;
  }

  _checkInitialized() {
    if (!this.initialized) {
      throw new AppError('AdvancedErrorHandlingService not initialized', 500, 'SERVICE_NOT_INITIALIZED');
    }
  }
}

module.exports = AdvancedErrorHandlingService;
