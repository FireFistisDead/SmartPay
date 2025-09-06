const config = require('../config/config');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const redisClient = require('../config/redis');
const User = require('../models/User');
const Job = require('../models/Job');

/**
 * AI-Powered Recommendations Service
 * Provides intelligent recommendations for freelancers, clients, and platform optimization
 */
class AIRecommendationService {
  constructor() {
    this.initialized = false;
    this.modelConfigs = {
      freelancerMatching: {
        weights: {
          skillMatch: 0.30,
          ratingScore: 0.25,
          priceCompatibility: 0.20,
          availability: 0.15,
          pastPerformance: 0.10
        }
      },
      jobRecommendation: {
        weights: {
          skillRelevance: 0.35,
          budgetMatch: 0.25,
          clientRating: 0.20,
          projectComplexity: 0.20
        }
      },
      priceOptimization: {
        weights: {
          marketRate: 0.40,
          skillLevel: 0.30,
          demandSupply: 0.20,
          urgency: 0.10
        }
      }
    };
    
    // Learning algorithms
    this.algorithms = {
      collaborativeFiltering: new CollaborativeFiltering(),
      contentBasedFiltering: new ContentBasedFiltering(),
      hybridRecommender: new HybridRecommender()
    };
    
    this.cachePrefix = 'ai_recommendations:';
  }

  /**
   * Initialize AI recommendation service
   */
  async initialize() {
    try {
      // Initialize ML algorithms
      await this.algorithms.collaborativeFiltering.initialize();
      await this.algorithms.contentBasedFiltering.initialize();
      await this.algorithms.hybridRecommender.initialize();
      
      // Load pre-trained models or train if needed
      await this.loadOrTrainModels();
      
      this.initialized = true;
      logger.info('AIRecommendationService initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize AIRecommendationService:', error);
      throw error;
    }
  }

  /**
   * Get freelancer recommendations for a job
   */
  async getFreelancerRecommendations(jobId, options = {}) {
    this._checkInitialized();
    
    try {
      const job = await Job.findOne({ jobId }).lean();
      if (!job) {
        throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
      }
      
      const cacheKey = `${this.cachePrefix}freelancers:${jobId}`;
      
      // Check cache
      const cached = await redisClient.get(cacheKey);
      if (cached && !options.refresh) {
        return JSON.parse(cached);
      }
      
      logger.info(`Generating freelancer recommendations for job ${jobId}`);
      
      // Get all available freelancers
      const freelancers = await User.find({
        roles: 'freelancer',
        status: 'active',
        'freelancerProfile.availability': { $ne: 'not-available' }
      }).lean();
      
      // Score each freelancer
      const scoredFreelancers = await Promise.all(
        freelancers.map(freelancer => this.scoreFreelancerForJob(freelancer, job))
      );
      
      // Sort by score and apply filters
      const recommendations = scoredFreelancers
        .filter(item => item.score > 0.3) // Minimum threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, options.limit || 20)
        .map(item => ({
          freelancer: {
            id: item.freelancer._id,
            address: item.freelancer.address,
            username: item.freelancer.username,
            displayName: item.freelancer.displayName,
            avatar: item.freelancer.profile?.avatar,
            skills: item.freelancer.freelancerProfile?.skills || [],
            hourlyRate: item.freelancer.freelancerProfile?.hourlyRate,
            rating: item.freelancer.reputation?.averageRating || 0,
            completedJobs: item.freelancer.stats?.jobsCompleted || 0
          },
          score: Math.round(item.score * 100),
          matchReasons: item.reasons,
          compatibility: item.compatibility
        }));
      
      const result = {
        jobId,
        recommendations,
        total: recommendations.length,
        generatedAt: new Date().toISOString()
      };
      
      // Cache results
      await redisClient.set(cacheKey, JSON.stringify(result), { ttl: 3600 });
      
      return result;
      
    } catch (error) {
      logger.error('Error generating freelancer recommendations:', error);
      throw new AppError('Failed to generate recommendations', 500, 'RECOMMENDATION_ERROR');
    }
  }

