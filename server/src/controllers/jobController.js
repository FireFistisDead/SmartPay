const Job = require('../models/Job');
const User = require('../models/User');
const Event = require('../models/Event');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const { ValidationUtils, FormatUtils } = require('../utils/helpers');
const redisClient = require('../config/redis');

class JobController {
  constructor() {
    this.contractService = null; // Will be set via ServiceManager
  }

  /**
   * Get all jobs with filtering and pagination
   */
  async getAllJobs(req, res) {
    const {
      page = 1,
      limit = 20,
      category,
      status,
      minAmount,
      maxAmount,
      skills,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    if (status) filter.status = status;
    
    if (minAmount || maxAmount) {
      filter.totalAmount = {};
      if (minAmount) filter.totalAmount.$gte = minAmount;
      if (maxAmount) filter.totalAmount.$lte = maxAmount;
    }
    
    if (skills) {
      let skillsArray;
      try {
        skillsArray = typeof skills === 'string' ? JSON.parse(skills) : skills;
      } catch {
        skillsArray = Array.isArray(skills) ? skills : [skills];
      }
      if (skillsArray.length > 0) {
        filter.skills = { $in: skillsArray };
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Sorting
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    try {
      // Check cache first
      const cacheKey = `jobs:${JSON.stringify({ filter, page, limit, sortBy, sortOrder })}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        return res.status(200).json(cached);
      }

      // Execute query
      const [jobs, total] = await Promise.all([
        Job.find(filter)
          .populate('client', 'username profile.firstName profile.lastName')
          .populate('freelancer', 'username profile.firstName profile.lastName reputation')
          .sort(sortObj)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Job.countDocuments(filter)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limitNum);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      const result = {
        jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalJobs: total,
          hasNextPage,
          hasPrevPage,
          limit: limitNum
        },
        filters: {
          category,
          status,
          minAmount,
          maxAmount,
          skills: skillsArray || []
        }
      };

      // Cache for 5 minutes
      await redisClient.set(cacheKey, result, { ttl: 300 });

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting all jobs:', error);
      throw new AppError('Failed to retrieve jobs', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get featured jobs
   */
  async getFeaturedJobs(req, res) {
    const { limit = 10 } = req.query;

    try {
      const cacheKey = `featured_jobs:${limit}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        return res.status(200).json(cached);
      }

      // Get jobs with high amounts or from verified clients
      const jobs = await Job.find({ 
        status: 'open',
        $or: [
          { totalAmount: { $gte: '1000' } }, // High-value jobs
          { views: { $gte: 100 } } // Popular jobs
        ]
      })
        .populate('client', 'username profile verification.isVerified')
        .sort({ totalAmount: -1, views: -1, createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      const result = { jobs };

      // Cache for 10 minutes
      await redisClient.set(cacheKey, result, { ttl: 600 });

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error getting featured jobs:', error);
      throw new AppError('Failed to retrieve featured jobs', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Search jobs by title, description, or skills
   */
  async searchJobs(req, res) {
    const { q, page = 1, limit = 20 } = req.query;

    try {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      // Create text search query
      const searchQuery = {
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { skills: { $in: [new RegExp(q, 'i')] } }
        ],
        status: { $in: ['open', 'assigned', 'in_progress'] }
      };

      const [jobs, total] = await Promise.all([
        Job.find(searchQuery)
          .populate('client', 'username profile.firstName profile.lastName')
          .populate('freelancer', 'username profile.firstName profile.lastName')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Job.countDocuments(searchQuery)
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.status(200).json({
        jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalJobs: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit: limitNum
        },
        searchQuery: q
      });
    } catch (error) {
      logger.error('Error searching jobs:', error);
      throw new AppError('Failed to search jobs', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get job statistics
   */
  async getJobStats(req, res) {
    try {
      const cacheKey = 'job_stats';
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        return res.status(200).json(cached);
      }

      const [
        totalJobs,
        openJobs,
        completedJobs,
        totalVolume,
        categoryStats,
        recentActivity
      ] = await Promise.all([
        Job.countDocuments(),
        Job.countDocuments({ status: 'open' }),
        Job.countDocuments({ status: 'completed' }),
        Job.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: { $toDouble: '$totalAmount' } } } }
        ]),
        Job.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Job.aggregate([
          { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ])
      ]);

      const stats = {
        totalJobs,
        openJobs,
        completedJobs,
        totalVolume: totalVolume[0]?.total || 0,
        completionRate: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0,
        categoryStats,
        recentActivity
      };

      // Cache for 15 minutes
      await redisClient.set(cacheKey, stats, { ttl: 900 });

      res.status(200).json(stats);
    } catch (error) {
      logger.error('Error getting job stats:', error);
      throw new AppError('Failed to retrieve job statistics', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Create a new job
   */
  async createJob(req, res) {
    const {
      title,
      description,
      category,
      skills = [],
      milestones,
      deadline,
      arbiter,
      ipfsHash
    } = req.body;

    try {
      // Validate arbiter address
      if (!ValidationUtils.isValidEthereumAddress(arbiter)) {
        throw new AppError('Invalid arbiter address', 400, 'INVALID_ARBITER');
      }

      // Validate milestones
      if (!milestones || milestones.length === 0) {
        throw new AppError('At least one milestone is required', 400, 'NO_MILESTONES');
      }

      // Calculate total amount
      let totalAmount = '0';
      for (const milestone of milestones) {
        ValidationUtils.validateAmount(milestone.amount);
        totalAmount = (parseFloat(totalAmount) + parseFloat(milestone.amount)).toString();
      }

      // Prepare data for blockchain transaction
      const blockchainJobData = {
        freelancerAddress: '0x0000000000000000000000000000000000000000', // Will be set when freelancer accepts
        arbiterAddress: arbiter.toLowerCase(),
        totalAmount: totalAmount,
        ipfsHash: ipfsHash || '',
        milestoneAmounts: milestones.map(m => m.amount),
        milestoneDueDates: milestones.map(m => m.dueDate)
      };

      // Create job object for database (will be saved when blockchain event is processed)
      const jobData = {
        title: ValidationUtils.sanitizeString(title, 200),
        description: ValidationUtils.sanitizeString(description, 5000),
        category,
        skills: skills.map(skill => ValidationUtils.sanitizeString(skill, 50)),
        client: req.user.address.toLowerCase(),
        arbiter: arbiter.toLowerCase(),
        totalAmount,
        deadline: new Date(deadline),
        milestones: milestones.map(milestone => ({
          description: ValidationUtils.sanitizeString(milestone.description, 500),
          amount: milestone.amount,
          dueDate: new Date(milestone.dueDate),
          status: 'pending'
        })),
        ipfsHash: ipfsHash || '',
        status: 'open'
      };

      logger.info('Creating job on blockchain:', {
        client: req.user.address,
        arbiter: arbiter,
        totalAmount,
        milestones: milestones.length
      });

      // Send transaction to blockchain
      try {
        const blockchainResult = await this.contractService.createJob(blockchainJobData);
        
        logger.info('Job created on blockchain successfully:', {
          jobId: blockchainResult.jobId,
          transactionHash: blockchainResult.transactionHash
        });

        // Store pending job data in cache for when the event is processed
        const pendingJobKey = `pending_job_${blockchainResult.transactionHash}`;
        await redisClient.set(pendingJobKey, JSON.stringify(jobData), { ttl: 3600 }); // 1 hour TTL

        res.status(200).json({
          success: true,
          message: 'Job creation transaction sent to blockchain',
          jobId: blockchainResult.jobId,
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber,
          status: 'pending_confirmation',
          jobData: {
            ...jobData,
            jobId: blockchainResult.jobId,
            transactionHash: blockchainResult.transactionHash
          }
        });

      } catch (blockchainError) {
        logger.error('Blockchain transaction failed:', blockchainError);
        
        // For development/testing, allow fallback to database-only creation
        if (process.env.NODE_ENV === 'development' && blockchainError.code === 'BLOCKCHAIN_INIT_ERROR') {
          logger.warn('Falling back to database-only job creation for development');
          
          // Generate a temporary job ID for development
          const tempJobId = Math.floor(Math.random() * 1000000);
          jobData.jobId = tempJobId;
          jobData.status = 'open';
          
          const job = await Job.create(jobData);
          
          return res.status(200).json({
            success: true,
            message: 'Job created in database (development mode - no blockchain)',
            job,
            warning: 'This job exists only in the database. Deploy smart contract for full functionality.'
          });
        }
        
        throw blockchainError;
      }

    } catch (error) {
      logger.error('Error creating job:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create job', 500, 'JOB_CREATION_ERROR');
    }
  }

  /**
   * Get current user's jobs
   */
  async getMyJobs(req, res) {
    const { role, status, page = 1, limit = 20 } = req.query;
    const userAddress = req.user.address.toLowerCase();

    try {
      // Build filter based on role
      let filter = {};
      
      if (role === 'client') {
        filter.client = userAddress;
      } else if (role === 'freelancer') {
        filter.freelancer = userAddress;
      } else if (role === 'arbiter') {
        filter.arbiter = userAddress;
      } else {
        // All roles
        filter.$or = [
          { client: userAddress },
          { freelancer: userAddress },
          { arbiter: userAddress }
        ];
      }

      if (status) {
        filter.status = status;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      const [jobs, total] = await Promise.all([
        Job.find(filter)
          .populate('client', 'username profile.firstName profile.lastName')
          .populate('freelancer', 'username profile.firstName profile.lastName')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Job.countDocuments(filter)
      ]);

      // Add role information to each job
      const jobsWithRole = jobs.map(job => ({
        ...job,
        userRole: job.client === userAddress ? 'client' 
                : job.freelancer === userAddress ? 'freelancer'
                : job.arbiter === userAddress ? 'arbiter' : null
      }));

      const totalPages = Math.ceil(total / limitNum);

      res.status(200).json({
        jobs: jobsWithRole,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalJobs: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit: limitNum
        }
      });

    } catch (error) {
      logger.error('Error getting user jobs:', error);
      throw new AppError('Failed to retrieve your jobs', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get job by ID
   */
  async getJobById(req, res) {
    const { jobId } = req.params;

    try {
      const job = await Job.findOne({ jobId: parseInt(jobId) })
        .populate('client', 'username profile reputation verification')
        .populate('freelancer', 'username profile reputation verification')
        .populate('arbiter', 'username profile reputation verification')
        .lean();

      if (!job) {
        throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
      }

      // Add user role if authenticated
      if (req.user) {
        const userAddress = req.user.address.toLowerCase();
        job.userRole = job.client === userAddress ? 'client' 
                     : job.freelancer === userAddress ? 'freelancer'
                     : job.arbiter === userAddress ? 'arbiter' : null;
      }

      res.status(200).json({ job });

    } catch (error) {
      logger.error('Error getting job by ID:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to retrieve job', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Update job (only before assignment)
   */
  async updateJob(req, res) {
    const { jobId } = req.params;
    const updateData = req.body;

    try {
      const job = await Job.findOne({ jobId: parseInt(jobId) });

      if (!job) {
        throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
      }

      // Can only update open jobs
      if (job.status !== 'open') {
        throw new AppError('Cannot update job after it has been assigned', 400, 'JOB_NOT_EDITABLE');
      }

      // Sanitize update data
      const allowedUpdates = ['title', 'description', 'skills'];
      const sanitizedUpdates = {};

      for (const field of allowedUpdates) {
        if (updateData[field] !== undefined) {
          if (field === 'skills') {
            sanitizedUpdates[field] = updateData[field].map(skill => 
              ValidationUtils.sanitizeString(skill, 50)
            );
          } else {
            const maxLength = field === 'title' ? 200 : 5000;
            sanitizedUpdates[field] = ValidationUtils.sanitizeString(updateData[field], maxLength);
          }
        }
      }

      const updatedJob = await Job.findOneAndUpdate(
        { jobId: parseInt(jobId) },
        { $set: sanitizedUpdates },
        { new: true, runValidators: true }
      ).populate('client', 'username profile');

      res.status(200).json({
        message: 'Job updated successfully',
        job: updatedJob
      });

    } catch (error) {
      logger.error('Error updating job:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update job', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Cancel job
   */
  async cancelJob(req, res) {
    const { jobId } = req.params;
    const { reason } = req.body;

    try {
      const job = await Job.findOne({ jobId: parseInt(jobId) });

      if (!job) {
        throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
      }

      // Can only cancel open or assigned jobs
      if (!['open', 'assigned'].includes(job.status)) {
        throw new AppError('Cannot cancel job in current status', 400, 'JOB_NOT_CANCELLABLE');
      }

      const cancellationReason = reason || 'Job cancelled by client';

      logger.info(`Cancelling job ${jobId}:`, {
        client: req.user.address,
        reason: cancellationReason
      });

      // Send transaction to blockchain
      try {
        const blockchainResult = await this.contractService.cancelJob(
          job.jobId,
          cancellationReason
        );

        logger.info('Job cancelled on blockchain successfully:', {
          jobId: job.jobId,
          transactionHash: blockchainResult.transactionHash
        });

        res.status(200).json({
          success: true,
          message: 'Job cancellation transaction sent to blockchain',
          jobId: parseInt(jobId),
          reason: cancellationReason,
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber,
          status: 'pending_confirmation'
        });

      } catch (blockchainError) {
        logger.error('Blockchain transaction failed:', blockchainError);
        
        // For development/testing, allow fallback to database-only update
        if (process.env.NODE_ENV === 'development' && blockchainError.code === 'BLOCKCHAIN_INIT_ERROR') {
          logger.warn('Falling back to database-only job cancellation for development');
          
          // Update job in database
          job.status = 'cancelled';
          job.cancelledAt = new Date();
          job.cancelReason = cancellationReason;
          
          await job.save();
          
          return res.status(200).json({
            success: true,
            message: 'Job cancelled (development mode - no blockchain)',
            job: job.toObject(),
            warning: 'This update exists only in the database. Deploy smart contract for full functionality.'
          });
        }
        
        throw blockchainError;
      }

    } catch (error) {
      logger.error('Error cancelling job:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cancel job', 500, 'JOB_CANCELLATION_ERROR');
    }
  }

  /**
   * Accept job (freelancer)
   */
  async acceptJob(req, res) {
    const { jobId } = req.params;

    try {
      const job = await Job.findOne({ jobId: parseInt(jobId) });

      if (!job) {
        throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
      }

      if (job.status !== 'open') {
        throw new AppError('Job is not available for acceptance', 400, 'JOB_NOT_AVAILABLE');
      }

      if (job.client.toLowerCase() === req.user.address.toLowerCase()) {
        throw new AppError('Cannot accept your own job', 400, 'CANNOT_ACCEPT_OWN_JOB');
      }

      logger.info(`Job ${jobId} being accepted by freelancer:`, {
        freelancer: req.user.address,
        client: job.client
      });

      // Send transaction to blockchain
      try {
        const blockchainResult = await this.contractService.acceptJob(
          job.jobId,
          req.user.address
        );

        logger.info('Job accepted on blockchain successfully:', {
          jobId: job.jobId,
          freelancer: req.user.address,
          transactionHash: blockchainResult.transactionHash
        });

        res.status(200).json({
          success: true,
          message: 'Job acceptance transaction sent to blockchain',
          jobId: parseInt(jobId),
          freelancer: req.user.address,
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber,
          status: 'pending_confirmation'
        });

      } catch (blockchainError) {
        logger.error('Blockchain transaction failed:', blockchainError);
        
        // For development/testing, allow fallback to database-only update
        if (process.env.NODE_ENV === 'development' && blockchainError.code === 'BLOCKCHAIN_INIT_ERROR') {
          logger.warn('Falling back to database-only job acceptance for development');
          
          // Update job in database
          job.freelancer = req.user.address.toLowerCase();
          job.status = 'assigned';
          job.acceptedAt = new Date();
          
          await job.save();
          
          return res.status(200).json({
            success: true,
            message: 'Job accepted (development mode - no blockchain)',
            job: job.toObject(),
            warning: 'This update exists only in the database. Deploy smart contract for full functionality.'
          });
        }
        
        throw blockchainError;
      }

    } catch (error) {
      logger.error('Error accepting job:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to accept job', 500, 'JOB_ACCEPTANCE_ERROR');
    }
  }

  /**
   * Get job milestones
   */
  async getJobMilestones(req, res) {
    const { jobId } = req.params;

    try {
      const job = await Job.findOne({ jobId: parseInt(jobId) })
        .select('milestones status')
        .lean();

      if (!job) {
        throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
      }

      res.status(200).json({
        jobId: parseInt(jobId),
        milestones: job.milestones,
        jobStatus: job.status
      });

    } catch (error) {
      logger.error('Error getting job milestones:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to retrieve job milestones', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get job activity/events
   */
  async getJobActivity(req, res) {
    const { jobId } = req.params;

    try {
      const events = await Event.findByJob(parseInt(jobId));

      res.status(200).json({
        jobId: parseInt(jobId),
        events
      });

    } catch (error) {
      logger.error('Error getting job activity:', error);
      throw new AppError('Failed to retrieve job activity', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Increment job view count
   */
  async incrementJobViews(req, res) {
    const { jobId } = req.params;

    try {
      // Use atomic increment to avoid race conditions
      await Job.findOneAndUpdate(
        { jobId: parseInt(jobId) },
        { $inc: { views: 1 } }
      );

      res.status(200).json({
        message: 'View count incremented'
      });

    } catch (error) {
      logger.error('Error incrementing job views:', error);
      // Don't throw error for view counting
      res.status(200).json({
        message: 'View count update failed but request processed'
      });
    }
  }

  /**
   * Get jobs by category
   */
  async getJobsByCategory(req, res) {
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;

    try {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      const [jobs, total] = await Promise.all([
        Job.find({ category, status: { $in: ['open', 'assigned', 'in_progress'] } })
          .populate('client', 'username profile.firstName profile.lastName')
          .populate('freelancer', 'username profile.firstName profile.lastName')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Job.countDocuments({ category, status: { $in: ['open', 'assigned', 'in_progress'] } })
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.status(200).json({
        category,
        jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalJobs: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit: limitNum
        }
      });

    } catch (error) {
      logger.error('Error getting jobs by category:', error);
      throw new AppError('Failed to retrieve jobs by category', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get jobs by user address
   */
  async getJobsByUser(req, res) {
    const { address } = req.params;
    const { role, page = 1, limit = 20 } = req.query;

    try {
      if (!ValidationUtils.isValidEthereumAddress(address)) {
        throw new AppError('Invalid Ethereum address', 400, 'INVALID_ADDRESS');
      }

      const userAddress = address.toLowerCase();
      let filter = {};

      if (role === 'client') {
        filter.client = userAddress;
      } else if (role === 'freelancer') {
        filter.freelancer = userAddress;
      } else if (role === 'arbiter') {
        filter.arbiter = userAddress;
      } else {
        filter.$or = [
          { client: userAddress },
          { freelancer: userAddress },
          { arbiter: userAddress }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      const [jobs, total] = await Promise.all([
        Job.find(filter)
          .populate('client', 'username profile.firstName profile.lastName')
          .populate('freelancer', 'username profile.firstName profile.lastName')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Job.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.status(200).json({
        address: userAddress,
        role,
        jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalJobs: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit: limitNum
        }
      });

    } catch (error) {
      logger.error('Error getting jobs by user:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to retrieve jobs by user', 500, 'DATABASE_ERROR');
    }
  }
}

module.exports = new JobController();
