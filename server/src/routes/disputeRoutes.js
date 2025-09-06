const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticate, requireJobAccess, requireRole } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const disputeController = require('../controllers/disputeController');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const raiseDisputeValidation = [
  param('jobId')
    .isMongoId()
    .withMessage('Invalid job ID'),
  body('reason')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Dispute reason must be between 10 and 1000 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Dispute description must be between 20 and 2000 characters'),
  body('evidenceFiles')
    .optional()
    .isArray()
    .withMessage('Evidence files must be an array'),
  body('evidenceFiles.*')
    .optional()
    .isString()
    .withMessage('Evidence file must be a valid IPFS hash'),
  body('requestedResolution')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Requested resolution must be less than 500 characters')
];

const arbiterResponseValidation = [
  param('disputeId')
    .isMongoId()
    .withMessage('Invalid dispute ID'),
  body('resolution')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Resolution must be between 10 and 2000 characters'),
  body('ruling')
    .isIn(['favor_client', 'favor_freelancer', 'partial_refund', 'no_fault'])
    .withMessage('Invalid ruling'),
  body('refundPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Refund percentage must be between 0 and 100'),
  body('evidenceFiles')
    .optional()
    .isArray()
    .withMessage('Evidence files must be an array')
];

const respondToDisputeValidation = [
  param('disputeId')
    .isMongoId()
    .withMessage('Invalid dispute ID'),
  body('response')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Response must be between 10 and 2000 characters'),
  body('evidenceFiles')
    .optional()
    .isArray()
    .withMessage('Evidence files must be an array')
];

// Routes

/**
 * @route   POST /api/disputes/job/:jobId/raise
 * @desc    Raise a dispute for a job
 * @access  Private (Client or Freelancer involved in the job)
 */
router.post('/job/:jobId/raise',
  authenticate,
  raiseDisputeValidation,
  validate,
  catchAsync(disputeController.raiseDispute)
);

/**
 * @route   GET /api/disputes
 * @desc    Get disputes with filtering
 * @access  Private
 */
router.get('/',
  authenticate,
  query('status')
    .optional()
    .isIn(['pending', 'in_review', 'resolved', 'escalated'])
    .withMessage('Invalid status'),
  query('role')
    .optional()
    .isIn(['client', 'freelancer', 'arbiter'])
    .withMessage('Invalid role filter'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  validate,
  catchAsync(disputeController.getDisputes)
);

/**
 * @route   GET /api/disputes/:disputeId
 * @desc    Get dispute details
 * @access  Private (Only involved parties and arbiters)
 */
router.get('/:disputeId',
  authenticate,
  param('disputeId')
    .isMongoId()
    .withMessage('Invalid dispute ID'),
  validate,
  catchAsync(disputeController.getDisputeDetails)
);

/**
 * @route   POST /api/disputes/:disputeId/respond
 * @desc    Respond to a dispute
 * @access  Private (Opposing party)
 */
router.post('/:disputeId/respond',
  authenticate,
  respondToDisputeValidation,
  validate,
  catchAsync(disputeController.respondToDispute)
);

/**
 * @route   POST /api/disputes/:disputeId/assign-arbiter
 * @desc    Assign an arbiter to a dispute
 * @access  Private (System or Admin)
 */
router.post('/:disputeId/assign-arbiter',
  authenticate,
  param('disputeId')
    .isMongoId()
    .withMessage('Invalid dispute ID'),
  body('arbiterId')
    .isMongoId()
    .withMessage('Invalid arbiter ID'),
  validate,
  catchAsync(disputeController.assignArbiter)
);

/**
 * @route   POST /api/disputes/:disputeId/resolve
 * @desc    Resolve a dispute (Arbiter only)
 * @access  Private (Arbiter)
 */
router.post('/:disputeId/resolve',
  authenticate,
  requireRole('arbiter'),
  arbiterResponseValidation,
  validate,
  catchAsync(disputeController.resolveDispute)
);

/**
 * @route   POST /api/disputes/:disputeId/escalate
 * @desc    Escalate a dispute
 * @access  Private (Involved parties)
 */
router.post('/:disputeId/escalate',
  authenticate,
  param('disputeId')
    .isMongoId()
    .withMessage('Invalid dispute ID'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Escalation reason must be less than 500 characters'),
  validate,
  catchAsync(disputeController.escalateDispute)
);

/**
 * @route   POST /api/disputes/:disputeId/accept-resolution
 * @desc    Accept arbiter's resolution
 * @access  Private (Involved parties)
 */
router.post('/:disputeId/accept-resolution',
  authenticate,
  param('disputeId')
    .isMongoId()
    .withMessage('Invalid dispute ID'),
  validate,
  catchAsync(disputeController.acceptResolution)
);

/**
 * @route   GET /api/disputes/pending/arbitration
 * @desc    Get disputes pending arbitration assignment
 * @access  Private (Arbiters)
 */
router.get('/pending/arbitration',
  authenticate,
  requireRole('arbiter'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20'),
  validate,
  catchAsync(disputeController.getPendingArbitration)
);

/**
 * @route   GET /api/disputes/my/arbitrations
 * @desc    Get disputes assigned to current arbiter
 * @access  Private (Arbiters)
 */
router.get('/my/arbitrations',
  authenticate,
  requireRole('arbiter'),
  query('status')
    .optional()
    .isIn(['in_review', 'resolved'])
    .withMessage('Invalid status'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20'),
  validate,
  catchAsync(disputeController.getMyArbitrations)
);

/**
 * @route   GET /api/disputes/stats
 * @desc    Get dispute statistics
 * @access  Private
 */
router.get('/stats',
  authenticate,
  catchAsync(disputeController.getDisputeStats)
);

/**
 * @route   POST /api/disputes/:disputeId/messages
 * @desc    Add message to dispute thread
 * @access  Private (Involved parties and arbiter)
 */
router.post('/:disputeId/messages',
  authenticate,
  param('disputeId')
    .isMongoId()
    .withMessage('Invalid dispute ID'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
  validate,
  catchAsync(disputeController.addMessage)
);

/**
 * @route   GET /api/disputes/:disputeId/messages
 * @desc    Get dispute messages
 * @access  Private (Involved parties and arbiter)
 */
router.get('/:disputeId/messages',
  authenticate,
  param('disputeId')
    .isMongoId()
    .withMessage('Invalid dispute ID'),
  validate,
  catchAsync(disputeController.getMessages)
);

module.exports = router;
