const { ethers } = require('ethers');
const { JWTUtils, ValidationUtils } = require('../utils/helpers');
const User = require('../models/User');
const logger = require('../utils/logger');
const { AppError } = require('./errorHandler');

/**
 * Verify user authentication via JWT or signature
 */
const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }

    if (!token) {
      return next(new AppError('Access token is required', 401, 'NO_TOKEN'));
    }

    // Verify token
    let decoded;
    try {
      // First try with the JWTUtils (for blockchain tokens with issuer/audience)
      decoded = JWTUtils.verifyToken(token);
    } catch (error) {
      // If that fails, try simple JWT verification (for traditional login tokens)
      try {
        const jwt = require('jsonwebtoken');
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      } catch (simpleError) {
        logger.error('Token verification failed:', simpleError);
        return next(new AppError('Invalid authentication token', 401, 'INVALID_TOKEN'));
      }
    }
    
    let user;
    
    // Check if token contains userId (traditional login) or address (blockchain login)
    if (decoded.userId) {
      // Traditional login with userId
      user = await User.findById(decoded.userId);
      if (!user) {
        return next(new AppError('User no longer exists', 401, 'USER_NOT_FOUND'));
      }
      // Attach user to request with userId property for traditional login
      req.user = { ...user.toObject(), userId: user._id };
    } else if (decoded.address) {
      // Blockchain login with address
      user = await User.findByAddress(decoded.address);
      if (!user) {
        return next(new AppError('User no longer exists', 401, 'USER_NOT_FOUND'));
      }
      // Attach user to request
      req.user = user;
      req.userAddress = decoded.address;
    } else {
      return next(new AppError('Invalid token format', 401, 'INVALID_TOKEN'));
    }

    // Check if user is active
    if (user.status !== 'active') {
      return next(new AppError('User account is not active', 401, 'ACCOUNT_INACTIVE'));
    }
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return next(new AppError('Invalid authentication token', 401, 'INVALID_TOKEN'));
  }
};

/**
 * Verify Ethereum signature for authentication
 */
const verifySignature = async (req, res, next) => {
  try {
    const { address, signature, message, nonce } = req.body;

    if (!address || !signature || !message) {
      return next(new AppError('Address, signature, and message are required', 400, 'MISSING_SIGNATURE_DATA'));
    }

    // Validate Ethereum address
    if (!ValidationUtils.isValidEthereumAddress(address)) {
      return next(new AppError('Invalid Ethereum address', 400, 'INVALID_ADDRESS'));
    }

    // Verify the signature
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        return next(new AppError('Signature verification failed', 401, 'SIGNATURE_MISMATCH'));
      }
    } catch (signatureError) {
      logger.error('Signature verification error:', signatureError);
      return next(new AppError('Invalid signature format', 400, 'INVALID_SIGNATURE'));
    }

    // Check nonce if provided
    if (nonce !== undefined) {
      const user = await User.findByAddress(address);
      if (user && user.nonce !== nonce) {
        return next(new AppError('Invalid nonce', 401, 'INVALID_NONCE'));
      }
    }

    // Attach verified address to request
    req.verifiedAddress = address.toLowerCase();
    req.signature = signature;
    req.message = message;
    
    next();
  } catch (error) {
    logger.error('Signature verification error:', error);
    return next(new AppError('Signature verification failed', 401, 'SIGNATURE_VERIFICATION_FAILED'));
  }
};

/**
 * Check if user has specific role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'NOT_AUTHENTICATED'));
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return next(new AppError(`Access denied. Required roles: ${roles.join(', ')}`, 403, 'INSUFFICIENT_PERMISSIONS'));
    }

    next();
  };
};

/**
 * Check if user is a freelancer
 */
const requireFreelancer = requireRole(['freelancer']);

/**
 * Check if user is a client
 */
const requireClient = requireRole(['client']);

/**
 * Check if user is an arbiter
 */
const requireArbiter = requireRole(['arbiter']);

/**
 * Check if user is verified
 */
const requireVerification = (level = 'basic') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'NOT_AUTHENTICATED'));
    }

    const verificationLevels = {
      'none': 0,
      'basic': 1,
      'enhanced': 2,
      'premium': 3
    };

    const userLevel = verificationLevels[req.user.verification?.verificationLevel || 'none'];
    const requiredLevel = verificationLevels[level];

    if (userLevel < requiredLevel) {
      return next(new AppError(`Verification level '${level}' required`, 403, 'INSUFFICIENT_VERIFICATION'));
    }

    next();
  };
};

/**
 * Check if user owns or is involved in a job
 */
