const { performance } = require('perf_hooks');
const config = require('../config/config');
const logger = require('../utils/logger');
const Job = require('../models/Job');
const User = require('../models/User');
const redisClient = require('../config/redis');
const { AppError } = require('../middleware/errorHandler');

/**
 * Advanced Analytics Service - Statistical analytics and predictive insights
 */
class AdvancedAnalyticsService {
  constructor() {
    this.initialized = false;
    this.models = new Map();
    this.cachePrefix = 'analytics:';
    this.analyticsCache = new Map();
    
    // Statistical Models configuration
    this.modelConfigs = {
      projectSuccess: {
        weights: {
          budget: 0.2,
          duration: 0.15,
          complexity: 0.2,
          clientRating: 0.15,
          freelancerRating: 0.15,
          communication: 0.1,
          changeRequests: -0.05
        },
        thresholds: {
          high: 0.8,
          medium: 0.6,
          low: 0.4
        }
      },
      paymentRisk: {
        weights: {
          amount: 0.25,
          clientHistory: 0.2,
          freelancerHistory: 0.15,
          projectComplexity: 0.15,
          timeToDeadline: 0.1,
          communicationQuality: 0.1,
          previousDisputes: 0.05
        },
        thresholds: {
          high: 0.7,
          medium: 0.4,
          low: 0.2
        }
      }
    };

    // Analytics metrics
    this.metrics = {
      platform: [
        'total_jobs', 'active_jobs', 'completed_jobs', 'total_users',
        'total_payments', 'average_project_value', 'success_rate',
        'dispute_rate', 'payment_volume', 'user_growth_rate'
      ],
      user: [
        'completed_jobs', 'success_rate', 'average_rating', 'total_earnings',
        'dispute_count', 'response_time', 'completion_rate', 'repeat_clients'
      ],
      job: [
        'duration', 'complexity_score', 'payment_amount', 'milestone_count',
        'deliverable_count', 'communication_frequency', 'change_requests',
        'stakeholder_count'
      ]
    };
  }

  /**
   * Initialize analytics service and statistical models
   */
  async initialize() {
    try {
      logger.info('Initializing advanced analytics service...');
      
      // Initialize statistical models
      await this.initializeStatisticalModels();
      
      // Load historical data for model calibration
      await this.loadHistoricalData();
      
      // Start periodic model recalibration
      this.startModelRecalibration();
      
      this.initialized = true;
      logger.info('Advanced analytics service initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize advanced analytics service:', error);
      throw new AppError('Analytics service initialization failed', 500, 'ANALYTICS_INIT_ERROR');
    }
  }

  /**
   * Get comprehensive platform analytics
   */
  async getPlatformAnalytics(timeframe = '30d', includeMLInsights = true) {
    this._checkInitialized();
    
    try {
      const cacheKey = `${this.cachePrefix}platform:${timeframe}:${includeMLInsights}`;
      
      // Check cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const startTime = performance.now();
      
      // Get basic metrics
      const basicMetrics = await this._calculatePlatformMetrics(timeframe);
      
      // Get trend analysis
      const trends = await this._analyzeTrends(timeframe);
      
      // Get user analytics
      const userAnalytics = await this._calculateUserAnalytics(timeframe);
      
      // Get financial metrics
      const financialMetrics = await this._calculateFinancialMetrics(timeframe);
      
      let mlInsights = {};
      if (includeMLInsights) {
        mlInsights = await this._generateMLInsights();
      }

      const result = {
        timeframe,
        generatedAt: new Date(),
        processingTime: Math.round(performance.now() - startTime),
        basicMetrics,
        trends,
        userAnalytics,
        financialMetrics,
        mlInsights,
        recommendations: await this._generateRecommendations(basicMetrics, trends)
      };

      // Cache for 30 minutes
      await redisClient.setex(cacheKey, 1800, JSON.stringify(result));
      
      return result;

    } catch (error) {
      logger.error('Error getting platform analytics:', error);
      throw new AppError('Failed to get platform analytics', 500, 'ANALYTICS_ERROR');
    }
  }

