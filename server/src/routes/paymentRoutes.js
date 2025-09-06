const express = require('express');
const PaymentController = require('../controllers/paymentController');
const { authenticate, requireJobOwner, requireAdmin } = require('../middleware/auth');
const { validatePaymentRequest, validatePriceRequest, validateBatchOperations } = require('../middleware/validation');
const router = express.Router();

// Initialize payment controller
const paymentController = new PaymentController();

// Initialize the controller when the module loads
paymentController.initialize().catch(error => {
  console.error('Failed to initialize payment controller:', error.message);
});

// Token Information Routes
router.get('/token/info', paymentController.getTokenInfo);

// Token Balance Routes
router.get('/balance', authenticate, paymentController.getTokenBalance);
router.get('/balance/:address', authenticate, paymentController.getTokenBalance);

// Token Allowance Routes
router.get('/allowance/:spender', authenticate, paymentController.getAllowance);

// Token Transaction Routes
router.post('/approve', 
  authenticate, 
  validatePaymentRequest, 
  paymentController.approveTokens
);

router.post('/transfer', 
  authenticate, 
  validatePaymentRequest, 
  paymentController.transferTokens
);

// Job Escrow Routes
router.post('/jobs/:jobId/fund', 
  authenticate, 
  requireJobOwner,
  validatePaymentRequest, 
  paymentController.fundJobEscrow
);

// Price Oracle Routes
router.get('/prices', 
  validatePriceRequest, 
  paymentController.getTokenPrices
);

router.get('/prices/:token', 
  paymentController.getTokenPrice
);

router.get('/prices/:token/history', 
  paymentController.getHistoricalPrices
);

router.get('/market/:token', 
  paymentController.getMarketData
);

// Conversion Routes
router.post('/convert/token-to-fiat', 
  validatePriceRequest, 
  paymentController.convertTokenToFiat
);

router.post('/convert/fiat-to-token', 
  validatePriceRequest, 
  paymentController.convertFiatToToken
);

router.post('/convert/token-to-token', 
  validatePriceRequest, 
  paymentController.convertTokenToToken
);

// Gas Price Routes
router.get('/gas-prices', paymentController.getGasPrices);

// Batch Operations Routes
router.post('/batch', 
  authenticate, 
  validateBatchOperations,
  paymentController.batchOperations
);

// Admin Routes
router.delete('/cache', 
  authenticate, 
  requireAdmin, 
  paymentController.clearPriceCache
);

module.exports = router;
