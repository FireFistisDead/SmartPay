const redis = require('redis');
const config = require('./config');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionAttempted = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.redisWarningShown = false;
  }

  async connect() {
    // If already attempted and failed, don't try again
    if (this.connectionAttempted && !this.isConnected && this.retryCount >= this.maxRetries) {
      if (!this.redisWarningShown) {
        logger.warn('Redis unavailable - continuing without Redis (caching disabled)');
        this.redisWarningShown = true;
      }
      return null;
    }

    this.connectionAttempted = true;

    try {
      this.client = redis.createClient({
        url: config.redis.url,
        ...config.redis.options,
        socket: {
          connectTimeout: 3000,
          lazyConnect: true,
          reconnectStrategy: false // Disable automatic reconnection
        }
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
        this.retryCount = 0;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      this.client.on('error', (err) => {
        if (!this.redisWarningShown) {
          logger.warn('Redis client error (Redis optional) - continuing without Redis');
          this.redisWarningShown = true;
        }
        this.isConnected = false;
        // Don't throw errors, just log warnings
      });

      this.client.on('end', () => {
        if (this.isConnected) {
          logger.warn('Redis client disconnected');
        }
        this.isConnected = false;
      });

      // Set a timeout for connection attempt
      const connectTimeout = setTimeout(() => {
        if (!this.redisWarningShown) {
          logger.warn('Redis connection timeout - continuing without Redis');
          this.redisWarningShown = true;
        }
        this.isConnected = false;
        this.retryCount = this.maxRetries; // Stop further attempts
      }, 3000);

      await this.client.connect();
      clearTimeout(connectTimeout);
      logger.info('Redis connected successfully');
      
      // Make client globally available
      global.redis = this.client;
      
      return this.client;
    } catch (error) {
      this.retryCount++;
      if (!this.redisWarningShown) {
        logger.warn('Redis connection failed, continuing without Redis');
        this.redisWarningShown = true;
      }
      this.isConnected = false;
      this.client = null;
      // Don't throw error, just continue without Redis
      return null;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.disconnect();
        this.isConnected = false;
        logger.info('Redis client disconnected');
      }
    } catch (error) {
      logger.warn('Error disconnecting from Redis:', error.message);
    }
  }

  async set(key, value, options = {}) {
    try {
      if (!this.isConnected || !this.client) {
        return false; // Silent fail when Redis unavailable
      }

      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      if (options.ttl) {
        await this.client.setEx(key, options.ttl, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
      
      return true;
    } catch (error) {
      logger.debug('Redis SET error:', error.message);
      return false;
    }
  }

  async get(key) {
    try {
      if (!this.isConnected || !this.client) {
        return null; // Silent fail when Redis unavailable
      }

      const value = await this.client.get(key);
      
      if (value === null) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.debug('Redis GET error:', error.message);
      return null;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected || !this.client) {
        return false; // Silent fail when Redis unavailable
      }

      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      logger.debug('Redis DEL error:', error.message);
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }

      const result = await this.client.exists(key);
      return result > 0;
    } catch (error) {
      logger.warn('Redis EXISTS error:', error.message);
      return false;
    }
  }

  async incr(key) {
    try {
      if (!this.isConnected || !this.client) {
        return 0; // Silent fail when Redis unavailable
      }

      return await this.client.incr(key);
    } catch (error) {
      logger.debug('Redis INCR error:', error.message);
      return 0;
    }
  }

  async expire(key, seconds) {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }

      const result = await this.client.expire(key, seconds);
      return result > 0;
    } catch (error) {
      logger.debug('Redis EXPIRE error:', error.message);
      return false;
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;