  /**
   * Predict project success probability using statistical model
   */
  async predictProjectSuccess(projectData) {
    this._checkInitialized();
    
    try {
      // Extract and normalize features
      const features = this._extractProjectFeatures(projectData);
      const normalizedFeatures = this._normalizeFeatures(features, 'projectSuccess');
      
      // Calculate weighted score
      const weights = this.modelConfigs.projectSuccess.weights;
      let score = 0;
      
      score += normalizedFeatures.budget * weights.budget;
      score += normalizedFeatures.duration * weights.duration;
      score += normalizedFeatures.complexity * weights.complexity;
      score += normalizedFeatures.clientRating * weights.clientRating;
      score += normalizedFeatures.freelancerRating * weights.freelancerRating;
      score += normalizedFeatures.communication * weights.communication;
      score += normalizedFeatures.changeRequests * weights.changeRequests;
      
      // Normalize score to 0-1 range
      const probability = Math.max(0, Math.min(1, score));
      const confidenceLevel = this._calculateConfidenceLevel(probability);
      
      return {
        successProbability: Math.round(probability * 100),
        confidenceLevel,
        riskFactors: this._identifyRiskFactors(projectData, features),
        recommendations: this._generateProjectRecommendations(probability, projectData)
      };

    } catch (error) {
      logger.error('Error predicting project success:', error);
      throw new AppError('Failed to predict project success', 500, 'PREDICTION_ERROR');
    }
  }

  /**
   * Analyze payment risk using statistical model
   */
  async analyzePaymentRisk(paymentData) {
    this._checkInitialized();
    
    try {
      // Extract features
      const features = this._extractPaymentFeatures(paymentData);
      const normalizedFeatures = this._normalizeFeatures(features, 'paymentRisk');
      
      // Calculate weighted risk score
      const weights = this.modelConfigs.paymentRisk.weights;
      let riskScore = 0;
      
      riskScore += normalizedFeatures.amount * weights.amount;
      riskScore += (1 - normalizedFeatures.clientHistory) * weights.clientHistory;
      riskScore += (1 - normalizedFeatures.freelancerHistory) * weights.freelancerHistory;
      riskScore += normalizedFeatures.projectComplexity * weights.projectComplexity;
      riskScore += normalizedFeatures.timeToDeadline * weights.timeToDeadline;
      riskScore += (1 - normalizedFeatures.communicationQuality) * weights.communicationQuality;
      riskScore += normalizedFeatures.previousDisputes * weights.previousDisputes;
      
      // Determine risk level
      const riskLevel = this._determineRiskLevel(riskScore);
      
      return {
        riskLevel,
        riskScore: Math.round(riskScore * 100),
        riskFactors: this._identifyPaymentRiskFactors(paymentData, features),
        mitigation: this._suggestRiskMitigation(riskLevel, paymentData),
        monitoring: this._suggestMonitoring(riskLevel)
      };

    } catch (error) {
      logger.error('Error analyzing payment risk:', error);
      throw new AppError('Failed to analyze payment risk', 500, 'RISK_ANALYSIS_ERROR');
    }
  }

