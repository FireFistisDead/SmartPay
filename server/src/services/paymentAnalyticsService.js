const Job = require('../models/Job');
const User = require('../models/User');
const Event = require('../models/Event');
const PaymentService = require('./paymentService');
const PriceOracleService = require('./priceOracleService');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const redisClient = require('../config/redis');

/**
 * Payment Analytics Service - Provides payment and financial analytics
 */
class PaymentAnalyticsService {
  constructor() {
    this.paymentService = new PaymentService();
    this.priceOracleService = new PriceOracleService();
    this.cachePrefix = 'payment_analytics:';
    this.defaultCacheDuration = 300; // 5 minutes
  }

  /**
   * Get platform payment statistics
   */
  async getPlatformPaymentStats(timeframe = '30d') {
    try {
      const cacheKey = `${this.cachePrefix}platform_stats_${timeframe}`;
      
      // Try cache first
      const cachedStats = await this._getFromCache(cacheKey);
      if (cachedStats) {
        return cachedStats;
      }

      const dateRange = this._getDateRange(timeframe);
      
      // Get job payment data
      const jobPayments = await Job.aggregate([
        {
          $match: {
            createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
            status: { $in: ['completed', 'in_progress', 'payment_released'] }
          }
        },
        {
          $group: {
            _id: null,
            totalJobs: { $sum: 1 },
            totalValue: { $sum: { $toDouble: '$totalAmount' } },
            averageJobValue: { $avg: { $toDouble: '$totalAmount' } },
            completedJobs: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            totalCompletedValue: {
              $sum: { 
                $cond: [
                  { $eq: ['$status', 'completed'] }, 
                  { $toDouble: '$totalAmount' }, 
                  0
                ]
              }
            }
          }
        }
      ]);

      // Get milestone payment data
      const milestonePayments = await Job.aggregate([
        { $unwind: '$milestones' },
        {
          $match: {
            'milestones.approvedAt': { $gte: dateRange.startDate, $lte: dateRange.endDate },
            'milestones.status': 'approved'
          }
        },
        {
          $group: {
            _id: null,
            totalMilestones: { $sum: 1 },
            totalMilestoneValue: { $sum: { $toDouble: '$milestones.amount' } },
            averageMilestoneValue: { $avg: { $toDouble: '$milestones.amount' } }
          }
        }
      ]);

      // Get platform fee data
      const platformFees = await Job.aggregate([
        {
          $match: {
            createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
            status: 'completed'
          }
        },
        {
          $addFields: {
            platformFee: {
              $multiply: [
                { $toDouble: '$totalAmount' },
                0.025 // 2.5% platform fee
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalPlatformFees: { $sum: '$platformFee' },
            averagePlatformFee: { $avg: '$platformFee' }
          }
        }
      ]);

      const stats = {
        timeframe,
        dateRange,
        jobs: jobPayments[0] || {
          totalJobs: 0,
          totalValue: 0,
          averageJobValue: 0,
          completedJobs: 0,
          totalCompletedValue: 0
        },
        milestones: milestonePayments[0] || {
          totalMilestones: 0,
          totalMilestoneValue: 0,
          averageMilestoneValue: 0
        },
        platformFees: platformFees[0] || {
          totalPlatformFees: 0,
          averagePlatformFee: 0
        },
        generatedAt: new Date().toISOString()
      };

      // Calculate additional metrics
      stats.metrics = {
        completionRate: stats.jobs.totalJobs > 0 
          ? (stats.jobs.completedJobs / stats.jobs.totalJobs) * 100 
          : 0,
        averageCompletionValue: stats.jobs.completedJobs > 0 
          ? stats.jobs.totalCompletedValue / stats.jobs.completedJobs 
          : 0,
        totalPlatformRevenue: stats.platformFees.totalPlatformFees
      };

      // Cache the results
      await this._setCache(cacheKey, stats, this.defaultCacheDuration);
      
      return stats;

    } catch (error) {
      logger.error('Error getting platform payment stats:', error);
      throw new AppError('Failed to get platform payment statistics', 500, 'PAYMENT_STATS_ERROR');
    }
  }

  /**
   * Get payment trends over time
   */
  async getPaymentTrends(timeframe = '30d', interval = 'daily') {
    try {
      const cacheKey = `${this.cachePrefix}trends_${timeframe}_${interval}`;
      
      // Try cache first
      const cachedTrends = await this._getFromCache(cacheKey);
      if (cachedTrends) {
        return cachedTrends;
      }

      const dateRange = this._getDateRange(timeframe);
      const groupBy = this._getGroupByFormat(interval);

      const trends = await Job.aggregate([
        {
          $match: {
            createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }
          }
        },
        {
          $group: {
            _id: groupBy,
            jobsCreated: { $sum: 1 },
            totalValue: { $sum: { $toDouble: '$totalAmount' } },
            completedJobs: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            averageValue: { $avg: { $toDouble: '$totalAmount' } }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const result = {
        timeframe,
        interval,
        dateRange,
        trends: trends.map(trend => ({
          date: trend._id,
          jobsCreated: trend.jobsCreated,
          totalValue: trend.totalValue,
          completedJobs: trend.completedJobs,
          averageValue: trend.averageValue,
          completionRate: trend.jobsCreated > 0 
            ? (trend.completedJobs / trend.jobsCreated) * 100 
            : 0
        })),
        generatedAt: new Date().toISOString()
      };

      // Cache the results
      await this._setCache(cacheKey, result, this.defaultCacheDuration);
      
      return result;

    } catch (error) {
      logger.error('Error getting payment trends:', error);
      throw new AppError('Failed to get payment trends', 500, 'PAYMENT_TRENDS_ERROR');
    }
  }

  /**
   * Get user payment analytics
   */
  async getUserPaymentAnalytics(userAddress, timeframe = '30d') {
    try {
      const cacheKey = `${this.cachePrefix}user_${userAddress}_${timeframe}`;
      
      // Try cache first
      const cachedAnalytics = await this._getFromCache(cacheKey);
      if (cachedAnalytics) {
        return cachedAnalytics;
      }

      const dateRange = this._getDateRange(timeframe);

      // Client analytics (jobs posted)
      const clientAnalytics = await Job.aggregate([
        {
          $match: {
            clientAddress: userAddress.toLowerCase(),
            createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalJobsPosted: { $sum: 1 },
            totalAmountPosted: { $sum: { $toDouble: '$totalAmount' } },
            completedJobs: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            totalAmountPaid: {
              $sum: {
                $cond: [
                  { $eq: ['$status', 'completed'] },
                  { $toDouble: '$totalAmount' },
                  0
                ]
              }
            }
          }
        }
      ]);

      // Freelancer analytics (jobs worked on)
      const freelancerAnalytics = await Job.aggregate([
        {
          $match: {
            freelancerAddress: userAddress.toLowerCase(),
            createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalJobsWorked: { $sum: 1 },
            totalAmountEarned: {
              $sum: {
                $cond: [
                  { $eq: ['$status', 'completed'] },
                  { $toDouble: '$totalAmount' },
                  0
                ]
              }
            },
            jobsCompleted: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        }
      ]);

      // Milestone analytics for freelancer
      const milestoneAnalytics = await Job.aggregate([
        { $unwind: '$milestones' },
        {
          $match: {
            freelancerAddress: userAddress.toLowerCase(),
            'milestones.approvedAt': { $gte: dateRange.startDate, $lte: dateRange.endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalMilestonesCompleted: { $sum: 1 },
            totalMilestoneEarnings: { $sum: { $toDouble: '$milestones.amount' } },
            averageMilestoneValue: { $avg: { $toDouble: '$milestones.amount' } }
          }
        }
      ]);

      const analytics = {
        userAddress,
        timeframe,
        dateRange,
        asClient: clientAnalytics[0] || {
          totalJobsPosted: 0,
          totalAmountPosted: 0,
          completedJobs: 0,
          totalAmountPaid: 0
        },
        asFreelancer: freelancerAnalytics[0] || {
          totalJobsWorked: 0,
          totalAmountEarned: 0,
          jobsCompleted: 0
        },
        milestones: milestoneAnalytics[0] || {
          totalMilestonesCompleted: 0,
          totalMilestoneEarnings: 0,
          averageMilestoneValue: 0
        },
        generatedAt: new Date().toISOString()
      };

      // Calculate additional metrics
      analytics.metrics = {
        clientCompletionRate: analytics.asClient.totalJobsPosted > 0
          ? (analytics.asClient.completedJobs / analytics.asClient.totalJobsPosted) * 100
          : 0,
        freelancerCompletionRate: analytics.asFreelancer.totalJobsWorked > 0
          ? (analytics.asFreelancer.jobsCompleted / analytics.asFreelancer.totalJobsWorked) * 100
          : 0,
        totalEarnings: analytics.asFreelancer.totalAmountEarned + analytics.milestones.totalMilestoneEarnings,
        totalSpent: analytics.asClient.totalAmountPaid,
        netBalance: (analytics.asFreelancer.totalAmountEarned + analytics.milestones.totalMilestoneEarnings) - analytics.asClient.totalAmountPaid
      };

      // Cache the results
      await this._setCache(cacheKey, analytics, this.defaultCacheDuration);
      
      return analytics;

    } catch (error) {
      logger.error('Error getting user payment analytics:', error);
      throw new AppError('Failed to get user payment analytics', 500, 'USER_PAYMENT_ANALYTICS_ERROR');
    }
  }

  /**
   * Get token price analytics
   */
  async getTokenPriceAnalytics(tokens, currency = 'USD', days = 7) {
    try {
      const cacheKey = `${this.cachePrefix}token_prices_${tokens.join('_')}_${currency}_${days}d`;
      
      // Try cache first (shorter cache for price data)
      const cachedAnalytics = await this._getFromCache(cacheKey, 60); // 1 minute cache
      if (cachedAnalytics) {
        return cachedAnalytics;
      }

      const analytics = {
        tokens,
        currency,
        days,
        data: {},
        generatedAt: new Date().toISOString()
      };

      // Get current prices and historical data for each token
      for (const token of tokens) {
        try {
          const [currentPrice, historicalPrices, marketData] = await Promise.all([
            this.priceOracleService.getTokenPrice(token, currency),
            this.priceOracleService.getHistoricalPrices(token, currency, days),
            this.priceOracleService.getMarketData(token)
          ]);

          analytics.data[token] = {
            currentPrice,
            historicalPrices,
            marketData,
            priceChange: this._calculatePriceChange(historicalPrices.prices),
            volatility: this._calculateVolatility(historicalPrices.prices)
          };

        } catch (error) {
          logger.warn(`Failed to get analytics for token ${token}:`, error.message);
          analytics.data[token] = { error: error.message };
        }
      }

      // Cache the results
      await this._setCache(cacheKey, analytics, 60); // 1 minute cache for price data
      
      return analytics;

    } catch (error) {
      logger.error('Error getting token price analytics:', error);
      throw new AppError('Failed to get token price analytics', 500, 'TOKEN_PRICE_ANALYTICS_ERROR');
    }
  }

  /**
   * Get payment volume by token
   */
  async getPaymentVolumeByToken(timeframe = '30d') {
    try {
      const cacheKey = `${this.cachePrefix}volume_by_token_${timeframe}`;
      
      // Try cache first
      const cachedVolume = await this._getFromCache(cacheKey);
      if (cachedVolume) {
        return cachedVolume;
      }

      const dateRange = this._getDateRange(timeframe);

      // Get volume data from blockchain events
      const volumeData = await Event.aggregate([
        {
          $match: {
            eventType: { $in: ['JobCreated', 'MilestoneApproved', 'FundsReleased'] },
            timestamp: { $gte: dateRange.startDate, $lte: dateRange.endDate }
          }
        },
        {
          $group: {
            _id: '$eventData.token',
            totalVolume: { $sum: { $toDouble: '$eventData.amount' } },
            transactionCount: { $sum: 1 },
            averageTransaction: { $avg: { $toDouble: '$eventData.amount' } }
          }
        },
        { $sort: { totalVolume: -1 } }
      ]);

      const result = {
        timeframe,
        dateRange,
        volumeByToken: volumeData.map(item => ({
          token: item._id || 'Unknown',
          totalVolume: item.totalVolume,
          transactionCount: item.transactionCount,
          averageTransaction: item.averageTransaction
        })),
        totalVolume: volumeData.reduce((sum, item) => sum + item.totalVolume, 0),
        totalTransactions: volumeData.reduce((sum, item) => sum + item.transactionCount, 0),
        generatedAt: new Date().toISOString()
      };

      // Cache the results
      await this._setCache(cacheKey, result, this.defaultCacheDuration);
      
      return result;

    } catch (error) {
      logger.error('Error getting payment volume by token:', error);
      throw new AppError('Failed to get payment volume by token', 500, 'PAYMENT_VOLUME_ERROR');
    }
  }

  /**
   * Helper method to get date range based on timeframe
   */
  _getDateRange(timeframe) {
    const endDate = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case '24h':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    return { startDate, endDate };
  }

  /**
   * Helper method to get group by format for time intervals
   */
  _getGroupByFormat(interval) {
    switch (interval) {
      case 'hourly':
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
      case 'daily':
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
      case 'weekly':
        return {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
      case 'monthly':
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
      default:
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }
  }

  /**
   * Calculate price change percentage
   */
  _calculatePriceChange(prices) {
    if (prices.length < 2) return 0;
    
    const firstPrice = prices[0].price;
    const lastPrice = prices[prices.length - 1].price;
    
    return ((lastPrice - firstPrice) / firstPrice) * 100;
  }

  /**
   * Calculate price volatility (standard deviation)
   */
  _calculateVolatility(prices) {
    if (prices.length < 2) return 0;
    
    const priceValues = prices.map(p => p.price);
    const mean = priceValues.reduce((sum, price) => sum + price, 0) / priceValues.length;
    const variance = priceValues.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / priceValues.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Get data from Redis cache
   */
  async _getFromCache(key, ttl = this.defaultCacheDuration) {
    try {
      const cachedData = await redisClient.get(key);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      logger.warn('Cache read error:', error.message);
      return null;
    }
  }

  /**
   * Set data in Redis cache
   */
  async _setCache(key, data, ttl = this.defaultCacheDuration) {
    try {
      await redisClient.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.warn('Cache write error:', error.message);
    }
  }
}

module.exports = PaymentAnalyticsService;