  /**
   * Get job recommendations for a freelancer
   */
  async getJobRecommendations(freelancerAddress, options = {}) {
    this._checkInitialized();
    
    try {
      const freelancer = await User.findByAddress(freelancerAddress).lean();
      if (!freelancer || !freelancer.isFreelancer()) {
        throw new AppError('Freelancer not found', 404, 'FREELANCER_NOT_FOUND');
      }
      
      const cacheKey = `${this.cachePrefix}jobs:${freelancerAddress}`;
      
      // Check cache
      const cached = await redisClient.get(cacheKey);
      if (cached && !options.refresh) {
        return JSON.parse(cached);
      }
      
      logger.info(`Generating job recommendations for freelancer ${freelancerAddress}`);
      
      // Get available jobs
      const jobs = await Job.find({
        status: 'open',
        freelancer: null
      }).lean();
      
      // Score each job
      const scoredJobs = await Promise.all(
        jobs.map(job => this.scoreJobForFreelancer(job, freelancer))
      );
      
      // Sort and filter
      const recommendations = scoredJobs
        .filter(item => item.score > 0.4) // Minimum threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, options.limit || 15)
        .map(item => ({
          job: {
            id: item.job._id,
            jobId: item.job.jobId,
            title: item.job.title,
            description: item.job.description,
            category: item.job.category,
            skills: item.job.skills,
            totalAmount: item.job.totalAmount,
            deadline: item.job.deadline,
            milestones: item.job.milestones?.length || 0
          },
          score: Math.round(item.score * 100),
          matchReasons: item.reasons,
          estimatedEarnings: item.estimatedEarnings
        }));
      
      const result = {
        freelancerAddress,
        recommendations,
        total: recommendations.length,
        generatedAt: new Date().toISOString()
      };
      
      // Cache results
      await redisClient.set(cacheKey, JSON.stringify(result), { ttl: 3600 });
      
      return result;
      
    } catch (error) {
      logger.error('Error generating job recommendations:', error);
      throw new AppError('Failed to generate job recommendations', 500, 'JOB_RECOMMENDATION_ERROR');
    }
  }

  /**
   * Get price optimization recommendations
   */
  async getPriceOptimization(jobData, options = {}) {
    this._checkInitialized();
    
    try {
      logger.info('Generating price optimization recommendations');
      
      // Analyze market rates for similar jobs
      const marketAnalysis = await this.analyzeMarketRates(jobData);
      
      // Calculate optimal pricing
      const priceRecommendation = await this.calculateOptimalPrice(jobData, marketAnalysis);
      
      // Generate price ranges
      const priceRanges = this.generatePriceRanges(priceRecommendation);
      
      return {
        optimizedPrice: priceRecommendation.recommended,
        priceRanges,
        marketAnalysis: {
          averagePrice: marketAnalysis.average,
          medianPrice: marketAnalysis.median,
          priceRange: marketAnalysis.range,
          competitorCount: marketAnalysis.competitors
        },
        factors: priceRecommendation.factors,
        confidence: priceRecommendation.confidence,
        recommendations: priceRecommendation.recommendations
      };
      
    } catch (error) {
      logger.error('Error generating price optimization:', error);
      throw new AppError('Price optimization failed', 500, 'PRICE_OPTIMIZATION_ERROR');
    }
  }

  /**
   * Get platform optimization insights
   */
  async getPlatformInsights(timeframe = '30d') {
    this._checkInitialized();
    
    try {
      const cacheKey = `${this.cachePrefix}platform_insights:${timeframe}`;
      
      // Check cache
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      logger.info(`Generating platform insights for ${timeframe}`);
      
      // Analyze platform metrics
      const insights = await this.analyzePlatformMetrics(timeframe);
      
      // Generate recommendations
      const recommendations = await this.generatePlatformRecommendations(insights);
      
      const result = {
        timeframe,
        insights,
        recommendations,
        generatedAt: new Date().toISOString()
      };
      
      // Cache results
      await redisClient.set(cacheKey, JSON.stringify(result), { ttl: 3600 });
      
      return result;
      
    } catch (error) {
      logger.error('Error generating platform insights:', error);
      throw new AppError('Platform insights generation failed', 500, 'PLATFORM_INSIGHTS_ERROR');
    }
  }