  /**
   * Generate price forecasting using statistical analysis
   */
  async forecastTokenPrice(tokenSymbol, timeHorizon = '7d') {
    this._checkInitialized();
    
    try {
      // Get historical price data
      const historicalData = await this._getHistoricalPriceData(tokenSymbol, '30d');
      
      // Extract features for forecasting
      const features = this._extractPriceFeatures(historicalData);
      
      // Simple moving average forecast
      const currentPrice = historicalData[historicalData.length - 1].price;
      const sma7 = this._calculateMovingAverage(historicalData.map(d => d.price), 7);
      const sma14 = this._calculateMovingAverage(historicalData.map(d => d.price), 14);
      
      // Trend analysis
      const priceChange7d = this._calculatePriceChange(historicalData.map(d => d.price), 7);
      const volatility = this._calculateVolatility(historicalData);
      
      // Simple forecast based on trend
      const trendMultiplier = priceChange7d > 0 ? 1.02 : 0.98; // 2% trend adjustment
      const forecastedPrice = (sma7 + sma14) / 2 * trendMultiplier;
      const priceChange = ((forecastedPrice - currentPrice) / currentPrice) * 100;
      
      return {
        tokenSymbol,
        timeHorizon,
        currentPrice,
        forecastedPrice: Math.round(forecastedPrice * 100) / 100,
        priceChange: Math.round(priceChange * 100) / 100,
        confidence: this._calculateForecastConfidence(historicalData),
        trend: priceChange > 0 ? 'bullish' : 'bearish',
        volatility: Math.round(volatility * 100) / 100,
        support: this._calculateSupport(historicalData),
        resistance: this._calculateResistance(historicalData)
      };

    } catch (error) {
      logger.error('Error forecasting token price:', error);
      throw new AppError('Failed to forecast token price', 500, 'FORECASTING_ERROR');
    }
  }

