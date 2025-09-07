const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticate, verifySignature, optionalAuth } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const userController = require('../controllers/userController');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('address')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum address'),
  body('signature')
    .notEmpty()
    .withMessage('Signature is required'),
  body('message')
    .notEmpty()
    .withMessage('Message is required'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('roles')
    .optional()
    .isArray()
    .withMessage('Roles must be an array'),
  body('roles.*')
    .isIn(['freelancer', 'client', 'arbiter'])
    .withMessage('Invalid role')
];

const updateProfileValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('profile.firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('profile.lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  body('profile.bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must be less than 1000 characters'),
  body('profile.location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  body('profile.website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL')
];

const addressValidation = [
  param('address')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum address')
];

// Routes

/**
 * @route   POST /api/users/auth/nonce
 * @desc    Get nonce for signature authentication
 * @access  Public
 */
router.post('/auth/nonce',
  body('address')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum address'),
  validate,
  catchAsync(userController.getNonce)
);

/**
 * @route   POST /api/users/auth/login
 * @desc    Login with signature
 * @access  Public
 */
router.post('/auth/login',
  body('address')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum address'),
  body('signature')
    .notEmpty()
    .withMessage('Signature is required'),
  body('message')
    .notEmpty()
    .withMessage('Message is required'),
  validate,
  verifySignature,
  catchAsync(userController.login)
);

/**
 * @route   POST /api/users/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register',
  registerValidation,
  validate,
  verifySignature,
  catchAsync(userController.register)
);

/**
 * @route   POST /api/users/simple-register
 * @desc    Simple user registration for testing (without signature)
 * @access  Public
 */
router.post('/simple-register',
  body('address')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum address'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  validate,
  catchAsync(userController.simpleRegister)
);

/**
 * @route   POST /api/users/signup
 * @desc    Traditional signup with email and password
 * @access  Public
 */
router.post('/signup',
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters'),
  body('role')
    .optional()
    .isIn(['client', 'freelancer'])
    .withMessage('Role must be either client or freelancer'),
  validate,
  catchAsync(userController.traditionalSignup)
);

/**
 * @route   POST /api/users/login
 * @desc    Traditional login with email and password
 * @access  Public
 */
router.post('/login',
  body('email')
    .isEmail()
    .withMessage('Invalid email format'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate,
  catchAsync(userController.traditionalLogin)
);

/**
 * @route   POST /api/users/forgot-password
 * @desc    Initiate password reset process
 * @access  Public
 */
router.post('/forgot-password',
  body('email')
    .isEmail()
    .withMessage('Invalid email format'),
  validate,
  catchAsync(userController.forgotPassword)
);

/**
 * @route   POST /api/users/reset-password
 * @desc    Complete password reset with new password
 * @access  Public
 */
router.post('/reset-password',
  body('email')
    .isEmail()
    .withMessage('Invalid email format'),
  body('newPassword')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters'),
  validate,
  catchAsync(userController.resetPassword)
);

/**
 * @route   POST /api/users/verify-email
 * @desc    Update email verification status after Firebase verification
 * @access  Private
 */
router.post('/verify-email',
  authenticate,
  body('firebaseUID')
    .optional()
    .isString()
    .withMessage('Firebase UID must be a string'),
  validate,
  catchAsync(userController.verifyEmail)
);

/**
 * @route   POST /api/users/resend-verification
 * @desc    Get user info for Firebase verification
 * @access  Private
 */
router.post('/resend-verification',
  authenticate,
  catchAsync(userController.resendVerificationEmail)
);

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me',
  authenticate,
  catchAsync(userController.getCurrentUser)
);

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me',
  authenticate,
  updateProfileValidation,
  validate,
  catchAsync(userController.updateProfile)
);

/**
 * @route   GET /api/users/:address
 * @desc    Get user profile by address
 * @access  Public
 */
router.get('/:address',
  addressValidation,
  validate,
  optionalAuth,
  catchAsync(userController.getUserByAddress)
);

/**
 * @route   GET /api/users
 * @desc    Get users with filtering
 * @access  Public
 */
router.get('/',
  query('role')
    .optional()
    .isIn(['freelancer', 'client', 'arbiter'])
    .withMessage('Invalid role'),
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
    .withMessage('Skills must be an array or valid JSON string'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  validate,
  catchAsync(userController.getUsers)
);

/**
 * @route   GET /api/users/freelancers/top
 * @desc    Get top freelancers
 * @access  Public
 */
router.get('/freelancers/top',
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20'),
  validate,
  catchAsync(userController.getTopFreelancers)
);

/**
 * @route   GET /api/users/arbiters/verified
 * @desc    Get verified arbiters
 * @access  Public
 */
router.get('/arbiters/verified',
  catchAsync(userController.getVerifiedArbiters)
);

/**
 * @route   POST /api/users/me/skills
 * @desc    Add skill to user profile
 * @access  Private
 */
router.post('/me/skills',
  authenticate,
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Skill name must be between 1 and 50 characters'),
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Invalid skill level'),
  body('yearsOfExperience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Years of experience must be between 0 and 50'),
  validate,
  catchAsync(userController.addSkill)
);

/**
 * @route   DELETE /api/users/me/skills/:skillName
 * @desc    Remove skill from user profile
 * @access  Private
 */
router.delete('/me/skills/:skillName',
  authenticate,
  param('skillName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Skill name is required'),
  validate,
  catchAsync(userController.removeSkill)
);

/**
 * @route   PUT /api/users/me/settings
 * @desc    Update user settings
 * @access  Private
 */
router.put('/me/settings',
  authenticate,
  body('emailNotifications')
    .optional()
    .isObject()
    .withMessage('Email notifications must be an object'),
  body('privacy')
    .optional()
    .isObject()
    .withMessage('Privacy settings must be an object'),
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object'),
  validate,
  catchAsync(userController.updateSettings)
);

/**
 * @route   GET /api/users/:address/stats
 * @desc    Get user statistics
 * @access  Public
 */
router.get('/:address/stats',
  addressValidation,
  validate,
  catchAsync(userController.getUserStats)
);

/**
 * @route   POST /api/users/me/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post('/me/avatar',
  authenticate,
  // Avatar upload will be handled by the IPFS controller
  catchAsync(userController.uploadAvatar)
);

module.exports = router;
