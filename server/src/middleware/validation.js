const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

/**
 * Middleware to check validation results and return formatted errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', errorMessages));
  }
  
  next();
};

/**
 * Validate Ethereum address format
 */
const validateEthereumAddress = (address) => {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validate positive number
 */
const validatePositiveNumber = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

/**
 * Validate payment request data
 */
const validatePaymentRequest = (req, res, next) => {
  const errors = [];
  
  // Check for required fields based on the endpoint
  if (req.route.path.includes('/approve') || req.route.path.includes('/transfer')) {
    const { amount } = req.body;
    
    if (!amount) {
      errors.push({ field: 'amount', message: 'Amount is required' });
    } else if (!validatePositiveNumber(amount)) {
      errors.push({ field: 'amount', message: 'Amount must be a positive number' });
    }
    
    if (req.route.path.includes('/approve')) {
      const { spender } = req.body;
      if (!spender) {
        errors.push({ field: 'spender', message: 'Spender address is required' });
      } else if (!validateEthereumAddress(spender)) {
        errors.push({ field: 'spender', message: 'Invalid Ethereum address format' });
      }
    }
    
    if (req.route.path.includes('/transfer')) {
      const { to } = req.body;
      if (!to) {
        errors.push({ field: 'to', message: 'Recipient address is required' });
      } else if (!validateEthereumAddress(to)) {
        errors.push({ field: 'to', message: 'Invalid Ethereum address format' });
      }
    }
  }
  
  if (req.route.path.includes('/fund')) {
    const { amount } = req.body;
    
    if (!amount) {
      errors.push({ field: 'amount', message: 'Amount is required' });
    } else if (!validatePositiveNumber(amount)) {
      errors.push({ field: 'amount', message: 'Amount must be a positive number' });
    }
  }
  
  if (errors.length > 0) {
    return next(new AppError('Payment validation failed', 400, 'PAYMENT_VALIDATION_ERROR', errors));
  }
  
  next();
};

/**
 * Validate price request data
 */
const validatePriceRequest = (req, res, next) => {
  const errors = [];
  
  // For conversion endpoints
  if (req.route.path.includes('/convert')) {
    if (req.route.path.includes('/token-to-fiat')) {
      const { token, amount, currency } = req.body;
      
      if (!token) {
        errors.push({ field: 'token', message: 'Token symbol is required' });
      } else if (!/^[A-Za-z0-9]{2,10}$/.test(token)) {
        errors.push({ field: 'token', message: 'Invalid token symbol format' });
      }
      
      if (!amount) {
        errors.push({ field: 'amount', message: 'Amount is required' });
      } else if (!validatePositiveNumber(amount)) {
        errors.push({ field: 'amount', message: 'Amount must be a positive number' });
      }
      
      if (currency && !/^[A-Z]{3}$/.test(currency)) {
        errors.push({ field: 'currency', message: 'Currency must be a 3-letter code (e.g., USD)' });
      }
    }
    
    if (req.route.path.includes('/fiat-to-token')) {
      const { currency, amount, token } = req.body;
      
      if (!currency) {
        errors.push({ field: 'currency', message: 'Currency is required' });
      } else if (!/^[A-Z]{3}$/.test(currency)) {
        errors.push({ field: 'currency', message: 'Currency must be a 3-letter code (e.g., USD)' });
      }
      
      if (!amount) {
        errors.push({ field: 'amount', message: 'Amount is required' });
      } else if (!validatePositiveNumber(amount)) {
        errors.push({ field: 'amount', message: 'Amount must be a positive number' });
      }
      
      if (!token) {
        errors.push({ field: 'token', message: 'Token symbol is required' });
      } else if (!/^[A-Za-z0-9]{2,10}$/.test(token)) {
        errors.push({ field: 'token', message: 'Invalid token symbol format' });
      }
    }
    
    if (req.route.path.includes('/token-to-token')) {
      const { fromToken, toToken, amount } = req.body;
      
      if (!fromToken) {
        errors.push({ field: 'fromToken', message: 'From token symbol is required' });
      } else if (!/^[A-Za-z0-9]{2,10}$/.test(fromToken)) {
        errors.push({ field: 'fromToken', message: 'Invalid from token symbol format' });
      }
      
      if (!toToken) {
        errors.push({ field: 'toToken', message: 'To token symbol is required' });
      } else if (!/^[A-Za-z0-9]{2,10}$/.test(toToken)) {
        errors.push({ field: 'toToken', message: 'Invalid to token symbol format' });
      }
      
      if (!amount) {
        errors.push({ field: 'amount', message: 'Amount is required' });
      } else if (!validatePositiveNumber(amount)) {
        errors.push({ field: 'amount', message: 'Amount must be a positive number' });
      }
      
      if (fromToken && toToken && fromToken.toLowerCase() === toToken.toLowerCase()) {
        errors.push({ field: 'tokens', message: 'From and to tokens cannot be the same' });
      }
    }
  }
  
  // For price query endpoints
  if (req.route.path.includes('/prices') && req.query.tokens) {
    const tokens = Array.isArray(req.query.tokens) ? req.query.tokens : req.query.tokens.split(',');
    
    if (tokens.length === 0) {
      errors.push({ field: 'tokens', message: 'At least one token is required' });
    } else if (tokens.length > 20) {
      errors.push({ field: 'tokens', message: 'Maximum 20 tokens allowed per request' });
    }
    
    tokens.forEach((token, index) => {
      if (!/^[A-Za-z0-9]{2,10}$/.test(token.trim())) {
        errors.push({ field: `tokens[${index}]`, message: `Invalid token symbol: ${token}` });
      }
    });
  }
  
  // For historical prices
  if (req.route.path.includes('/history')) {
    const { days } = req.query;
    
    if (days) {
      const daysNum = parseInt(days);
      if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
        errors.push({ field: 'days', message: 'Days must be between 1 and 365' });
      }
    }
  }
  
  if (errors.length > 0) {
    return next(new AppError('Price validation failed', 400, 'PRICE_VALIDATION_ERROR', errors));
  }
  
  next();
};