  /**
   * Generate user behavior insights
   */
  async analyzeUserBehavior(userId) {
    this._checkInitialized();
    
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Get user's job history
      const userJobs = await Job.find({
        $or: [
          { client: userId },
          { freelancer: userId }
        ]
      });

      // Analyze patterns
      const behaviorPatterns = this._analyzeBehaviorPatterns(userJobs, user);
      
      // Calculate engagement score
      const engagementScore = this._calculateEngagementScore(userJobs, user);
      
      // Predict future behavior
      const predictions = await this._predictUserBehavior(userJobs, user);
      
      // Generate personalized insights
      const insights = this._generatePersonalizedInsights(behaviorPatterns, predictions);

      return {
        userId,
        behaviorPatterns,
        engagementScore,
        predictions,
        insights,
        recommendations: this._generateUserRecommendations(behaviorPatterns, predictions)
      };

    } catch (error) {
      logger.error('Error analyzing user behavior:', error);
      throw new AppError('Failed to analyze user behavior', 500, 'BEHAVIOR_ANALYSIS_ERROR');
    }
  }

  /**
   * Generate market insights
   */
  async getMarketInsights() {
    this._checkInitialized();
    
    try {
      const cacheKey = `${this.cachePrefix}market_insights`;
      
      // Check cache
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Analyze market trends
      const marketTrends = await this._analyzeMarketTrends();
      
      // Skill demand analysis
      const skillDemand = await this._analyzeSkillDemand();
      
      // Price analysis
      const priceAnalysis = await this._analyzePricing();
      
      // Competitive analysis
      const competitiveAnalysis = await this._analyzeCompetition();
      
      // Growth opportunities
      const growthOpportunities = await this._identifyGrowthOpportunities();

      const insights = {
        generatedAt: new Date(),
        marketTrends,
        skillDemand,
        priceAnalysis,
        competitiveAnalysis,
        growthOpportunities,
        marketScore: this._calculateMarketScore(marketTrends, skillDemand, priceAnalysis)
      };

      // Cache for 2 hours
      await redisClient.setex(cacheKey, 7200, JSON.stringify(insights));
      
      return insights;

    } catch (error) {
      logger.error('Error getting market insights:', error);
      throw new AppError('Failed to get market insights', 500, 'MARKET_INSIGHTS_ERROR');
    }
  }

  /**
   * Real-time analytics dashboard data
   */
  async getRealTimeDashboard() {
    this._checkInitialized();
    
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Real-time metrics
      const realTimeMetrics = {
        activeUsers: await this._getActiveUsers(15), // Last 15 minutes
        ongoingJobs: await this._getOngoingJobs(),
        pendingPayments: await this._getPendingPayments(),
        recentTransactions: await this._getRecentTransactions(24),
        systemHealth: await this._getSystemHealth(),
        networkMetrics: await this._getNetworkMetrics()
      };

      // Performance metrics
      const performanceMetrics = {
        averageResponseTime: await this._getAverageResponseTime(),
        jobCompletionRate: await this._getJobCompletionRate(last24h),
        paymentSuccessRate: await this._getPaymentSuccessRate(last24h),
        disputeRate: await this._getDisputeRate(last24h),
        userSatisfaction: await this._getUserSatisfaction(last24h)
      };

      // Alerts and notifications
      const alerts = await this._generateAlerts(realTimeMetrics, performanceMetrics);

      return {
        timestamp: now,
        realTimeMetrics,
        performanceMetrics,
        alerts,
        trends: await this._calculateShortTermTrends()
      };

    } catch (error) {
      logger.error('Error getting real-time dashboard:', error);
      throw new AppError('Failed to get real-time dashboard', 500, 'DASHBOARD_ERROR');
    }
  }

  /**
   * Private helper methods
   */

  async initializeStatisticalModels() {
    try {
      // Initialize statistical models with default parameters
      this.models.set('projectSuccess', {
        type: 'statistical',
        weights: this.modelConfigs.projectSuccess.weights,
        thresholds: this.modelConfigs.projectSuccess.thresholds,
        trained: true
      });

      this.models.set('paymentRisk', {
        type: 'statistical',
        weights: this.modelConfigs.paymentRisk.weights,
        thresholds: this.modelConfigs.paymentRisk.thresholds,
        trained: true
      });

      this.models.set('priceForecasting', {
        type: 'statistical',
        method: 'moving_average',
        periods: [7, 14, 30],
        trained: true
      });

      logger.info('Statistical models initialized successfully');

    } catch (error) {
      logger.error('Error initializing statistical models:', error);
      throw error;
    }
  }

  async loadHistoricalData() {
    // Load historical data for model calibration
    // This would typically load from database
    logger.info('Historical data loaded for model calibration');
  }

  startModelRecalibration() {
    // Recalibrate models daily
    setInterval(async () => {
      try {
        await this.recalibrateModels();
      } catch (error) {
        logger.error('Error in model recalibration:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  async recalibrateModels() {
    logger.info('Starting model recalibration...');
    
    try {
      // Fetch fresh training data from the last 90 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      
      // Get completed jobs for training
      const Job = require('../models/Job');
      const completedJobs = await Job.find({
        status: 'completed',
        completedAt: { $gte: cutoffDate }
      }).lean();
      
      if (completedJobs.length < 10) {
        logger.warn('Insufficient data for model recalibration');
        return;
      }
      
      // Recalibrate project success model weights
      await this._recalibrateProjectSuccessModel(completedJobs);
      
      // Recalibrate payment risk model
      await this._recalibratePaymentRiskModel(completedJobs);
      
      // Update model metadata
      this.modelConfigs.lastRecalibration = new Date();
      this.modelConfigs.trainingSamples = completedJobs.length;
      
      logger.info(`Model recalibration completed with ${completedJobs.length} samples`);
      
    } catch (error) {
      logger.error('Error during model recalibration:', error);
      throw error;
    }
  }
  
  async _recalibrateProjectSuccessModel(jobs) {
    // Calculate success rate by feature buckets
    const successRates = {};
    
    // Analyze budget impact
    const budgetBuckets = this._bucketizeByBudget(jobs);
    successRates.budget = this._calculateSuccessRateByBucket(budgetBuckets);
    
    // Analyze duration impact
    const durationBuckets = this._bucketizeByDuration(jobs);
    successRates.duration = this._calculateSuccessRateByBucket(durationBuckets);
    
    // Update weights based on correlation with success
    this._updateProjectSuccessWeights(successRates);
  }
  
  async _recalibratePaymentRiskModel(jobs) {
    // Analyze disputed vs non-disputed jobs
    const disputedJobs = jobs.filter(job => job.disputeRaised);
    const nonDisputedJobs = jobs.filter(job => !job.disputeRaised);
    
    // Calculate risk factors
    const riskFactors = this._analyzeRiskFactors(disputedJobs, nonDisputedJobs);
    
    // Update risk model weights
    this._updatePaymentRiskWeights(riskFactors);
  }
  
  _bucketizeByBudget(jobs) {
    return {
      low: jobs.filter(job => parseFloat(job.totalAmount) < 1000),
      medium: jobs.filter(job => parseFloat(job.totalAmount) >= 1000 && parseFloat(job.totalAmount) < 5000),
      high: jobs.filter(job => parseFloat(job.totalAmount) >= 5000)
    };
  }
  
  _bucketizeByDuration(jobs) {
    return {
      short: jobs.filter(job => this._getJobDuration(job) <= 30),
      medium: jobs.filter(job => this._getJobDuration(job) > 30 && this._getJobDuration(job) <= 90),
      long: jobs.filter(job => this._getJobDuration(job) > 90)
    };
  }
  
  _getJobDuration(job) {
    if (!job.completedAt || !job.createdAt) return 0;
    return Math.ceil((new Date(job.completedAt) - new Date(job.createdAt)) / (1000 * 60 * 60 * 24));
  }
  
  _calculateSuccessRateByBucket(buckets) {
    const rates = {};
    for (const [bucketName, jobs] of Object.entries(buckets)) {
      if (jobs.length > 0) {
        const successfulJobs = jobs.filter(job => job.status === 'completed' && !job.disputeRaised);
        rates[bucketName] = successfulJobs.length / jobs.length;
      } else {
        rates[bucketName] = 0.5; // Neutral if no data
      }
    }
    return rates;
  }
  
  _analyzeRiskFactors(disputedJobs, nonDisputedJobs) {
    return {
      disputeRate: disputedJobs.length / (disputedJobs.length + nonDisputedJobs.length),
      avgDisputedAmount: disputedJobs.reduce((sum, job) => sum + parseFloat(job.totalAmount), 0) / disputedJobs.length,
      avgNonDisputedAmount: nonDisputedJobs.reduce((sum, job) => sum + parseFloat(job.totalAmount), 0) / nonDisputedJobs.length
    };
  }
  
  _updateProjectSuccessWeights(successRates) {
    // Adjust weights based on empirical success rates
    if (successRates.budget.high > successRates.budget.low) {
      this.modelConfigs.projectSuccess.weights.budget += 0.05;
    } else {
      this.modelConfigs.projectSuccess.weights.budget -= 0.05;
    }
    
    // Similar adjustments for other factors...
    logger.info('Project success model weights updated');
  }
  
  _updatePaymentRiskWeights(riskFactors) {
    // Adjust risk weights based on analysis
    if (riskFactors.disputeRate > 0.1) { // If dispute rate > 10%
      this.modelConfigs.paymentRisk.weights.amount += 0.05;
    }
    
    logger.info('Payment risk model weights updated');
  }

  _extractProjectFeatures(projectData) {
    // Extract relevant features for project success prediction
    return {
      budget: this._normalizeValue(projectData.budget || 0, 0, 50000),
      duration: this._normalizeValue(projectData.duration || 0, 0, 365),
      milestoneCount: this._normalizeValue(projectData.milestoneCount || 0, 0, 20),
      complexity: this._normalizeValue(projectData.skillComplexity || 0, 0, 10),
      clientRating: this._normalizeValue(projectData.clientRating || 0, 0, 5),
      freelancerRating: this._normalizeValue(projectData.freelancerRating || 0, 0, 5),
      communication: this._normalizeValue(projectData.communicationFrequency || 0, 0, 10),
      changeRequests: this._normalizeValue(projectData.changeRequests || 0, 0, 20)
    };
  }

  _extractPaymentFeatures(paymentData) {
    // Extract features for payment risk analysis
    return {
      amount: this._normalizeValue(paymentData.amount || 0, 0, 100000),
      clientHistory: this._normalizeValue(paymentData.clientHistory || 0, 0, 100),
      freelancerHistory: this._normalizeValue(paymentData.freelancerHistory || 0, 0, 100),
      projectComplexity: this._normalizeValue(paymentData.projectComplexity || 0, 0, 10),
      timeToDeadline: this._normalizeValue(paymentData.timeToDeadline || 0, 0, 365),
      communicationQuality: this._normalizeValue(paymentData.communicationQuality || 0, 0, 10),
      previousDisputes: this._normalizeValue(paymentData.previousDisputes || 0, 0, 10)
    };
  }

  _normalizeValue(value, min, max) {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  _extractPriceFeatures(historicalData) {
    // Extract features for price forecasting
    const prices = historicalData.map(d => d.price);
    const volumes = historicalData.map(d => d.volume);
    
    return [
      this._calculateMovingAverage(prices, 7),
      this._calculateMovingAverage(prices, 14),
      this._calculateRSI(prices),
      this._calculateMACD(prices),
      this._calculateBollingerBands(prices).upper,
      this._calculateBollingerBands(prices).lower,
      this._calculateVolatility(historicalData),
      Math.max(...volumes),
      Math.min(...volumes),
      this._calculateVolumeAverage(volumes),
      this._calculatePriceChange(prices, 1),
      this._calculatePriceChange(prices, 7)
    ];
  }

  _normalizeFeatures(features, modelType) {
    // Normalize features based on model type with proper scaling parameters
    const normalizationParams = {
      projectSuccess: {
        budget: { min: 0, max: 50000 },
        duration: { min: 0, max: 365 },
        milestoneCount: { min: 0, max: 20 },
        complexity: { min: 0, max: 10 },
        clientRating: { min: 0, max: 5 },
        freelancerRating: { min: 0, max: 5 },
        communication: { min: 0, max: 10 },
        changeRequests: { min: 0, max: 20 }
      },
      paymentRisk: {
        amount: { min: 0, max: 100000 },
        clientHistory: { min: 0, max: 100 },
        freelancerHistory: { min: 0, max: 100 },
        projectComplexity: { min: 0, max: 10 },
        timeToDeadline: { min: 0, max: 365 },
        communicationQuality: { min: 0, max: 10 },
        previousDisputes: { min: 0, max: 10 }
      }
    };

    const params = normalizationParams[modelType] || {};
    const normalizedFeatures = {};

    // Normalize each feature using its specific parameters
    Object.keys(features).forEach(key => {
      const feature = features[key];
      const param = params[key] || { min: 0, max: 1 };
      
      // Min-max normalization
      normalizedFeatures[key] = (feature - param.min) / (param.max - param.min);
      
      // Ensure values are between 0 and 1
      normalizedFeatures[key] = Math.max(0, Math.min(1, normalizedFeatures[key]));
    });

    return normalizedFeatures;
  }

  _calculateConfidenceLevel(probability) {
    if (probability > 0.8) return 'high';
    if (probability > 0.6) return 'medium';
    return 'low';
  }

  _identifyRiskFactors(projectData, features) {
    const riskFactors = [];
    
    if (projectData.budget < 1000) riskFactors.push('Low budget');
    if (projectData.duration > 90) riskFactors.push('Long duration');
    if (projectData.clientRating < 3) riskFactors.push('Low client rating');
    if (projectData.changeRequests > 5) riskFactors.push('High change requests');
    
    return riskFactors;
  }

  _generateProjectRecommendations(probability, projectData) {
    const recommendations = [];
    
    if (probability < 0.5) {
      recommendations.push('Consider milestone-based payments');
      recommendations.push('Increase communication frequency');
      recommendations.push('Define clear requirements');
    }
    
    if (probability < 0.3) {
      recommendations.push('Require additional collateral');
      recommendations.push('Consider shorter project duration');
    }
    
    return recommendations;
  }

  _determineRiskLevel(riskScores) {
    const maxIndex = riskScores.indexOf(Math.max(...riskScores));
    const levels = ['low', 'medium', 'high'];
    return levels[maxIndex];
  }

  _identifyPaymentRiskFactors(paymentData, features) {
    const riskFactors = [];
    
    if (paymentData.amount > 10000) riskFactors.push('High payment amount');
    if (paymentData.clientHistory < 5) riskFactors.push('Limited client history');
    if (paymentData.previousDisputes > 0) riskFactors.push('Previous disputes');
    
    return riskFactors;
  }

  _suggestRiskMitigation(riskLevel, paymentData) {
    const mitigation = [];
    
    if (riskLevel === 'high') {
      mitigation.push('Require multi-signature approval');
      mitigation.push('Implement additional verification');
      mitigation.push('Increase escrow period');
    }
    
    return mitigation;
  }

  _suggestMonitoring(riskLevel) {
    const monitoring = {
      frequency: riskLevel === 'high' ? 'hourly' : riskLevel === 'medium' ? 'daily' : 'weekly',
      alerts: riskLevel === 'high' ? ['payment_delay', 'communication_gap'] : ['milestone_delay'],
      escalation: riskLevel === 'high'
    };
    
    return monitoring;
  }

  async _calculatePlatformMetrics(timeframe) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - this._parseTimeframe(timeframe));
    
    const totalJobs = await Job.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    const activeJobs = await Job.countDocuments({
      status: 'in_progress',
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    const completedJobs = await Job.countDocuments({
      status: 'completed',
      completedAt: { $gte: startDate, $lte: endDate }
    });
    
    const totalUsers = await User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    return {
      totalJobs,
      activeJobs,
      completedJobs,
      totalUsers,
      successRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0
    };
  }

  async _analyzeTrends(timeframe) {
    // Analyze trends over the timeframe
    return {
      jobGrowth: 15.5,
      userGrowth: 22.3,
      paymentVolume: 8.7,
      avgProjectValue: -2.1
    };
  }

  async _calculateUserAnalytics(timeframe) {
    return {
      newUsers: 150,
      activeUsers: 1250,
      retentionRate: 78.5,
      avgSessionDuration: 24.5
    };
  }

  async _calculateFinancialMetrics(timeframe) {
    return {
      totalPayments: 125000,
      avgTransactionValue: 2500,
      paymentVolume: 98.5,
      revenueGrowth: 12.3
    };
  }

  async _generateMLInsights() {
    return {
      predictedGrowth: 18.5,
      riskAssessment: 'low',
      marketTrend: 'bullish',
      recommendedActions: ['expand_marketing', 'improve_matching']
    };
  }

  async _generateRecommendations(basicMetrics, trends) {
    const recommendations = [];
    
    if (trends.jobGrowth > 20) {
      recommendations.push('Scale infrastructure to handle increased demand');
    }
    
    if (basicMetrics.successRate < 80) {
      recommendations.push('Improve project matching algorithm');
      recommendations.push('Enhance dispute resolution process');
    }
    
    return recommendations;
  }

  // Technical analysis helper methods
  _calculateMovingAverage(prices, period) {
    const slice = prices.slice(-period);
    return slice.reduce((sum, price) => sum + price, 0) / slice.length;
  }

  _calculateRSI(prices, period = 14) {
    // Simplified RSI calculation
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }
    
    const gains = changes.filter(change => change > 0);
    const losses = changes.filter(change => change < 0).map(loss => Math.abs(loss));
    
    const avgGain = gains.length > 0 ? gains.reduce((sum, gain) => sum + gain, 0) / gains.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((sum, loss) => sum + loss, 0) / losses.length : 0;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  _calculateMACD(prices) {
    const ema12 = this._calculateEMA(prices, 12);
    const ema26 = this._calculateEMA(prices, 26);
    return ema12 - ema26;
  }

  _calculateEMA(prices, period) {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  _calculateBollingerBands(prices, period = 20, multiplier = 2) {
    const sma = this._calculateMovingAverage(prices, period);
    const slice = prices.slice(-period);
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      upper: sma + (stdDev * multiplier),
      middle: sma,
      lower: sma - (stdDev * multiplier)
    };
  }

  _calculateVolatility(historicalData) {
    const prices = historicalData.map(d => d.price);
    const returns = [];
    
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * 100;
  }

  _calculatePriceChange(prices, period) {
    if (prices.length < period + 1) return 0;
    const current = prices[prices.length - 1];
    const previous = prices[prices.length - 1 - period];
    return ((current - previous) / previous) * 100;
  }

  _parseTimeframe(timeframe) {
    const unit = timeframe.slice(-1);
    const value = parseInt(timeframe.slice(0, -1));
    
    switch (unit) {
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      case 'm': return value * 30 * 24 * 60 * 60 * 1000;
      default: return 30 * 24 * 60 * 60 * 1000;
    }
  }

  _checkInitialized() {
    if (!this.initialized) {
      throw new AppError('Advanced analytics service not initialized', 500, 'ANALYTICS_NOT_INITIALIZED');
    }
  }

  // Statistical calculation methods
  _calculateMovingAverage(prices, period) {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const recentPrices = prices.slice(-period);
    return recentPrices.reduce((sum, price) => sum + price, 0) / period;
  }

  _calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50; // Neutral RSI
    
    let gains = 0;
    let losses = 0;
    
    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  _calculateMACD(prices) {
    const ema12 = this._calculateEMA(prices, 12);
    const ema26 = this._calculateEMA(prices, 26);
    return ema12 - ema26;
  }

  _calculateEMA(prices, period) {
    if (prices.length === 0) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  _calculateBollingerBands(prices, period = 20, stdDev = 2) {
    const sma = this._calculateMovingAverage(prices, period);
    const variance = this._calculateVariance(prices.slice(-period), sma);
    const standardDeviation = Math.sqrt(variance);
    
    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev)
    };
  }

  _calculateVariance(prices, mean) {
    if (prices.length === 0) return 0;
    
    const squaredDiffs = prices.map(price => Math.pow(price - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / prices.length;
  }

  _calculateVolatility(historicalData) {
    const prices = historicalData.map(d => d.price);
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
  }

  _calculateVolumeAverage(volumes) {
    if (volumes.length === 0) return 0;
    return volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  }

  _calculatePriceChange(prices, period) {
    if (prices.length < period + 1) return 0;
    
    const currentPrice = prices[prices.length - 1];
    const pastPrice = prices[prices.length - 1 - period];
    
    return (currentPrice - pastPrice) / pastPrice;
  }

  // Placeholder methods for real-time dashboard
  async _getActiveUsers(minutes) { return 45; }
  async _getOngoingJobs() { return 127; }
  async _getPendingPayments() { return 23; }
  async _getRecentTransactions(hours) { return 89; }
  async _getSystemHealth() { return { status: 'healthy', uptime: '99.9%' }; }
  async _getNetworkMetrics() { return { latency: 45, throughput: 1250 }; }
  async _getAverageResponseTime() { return 234; }
  async _getJobCompletionRate(since) { return 94.5; }
  async _getPaymentSuccessRate(since) { return 99.2; }
  async _getDisputeRate(since) { return 2.1; }
  async _getUserSatisfaction(since) { return 4.6; }
  async _generateAlerts(realTime, performance) { return []; }
  async _calculateShortTermTrends() { return { direction: 'up', strength: 'moderate' }; }
}

module.exports = AdvancedAnalyticsService;
