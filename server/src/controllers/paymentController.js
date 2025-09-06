const PriceOracleService = require('../services/priceOracleService');
const logger = require('../utils/logger');
const { AppError, catchAsync } = require('../middleware/errorHandler');

/**
 * Payment Controller - Handles payment and token-related API endpoints
 */
class PaymentController {
  constructor() {
    this.paymentService = null; // Will be set via ServiceManager
    this.priceOracleService = new PriceOracleService();
    this.initialized = false;
  }

  /**
   * Initialize payment controller
   */
  async initialize() {
    try {
      // Get PaymentService from ServiceManager
      const serviceManager = require('../services/ServiceManager');
      if (serviceManager.hasService('PaymentService')) {
        this.paymentService = serviceManager.getExistingService('PaymentService');
        this.initialized = true;
        logger.info('Payment controller initialized');
      } else {
        logger.warn('PaymentService not available in ServiceManager');
      }
    } catch (error) {
      logger.error('Failed to initialize payment controller:', error);
      // Don't throw error - allow graceful degradation
    }
  }

  /**
   * Get token information
   */
  getTokenInfo = catchAsync(async (req, res) => {
    if (!this.initialized) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not available',
        error: 'PAYMENT_SERVICE_UNAVAILABLE'
      });
    }

    const tokenInfo = await this.paymentService.getTokenInfo();
    
    res.status(200).json({
      success: true,
      data: tokenInfo
    });
  });

  /**
   * Get token balance for user's address
   */
  getTokenBalance = catchAsync(async (req, res) => {
    if (!this.initialized) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not available',
        error: 'PAYMENT_SERVICE_UNAVAILABLE'
      });
    }

    const { address } = req.params;
    const userAddress = address || req.user.address;
    
    if (!userAddress) {
      throw new AppError('Address is required', 400, 'ADDRESS_REQUIRED');
    }
    
    const balance = await this.paymentService.getTokenBalance(userAddress);
    
    res.status(200).json({
      success: true,
      data: {
        address: userAddress,
        ...balance
      }
    });
  });

  /**
   * Get allowance for smart contract
   */
  getAllowance = catchAsync(async (req, res) => {
    if (!this.initialized) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not available',
        error: 'PAYMENT_SERVICE_UNAVAILABLE'
      });
    }

    const { spender } = req.params;
    const owner = req.user.address;
    
    if (!spender) {
      throw new AppError('Spender address is required', 400, 'SPENDER_REQUIRED');
    }
    
    const allowance = await this.paymentService.getAllowance(owner, spender);
    
    res.status(200).json({
      success: true,
      data: {
        owner,
        spender,
        ...allowance
      }
    });
  });

  /**
   * Approve tokens for spending
   */
  approveTokens = catchAsync(async (req, res) => {
    if (!this.initialized) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not available',
        error: 'PAYMENT_SERVICE_UNAVAILABLE'
      });
    }

    const { spender, amount } = req.body;
    
    if (!spender || !amount) {
      throw new AppError('Spender and amount are required', 400, 'APPROVAL_DATA_REQUIRED');
    }
    
    if (amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400, 'INVALID_AMOUNT');
    }
    
    const result = await this.paymentService.approveTokens(spender, amount);
    
    res.status(200).json({
      success: true,
      message: 'Token approval transaction sent',
      data: result
    });
  });

  /**
   * Transfer tokens
   */
  transferTokens = catchAsync(async (req, res) => {
    if (!this.initialized) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not available',
        error: 'PAYMENT_SERVICE_UNAVAILABLE'
      });
    }

    const { to, amount } = req.body;
    
    if (!to || !amount) {
      throw new AppError('Recipient and amount are required', 400, 'TRANSFER_DATA_REQUIRED');
    }
    
    if (amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400, 'INVALID_AMOUNT');
    }
    
    const result = await this.paymentService.transferTokens(to, amount);
    
    res.status(200).json({
      success: true,
      message: 'Token transfer transaction sent',
      data: result
    });
  });

  /**
   * Fund job escrow
   */
  fundJobEscrow = catchAsync(async (req, res) => {
    if (!this.initialized) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not available',
        error: 'PAYMENT_SERVICE_UNAVAILABLE'
      });
    }

    const { jobId } = req.params;
    const { amount } = req.body;
    
    if (!amount) {
      throw new AppError('Amount is required', 400, 'AMOUNT_REQUIRED');
    }
    
    if (amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400, 'INVALID_AMOUNT');
    }
    
    const result = await this.paymentService.fundJobEscrow(parseInt(jobId), amount);
    
    res.status(200).json({
      success: true,
      message: 'Job escrow funding transaction sent',
      data: {
        jobId: parseInt(jobId),
        amount: amount.toString(),
        ...result
      }
    });
  });

  /**
   * Get current token prices
   */
  getTokenPrices = catchAsync(async (req, res) => {
    const { tokens, currency = 'USD' } = req.query;
    
    if (!tokens) {
      throw new AppError('Tokens parameter is required', 400, 'TOKENS_REQUIRED');
    }
    
    const tokenList = Array.isArray(tokens) ? tokens : tokens.split(',');
    const result = await this.priceOracleService.getMultipleTokenPrices(tokenList, currency);
    
    res.status(200).json({
      success: true,
      data: {
        currency,
        ...result,
        timestamp: new Date().toISOString()
      }
    });
  });

  /**
   * Get single token price
   */
  getTokenPrice = catchAsync(async (req, res) => {
    const { token } = req.params;
    const { currency = 'USD' } = req.query;
    
    const price = await this.priceOracleService.getTokenPrice(token.toUpperCase(), currency);
    
    res.status(200).json({
      success: true,
      data: price
    });
  });

  /**
   * Convert token amount to fiat
   */
  convertTokenToFiat = catchAsync(async (req, res) => {
    const { token, amount, currency = 'USD' } = req.body;
    
    if (!token || !amount) {
      throw new AppError('Token and amount are required', 400, 'CONVERSION_DATA_REQUIRED');
    }
    
    if (amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400, 'INVALID_AMOUNT');
    }
    
    const result = await this.priceOracleService.convertTokenToFiat(token.toUpperCase(), amount, currency);
    
    res.status(200).json({
      success: true,
      data: result
    });
  });

  /**
   * Convert fiat amount to token
   */
  convertFiatToToken = catchAsync(async (req, res) => {
    const { currency, amount, token } = req.body;
    
    if (!currency || !amount || !token) {
      throw new AppError('Currency, amount, and token are required', 400, 'CONVERSION_DATA_REQUIRED');
    }
    
    if (amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400, 'INVALID_AMOUNT');
    }
    
    const result = await this.priceOracleService.convertFiatToToken(currency.toUpperCase(), amount, token.toUpperCase());
    
    res.status(200).json({
      success: true,
      data: result
    });
  });

  /**
   * Convert between tokens
   */
  convertTokenToToken = catchAsync(async (req, res) => {
    const { fromToken, toToken, amount } = req.body;
    
    if (!fromToken || !toToken || !amount) {
      throw new AppError('From token, to token, and amount are required', 400, 'CONVERSION_DATA_REQUIRED');
    }
    
    if (amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400, 'INVALID_AMOUNT');
    }
    
    const result = await this.priceOracleService.convertTokenToToken(
      fromToken.toUpperCase(), 
      toToken.toUpperCase(), 
      amount
    );
    
    res.status(200).json({
      success: true,
      data: result
    });
  });

  /**
   * Get historical prices
   */
  getHistoricalPrices = catchAsync(async (req, res) => {
    const { token } = req.params;
    const { currency = 'USD', days = 7 } = req.query;
    
    const result = await this.priceOracleService.getHistoricalPrices(
      token.toUpperCase(), 
      currency, 
      parseInt(days)
    );
    
    res.status(200).json({
      success: true,
      data: result
    });
  });

  /**
   * Get market data
   */
  getMarketData = catchAsync(async (req, res) => {
    const { token } = req.params;
    
    const result = await this.priceOracleService.getMarketData(token.toUpperCase());
    
    res.status(200).json({
      success: true,
      data: result
    });
  });

  /**
   * Get gas price estimates
   */
  getGasPrices = catchAsync(async (req, res) => {
    if (!this.initialized) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not available',
        error: 'PAYMENT_SERVICE_UNAVAILABLE'
      });
    }

    const gasInfo = await this.paymentService.getGasPriceInTokens();
    
    res.status(200).json({
      success: true,
      data: gasInfo
    });
  });

  /**
   * Batch token operations
   */
  batchOperations = catchAsync(async (req, res) => {
    if (!this.initialized) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not available',
        error: 'PAYMENT_SERVICE_UNAVAILABLE'
      });
    }

    const { operations } = req.body;
    
    if (!operations || !Array.isArray(operations)) {
      throw new AppError('Operations array is required', 400, 'OPERATIONS_REQUIRED');
    }
    
    if (operations.length === 0) {
      throw new AppError('At least one operation is required', 400, 'NO_OPERATIONS');
    }
    
    if (operations.length > 10) {
      throw new AppError('Maximum 10 operations allowed per batch', 400, 'TOO_MANY_OPERATIONS');
    }
    
    const results = await this.paymentService.batchTokenOperations(operations);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    res.status(200).json({
      success: true,
      message: `Batch completed: ${successCount} successful, ${failureCount} failed`,
      data: {
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount
        },
        results
      }
    });
  });

  /**
   * Clear price cache (admin only)
   */
  clearPriceCache = catchAsync(async (req, res) => {
    const { pattern } = req.query;
    
    await this.priceOracleService.clearCache(pattern);
    
    res.status(200).json({
      success: true,
      message: 'Price cache cleared',
      pattern: pattern || '*'
    });
  });
}

module.exports = PaymentController;