/**
 * Validate batch operations
 */
const validateBatchOperations = (req, res, next) => {
  const errors = [];
  const { operations } = req.body;
  
  if (!operations || !Array.isArray(operations)) {
    errors.push({ field: 'operations', message: 'Operations must be an array' });
    return next(new AppError('Batch validation failed', 400, 'BATCH_VALIDATION_ERROR', errors));
  }
  
  if (operations.length === 0) {
    errors.push({ field: 'operations', message: 'At least one operation is required' });
  }
  
  if (operations.length > 10) {
    errors.push({ field: 'operations', message: 'Maximum 10 operations allowed per batch' });
  }
  
  operations.forEach((operation, index) => {
    if (!operation.type) {
      errors.push({ field: `operations[${index}].type`, message: 'Operation type is required' });
    } else if (!['transfer', 'approve'].includes(operation.type)) {
      errors.push({ field: `operations[${index}].type`, message: 'Operation type must be "transfer" or "approve"' });
    }
    
    if (!operation.amount) {
      errors.push({ field: `operations[${index}].amount`, message: 'Amount is required' });
    } else if (!validatePositiveNumber(operation.amount)) {
      errors.push({ field: `operations[${index}].amount`, message: 'Amount must be a positive number' });
    }
    
    if (operation.type === 'transfer') {
      if (!operation.to) {
        errors.push({ field: `operations[${index}].to`, message: 'Recipient address is required for transfer' });
      } else if (!validateEthereumAddress(operation.to)) {
        errors.push({ field: `operations[${index}].to`, message: 'Invalid recipient address format' });
      }
    }
    
    if (operation.type === 'approve') {
      if (!operation.spender) {
        errors.push({ field: `operations[${index}].spender`, message: 'Spender address is required for approval' });
      } else if (!validateEthereumAddress(operation.spender)) {
        errors.push({ field: `operations[${index}].spender`, message: 'Invalid spender address format' });
      }
    }
  });
  
  if (errors.length > 0) {
    return next(new AppError('Batch validation failed', 400, 'BATCH_VALIDATION_ERROR', errors));
  }
  
  next();
};

module.exports = {
  validate,
  validatePaymentRequest,
  validatePriceRequest,
  validateBatchOperations,
  validateEthereumAddress,
  validatePositiveNumber
};
