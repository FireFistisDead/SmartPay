const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

class CryptoUtils {
  /**
   * Generate a cryptographically secure random string
   */
  static generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate a nonce for signature verification
   */
  static generateNonce() {
    return Math.floor(Math.random() * 1000000);
  }

  /**
   * Hash data using SHA-256
   */
  static hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Create HMAC signature
   */
  static createHMAC(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  static verifyHMAC(data, signature, secret) {
    const expectedSignature = this.createHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Encrypt sensitive data
   */
  static encrypt(text, key = config.security.encryptionKey) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData, key = config.security.encryptionKey) {
    const algorithm = 'aes-256-gcm';
    const decipher = crypto.createDecipher(algorithm, key);
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

class ValidationUtils {
  /**
   * Validate Ethereum address format
   */
  static isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Validate email format
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  static isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate IPFS CID format
   */
  static isValidIPFSCID(cid) {
    // CID v0 (Qm...)
    const cidV0Pattern = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
    // CID v1 (b...)
    const cidV1Pattern = /^b[a-z2-7]{58}$/;
    
    return cidV0Pattern.test(cid) || cidV1Pattern.test(cid);
  }

  /**
   * Validate and sanitize amount strings
   */
  static validateAmount(amount) {
    if (typeof amount !== 'string') {
      throw new Error('Amount must be a string');
    }
    
    const amountRegex = /^\d+(\.\d{1,18})?$/;
    if (!amountRegex.test(amount)) {
      throw new Error('Invalid amount format');
    }
    
    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    return amount;
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(str, maxLength = 1000) {
    if (typeof str !== 'string') {
      return '';
    }
    
    return str
      .trim()
      .substring(0, maxLength)
      .replace(/[<>]/g, ''); // Basic XSS prevention
  }

  /**
   * Validate job status transition
   */
  static isValidStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      'open': ['assigned', 'cancelled'],
      'assigned': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'disputed', 'cancelled'],
      'disputed': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };
    
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}

class FormatUtils {
  /**
   * Format Ethereum address for display
   */
  static formatAddress(address, startChars = 6, endChars = 4) {
    if (!ValidationUtils.isValidEthereumAddress(address)) {
      return address;
    }
    
    if (address.length <= startChars + endChars) {
      return address;
    }
    
    return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
  }

  /**
   * Format amount for display
   */
  static formatAmount(amount, decimals = 2, symbol = 'USDC') {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return '0.00';
    }
    
    return `${numAmount.toFixed(decimals)} ${symbol}`;
  }

  /**
   * Format date for display
   */
  static formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Date(date).toLocaleDateString('en-US', {
      ...defaultOptions,
      ...options
    });
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format duration in human readable format
   */
  static formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }
  }
}

class JWTUtils {
  /**
   * Generate JWT token
   */
  static generateToken(payload, options = {}) {
    const defaultOptions = {
      expiresIn: config.jwt.expiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    };
    
    return jwt.sign(payload, config.jwt.secret, {
      ...defaultOptions,
      ...options
    });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      });
    } catch (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }
  }

  /**
   * Decode JWT token without verification
   */
  static decodeToken(token) {
    return jwt.decode(token);
  }

  /**
   * Generate authentication token for user
   */
  static generateAuthToken(address, nonce) {
    return this.generateToken({
      address: address.toLowerCase(),
      nonce,
      type: 'auth'
    });
  }
}

class ArrayUtils {
  /**
   * Remove duplicates from array
   */
  static removeDuplicates(array) {
    return [...new Set(array)];
  }

  /**
   * Chunk array into smaller arrays
   */
  static chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Shuffle array randomly
   */
  static shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Group array by key
   */
  static groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
      return groups;
    }, {});
  }
}

class TimeUtils {
  /**
   * Get timestamp in seconds (Unix timestamp)
   */
  static getUnixTimestamp(date = new Date()) {
    return Math.floor(date.getTime() / 1000);
  }

  /**
   * Convert Unix timestamp to Date
   */
  static fromUnixTimestamp(timestamp) {
    return new Date(timestamp * 1000);
  }

  /**
   * Get time difference in human readable format
   */
  static getTimeDifference(date1, date2 = new Date()) {
    const diffMs = Math.abs(date2.getTime() - date1.getTime());
    return FormatUtils.formatDuration(diffMs);
  }

  /**
   * Check if date is within range
   */
  static isWithinRange(date, startDate, endDate) {
    const checkDate = new Date(date);
    return checkDate >= startDate && checkDate <= endDate;
  }

  /**
   * Add time to date
   */
  static addTime(date, amount, unit = 'days') {
    const newDate = new Date(date);
    
    switch (unit) {
      case 'seconds':
        newDate.setSeconds(newDate.getSeconds() + amount);
        break;
      case 'minutes':
        newDate.setMinutes(newDate.getMinutes() + amount);
        break;
      case 'hours':
        newDate.setHours(newDate.getHours() + amount);
        break;
      case 'days':
        newDate.setDate(newDate.getDate() + amount);
        break;
      case 'weeks':
        newDate.setDate(newDate.getDate() + (amount * 7));
        break;
      case 'months':
        newDate.setMonth(newDate.getMonth() + amount);
        break;
      case 'years':
        newDate.setFullYear(newDate.getFullYear() + amount);
        break;
    }
    
    return newDate;
  }
}

module.exports = {
  CryptoUtils,
  ValidationUtils,
  FormatUtils,
  JWTUtils,
  ArrayUtils,
  TimeUtils
};
