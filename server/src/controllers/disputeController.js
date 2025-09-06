const Job = require('../models/Job');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('../services/notificationService');
const ContractService = require('../services/contractService');
const logger = require('../utils/logger');

class DisputeController {
  constructor() {
    this.contractService = new ContractService();
  }

  /**
   * Raise a dispute for a job
   */
  async raiseDispute(req, res) {
    const { jobId } = req.params;
    const { reason, description, evidenceFiles, requestedResolution } = req.body;
    const userId = req.user.userId;

    // Find the job
    const job = await Job.findById(jobId).populate('client freelancer');
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    // Check if user is involved in the job
    const isClient = job.client._id.toString() === userId;
    const isFreelancer = job.freelancer._id.toString() === userId;
    
    if (!isClient && !isFreelancer) {
      throw new AppError('You are not authorized to raise a dispute for this job', 403);
    }

    // Check if job can have disputes
    if (!['in_progress', 'completed', 'under_review'].includes(job.status)) {
      throw new AppError('Disputes can only be raised for jobs that are in progress, completed, or under review', 400);
    }

    // Check if there's already an active dispute
    if (job.dispute && job.dispute.status !== 'resolved') {
      throw new AppError('There is already an active dispute for this job', 400);
    }

    // Create dispute object
    const dispute = {
      raisedBy: userId,
      raisedAt: new Date(),
      reason,
      description,
      evidenceFiles: evidenceFiles || [],
      requestedResolution,
      status: 'pending',
      timeline: [{
        action: 'dispute_raised',
        by: userId,
        timestamp: new Date(),
        details: { reason, description }
      }]
    };

    // Update job with dispute
    job.dispute = dispute;
    job.status = 'disputed';
    await job.save();

    // Notify the other party
    const otherParty = isClient ? job.freelancer : job.client;
    await notificationService.sendNotification(otherParty._id, {
      type: 'dispute_raised',
      jobId: job._id,
      jobTitle: job.title,
      raisedBy: isClient ? 'client' : 'freelancer',
      message: `A dispute has been raised for job "${job.title}"`
    });

    logger.info(`Dispute raised for job ${jobId} by user ${userId}`);

    res.status(201).json({
      success: true,
      data: {
        dispute: job.dispute,
        message: 'Dispute raised successfully. The other party has been notified.'
      }
    });
  }

