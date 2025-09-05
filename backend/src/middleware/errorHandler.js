const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    error: err,
    message: err.message,
    stack: err.stack,
    code: err.code
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      code: err.code
    });
  } 
  // Programming or other unknown error: don't leak error details
  else {
    logger.error('ERROR:', err);
    
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400, 'INVALID_ID');
};

const handleDuplicateFieldsDB = err => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400, 'DUPLICATE_FIELD');
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401, 'TOKEN_EXPIRED');

const handleEthereumError = err => {
  let message = 'Blockchain operation failed';
  let code = 'BLOCKCHAIN_ERROR';
  
  if (err.message.includes('insufficient funds')) {
    message = 'Insufficient funds for transaction';
    code = 'INSUFFICIENT_FUNDS';
  } else if (err.message.includes('gas')) {
    message = 'Transaction failed due to gas issues';
    code = 'GAS_ERROR';
  } else if (err.message.includes('revert')) {
    message = 'Smart contract execution reverted';
    code = 'CONTRACT_REVERT';
  } else if (err.message.includes('nonce')) {
    message = 'Transaction nonce error';
    code = 'NONCE_ERROR';
  }
  
  return new AppError(message, 400, code);
};

const handleIPFSError = err => {
  let message = 'IPFS operation failed';
  let code = 'IPFS_ERROR';
  
  if (err.message.includes('timeout')) {
    message = 'IPFS request timed out';
    code = 'IPFS_TIMEOUT';
  } else if (err.message.includes('not found')) {
    message = 'Content not found on IPFS';
    code = 'IPFS_NOT_FOUND';
  } else if (err.message.includes('size')) {
    message = 'File size exceeds maximum allowed limit';
    code = 'FILE_TOO_LARGE';
  }
  
  return new AppError(message, 400, code);
};

const handleMongooseError = err => {
  if (err.name === 'CastError') return handleCastErrorDB(err);
  if (err.code === 11000) return handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') return handleValidationErrorDB(err);
  
  return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
};

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') error = handleCastErrorDB(error);

  // Mongoose duplicate key
  if (err.code === 11000) error = handleDuplicateFieldsDB(error);

  // Mongoose validation error
  if (err.name === 'ValidationError') error = handleValidationErrorDB(error);

  // JWT errors
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // Ethereum/Web3 errors
  if (err.message && (
    err.message.includes('revert') || 
    err.message.includes('gas') || 
    err.message.includes('nonce') ||
    err.message.includes('insufficient funds')
  )) {
    error = handleEthereumError(error);
  }

  // IPFS errors
  if (err.message && (
    err.message.includes('IPFS') ||
    err.message.includes('gateway') ||
    err.message.includes('pin')
  )) {
    error = handleIPFSError(error);
  }

  // Mongoose errors
  if (err.name && err.name.includes('Mongo')) {
    error = handleMongooseError(error);
  }

  // Rate limiting error
  if (err.message && err.message.includes('Too many requests')) {
    error = new AppError('Too many requests, please try again later', 429, 'RATE_LIMIT_EXCEEDED');
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('File too large', 413, 'FILE_TOO_LARGE');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new AppError('Unexpected file field', 400, 'UNEXPECTED_FILE');
  }

  // Network errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    error = new AppError('External service unavailable', 503, 'SERVICE_UNAVAILABLE');
  }

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// Global error class export
const createError = (message, statusCode, code = null) => {
  return new AppError(message, statusCode, code);
};

// Async error wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404, 'NOT_FOUND');
  next(error);
};

module.exports = {
  errorHandler,
  AppError,
  createError,
  catchAsync,
  notFound
};