  /**
   * Get personalized user experience recommendations
   */
  async getPersonalizedUX(userAddress, userType) {
    this._checkInitialized();
    
    try {
      const user = await User.findByAddress(userAddress).lean();
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }
      
      logger.info(`Generating personalized UX for ${userType}: ${userAddress}`);
      
      // Analyze user behavior patterns
      const behaviorAnalysis = await this.analyzeUserBehavior(user);
      
      // Generate UX recommendations
      const uxRecommendations = await this.generateUXRecommendations(user, behaviorAnalysis);
      
      return {
        userAddress,
        userType,
        behaviorProfile: behaviorAnalysis.profile,
        recommendations: uxRecommendations,
        personalization: {
          dashboard: uxRecommendations.dashboard,
          notifications: uxRecommendations.notifications,
          features: uxRecommendations.features
        }
      };
      
    } catch (error) {
      logger.error('Error generating personalized UX:', error);
      throw new AppError('UX personalization failed', 500, 'UX_PERSONALIZATION_ERROR');
    }
  }

  // AI Scoring Methods
  async scoreFreelancerForJob(freelancer, job) {
    const weights = this.modelConfigs.freelancerMatching.weights;
    
    // Calculate individual scores
    const skillMatch = this.calculateSkillMatch(freelancer.freelancerProfile?.skills || [], job.skills);
    const ratingScore = (freelancer.reputation?.averageRating || 0) / 5;
    const priceCompatibility = this.calculatePriceCompatibility(
      freelancer.freelancerProfile?.hourlyRate || 0,
      job.totalAmount,
      job.milestones?.length || 1
    );
    const availability = this.calculateAvailabilityScore(freelancer.freelancerProfile?.availability);
    const pastPerformance = this.calculatePerformanceScore(freelancer.stats);
    
    // Calculate weighted score
    const score = (
      skillMatch * weights.skillMatch +
      ratingScore * weights.ratingScore +
      priceCompatibility * weights.priceCompatibility +
      availability * weights.availability +
      pastPerformance * weights.pastPerformance
    );
    
    const reasons = [];
    if (skillMatch > 0.7) reasons.push('Strong skill match');
    if (ratingScore > 0.8) reasons.push('Excellent rating');
    if (priceCompatibility > 0.6) reasons.push('Competitive pricing');
    if (pastPerformance > 0.7) reasons.push('Strong track record');
    
    return {
      freelancer,
      score,
      reasons,
      compatibility: {
        skills: Math.round(skillMatch * 100),
        rating: Math.round(ratingScore * 100),
        price: Math.round(priceCompatibility * 100),
        availability: Math.round(availability * 100),
        performance: Math.round(pastPerformance * 100)
      }
    };
  }

  async scoreJobForFreelancer(job, freelancer) {
    const weights = this.modelConfigs.jobRecommendation.weights;
    
    // Calculate individual scores
    const skillRelevance = this.calculateSkillMatch(freelancer.freelancerProfile?.skills || [], job.skills);
    const budgetMatch = this.calculateBudgetMatch(job.totalAmount, freelancer.freelancerProfile?.hourlyRate || 0);
    const clientRating = await this.getClientRating(job.client);
    const projectComplexity = this.calculateComplexityScore(job);
    
    // Calculate weighted score
    const score = (
      skillRelevance * weights.skillRelevance +
      budgetMatch * weights.budgetMatch +
      clientRating * weights.clientRating +
      projectComplexity * weights.projectComplexity
    );
    
    const reasons = [];
    if (skillRelevance > 0.8) reasons.push('Perfect skill match');
    if (budgetMatch > 0.7) reasons.push('Good budget fit');
    if (clientRating > 0.8) reasons.push('Reputable client');
    if (projectComplexity > 0.6) reasons.push('Suitable complexity');
    
    return {
      job,
      score,
      reasons,
      estimatedEarnings: this.estimateEarnings(job, freelancer)
    };
  }

  // Helper Methods
  calculateSkillMatch(freelancerSkills, jobSkills) {
    if (!jobSkills || jobSkills.length === 0) return 0.5;
    
    const freelancerSkillNames = freelancerSkills.map(s => s.name?.toLowerCase() || s.toLowerCase());
    const jobSkillNames = jobSkills.map(s => s.toLowerCase());
    
    const matchedSkills = jobSkillNames.filter(skill => 
      freelancerSkillNames.includes(skill)
    );
    
    return matchedSkills.length / jobSkillNames.length;
  }

  calculatePriceCompatibility(freelancerRate, jobBudget, milestones) {
    if (!freelancerRate || !jobBudget) return 0.5;
    
    const estimatedHours = milestones * 20; // Assume 20 hours per milestone
    const estimatedCost = freelancerRate * estimatedHours;
    const budgetNum = parseFloat(jobBudget);
    
    if (estimatedCost <= budgetNum * 0.8) return 1.0; // Under budget
    if (estimatedCost <= budgetNum) return 0.8; // On budget
    if (estimatedCost <= budgetNum * 1.2) return 0.6; // Slightly over
    return 0.3; // Significantly over
  }

  calculateAvailabilityScore(availability) {
    const scores = {
      'full-time': 1.0,
      'part-time': 0.7,
      'contract': 0.8,
      'not-available': 0.0
    };
    return scores[availability] || 0.5;
  }

  calculatePerformanceScore(stats) {
    if (!stats) return 0.5;
    
    const completionRate = stats.successRate || 0;
    const jobCount = stats.jobsCompleted || 0;
    
    const rateScore = completionRate / 100;
    const experienceScore = Math.min(jobCount / 50, 1); // Cap at 50 jobs
    
    return (rateScore * 0.7) + (experienceScore * 0.3);
  }

  async loadOrTrainModels() {
    logger.info('Loading or training AI models...');
    // Implementation for model loading/training
  }

  _checkInitialized() {
    if (!this.initialized) {
      throw new AppError('AIRecommendationService not initialized', 500, 'SERVICE_NOT_INITIALIZED');
    }
  }
}

// AI Algorithm Classes
class CollaborativeFiltering {
  async initialize() {
    logger.debug('Initializing Collaborative Filtering algorithm');
  }
}

class ContentBasedFiltering {
  async initialize() {
    logger.debug('Initializing Content-Based Filtering algorithm');
  }
}

class HybridRecommender {
  async initialize() {
    logger.debug('Initializing Hybrid Recommender algorithm');
  }
}

module.exports = AIRecommendationService;
