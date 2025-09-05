const Job = require('../models/Job');
const IPFSService = require('../services/ipfsService');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const { ValidationUtils } = require('../utils/helpers');

class MilestoneController {
  constructor() {
    this.ipfsService = new IPFSService();
  }

  /**
   * Get all milestones for a job
   */
  async getJobMilestones(req, res) {
    try {
      const { jobId } = req.params;
      const job = req.job; // Set by requireJobAccess middleware

      const milestones = job.milestones.map((milestone, index) => ({
        index,
        ...milestone.toObject(),
        canSubmit: job.canSubmitMilestone(index, req.user.address),
        canApprove: job.canApproveMilestone(index, req.user.address)
      }));

      res.status(200).json({
        jobId: parseInt(jobId),
        jobStatus: job.status,
        milestones,
        totalMilestones: milestones.length,
        completedMilestones: milestones.filter(m => m.status === 'approved').length
      });

    } catch (error) {
      logger.error('Error getting job milestones:', error);
      throw new AppError('Failed to retrieve job milestones', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get specific milestone details
   */
  async getMilestoneDetails(req, res) {
    try {
      const { jobId, milestoneIndex } = req.params;
      const job = req.job;
      const index = parseInt(milestoneIndex);

      if (index >= job.milestones.length) {
        throw new AppError('Milestone not found', 404, 'MILESTONE_NOT_FOUND');
      }

      const milestone = job.milestones[index];

      res.status(200).json({
        jobId: parseInt(jobId),
        milestoneIndex: index,
        milestone: {
          ...milestone.toObject(),
          canSubmit: job.canSubmitMilestone(index, req.user.address),
          canApprove: job.canApproveMilestone(index, req.user.address)
        }
      });

    } catch (error) {
      logger.error('Error getting milestone details:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to retrieve milestone details', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Submit milestone deliverable (freelancer only)
   */
  async submitMilestone(req, res) {
    try {
      const { jobId, milestoneIndex } = req.params;
      const { deliverableHash, notes } = req.body;
      const job = req.job;
      const index = parseInt(milestoneIndex);

      if (index >= job.milestones.length) {
        throw new AppError('Milestone not found', 404, 'MILESTONE_NOT_FOUND');
      }

      const milestone = job.milestones[index];

      // Check if milestone can be submitted
      if (!job.canSubmitMilestone(index, req.user.address)) {
        throw new AppError('Cannot submit this milestone', 403, 'MILESTONE_NOT_SUBMITTABLE');
      }

      // Validate IPFS hash
      if (!ValidationUtils.isValidIPFSCID(deliverableHash)) {
        throw new AppError('Invalid deliverable hash', 400, 'INVALID_DELIVERABLE_HASH');
      }

      // Verify the deliverable exists on IPFS (optional check)
      try {
        await this.ipfsService.getCachedFileMetadata(deliverableHash);
      } catch (error) {
        logger.warn(`Could not verify deliverable on IPFS: ${deliverableHash}`);
        // Continue anyway - the hash might be valid but not in our cache
      }

      // This should trigger a blockchain transaction
      // For now, just return instructions
      res.status(200).json({
        message: 'Milestone submission prepared',
        instructions: {
          1: 'Call the submitMilestone function on the smart contract',
          2: 'Pass the jobId, milestoneIndex, and deliverableHash as parameters',
          3: 'The backend will process the blockchain event and update the milestone'
        },
        transactionData: {
          jobId: parseInt(jobId),
          milestoneIndex: index,
          deliverableHash,
          notes: notes || null
        }
      });

    } catch (error) {
      logger.error('Error submitting milestone:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to submit milestone', 500, 'SUBMISSION_ERROR');
    }
  }

  /**
   * Approve milestone (client only)
   */
  async approveMilestone(req, res) {
    try {
      const { jobId, milestoneIndex } = req.params;
      const { notes } = req.body;
      const job = req.job;
      const index = parseInt(milestoneIndex);

      if (index >= job.milestones.length) {
        throw new AppError('Milestone not found', 404, 'MILESTONE_NOT_FOUND');
      }

      const milestone = job.milestones[index];

      // Check if milestone can be approved
      if (!job.canApproveMilestone(index, req.user.address)) {
        throw new AppError('Cannot approve this milestone', 403, 'MILESTONE_NOT_APPROVABLE');
      }

      // This should trigger a blockchain transaction
      // For now, just return instructions
      res.status(200).json({
        message: 'Milestone approval prepared',
        instructions: {
          1: 'Call the approveMilestone function on the smart contract',
          2: 'Pass the jobId and milestoneIndex as parameters',
          3: 'The backend will process the blockchain event and release the payment'
        },
        transactionData: {
          jobId: parseInt(jobId),
          milestoneIndex: index,
          amount: milestone.amount,
          notes: notes || null
        }
      });

    } catch (error) {
      logger.error('Error approving milestone:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to approve milestone', 500, 'APPROVAL_ERROR');
    }
  }

  /**
   * Get milestone deliverable from IPFS
   */
  async getMilestoneDeliverable(req, res) {
    try {
      const { jobId, milestoneIndex } = req.params;
      const job = req.job;
      const index = parseInt(milestoneIndex);

      if (index >= job.milestones.length) {
        throw new AppError('Milestone not found', 404, 'MILESTONE_NOT_FOUND');
      }

      const milestone = job.milestones[index];

      if (!milestone.deliverableHash) {
        throw new AppError('No deliverable submitted for this milestone', 404, 'NO_DELIVERABLE');
      }

      // Get deliverable metadata
      const metadata = await this.ipfsService.getCachedFileMetadata(milestone.deliverableHash);

      res.status(200).json({
        jobId: parseInt(jobId),
        milestoneIndex: index,
        deliverable: {
          hash: milestone.deliverableHash,
          url: this.ipfsService.getIPFSUrl(milestone.deliverableHash),
          submittedAt: milestone.submittedAt,
          metadata
        }
      });

    } catch (error) {
      logger.error('Error getting milestone deliverable:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to retrieve deliverable', 500, 'DELIVERABLE_ERROR');
    }
  }

  /**
   * Get user's pending milestones
   */
  async getPendingMilestones(req, res) {
    try {
      const userAddress = req.user.address.toLowerCase();

      // Find jobs where user is freelancer with pending milestones
      const jobs = await Job.find({
        freelancer: userAddress,
        status: { $in: ['assigned', 'in_progress'] },
        'milestones.status': 'pending'
      })
        .populate('client', 'username profile.firstName profile.lastName')
        .lean();

      const pendingMilestones = [];

      jobs.forEach(job => {
        job.milestones.forEach((milestone, index) => {
          if (milestone.status === 'pending') {
            pendingMilestones.push({
              jobId: job.jobId,
              jobTitle: job.title,
              client: job.client,
              milestoneIndex: index,
              milestone: {
                description: milestone.description,
                amount: milestone.amount,
                dueDate: milestone.dueDate,
                status: milestone.status
              }
            });
          }
        });
      });

      // Sort by due date
      pendingMilestones.sort((a, b) => new Date(a.milestone.dueDate) - new Date(b.milestone.dueDate));

      res.status(200).json({
        pendingMilestones,
        totalPending: pendingMilestones.length
      });

    } catch (error) {
      logger.error('Error getting pending milestones:', error);
      throw new AppError('Failed to retrieve pending milestones', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get user's submitted milestones waiting for approval
   */
  async getSubmittedMilestones(req, res) {
    try {
      const userAddress = req.user.address.toLowerCase();

      // Find jobs based on user role
      const clientJobs = await Job.find({
        client: userAddress,
        'milestones.status': 'submitted'
      })
        .populate('freelancer', 'username profile.firstName profile.lastName')
        .lean();

      const freelancerJobs = await Job.find({
        freelancer: userAddress,
        'milestones.status': 'submitted'
      })
        .populate('client', 'username profile.firstName profile.lastName')
        .lean();

      const submittedMilestones = [];

      // Client perspective - milestones waiting for approval
      clientJobs.forEach(job => {
        job.milestones.forEach((milestone, index) => {
          if (milestone.status === 'submitted') {
            submittedMilestones.push({
              jobId: job.jobId,
              jobTitle: job.title,
              freelancer: job.freelancer,
              milestoneIndex: index,
              milestone: {
                description: milestone.description,
                amount: milestone.amount,
                deliverableHash: milestone.deliverableHash,
                submittedAt: milestone.submittedAt,
                status: milestone.status
              },
              userRole: 'client',
              action: 'approve'
            });
          }
        });
      });

      // Freelancer perspective - milestones submitted but not yet approved
      freelancerJobs.forEach(job => {
        job.milestones.forEach((milestone, index) => {
          if (milestone.status === 'submitted') {
            submittedMilestones.push({
              jobId: job.jobId,
              jobTitle: job.title,
              client: job.client,
              milestoneIndex: index,
              milestone: {
                description: milestone.description,
                amount: milestone.amount,
                deliverableHash: milestone.deliverableHash,
                submittedAt: milestone.submittedAt,
                status: milestone.status
              },
              userRole: 'freelancer',
              action: 'waiting'
            });
          }
        });
      });

      // Sort by submission date
      submittedMilestones.sort((a, b) => new Date(b.milestone.submittedAt) - new Date(a.milestone.submittedAt));

      res.status(200).json({
        submittedMilestones,
        totalSubmitted: submittedMilestones.length
      });

    } catch (error) {
      logger.error('Error getting submitted milestones:', error);
      throw new AppError('Failed to retrieve submitted milestones', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get milestone statistics for user
   */
  async getMilestoneStats(req, res) {
    try {
      const userAddress = req.user.address.toLowerCase();

      const [freelancerStats, clientStats] = await Promise.all([
        // Stats as freelancer
        Job.aggregate([
          { $match: { freelancer: userAddress } },
          { $unwind: '$milestones' },
          {
            $group: {
              _id: '$milestones.status',
              count: { $sum: 1 },
              totalAmount: { $sum: { $toDouble: '$milestones.amount' } }
            }
          }
        ]),
        // Stats as client
        Job.aggregate([
          { $match: { client: userAddress } },
          { $unwind: '$milestones' },
          {
            $group: {
              _id: '$milestones.status',
              count: { $sum: 1 },
              totalAmount: { $sum: { $toDouble: '$milestones.amount' } }
            }
          }
        ])
      ]);

      // Process stats
      const processStats = (stats) => {
        const result = {
          pending: { count: 0, amount: 0 },
          submitted: { count: 0, amount: 0 },
          approved: { count: 0, amount: 0 },
          disputed: { count: 0, amount: 0 }
        };

        stats.forEach(stat => {
          if (result[stat._id]) {
            result[stat._id] = {
              count: stat.count,
              amount: stat.totalAmount
            };
          }
        });

        return result;
      };

      const freelancerMilestones = processStats(freelancerStats);
      const clientMilestones = processStats(clientStats);

      res.status(200).json({
        userAddress,
        freelancer: {
          milestones: freelancerMilestones,
          totalMilestones: Object.values(freelancerMilestones).reduce((sum, stat) => sum + stat.count, 0),
          totalEarned: freelancerMilestones.approved.amount
        },
        client: {
          milestones: clientMilestones,
          totalMilestones: Object.values(clientMilestones).reduce((sum, stat) => sum + stat.count, 0),
          totalSpent: clientMilestones.approved.amount
        }
      });

    } catch (error) {
      logger.error('Error getting milestone stats:', error);
      throw new AppError('Failed to retrieve milestone statistics', 500, 'DATABASE_ERROR');
    }
  }
}

module.exports = new MilestoneController();