const requireJobAccess = (paramName = 'jobId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'NOT_AUTHENTICATED'));
      }

      const jobId = req.params[paramName];
      if (!jobId) {
        return next(new AppError('Job ID is required', 400, 'MISSING_JOB_ID'));
      }

      const Job = require('../models/Job');
      const job = await Job.findOne({ jobId: parseInt(jobId) });
      
      if (!job) {
        return next(new AppError('Job not found', 404, 'JOB_NOT_FOUND'));
      }

      const userAddress = req.user.address.toLowerCase();
      const hasAccess = 
        job.client.toLowerCase() === userAddress ||
        job.freelancer?.toLowerCase() === userAddress ||
        job.arbiter.toLowerCase() === userAddress;

      if (!hasAccess) {
        return next(new AppError('Access denied to this job', 403, 'JOB_ACCESS_DENIED'));
      }

      // Attach job to request for further use
      req.job = job;
      next();
    } catch (error) {
      logger.error('Job access check error:', error);
      return next(new AppError('Error checking job access', 500, 'JOB_ACCESS_ERROR'));
    }
  };
};

/**
 * Check if user is the job client
 */
const requireJobClient = (paramName = 'jobId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'NOT_AUTHENTICATED'));
      }

      const jobId = req.params[paramName];
      if (!jobId) {
        return next(new AppError('Job ID is required', 400, 'MISSING_JOB_ID'));
      }

      const Job = require('../models/Job');
      const job = await Job.findOne({ jobId: parseInt(jobId) });
      
      if (!job) {
        return next(new AppError('Job not found', 404, 'JOB_NOT_FOUND'));
      }

      if (job.client.toLowerCase() !== req.user.address.toLowerCase()) {
        return next(new AppError('Only job client can perform this action', 403, 'NOT_JOB_CLIENT'));
      }

      req.job = job;
      next();
    } catch (error) {
      logger.error('Job client check error:', error);
      return next(new AppError('Error checking job client access', 500, 'JOB_CLIENT_CHECK_ERROR'));
    }
  };
};

/**
 * Check if user is the job freelancer
 */
const requireJobFreelancer = (paramName = 'jobId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'NOT_AUTHENTICATED'));
      }

      const jobId = req.params[paramName];
      if (!jobId) {
        return next(new AppError('Job ID is required', 400, 'MISSING_JOB_ID'));
      }

      const Job = require('../models/Job');
      const job = await Job.findOne({ jobId: parseInt(jobId) });
      
      if (!job) {
        return next(new AppError('Job not found', 404, 'JOB_NOT_FOUND'));
      }

      if (!job.freelancer || job.freelancer.toLowerCase() !== req.user.address.toLowerCase()) {
        return next(new AppError('Only assigned freelancer can perform this action', 403, 'NOT_JOB_FREELANCER'));
      }

      req.job = job;
      next();
    } catch (error) {
      logger.error('Job freelancer check error:', error);
      return next(new AppError('Error checking job freelancer access', 500, 'JOB_FREELANCER_CHECK_ERROR'));
    }
  };
};

/**
 * Check if user is the job arbiter
 */
const requireJobArbiter = (paramName = 'jobId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'NOT_AUTHENTICATED'));
      }

      const jobId = req.params[paramName];
      if (!jobId) {
        return next(new AppError('Job ID is required', 400, 'MISSING_JOB_ID'));
      }

      const Job = require('../models/Job');
      const job = await Job.findOne({ jobId: parseInt(jobId) });
      
      if (!job) {
        return next(new AppError('Job not found', 404, 'JOB_NOT_FOUND'));
      }

      if (job.arbiter.toLowerCase() !== req.user.address.toLowerCase()) {
        return next(new AppError('Only job arbiter can perform this action', 403, 'NOT_JOB_ARBITER'));
      }

      req.job = job;
      next();
    } catch (error) {
      logger.error('Job arbiter check error:', error);
      return next(new AppError('Error checking job arbiter access', 500, 'JOB_ARBITER_CHECK_ERROR'));
    }
  };
};

/**
 * Rate limiting based on user address
 */
const userRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const identifier = req.user?.address || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get or create request history for this identifier
    if (!requests.has(identifier)) {
      requests.set(identifier, []);
    }
    
    const userRequests = requests.get(identifier);
    
    // Remove old requests outside the window
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);
    requests.set(identifier, recentRequests);
    
    // Check if limit exceeded
    if (recentRequests.length >= max) {
      return next(new AppError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED'));
    }
    
    // Add current request
    recentRequests.push(now);
    
    next();
  };
};

/**
 * Optional authentication (don't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }

    if (token) {
      try {
        const decoded = JWTUtils.verifyToken(token);
        const user = await User.findByAddress(decoded.address);
        
        if (user && user.status === 'active') {
          req.user = user;
          req.userAddress = decoded.address;
        }
      } catch (error) {
        // Token is invalid, but we don't fail - just continue without user
        logger.debug('Optional auth failed:', error.message);
      }
    }
    
    next();
  } catch (error) {
    // Don't fail on optional auth errors
    next();
  }
};

module.exports = {
  authenticate,
  verifySignature,
  requireRole,
  requireFreelancer,
  requireClient,
  requireArbiter,
  requireVerification,
  requireJobAccess,
  requireJobClient,
  requireJobFreelancer,
  requireJobArbiter,
  userRateLimit,
  optionalAuth
};
