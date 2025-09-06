const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const DOMPurify = require('isomorphic-dompurify');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');
const { AppError } = require('../middleware/errorHandler');

/**
 * Security Service - Advanced security features and utilities
 */
class SecurityService {
  constructor() {
    this.saltRounds = 12;
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    this.auditLog = [];
    this.suspiciousPatterns = new Map();
    
    // Security configuration
    this.securityConfig = {
      encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16,
        tagLength: 16
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      },
      csrf: {
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        }
      }
    };
  }

  /**
   * Rate limiting middleware factory
   */
  createRateLimit(options = {}) {
    const limitConfig = {
      windowMs: options.windowMs || this.securityConfig.rateLimit.windowMs,
      max: options.max || this.securityConfig.rateLimit.maxRequests,
      message: options.message || 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
      store: options.store,
      keyGenerator: options.keyGenerator || ((req) => req.ip),
      handler: (req, res) => {
        this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          method: req.method
        });
        
        res.status(429).json({
          success: false,
          message: 'Rate limit exceeded',
          retryAfter: Math.round(options.windowMs / 1000)
        });
      }
    };

    // Use Redis store for distributed rate limiting
    if (redisClient) {
      const RedisStore = require('rate-limit-redis');
      limitConfig.store = new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
      });
    }

    return rateLimit(limitConfig);
  }

  /**
   * Enhanced input validation and sanitization
   */
  validateAndSanitize(data, schema) {
    const sanitized = {};
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // Check required fields
      if (rules.required && (!value || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value === undefined || value === null) {
        if (rules.default !== undefined) {
          sanitized[field] = rules.default;
        }
        continue;
      }

      // Type validation
      if (rules.type) {
        switch (rules.type) {
          case 'email':
            if (!validator.isEmail(value)) {
              errors.push(`${field} must be a valid email`);
              continue;
            }
            sanitized[field] = validator.normalizeEmail(value);
            break;

          case 'url':
            if (!validator.isURL(value)) {
              errors.push(`${field} must be a valid URL`);
              continue;
            }
            sanitized[field] = value;
            break;

          case 'ethereum_address':
            if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
              errors.push(`${field} must be a valid Ethereum address`);
              continue;
            }
            sanitized[field] = value.toLowerCase();
            break;

          case 'string':
            if (typeof value !== 'string') {
              errors.push(`${field} must be a string`);
              continue;
            }
            // Sanitize HTML
            sanitized[field] = DOMPurify.sanitize(value);
            break;

          case 'number':
            const num = Number(value);
            if (isNaN(num)) {
              errors.push(`${field} must be a number`);
              continue;
            }
            sanitized[field] = num;
            break;

          case 'boolean':
            sanitized[field] = Boolean(value);
            break;

          default:
            sanitized[field] = value;
        }
      }

      // Length validation
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must not exceed ${rules.maxLength} characters`);
      }

      // Custom validation
      if (rules.validate && typeof rules.validate === 'function') {
        const customError = rules.validate(value);
        if (customError) {
          errors.push(customError);
        }
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
    }

    return {
      isValid: errors.length === 0,
      data: sanitized,
      errors
    };
  }

  /**
   * Advanced password security
   */
  async hashPassword(password) {
    // Validate password strength
    const strengthCheck = this.checkPasswordStrength(password);
    if (!strengthCheck.isStrong) {
      throw new AppError(`Password is weak: ${strengthCheck.issues.join(', ')}`, 400, 'WEAK_PASSWORD');
    }

    const salt = await bcrypt.genSalt(this.saltRounds);
    return await bcrypt.hash(password, salt);
  }

  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  checkPasswordStrength(password) {
    const issues = [];
    
    if (password.length < 8) {
      issues.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      issues.push('Password must contain lowercase letters');
    }
    
    if (!/[A-Z]/.test(password)) {
      issues.push('Password must contain uppercase letters');
    }
    
    if (!/[0-9]/.test(password)) {
      issues.push('Password must contain numbers');
    }
    
    if (!/[^a-zA-Z0-9]/.test(password)) {
      issues.push('Password must contain special characters');
    }

    // Check for common patterns
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        issues.push('Password contains common patterns');
        break;
      }
    }

    return {
      isStrong: issues.length === 0,
      issues,
      score: Math.max(0, 100 - (issues.length * 20))
    };
  }

  /**
   * Account lockout protection
   */
  async checkAccountLockout(identifier) {
    const key = `lockout:${identifier}`;
    const lockData = await redisClient.get(key);
    
    if (lockData) {
      const data = JSON.parse(lockData);
      const now = Date.now();
      
      if (data.lockedUntil && now < data.lockedUntil) {
        const remainingTime = Math.ceil((data.lockedUntil - now) / 1000);
        throw new AppError(
          `Account locked due to too many failed attempts. Try again in ${remainingTime} seconds`,
          423,
          'ACCOUNT_LOCKED'
        );
      }
    }
  }

  async recordFailedLogin(identifier) {
    const key = `lockout:${identifier}`;
    const lockData = await redisClient.get(key);
    let data = lockData ? JSON.parse(lockData) : { attempts: 0 };
    
    data.attempts += 1;
    data.lastAttempt = Date.now();
    
    if (data.attempts >= this.maxLoginAttempts) {
      data.lockedUntil = Date.now() + this.lockoutDuration;
      
      this.logSecurityEvent('ACCOUNT_LOCKED', {
        identifier,
        attempts: data.attempts,
        lockedUntil: new Date(data.lockedUntil)
      });
    }
    
    await redisClient.setex(key, this.lockoutDuration / 1000, JSON.stringify(data));
    
    return {
      attempts: data.attempts,
      maxAttempts: this.maxLoginAttempts,
      lockedUntil: data.lockedUntil
    };
  }

  async resetFailedLogins(identifier) {
    const key = `lockout:${identifier}`;
    await redisClient.del(key);
  }

  /**
   * Session security
   */
  async createSecureSession(userId, metadata = {}) {
    const sessionId = this.generateSecureToken(32);
    const sessionData = {
      userId,
      sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      deviceFingerprint: metadata.deviceFingerprint,
      isActive: true
    };

    const key = `session:${sessionId}`;
    await redisClient.setex(key, this.sessionTimeout / 1000, JSON.stringify(sessionData));
    
    // Also store by user ID for session management
    const userSessionsKey = `user_sessions:${userId}`;
    await redisClient.sadd(userSessionsKey, sessionId);
    await redisClient.expire(userSessionsKey, this.sessionTimeout / 1000);

    this.logSecurityEvent('SESSION_CREATED', {
      userId,
      sessionId,
      ipAddress: metadata.ipAddress
    });

    return sessionId;
  }

  async validateSession(sessionId) {
    const key = `session:${sessionId}`;
    const sessionData = await redisClient.get(key);
    
    if (!sessionData) {
      throw new AppError('Invalid or expired session', 401, 'INVALID_SESSION');
    }

    const session = JSON.parse(sessionData);
    const now = Date.now();
    
    // Check session timeout
    if (now - session.lastActivity > this.sessionTimeout) {
      await this.invalidateSession(sessionId);
      throw new AppError('Session expired', 401, 'SESSION_EXPIRED');
    }

    // Update last activity
    session.lastActivity = now;
    await redisClient.setex(key, this.sessionTimeout / 1000, JSON.stringify(session));

    return session;
  }

  async invalidateSession(sessionId) {
    const key = `session:${sessionId}`;
    const sessionData = await redisClient.get(key);
    
    if (sessionData) {
      const session = JSON.parse(sessionData);
      const userSessionsKey = `user_sessions:${session.userId}`;
      await redisClient.srem(userSessionsKey, sessionId);
      
      this.logSecurityEvent('SESSION_INVALIDATED', {
        userId: session.userId,
        sessionId
      });
    }
    
    await redisClient.del(key);
  }

  async invalidateAllUserSessions(userId) {
    const userSessionsKey = `user_sessions:${userId}`;
    const sessionIds = await redisClient.smembers(userSessionsKey);
    
    for (const sessionId of sessionIds) {
      await redisClient.del(`session:${sessionId}`);
    }
    
    await redisClient.del(userSessionsKey);
    
    this.logSecurityEvent('ALL_SESSIONS_INVALIDATED', { userId });
  }

  /**
   * Encryption utilities
   */
  encrypt(text, key = null) {
    try {
      const encryptionKey = key || Buffer.from(config.security.encryptionKey, 'hex');
      const iv = crypto.randomBytes(this.securityConfig.encryption.ivLength);
      const cipher = crypto.createCipher(this.securityConfig.encryption.algorithm, encryptionKey, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      logger.error('Encryption error:', error);
      throw new AppError('Encryption failed', 500, 'ENCRYPTION_ERROR');
    }
  }

  decrypt(encryptedData, key = null) {
    try {
      const { encrypted, iv, tag } = encryptedData;
      const encryptionKey = key || Buffer.from(config.security.encryptionKey, 'hex');
      
      const decipher = crypto.createDecipher(
        this.securityConfig.encryption.algorithm,
        encryptionKey,
        Buffer.from(iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption error:', error);
      throw new AppError('Decryption failed', 500, 'DECRYPTION_ERROR');
    }
  }

  /**
   * Security token generation
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  generateCSRFToken() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Security monitoring
   */
  logSecurityEvent(eventType, details = {}) {
    const event = {
      type: eventType,
      timestamp: new Date(),
      details,
      severity: this.getEventSeverity(eventType)
    };

    this.auditLog.push(event);
    
    // Log to file/database
    logger.info('Security event:', event);
    
    // Check for suspicious patterns
    this.analyzeSuspiciousActivity(event);
    
    // Keep audit log size manageable
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-500);
    }
  }

  getEventSeverity(eventType) {
    const severityMap = {
      'LOGIN_SUCCESS': 'low',
      'LOGIN_FAILED': 'medium',
      'ACCOUNT_LOCKED': 'high',
      'SESSION_CREATED': 'low',
      'SESSION_INVALIDATED': 'low',
      'RATE_LIMIT_EXCEEDED': 'medium',
      'SUSPICIOUS_ACTIVITY': 'high',
      'UNAUTHORIZED_ACCESS': 'critical'
    };
    
    return severityMap[eventType] || 'medium';
  }

  analyzeSuspiciousActivity(event) {
    const { type, details } = event;
    
    // Track patterns by IP
    if (details.ipAddress) {
      const key = details.ipAddress;
      const pattern = this.suspiciousPatterns.get(key) || { events: [], score: 0 };
      
      pattern.events.push(event);
      
      // Calculate suspicion score
      if (type === 'LOGIN_FAILED') pattern.score += 10;
      if (type === 'RATE_LIMIT_EXCEEDED') pattern.score += 20;
      if (type === 'ACCOUNT_LOCKED') pattern.score += 50;
      
      // Check for rapid successive events
      const recentEvents = pattern.events.filter(e => 
        Date.now() - new Date(e.timestamp).getTime() < 5 * 60 * 1000 // 5 minutes
      );
      
      if (recentEvents.length > 10) {
        pattern.score += 30;
      }
      
      this.suspiciousPatterns.set(key, pattern);
      
      // Alert on high suspicion score
      if (pattern.score > 100) {
        this.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
          ipAddress: key,
          score: pattern.score,
          recentEvents: recentEvents.length
        });
      }
    }
  }

  /**
   * Security middleware
   */
  getSecurityMiddleware() {
    return [
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
          }
        },
        crossOriginEmbedderPolicy: false
      }),
      this.createRateLimit(),
      this.securityHeadersMiddleware.bind(this),
      this.requestLoggingMiddleware.bind(this)
    ];
  }

  securityHeadersMiddleware(req, res, next) {
    // Add additional security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
  }

  requestLoggingMiddleware(req, res, next) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logData = {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };
      
      // Log suspicious requests
      if (res.statusCode >= 400 || duration > 5000) {
        this.logSecurityEvent('SUSPICIOUS_REQUEST', logData);
      }
    });
    
    next();
  }

  /**
   * Get security report
   */
  getSecurityReport() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    
    const recentEvents = this.auditLog.filter(event => 
      new Date(event.timestamp).getTime() > last24Hours
    );
    
    const eventCounts = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});
    
    const suspiciousIPs = Array.from(this.suspiciousPatterns.entries())
      .filter(([ip, pattern]) => pattern.score > 50)
      .map(([ip, pattern]) => ({ ip, score: pattern.score }))
      .sort((a, b) => b.score - a.score);
    
    return {
      totalEvents: recentEvents.length,
      eventCounts,
      suspiciousIPs,
      topEvents: recentEvents
        .filter(event => event.severity === 'high' || event.severity === 'critical')
        .slice(-10)
    };
  }
}

module.exports = SecurityService;