  /**
   * Get disputes with filtering
   */
  async getDisputes(req, res) {
    const { status, role, page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;

    const matchConditions = {
      $or: [
        { client: userId },
        { freelancer: userId }
      ],
      'dispute': { $exists: true }
    };

    // Add role-specific filtering
    if (role === 'client') {
      matchConditions.$or = [{ client: userId }];
    } else if (role === 'freelancer') {
      matchConditions.$or = [{ freelancer: userId }];
    } else if (role === 'arbiter' && req.user.roles.includes('arbiter')) {
      matchConditions.$or = [{ 'dispute.arbiter': userId }];
    }

    // Add status filtering
    if (status) {
      matchConditions['dispute.status'] = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [disputes, total] = await Promise.all([
      Job.find(matchConditions)
        .populate('client', 'address username profile.firstName profile.lastName')
        .populate('freelancer', 'address username profile.firstName profile.lastName')
        .populate('dispute.arbiter', 'address username profile.firstName profile.lastName')
        .select('title budget status dispute createdAt')
        .sort({ 'dispute.raisedAt': -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Job.countDocuments(matchConditions)
    ]);

    res.json({
      success: true,
      data: {
        disputes: disputes.map(job => ({
          id: job._id,
          title: job.title,
          budget: job.budget,
          status: job.status,
          client: job.client,
          freelancer: job.freelancer,
          dispute: job.dispute,
          createdAt: job.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  }

  /**
   * Get dispute details
   */
  async getDisputeDetails(req, res) {
    const { disputeId } = req.params;
    const userId = req.user.userId;

    const job = await Job.findById(disputeId)
      .populate('client', 'address username profile reputation')
      .populate('freelancer', 'address username profile reputation')
      .populate('dispute.arbiter', 'address username profile reputation')
      .populate('dispute.timeline.by', 'address username');

    if (!job || !job.dispute) {
      throw new AppError('Dispute not found', 404);
    }

    // Check access permissions
    const isClient = job.client._id.toString() === userId;
    const isFreelancer = job.freelancer._id.toString() === userId;
    const isArbiter = job.dispute.arbiter && job.dispute.arbiter._id.toString() === userId;
    
    if (!isClient && !isFreelancer && !isArbiter && !req.user.roles.includes('admin')) {
      throw new AppError('You are not authorized to view this dispute', 403);
    }

    res.json({
      success: true,
      data: {
        job: {
          id: job._id,
          title: job.title,
          description: job.description,
          budget: job.budget,
          status: job.status,
          client: job.client,
          freelancer: job.freelancer,
          milestones: job.milestones,
          createdAt: job.createdAt
        },
        dispute: job.dispute
      }
    });
  }

  /**
   * Respond to a dispute
   */
  async respondToDispute(req, res) {
    const { disputeId } = req.params;
    const { response, evidenceFiles } = req.body;
    const userId = req.user.userId;

    const job = await Job.findById(disputeId).populate('client freelancer');
    if (!job || !job.dispute) {
      throw new AppError('Dispute not found', 404);
    }

    // Check if user is the opposing party
    const isClient = job.client._id.toString() === userId;
    const isFreelancer = job.freelancer._id.toString() === userId;
    const disputeRaisedByClient = job.dispute.raisedBy.toString() === job.client._id.toString();
    
    if (!isClient && !isFreelancer) {
      throw new AppError('You are not authorized to respond to this dispute', 403);
    }

    // Check if user is the opposing party (not the one who raised the dispute)
    if ((disputeRaisedByClient && isClient) || (!disputeRaisedByClient && isFreelancer)) {
      throw new AppError('You cannot respond to your own dispute', 400);
    }

    // Check if dispute can be responded to
    if (job.dispute.status !== 'pending') {
      throw new AppError('This dispute cannot be responded to', 400);
    }

    // Add response to dispute
    job.dispute.response = {
      respondedBy: userId,
      respondedAt: new Date(),
      response,
      evidenceFiles: evidenceFiles || []
    };

    job.dispute.status = 'responded';
    job.dispute.timeline.push({
      action: 'dispute_responded',
      by: userId,
      timestamp: new Date(),
      details: { response }
    });

    await job.save();

    // Notify the dispute raiser
    const disputeRaiser = disputeRaisedByClient ? job.client : job.freelancer;
    await notificationService.sendNotification(disputeRaiser._id, {
      type: 'dispute_responded',
      jobId: job._id,
      jobTitle: job.title,
      message: `The other party has responded to the dispute for "${job.title}"`
    });

    res.json({
      success: true,
      data: {
        dispute: job.dispute,
        message: 'Response submitted successfully'
      }
    });
  }

  /**
   * Assign an arbiter to a dispute
   */
  async assignArbiter(req, res) {
    const { disputeId } = req.params;
    const { arbiterId } = req.body;

    const job = await Job.findById(disputeId);
    if (!job || !job.dispute) {
      throw new AppError('Dispute not found', 404);
    }

    // Verify arbiter exists and has arbiter role
    const arbiter = await User.findById(arbiterId);
    if (!arbiter || !arbiter.roles.includes('arbiter')) {
      throw new AppError('Invalid arbiter', 400);
    }

    // Check if arbiter is not involved in the job
    if (arbiter._id.toString() === job.client.toString() || 
        arbiter._id.toString() === job.freelancer.toString()) {
      throw new AppError('Arbiter cannot be involved in the job', 400);
    }

    job.dispute.arbiter = arbiterId;
    job.dispute.status = 'in_review';
    job.dispute.assignedAt = new Date();
    job.dispute.timeline.push({
      action: 'arbiter_assigned',
      by: req.user.userId,
      timestamp: new Date(),
      details: { arbiterId }
    });

    await job.save();

    // Notify all parties
    const notifications = [
      notificationService.sendNotification(job.client, {
        type: 'arbiter_assigned',
        jobId: job._id,
        arbiterId,
        message: `An arbiter has been assigned to your dispute`
      }),
      notificationService.sendNotification(job.freelancer, {
        type: 'arbiter_assigned',
        jobId: job._id,
        arbiterId,
        message: `An arbiter has been assigned to your dispute`
      }),
      notificationService.sendNotification(arbiterId, {
        type: 'arbitration_assigned',
        jobId: job._id,
        message: `You have been assigned to arbitrate a dispute`
      })
    ];

    await Promise.all(notifications);

    res.json({
      success: true,
      data: {
        dispute: job.dispute,
        message: 'Arbiter assigned successfully'
      }
    });
  }

  /**
   * Resolve a dispute (Arbiter only)
   */
  async resolveDispute(req, res) {
    const { disputeId } = req.params;
    const { resolution, ruling, refundPercentage, evidenceFiles } = req.body;
    const userId = req.user.userId;

    const job = await Job.findById(disputeId).populate('client freelancer');
    if (!job || !job.dispute) {
      throw new AppError('Dispute not found', 404);
    }

    // Check if user is the assigned arbiter
    if (!job.dispute.arbiter || job.dispute.arbiter.toString() !== userId) {
      throw new AppError('You are not the assigned arbiter for this dispute', 403);
    }

    // Check if dispute is in review
    if (job.dispute.status !== 'in_review') {
      throw new AppError('Dispute is not in review status', 400);
    }

    // Add arbiter resolution
    job.dispute.arbiterResolution = {
      resolvedBy: userId,
      resolvedAt: new Date(),
      resolution,
      ruling,
      refundPercentage: refundPercentage || 0,
      evidenceFiles: evidenceFiles || []
    };

    job.dispute.status = 'resolved';
    job.dispute.timeline.push({
      action: 'dispute_resolved',
      by: userId,
      timestamp: new Date(),
      details: { ruling, resolution }
    });

    // Update job status based on ruling
    switch (ruling) {
      case 'favor_client':
        job.status = 'cancelled';
        break;
      case 'favor_freelancer':
        job.status = 'completed';
        break;
      case 'partial_refund':
      case 'no_fault':
        job.status = 'completed';
        break;
    }

    await job.save();

    // Notify all parties
    const notifications = [
      notificationService.sendNotification(job.client._id, {
        type: 'dispute_resolved',
        jobId: job._id,
        ruling,
        message: `Your dispute has been resolved by the arbiter`
      }),
      notificationService.sendNotification(job.freelancer._id, {
        type: 'dispute_resolved',
        jobId: job._id,
        ruling,
        message: `Your dispute has been resolved by the arbiter`
      })
    ];

    await Promise.all(notifications);

    logger.info(`Dispute resolved for job ${disputeId} by arbiter ${userId} with ruling: ${ruling}`);

    res.json({
      success: true,
      data: {
        dispute: job.dispute,
        message: 'Dispute resolved successfully'
      }
    });
  }

  /**
   * Escalate a dispute
   */
  async escalateDispute(req, res) {
    const { disputeId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    const job = await Job.findById(disputeId);
    if (!job || !job.dispute) {
      throw new AppError('Dispute not found', 404);
    }

    // Check if user is involved in the dispute
    const isClient = job.client.toString() === userId;
    const isFreelancer = job.freelancer.toString() === userId;
    
    if (!isClient && !isFreelancer) {
      throw new AppError('You are not authorized to escalate this dispute', 403);
    }

    // Check if dispute can be escalated
    if (!['resolved'].includes(job.dispute.status)) {
      throw new AppError('Only resolved disputes can be escalated', 400);
    }

    job.dispute.status = 'escalated';
    job.dispute.escalation = {
      escalatedBy: userId,
      escalatedAt: new Date(),
      reason: reason || 'Disagreement with arbiter resolution'
    };

    job.dispute.timeline.push({
      action: 'dispute_escalated',
      by: userId,
      timestamp: new Date(),
      details: { reason }
    });

    await job.save();

    res.json({
      success: true,
      data: {
        dispute: job.dispute,
        message: 'Dispute escalated successfully'
      }
    });
  }

  /**
   * Accept arbiter's resolution
   */
  async acceptResolution(req, res) {
    const { disputeId } = req.params;
    const userId = req.user.userId;

    const job = await Job.findById(disputeId);
    if (!job || !job.dispute) {
      throw new AppError('Dispute not found', 404);
    }

    // Check if user is involved in the dispute
    const isClient = job.client.toString() === userId;
    const isFreelancer = job.freelancer.toString() === userId;
    
    if (!isClient && !isFreelancer) {
      throw new AppError('You are not authorized to accept this resolution', 403);
    }

    // Check if dispute is resolved
    if (job.dispute.status !== 'resolved') {
      throw new AppError('Dispute must be resolved to accept resolution', 400);
    }

    // Track acceptance
    if (!job.dispute.acceptance) {
      job.dispute.acceptance = {};
    }

    const role = isClient ? 'client' : 'freelancer';
    job.dispute.acceptance[role] = {
      acceptedBy: userId,
      acceptedAt: new Date()
    };

    job.dispute.timeline.push({
      action: 'resolution_accepted',
      by: userId,
      timestamp: new Date(),
      details: { role }
    });

    // Check if both parties have accepted
    const bothAccepted = job.dispute.acceptance.client && job.dispute.acceptance.freelancer;
    if (bothAccepted) {
      job.dispute.status = 'closed';
      job.dispute.closedAt = new Date();
    }

    await job.save();

    res.json({
      success: true,
      data: {
        dispute: job.dispute,
        message: bothAccepted ? 'Resolution accepted by both parties. Dispute closed.' : 'Resolution accepted'
      }
    });
  }

  /**
   * Get disputes pending arbitration assignment
   */
  async getPendingArbitration(req, res) {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [disputes, total] = await Promise.all([
      Job.find({
        'dispute': { $exists: true },
        'dispute.status': { $in: ['responded', 'pending'] },
        'dispute.arbiter': { $exists: false }
      })
        .populate('client', 'address username profile.firstName profile.lastName')
        .populate('freelancer', 'address username profile.firstName profile.lastName')
        .select('title budget dispute createdAt')
        .sort({ 'dispute.raisedAt': 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Job.countDocuments({
        'dispute': { $exists: true },
        'dispute.status': { $in: ['responded', 'pending'] },
        'dispute.arbiter': { $exists: false }
      })
    ]);

    res.json({
      success: true,
      data: {
        disputes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  }

  /**
   * Get disputes assigned to current arbiter
   */
  async getMyArbitrations(req, res) {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.userId;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const matchConditions = {
      'dispute.arbiter': userId
    };

    if (status) {
      matchConditions['dispute.status'] = status;
    }

    const [arbitrations, total] = await Promise.all([
      Job.find(matchConditions)
        .populate('client', 'address username profile.firstName profile.lastName')
        .populate('freelancer', 'address username profile.firstName profile.lastName')
        .select('title budget dispute createdAt')
        .sort({ 'dispute.assignedAt': -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Job.countDocuments(matchConditions)
    ]);

    res.json({
      success: true,
      data: {
        arbitrations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  }

  /**
   * Get dispute statistics
   */
  async getDisputeStats(req, res) {
    const userId = req.user.userId;

    const [userDisputes, generalStats] = await Promise.all([
      // User-specific dispute stats
      Job.aggregate([
        {
          $match: {
            $or: [{ client: userId }, { freelancer: userId }],
            'dispute': { $exists: true }
          }
        },
        {
          $group: {
            _id: '$dispute.status',
            count: { $sum: 1 }
          }
        }
      ]),
      // General dispute statistics
      Job.aggregate([
        {
          $match: { 'dispute': { $exists: true } }
        },
        {
          $group: {
            _id: null,
            totalDisputes: { $sum: 1 },
            resolvedDisputes: {
              $sum: { $cond: [{ $eq: ['$dispute.status', 'resolved'] }, 1, 0] }
            },
            escalatedDisputes: {
              $sum: { $cond: [{ $eq: ['$dispute.status', 'escalated'] }, 1, 0] }
            },
            averageResolutionTime: {
              $avg: {
                $divide: [
                  { $subtract: ['$dispute.arbiterResolution.resolvedAt', '$dispute.raisedAt'] },
                  1000 * 60 * 60 * 24 // Convert to days
                ]
              }
            }
          }
        }
      ])
    ]);

    const userStats = userDisputes.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const general = generalStats[0] || {
      totalDisputes: 0,
      resolvedDisputes: 0,
      escalatedDisputes: 0,
      averageResolutionTime: 0
    };

    res.json({
      success: true,
      data: {
        userStats,
        generalStats: general
      }
    });
  }

  /**
   * Add message to dispute thread
   */
  async addMessage(req, res) {
    const { disputeId } = req.params;
    const { message, attachments } = req.body;
    const userId = req.user.userId;

    const job = await Job.findById(disputeId);
    if (!job || !job.dispute) {
      throw new AppError('Dispute not found', 404);
    }

    // Check access permissions
    const isClient = job.client.toString() === userId;
    const isFreelancer = job.freelancer.toString() === userId;
    const isArbiter = job.dispute.arbiter && job.dispute.arbiter.toString() === userId;
    
    if (!isClient && !isFreelancer && !isArbiter) {
      throw new AppError('You are not authorized to add messages to this dispute', 403);
    }

    // Initialize messages array if it doesn't exist
    if (!job.dispute.messages) {
      job.dispute.messages = [];
    }

    const newMessage = {
      from: userId,
      message,
      attachments: attachments || [],
      timestamp: new Date()
    };

    job.dispute.messages.push(newMessage);
    await job.save();

    res.json({
      success: true,
      data: {
        message: newMessage
      }
    });
  }

  /**
   * Get dispute messages
   */
  async getMessages(req, res) {
    const { disputeId } = req.params;
    const userId = req.user.userId;

    const job = await Job.findById(disputeId)
      .populate('dispute.messages.from', 'address username profile.firstName profile.lastName');

    if (!job || !job.dispute) {
      throw new AppError('Dispute not found', 404);
    }

    // Check access permissions
    const isClient = job.client.toString() === userId;
    const isFreelancer = job.freelancer.toString() === userId;
    const isArbiter = job.dispute.arbiter && job.dispute.arbiter.toString() === userId;
    
    if (!isClient && !isFreelancer && !isArbiter) {
      throw new AppError('You are not authorized to view messages for this dispute', 403);
    }

    res.json({
      success: true,
      data: {
        messages: job.dispute.messages || []
      }
    });
  }
}

module.exports = new DisputeController();
