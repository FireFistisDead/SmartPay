const fs = require('fs');
const path = require('path');
const IPFSService = require('../services/ipfsService');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const { ValidationUtils } = require('../utils/helpers');
const redisClient = require('../config/redis');

class IPFSController {
  constructor() {
    this.ipfsService = new IPFSService();
  }

  /**
   * Upload file to IPFS
   */
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400, 'NO_FILE');
      }

      const { description, tags, jobId } = req.body;
      const filePath = req.file.path;
      const fileName = req.file.originalname;

      // Prepare metadata
      const metadata = {
        name: fileName,
        mimeType: req.file.mimetype,
        uploadedBy: req.user.address,
        uploadedAt: new Date(),
        description: description || null,
        tags: tags || [],
        jobId: jobId ? parseInt(jobId) : null,
        keyvalues: {
          uploadedBy: req.user.address,
          originalName: fileName,
          jobId: jobId || null
        }
      };

      // Upload to IPFS
      const result = await this.ipfsService.uploadFile(filePath, metadata);

      // Clean up local file
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        logger.warn('Failed to delete local file:', error);
      }

      // Store upload record in cache
      const uploadRecord = {
        cid: result.cid,
        fileName: result.fileName,
        fileSize: result.fileSize,
        uploadedBy: req.user.address,
        uploadedAt: new Date(),
        metadata
      };

      await redisClient.set(
        `upload:${req.user.address}:${result.cid}`,
        uploadRecord,
        { ttl: 86400 * 30 } // 30 days
      );

      res.status(200).json({
        message: 'File uploaded successfully',
        cid: result.cid,
        url: result.url,
        fileName: result.fileName,
        fileSize: result.fileSize,
        providers: result.providers
      });

    } catch (error) {
      // Clean up file on error
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          logger.error('Failed to cleanup file on error:', cleanupError);
        }
      }

      logger.error('Error uploading file to IPFS:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to upload file to IPFS', 500, 'IPFS_UPLOAD_ERROR');
    }
  }

  /**
   * Upload multiple files to IPFS
   */
  async uploadMultipleFiles(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        throw new AppError('No files uploaded', 400, 'NO_FILES');
      }

      const { description, tags, jobId } = req.body;
      const uploadResults = [];
      const errors = [];

      // Process each file
      for (const file of req.files) {
        try {
          const metadata = {
            name: file.originalname,
            mimeType: file.mimetype,
            uploadedBy: req.user.address,
            uploadedAt: new Date(),
            description: description || null,
            tags: tags || [],
            jobId: jobId ? parseInt(jobId) : null,
            keyvalues: {
              uploadedBy: req.user.address,
              originalName: file.originalname,
              jobId: jobId || null
            }
          };

          const result = await this.ipfsService.uploadFile(file.path, metadata);

          uploadResults.push({
            fileName: file.originalname,
            cid: result.cid,
            url: result.url,
            fileSize: result.fileSize,
            providers: result.providers
          });

          // Store upload record
          const uploadRecord = {
            cid: result.cid,
            fileName: result.fileName,
            fileSize: result.fileSize,
            uploadedBy: req.user.address,
            uploadedAt: new Date(),
            metadata
          };

          await redisClient.set(
            `upload:${req.user.address}:${result.cid}`,
            uploadRecord,
            { ttl: 86400 * 30 }
          );

          // Clean up local file
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            logger.warn('Failed to delete local file:', error);
          }

        } catch (fileError) {
          logger.error(`Error uploading file ${file.originalname}:`, fileError);
          errors.push({
            fileName: file.originalname,
            error: fileError.message
          });

          // Clean up file on error
          try {
            fs.unlinkSync(file.path);
          } catch (cleanupError) {
            logger.error('Failed to cleanup file on error:', cleanupError);
          }
        }
      }

      res.status(200).json({
        message: `Successfully uploaded ${uploadResults.length} of ${req.files.length} files`,
        uploads: uploadResults,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      // Clean up all files on error
      if (req.files) {
        req.files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (cleanupError) {
            logger.error('Failed to cleanup file on error:', cleanupError);
          }
        });
      }

      logger.error('Error uploading multiple files to IPFS:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to upload files to IPFS', 500, 'IPFS_UPLOAD_ERROR');
    }
  }

  /**
   * Upload JSON data to IPFS
   */
  async uploadData(req, res) {
    try {
      const { data, fileName } = req.body;

      const options = {
        fileName: fileName || 'data.json',
        uploadedBy: req.user.address,
        uploadedAt: new Date()
      };

      const result = await this.ipfsService.uploadData(data, options);

      // Store upload record
      const uploadRecord = {
        cid: result.cid,
        fileName: options.fileName,
        dataSize: result.dataSize,
        uploadedBy: req.user.address,
        uploadedAt: new Date(),
        type: 'data'
      };

      await redisClient.set(
        `upload:${req.user.address}:${result.cid}`,
        uploadRecord,
        { ttl: 86400 * 30 }
      );

      res.status(200).json({
        message: 'Data uploaded successfully',
        cid: result.cid,
        url: result.url,
        fileName: options.fileName,
        dataSize: result.dataSize,
        provider: result.provider
      });

    } catch (error) {
      logger.error('Error uploading data to IPFS:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to upload data to IPFS', 500, 'IPFS_UPLOAD_ERROR');
    }
  }

  /**
   * Get file from IPFS by CID
   */
  async getFile(req, res) {
    try {
      const { cid } = req.params;

      if (!ValidationUtils.isValidIPFSCID(cid)) {
        throw new AppError('Invalid IPFS CID', 400, 'INVALID_CID');
      }

      const result = await this.ipfsService.getFile(cid);

      // Set appropriate headers
      if (result.contentType) {
        res.set('Content-Type', result.contentType);
      }

      if (result.metadata?.fileName) {
        res.set('Content-Disposition', `inline; filename="${result.metadata.fileName}"`);
      }

      res.send(result.data);

    } catch (error) {
      logger.error('Error getting file from IPFS:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to retrieve file from IPFS', 500, 'IPFS_GET_ERROR');
    }
  }

  /**
   * Get JSON data from IPFS by CID
   */
  async getData(req, res) {
    try {
      const { cid } = req.params;

      if (!ValidationUtils.isValidIPFSCID(cid)) {
        throw new AppError('Invalid IPFS CID', 400, 'INVALID_CID');
      }

      const result = await this.ipfsService.getData(cid);

      res.status(200).json({
        cid: result.cid,
        data: result.data,
        metadata: result.metadata
      });

    } catch (error) {
      logger.error('Error getting data from IPFS:', error);
      if (error instanceof AppError) throw error;
      
      if (error.message.includes('JSON')) {
        throw new AppError('Content is not valid JSON', 400, 'INVALID_JSON');
      }
      
      throw new AppError('Failed to retrieve data from IPFS', 500, 'IPFS_GET_ERROR');
    }
  }

  /**
   * Get file metadata from IPFS
   */
  async getMetadata(req, res) {
    try {
      const { cid } = req.params;

      if (!ValidationUtils.isValidIPFSCID(cid)) {
        throw new AppError('Invalid IPFS CID', 400, 'INVALID_CID');
      }

      const metadata = await this.ipfsService.getCachedFileMetadata(cid);

      if (!metadata) {
        throw new AppError('Metadata not found for this CID', 404, 'METADATA_NOT_FOUND');
      }

      res.status(200).json({
        cid,
        metadata
      });

    } catch (error) {
      logger.error('Error getting metadata from IPFS:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to retrieve metadata', 500, 'METADATA_ERROR');
    }
  }

  /**
   * Pin content to ensure persistence
   */
  async pinContent(req, res) {
    try {
      const { cid } = req.params;
      const { name } = req.body;

      if (!ValidationUtils.isValidIPFSCID(cid)) {
        throw new AppError('Invalid IPFS CID', 400, 'INVALID_CID');
      }

      const metadata = {
        name: name || `pinned-${cid}`,
        pinnedBy: req.user.address,
        pinnedAt: new Date()
      };

      const results = await this.ipfsService.pinContent(cid, metadata);

      const successfulPins = results.filter(r => r.success);
      const failedPins = results.filter(r => !r.success);

      if (successfulPins.length === 0) {
        throw new AppError('Failed to pin content on any provider', 500, 'PIN_FAILED');
      }

      res.status(200).json({
        message: 'Content pinned successfully',
        cid,
        successfulPins: successfulPins.length,
        failedPins: failedPins.length,
        results
      });

    } catch (error) {
      logger.error('Error pinning content:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to pin content', 500, 'PIN_ERROR');
    }
  }

  /**
   * Get IPFS gateway URL for CID
   */
  async getIPFSUrl(req, res) {
    try {
      const { cid } = req.params;
      const { gateway } = req.query;

      if (!ValidationUtils.isValidIPFSCID(cid)) {
        throw new AppError('Invalid IPFS CID', 400, 'INVALID_CID');
      }

      const url = this.ipfsService.getIPFSUrl(cid, gateway);

      res.status(200).json({
        cid,
        url,
        gateway: gateway || 'default'
      });

    } catch (error) {
      logger.error('Error getting IPFS URL:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to generate IPFS URL', 500, 'URL_ERROR');
    }
  }

  /**
   * Get IPFS service status
   */
  async getServiceStatus(req, res) {
    try {
      const status = await this.ipfsService.getStatus();

      res.status(200).json({
        service: 'IPFS',
        status,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('Error getting service status:', error);
      res.status(500).json({
        service: 'IPFS',
        status: 'error',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get user's uploaded files
   */
  async getUserUploads(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const userAddress = req.user.address;

      // Get uploads from cache
      const pattern = `upload:${userAddress}:*`;
      const keys = await redisClient.keys ? await redisClient.keys(pattern) : [];

      if (keys.length === 0) {
        return res.status(200).json({
          uploads: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalUploads: 0,
            hasNextPage: false,
            hasPrevPage: false,
            limit: parseInt(limit)
          }
        });
      }

      // Get upload records
      const uploads = [];
      for (const key of keys) {
        try {
          const upload = await redisClient.get(key);
          if (upload) {
            uploads.push(upload);
          }
        } catch (error) {
          logger.warn('Failed to get upload record:', error);
        }
      }

      // Sort by upload date (newest first)
      uploads.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);
      const paginatedUploads = uploads.slice(skip, skip + limitNum);

      const totalPages = Math.ceil(uploads.length / limitNum);

      res.status(200).json({
        uploads: paginatedUploads,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUploads: uploads.length,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit: limitNum
        }
      });

    } catch (error) {
      logger.error('Error getting user uploads:', error);
      throw new AppError('Failed to retrieve user uploads', 500, 'DATABASE_ERROR');
    }
  }
}

module.exports = new IPFSController();
