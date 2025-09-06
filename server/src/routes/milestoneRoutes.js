const express = require('express');
const { body, param } = require('express-validator');
const { authenticate, requireJobAccess, requireJobFreelancer, requireJobClient } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const milestoneController = require('../controllers/milestoneController');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const jobIdValidation = [
  param('jobId')
    .isInt({ min: 0 })
    .withMessage('Job ID must be a valid integer')
];

const milestoneIndexValidation = [
  param('milestoneIndex')
    .isInt({ min: 0 })
    .withMessage('Milestone index must be a valid integer')
];

const submitMilestoneValidation = [
  body('deliverableHash')
    .notEmpty()
    .withMessage('Deliverable hash is required')
    .custom((value) => {
      // Basic IPFS CID validation
      const cidV0Pattern = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
      const cidV1Pattern = /^b[a-z2-7]{58}$/;
      if (!cidV0Pattern.test(value) && !cidV1Pattern.test(value)) {
        throw new Error('Invalid IPFS CID format');
      }
      return true;
    }),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

const approveMilestoneValidation = [
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

// Routes

/**
 * @route   GET /api/milestones/job/:jobId
 * @desc    Get all milestones for a job
 * @access  Private (Job participants)
 */
router.get('/job/:jobId',
  authenticate,
  jobIdValidation,
  validate,
  requireJobAccess(),
  catchAsync(milestoneController.getJobMilestones)
);

/**
 * @route   GET /api/milestones/job/:jobId/:milestoneIndex
 * @desc    Get specific milestone details
 * @access  Private (Job participants)
 */
router.get('/job/:jobId/:milestoneIndex',
  authenticate,
  jobIdValidation,
  milestoneIndexValidation,
  validate,
  requireJobAccess(),
  catchAsync(milestoneController.getMilestoneDetails)
);

/**
 * @route   POST /api/milestones/job/:jobId/:milestoneIndex/submit
 * @desc    Submit milestone deliverable (freelancer only)
 * @access  Private (Freelancer)
 */
router.post('/job/:jobId/:milestoneIndex/submit',
  authenticate,
  jobIdValidation,
  milestoneIndexValidation,
  submitMilestoneValidation,
  validate,
  requireJobFreelancer(),
  catchAsync(milestoneController.submitMilestone)
);

/**
 * @route   POST /api/milestones/job/:jobId/:milestoneIndex/approve
 * @desc    Approve milestone (client only)
 * @access  Private (Client)
 */
router.post('/job/:jobId/:milestoneIndex/approve',
  authenticate,
  jobIdValidation,
  milestoneIndexValidation,
  approveMilestoneValidation,
  validate,
  requireJobClient(),
  catchAsync(milestoneController.approveMilestone)
);

/**
 * @route   GET /api/milestones/job/:jobId/:milestoneIndex/deliverable
 * @desc    Get milestone deliverable from IPFS
 * @access  Private (Job participants)
 */
router.get('/job/:jobId/:milestoneIndex/deliverable',
  authenticate,
  jobIdValidation,
  milestoneIndexValidation,
  validate,
  requireJobAccess(),
  catchAsync(milestoneController.getMilestoneDeliverable)
);

/**
 * @route   GET /api/milestones/pending
 * @desc    Get user's pending milestones
 * @access  Private
 */
router.get('/pending',
  authenticate,
  catchAsync(milestoneController.getPendingMilestones)
);

/**
 * @route   GET /api/milestones/submitted
 * @desc    Get user's submitted milestones waiting for approval
 * @access  Private
 */
router.get('/submitted',
  authenticate,
  catchAsync(milestoneController.getSubmittedMilestones)
);

/**
 * @route   GET /api/milestones/stats
 * @desc    Get milestone statistics for user
 * @access  Private
 */
router.get('/stats',
  authenticate,
  catchAsync(milestoneController.getMilestoneStats)
);

module.exports = router;
