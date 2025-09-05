const express = require('express');
const multer = require('multer');
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const ipfsController = require('../controllers/ipfsController');
const validate = require('../middleware/validation');
const config = require('../config/config');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Validation rules
const uploadFileValidation = [
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('jobId')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Job ID must be a valid integer')
];

const uploadDataValidation = [
  body('data')
    .notEmpty()
    .withMessage('Data is required'),
  body('fileName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('File name must be between 1 and 255 characters')
];

const cidValidation = [
  param('cid')
    .notEmpty()
    .withMessage('CID is required')
    .custom((value) => {
      // Basic CID validation
      const cidV0Pattern = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
      const cidV1Pattern = /^b[a-z2-7]{58}$/;
      if (!cidV0Pattern.test(value) && !cidV1Pattern.test(value)) {
        throw new Error('Invalid IPFS CID format');
      }
      return true;
    })
];

// Routes

/**
 * @route   POST /api/ipfs/upload
 * @desc    Upload file to IPFS
 * @access  Private
 */
router.post('/upload',
  authenticate,
  upload.single('file'),
  uploadFileValidation,
  validate,
  catchAsync(ipfsController.uploadFile)
);

/**
 * @route   POST /api/ipfs/upload-multiple
 * @desc    Upload multiple files to IPFS
 * @access  Private
 */
router.post('/upload-multiple',
  authenticate,
  upload.array('files', 10), // Max 10 files
  uploadFileValidation,
  validate,
  catchAsync(ipfsController.uploadMultipleFiles)
);

/**
 * @route   POST /api/ipfs/upload-data
 * @desc    Upload JSON data to IPFS
 * @access  Private
 */
router.post('/upload-data',
  authenticate,
  uploadDataValidation,
  validate,
  catchAsync(ipfsController.uploadData)
);

/**
 * @route   GET /api/ipfs/:cid
 * @desc    Get file from IPFS by CID
 * @access  Public
 */
router.get('/:cid',
  cidValidation,
  validate,
  catchAsync(ipfsController.getFile)
);

/**
 * @route   GET /api/ipfs/:cid/data
 * @desc    Get JSON data from IPFS by CID
 * @access  Public
 */
router.get('/:cid/data',
  cidValidation,
  validate,
  catchAsync(ipfsController.getData)
);

/**
 * @route   GET /api/ipfs/:cid/metadata
 * @desc    Get file metadata from IPFS
 * @access  Public
 */
router.get('/:cid/metadata',
  cidValidation,
  validate,
  catchAsync(ipfsController.getMetadata)
);

/**
 * @route   POST /api/ipfs/:cid/pin
 * @desc    Pin content to ensure persistence
 * @access  Private
 */
router.post('/:cid/pin',
  authenticate,
  cidValidation,
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name must be less than 100 characters'),
  validate,
  catchAsync(ipfsController.pinContent)
);

/**
 * @route   GET /api/ipfs/:cid/url
 * @desc    Get IPFS gateway URL for CID
 * @access  Public
 */
router.get('/:cid/url',
  cidValidation,
  validate,
  catchAsync(ipfsController.getIPFSUrl)
);

/**
 * @route   GET /api/ipfs/status
 * @desc    Get IPFS service status
 * @access  Public
 */
router.get('/service/status',
  catchAsync(ipfsController.getServiceStatus)
);

/**
 * @route   GET /api/ipfs/user/uploads
 * @desc    Get user's uploaded files
 * @access  Private
 */
router.get('/user/uploads',
  authenticate,
  catchAsync(ipfsController.getUserUploads)
);

module.exports = router;
