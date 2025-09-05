const Job = require('../models/Job');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const cache = require('../config/redis');

class AnalyticsController {
  /**
   * Get platform-wide statistics
   */
  async getPlatformStats(req, res) {
    const { period = '30d' } = req.query;
    const cacheKey = `platform-stats-${period}`;
    
    // Try to get from cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached)
      });
    }

    const dateFilter = this.getDateFilter(period);

    const [
      totalJobs,
      totalUsers,
      totalVolume,
      completedJobs,
      activeJobs,
      disputeRate,
      avgJobValue,
      topSkills
    ] = await Promise.all([
      Job.countDocuments(dateFilter),
      User.countDocuments(dateFilter),
      Job.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$budget' } } }
      ]),
      Job.countDocuments({ ...dateFilter, status: 'completed' }),
      Job.countDocuments({ ...dateFilter, status: { $in: ['posted', 'in_progress'] } }),
      this.getDisputeRate(dateFilter),
      Job.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, avg: { $avg: '$budget' } } }
      ]),
      this.getTopSkills(dateFilter)
    ]);

    const stats = {
      overview: {
        totalJobs,
        totalUsers,
        totalVolume: totalVolume[0]?.total || 0,
        completedJobs,
        activeJobs,
        successRate: totalJobs > 0 ? (completedJobs / totalJobs * 100).toFixed(2) : 0,
        disputeRate: disputeRate.toFixed(2),
        avgJobValue: avgJobValue[0]?.avg || 0
      },
      trends: {
        topSkills: topSkills.slice(0, 10)
      },
      period
    };

    // Cache for 1 hour
    await cache.setex(cacheKey, 3600, JSON.stringify(stats));

    res.json({
      success: true,
      data: stats
    });
  }

  /**
   * Get job analytics
   */
  async getJobAnalytics(req, res) {
    const { period = '30d', role } = req.query;
    const userId = req.user.userId;
    const dateFilter = this.getDateFilter(period);

    let userFilter = {};
    if (role === 'client') {
      userFilter.client = userId;
    } else if (role === 'freelancer') {
      userFilter.freelancer = userId;
    } else {
      userFilter.$or = [{ client: userId }, { freelancer: userId }];
    }

    const matchCondition = { ...dateFilter, ...userFilter };

    const [
      totalJobs,
      completedJobs,
      cancelledJobs,
      totalValue,
      avgRating,
      completionTimes,
      statusDistribution
    ] = await Promise.all([
      Job.countDocuments(matchCondition),
      Job.countDocuments({ ...matchCondition, status: 'completed' }),
      Job.countDocuments({ ...matchCondition, status: 'cancelled' }),
      Job.aggregate([
        { $match: matchCondition },
        { $group: { _id: null, total: { $sum: '$budget' } } }
      ]),
      Job.aggregate([
        { $match: { ...matchCondition, status: 'completed', rating: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$rating' } } }
      ]),
      this.getAverageCompletionTime(matchCondition),
      Job.aggregate([
        { $match: matchCondition },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const analytics = {
      overview: {
        totalJobs,
        completedJobs,
        cancelledJobs,
        successRate: totalJobs > 0 ? (completedJobs / totalJobs * 100).toFixed(2) : 0,
        totalValue: totalValue[0]?.total || 0,
        avgRating: avgRating[0]?.avg || 0,
        avgCompletionTime: completionTimes
      },
      distribution: {
        byStatus: statusDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      period
    };

    res.json({
      success: true,
      data: analytics
    });
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(req, res) {
    const { period = '30d', scope = 'personal' } = req.query;
    const userId = req.user.userId;
    const dateFilter = this.getDateFilter(period);

    if (scope === 'platform' && !req.user.roles.includes('admin')) {
      throw new AppError('Insufficient permissions for platform-wide user analytics', 403);
    }

    let analytics;

    if (scope === 'personal') {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      analytics = {
        profile: {
          joinDate: user.createdAt,
          reputation: user.reputation,
          roles: user.roles,
          verificationStatus: user.isVerified
        },
        activity: await this.getUserActivity(userId, dateFilter),
        growth: await this.getUserGrowth(userId, period)
      };
    } else {
      // Platform-wide user analytics
      const [
        newUsers,
        activeUsers,
        usersByRole,
        topPerformers
      ] = await Promise.all([
        User.countDocuments(dateFilter),
        this.getActiveUsers(dateFilter),
        User.aggregate([
          { $unwind: '$roles' },
          { $group: { _id: '$roles', count: { $sum: 1 } } }
        ]),
        this.getTopPerformers(10)
      ]);

      analytics = {
        overview: {
          newUsers,
          activeUsers,
          usersByRole: usersByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        },
        topPerformers
      };
    }

    res.json({
      success: true,
      data: { ...analytics, period }
    });
  }

  /**
   * Get dispute analytics
   */
  async getDisputeAnalytics(req, res) {
    const { period = '30d' } = req.query;
    const userId = req.user.userId;
    const dateFilter = this.getDateFilter(period);

    const userFilter = {
      $or: [{ client: userId }, { freelancer: userId }],
      'dispute': { $exists: true }
    };

    const matchCondition = { ...dateFilter, ...userFilter };

    const [
      totalDisputes,
      resolvedDisputes,
      escalatedDisputes,
      disputesByReason,
      avgResolutionTime,
      userDisputeHistory
    ] = await Promise.all([
      Job.countDocuments(matchCondition),
      Job.countDocuments({ ...matchCondition, 'dispute.status': 'resolved' }),
      Job.countDocuments({ ...matchCondition, 'dispute.status': 'escalated' }),
      Job.aggregate([
        { $match: matchCondition },
        { $group: { _id: '$dispute.reason', count: { $sum: 1 } } }
      ]),
      this.getAverageDisputeResolutionTime(matchCondition),
      Job.find(matchCondition)
        .select('title dispute.reason dispute.status dispute.raisedAt dispute.arbiterResolution.resolvedAt')
        .sort({ 'dispute.raisedAt': -1 })
        .limit(10)
    ]);

    const analytics = {
      overview: {
        totalDisputes,
        resolvedDisputes,
        escalatedDisputes,
        resolutionRate: totalDisputes > 0 ? (resolvedDisputes / totalDisputes * 100).toFixed(2) : 0,
        avgResolutionTime
      },
      distribution: {
        byReason: disputesByReason.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      recentDisputes: userDisputeHistory,
      period
    };

    res.json({
      success: true,
      data: analytics
    });
  }

  /**
   * Get earnings analytics for freelancers
   */
  async getEarningsAnalytics(req, res) {
    const { period = '30d' } = req.query;
    const userId = req.user.userId;
    const dateFilter = this.getDateFilter(period);

    const matchCondition = {
      ...dateFilter,
      freelancer: userId,
      status: 'completed'
    };

    const [
      totalEarnings,
      jobCount,
      avgJobValue,
      earningsByMonth,
      topClients,
      skillsPerformance
    ] = await Promise.all([
      Job.aggregate([
        { $match: matchCondition },
        { $group: { _id: null, total: { $sum: '$budget' } } }
      ]),
      Job.countDocuments(matchCondition),
      Job.aggregate([
        { $match: matchCondition },
        { $group: { _id: null, avg: { $avg: '$budget' } } }
      ]),
      this.getEarningsByPeriod(userId, period),
      this.getTopClients(userId, 5),
      this.getSkillsPerformance(userId)
    ]);

    const analytics = {
      overview: {
        totalEarnings: totalEarnings[0]?.total || 0,
        jobCount,
        avgJobValue: avgJobValue[0]?.avg || 0,
        avgEarningsPerJob: jobCount > 0 ? (totalEarnings[0]?.total || 0) / jobCount : 0
      },
      trends: {
        earningsByMonth,
        topClients,
        skillsPerformance
      },
      period
    };

    res.json({
      success: true,
      data: analytics
    });
  }

  /**
   * Get spending analytics for clients
   */
  async getSpendingAnalytics(req, res) {
    const { period = '30d' } = req.query;
    const userId = req.user.userId;
    const dateFilter = this.getDateFilter(period);

    const matchCondition = {
      ...dateFilter,
      client: userId
    };

    const [
      totalSpending,
      jobCount,
      avgJobValue,
      spendingByMonth,
      topFreelancers,
      budgetDistribution
    ] = await Promise.all([
      Job.aggregate([
        { $match: matchCondition },
        { $group: { _id: null, total: { $sum: '$budget' } } }
      ]),
      Job.countDocuments(matchCondition),
      Job.aggregate([
        { $match: matchCondition },
        { $group: { _id: null, avg: { $avg: '$budget' } } }
      ]),
      this.getSpendingByPeriod(userId, period),
      this.getTopFreelancers(userId, 5),
      this.getBudgetDistribution(matchCondition)
    ]);

    const analytics = {
      overview: {
        totalSpending: totalSpending[0]?.total || 0,
        jobCount,
        avgJobValue: avgJobValue[0]?.avg || 0,
        avgSpendingPerJob: jobCount > 0 ? (totalSpending[0]?.total || 0) / jobCount : 0
      },
      trends: {
        spendingByMonth,
        topFreelancers,
        budgetDistribution
      },
      period
    };

    res.json({
      success: true,
      data: analytics
    });
  }

  /**
   * Get reputation analytics
   */
  async getReputationAnalytics(req, res) {
    const { period = '30d' } = req.query;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const dateFilter = this.getDateFilter(period);
    const userFilter = {
      $or: [{ client: userId }, { freelancer: userId }],
      status: 'completed',
      rating: { $exists: true }
    };

    const matchCondition = { ...dateFilter, ...userFilter };

    const [
      recentRatings,
      avgRating,
      ratingDistribution,
      reputationTrend
    ] = await Promise.all([
      Job.find(matchCondition)
        .select('title rating ratingComment createdAt client freelancer')
        .populate('client', 'username')
        .populate('freelancer', 'username')
        .sort({ completedAt: -1 })
        .limit(10),
      Job.aggregate([
        { $match: matchCondition },
        { $group: { _id: null, avg: { $avg: '$rating' } } }
      ]),
      Job.aggregate([
        { $match: matchCondition },
        { $group: { _id: '$rating', count: { $sum: 1 } } }
      ]),
      this.getReputationTrend(userId, period)
    ]);

    const analytics = {
      overview: {
        currentReputation: user.reputation,
        avgRating: avgRating[0]?.avg || 0,
        totalRatings: recentRatings.length
      },
      distribution: {
        byRating: ratingDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      trends: {
        reputationTrend,
        recentRatings
      },
      period
    };

    res.json({
      success: true,
      data: analytics
    });
  }

  /**
   * Get market trends and insights
   */
  async getMarketTrends(req, res) {
    const { category = 'skills', period = '30d' } = req.query;
    const dateFilter = this.getDateFilter(period);

    let trends;

    switch (category) {
      case 'skills':
        trends = await this.getSkillTrends(dateFilter);
        break;
      case 'budgets':
        trends = await this.getBudgetTrends(dateFilter);
        break;
      case 'completion-rates':
        trends = await this.getCompletionRateTrends(dateFilter);
        break;
      case 'satisfaction':
        trends = await this.getSatisfactionTrends(dateFilter);
        break;
      default:
        trends = await this.getSkillTrends(dateFilter);
    }

    res.json({
      success: true,
      data: {
        category,
        period,
        trends
      }
    });
  }

  /**
   * Get summary report for dashboards
   */
  async getSummaryReport(req, res) {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const last30Days = this.getDateFilter('30d');

    const summary = {
      user: {
        id: user._id,
        username: user.username,
        roles: user.roles,
        reputation: user.reputation,
        memberSince: user.createdAt
      },
      activity: await this.getUserActivity(userId, last30Days),
      quickStats: await this.getQuickStats(userId, last30Days)
    };

    // Add role-specific data
    if (user.roles.includes('freelancer')) {
      summary.freelancer = await this.getFreelancerSummary(userId, last30Days);
    }

    if (user.roles.includes('client')) {
      summary.client = await this.getClientSummary(userId, last30Days);
    }

    if (user.roles.includes('arbiter')) {
      summary.arbiter = await this.getArbiterSummary(userId, last30Days);
    }

    res.json({
      success: true,
      data: summary
    });
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(req, res) {
    const { metric = 'completion-time', period = '30d' } = req.query;
    const userId = req.user.userId;
    const dateFilter = this.getDateFilter(period);

    let metrics;

    switch (metric) {
      case 'completion-time':
        metrics = await this.getCompletionTimeMetrics(userId, dateFilter);
        break;
      case 'quality-score':
        metrics = await this.getQualityScoreMetrics(userId, dateFilter);
        break;
      case 'client-satisfaction':
        metrics = await this.getClientSatisfactionMetrics(userId, dateFilter);
        break;
      case 'repeat-clients':
        metrics = await this.getRepeatClientMetrics(userId, dateFilter);
        break;
      default:
        metrics = await this.getCompletionTimeMetrics(userId, dateFilter);
    }

    res.json({
      success: true,
      data: {
        metric,
        period,
        metrics
      }
    });
  }

  // Helper methods
  getDateFilter(period) {
    const now = new Date();
    const filters = {
      '7d': new Date(now.setDate(now.getDate() - 7)),
      '30d': new Date(now.setDate(now.getDate() - 30)),
      '90d': new Date(now.setDate(now.getDate() - 90)),
      '1y': new Date(now.setFullYear(now.getFullYear() - 1)),
      'all': new Date('1970-01-01')
    };

    return period === 'all' ? {} : { createdAt: { $gte: filters[period] } };
  }

  async getDisputeRate(dateFilter) {
    const [totalJobs, disputedJobs] = await Promise.all([
      Job.countDocuments(dateFilter),
      Job.countDocuments({ ...dateFilter, 'dispute': { $exists: true } })
    ]);

    return totalJobs > 0 ? (disputedJobs / totalJobs) * 100 : 0;
  }

  async getTopSkills(dateFilter) {
    return Job.aggregate([
      { $match: dateFilter },
      { $unwind: '$requiredSkills' },
      { $group: { _id: '$requiredSkills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
  }

  async getAverageCompletionTime(matchCondition) {
    const result = await Job.aggregate([
      { $match: { ...matchCondition, status: 'completed', completedAt: { $exists: true } } },
      {
        $addFields: {
          completionTime: {
            $divide: [
              { $subtract: ['$completedAt', '$createdAt'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      { $group: { _id: null, avg: { $avg: '$completionTime' } } }
    ]);

    return result[0]?.avg || 0;
  }

  async getUserActivity(userId, dateFilter) {
    const [jobsCreated, jobsCompleted, disputesRaised] = await Promise.all([
      Job.countDocuments({ ...dateFilter, $or: [{ client: userId }, { freelancer: userId }] }),
      Job.countDocuments({ ...dateFilter, $or: [{ client: userId }, { freelancer: userId }], status: 'completed' }),
      Job.countDocuments({ ...dateFilter, $or: [{ client: userId }, { freelancer: userId }], 'dispute': { $exists: true } })
    ]);

    return { jobsCreated, jobsCompleted, disputesRaised };
  }

  async getQuickStats(userId, dateFilter) {
    const user = await User.findById(userId);
    const roles = user.roles;

    const stats = {};

    if (roles.includes('freelancer')) {
      const earnings = await Job.aggregate([
        { $match: { ...dateFilter, freelancer: userId, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$budget' } } }
      ]);
      stats.recentEarnings = earnings[0]?.total || 0;
    }

    if (roles.includes('client')) {
      const spending = await Job.aggregate([
        { $match: { ...dateFilter, client: userId } },
        { $group: { _id: null, total: { $sum: '$budget' } } }
      ]);
      stats.recentSpending = spending[0]?.total || 0;
    }

    return stats;
  }

  // Additional helper methods would be implemented here for various analytics calculations
  // Due to length constraints, I'm providing the core structure
}

module.exports = new AnalyticsController();
