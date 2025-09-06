const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticate, optionalAuth, requireJobAccess, requireJobClient } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const jobController = require('../controllers/jobController');
const validate = require('../middleware/validation');

const router = express.Router();

// Validation rules
const createJobValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('category')
    .isIn(['development', 'design', 'writing', 'marketing', 'consulting', 'other'])
    .withMessage('Invalid category'),
  body('milestones')
    .isArray({ min: 1 })
    .withMessage('At least one milestone is required'),
  body('milestones.*.description')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Milestone description must be between 5 and 500 characters'),
  body('milestones.*.amount')
    .matches(/^\d+(\.\d{1,18})?$/)
    .withMessage('Invalid milestone amount format'),
  body('milestones.*.dueDate')
    .isISO8601()
    .withMessage('Invalid due date format'),
  body('deadline')
    .isISO8601()
    .withMessage('Invalid deadline format'),
  body('arbiter')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid arbiter address'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array')
];

const updateJobValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array')
];

const jobIdValidation = [
  param('jobId')
    .isInt({ min: 0 })
    .withMessage('Job ID must be a valid integer')
];

const listJobsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('category')
    .optional()
    .isIn(['development', 'design', 'writing', 'marketing', 'consulting', 'other'])
    .withMessage('Invalid category'),
  query('status')
    .optional()
    .isIn(['open', 'assigned', 'in_progress', 'completed', 'disputed', 'cancelled'])
    .withMessage('Invalid status'),
  query('minAmount')
    .optional()
    .matches(/^\d+(\.\d{1,18})?$/)
    .withMessage('Invalid minimum amount format'),
  query('maxAmount')
    .optional()
    .matches(/^\d+(\.\d{1,18})?$/)
    .withMessage('Invalid maximum amount format'),
  query('skills')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      }
      return Array.isArray(value);
    })
    .withMessage('Skills must be an array or valid JSON string')
];

// Routes

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs with filtering and pagination
 * @access  Public
 */
router.get('/', 
  listJobsValidation,
  validate,
  optionalAuth,
  catchAsync(jobController.getAllJobs)
);

/**
 * @route   GET /api/jobs/featured
 * @desc    Get featured jobs
 * @access  Public
 */
router.get('/featured',
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20'),
  validate,
  catchAsync(jobController.getFeaturedJobs)
);

/**
 * @route   GET /api/jobs/search
 * @desc    Search jobs by title, description, or skills
 * @access  Public
 */
router.get('/search',
  query('q')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  validate,
  optionalAuth,
  catchAsync(jobController.searchJobs)
);

/**
 * @route   GET /api/jobs/stats
 * @desc    Get job statistics
 * @access  Public
 */
router.get('/stats',
  catchAsync(jobController.getJobStats)
);

/**
 * @route   POST /api/jobs
 * @desc    Create a new job
 * @access  Private (Client)
 */
router.post('/',
  authenticate,
  createJobValidation,
  validate,
  catchAsync(jobController.createJob)
);

/**
 * @route   GET /api/jobs/my
 * @desc    Get current user's jobs
 * @access  Private
 */
router.get('/my',
  authenticate,
  query('role')
    .optional()
    .isIn(['client', 'freelancer', 'arbiter'])
    .withMessage('Role must be client, freelancer, or arbiter'),
  query('status')
    .optional()
    .isIn(['open', 'assigned', 'in_progress', 'completed', 'disputed', 'cancelled'])
    .withMessage('Invalid status'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate,
  catchAsync(jobController.getMyJobs)
);

/**
 * @route   GET /api/jobs/:jobId
 * @desc    Get job by ID
 * @access  Public
 */
router.get('/:jobId',
  jobIdValidation,
  validate,
  optionalAuth,
  catchAsync(jobController.getJobById)
);

/**
 * @route   PUT /api/jobs/:jobId
 * @desc    Update job (only client can update before assignment)
 * @access  Private (Client)
 */
router.put('/:jobId',
  authenticate,
  jobIdValidation,
  updateJobValidation,
  validate,
  requireJobClient(),
  catchAsync(jobController.updateJob)
);

/**
 * @route   DELETE /api/jobs/:jobId
 * @desc    Cancel job
 * @access  Private (Client)
 */
router.delete('/:jobId',
  authenticate,
  jobIdValidation,
  validate,
  requireJobClient(),
  catchAsync(jobController.cancelJob)
);

/**
 * @route   POST /api/jobs/:jobId/accept
 * @desc    Accept job (freelancer)
 * @access  Private (Freelancer)
 */
router.post('/:jobId/accept',
  authenticate,
  jobIdValidation,
  validate,
  catchAsync(jobController.acceptJob)
);

/**
 * @route   GET /api/jobs/:jobId/milestones
 * @desc    Get job milestones
 * @access  Private (Job participants)
 */
router.get('/:jobId/milestones',
  authenticate,
  jobIdValidation,
  validate,
  requireJobAccess(),
  catchAsync(jobController.getJobMilestones)
);

/**
 * @route   GET /api/jobs/:jobId/activity
 * @desc    Get job activity/events
 * @access  Private (Job participants)
 */
router.get('/:jobId/activity',
  authenticate,
  jobIdValidation,
  validate,
  requireJobAccess(),
  catchAsync(jobController.getJobActivity)
);

/**
 * @route   POST /api/jobs/:jobId/view
 * @desc    Increment job view count
 * @access  Public
 */
router.post('/:jobId/view',
  jobIdValidation,
  validate,
  optionalAuth,
  catchAsync(jobController.incrementJobViews)
);

/**
 * @route   GET /api/jobs/category/:category
 * @desc    Get jobs by category
 * @access  Public
 */
router.get('/category/:category',
  param('category')
    .isIn(['development', 'design', 'writing', 'marketing', 'consulting', 'other'])
    .withMessage('Invalid category'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  validate,
  optionalAuth,
  catchAsync(jobController.getJobsByCategory)
);

/**
 * @route   GET /api/jobs/user/:address
 * @desc    Get jobs by user address
 * @access  Public
 */
router.get('/user/:address',
  param('address')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum address'),
  query('role')
    .optional()
    .isIn(['client', 'freelancer', 'arbiter'])
    .withMessage('Role must be client, freelancer, or arbiter'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  validate,
  optionalAuth,
  catchAsync(jobController.getJobsByUser)
);

module.exports = router;
