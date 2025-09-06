const logger = require('../utils/logger');
const redisClient = require('../config/redis');
const config = require('../config/config');
const { AppError } = require('../middleware/errorHandler');

/**
 * Performance Analytics Service - Phase 5
 * Provides detailed performance analysis, bottleneck detection, and optimization recommendations
 */
class PerformanceAnalyticsService {
  constructor() {
    this.initialized = false;
    this.metricsBuffer = [];
    this.analysisInterval = null;
    
    this.performanceMetrics = {
      response_times: [],
      throughput: [],
      error_rates: [],
      resource_usage: [],
      database_performance: [],
      blockchain_performance: [],
      cache_performance: []
    };
    
    this.benchmarks = {
      response_time: {
        excellent: 100,
        good: 300,
        acceptable: 1000,
        poor: 3000
      },
      throughput: {
        excellent: 1000,
        good: 500,
        acceptable: 200,
        poor: 100
      },
      error_rate: {
        excellent: 0.1,
        good: 0.5,
        acceptable: 2.0,
        poor: 5.0
      },
      availability: {
        excellent: 99.99,
        good: 99.9,
        acceptable: 99.5,
        poor: 99.0
      }
    };
    
    this.analysisResults = {
      current_performance: {},
      trends: {},
      bottlenecks: [],
      recommendations: [],
      predictions: {},
      alerts: []
    };
  }

  /**
   * Initialize performance analytics service
   */
  async initialize() {
    try {
      await this.loadHistoricalData();
      await this.setupAnalysisIntervals();
      await this.initializeBaselines();
      
      this.initialized = true;
      logger.info('PerformanceAnalyticsService initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize PerformanceAnalyticsService:', error);
      throw error;
    }
  }

  /**
   * Record performance metric
   */
  async recordMetric(metricType, value, metadata = {}) {
    this._checkInitialized();
    
    try {
      const metric = {
        type: metricType,
        value,
        timestamp: new Date().toISOString(),
        metadata
      };
      
      // Add to buffer
      this.metricsBuffer.push(metric);
      
      // Store in Redis for real-time access
      await this.storeMetricInRedis(metric);
      
      // Add to in-memory collections
      if (this.performanceMetrics[metricType]) {
        this.performanceMetrics[metricType].push(metric);
        
        // Keep only last 1000 entries per metric type
        if (this.performanceMetrics[metricType].length > 1000) {
          this.performanceMetrics[metricType] = this.performanceMetrics[metricType].slice(-1000);
        }
      }
      
      // Trigger real-time analysis for critical metrics
      if (this.isCriticalMetric(metricType)) {
        await this.performRealTimeAnalysis(metric);
      }
      
    } catch (error) {
      logger.error('Error recording performance metric:', error);
    }
  }

  /**
   * Perform comprehensive performance analysis
   */
  async performAnalysis(timeframe = '1h') {
    this._checkInitialized();
    
    try {
      logger.info(`Starting performance analysis for timeframe: ${timeframe}`);
      
      const analysisResults = {
        timeframe,
        timestamp: new Date().toISOString(),
        current_performance: await this.analyzeCurrentPerformance(timeframe),
        trends: await this.analyzeTrends(timeframe),
        bottlenecks: await this.detectBottlenecks(timeframe),
        recommendations: await this.generateRecommendations(timeframe),
        predictions: await this.generatePredictions(timeframe),
        alerts: await this.checkPerformanceAlerts(timeframe),
        summary: {}
      };
      
      // Generate summary
      analysisResults.summary = this.generateAnalysisSummary(analysisResults);
      
      // Store results
      await this.storeAnalysisResults(analysisResults);
      
      // Update global analysis results
      this.analysisResults = analysisResults;
      
      logger.info('Performance analysis completed successfully');
      return analysisResults;
      
    } catch (error) {
      logger.error('Error performing performance analysis:', error);
      throw new AppError('Failed to perform performance analysis', 500, 'ANALYSIS_ERROR');
    }
  }

  /**
   * Analyze current performance against benchmarks
   */
  async analyzeCurrentPerformance(timeframe) {
    try {
      const metrics = await this.getMetricsForTimeframe(timeframe);
      const analysis = {};
      
      // Response time analysis
      if (metrics.response_times.length > 0) {
        const responseTimes = metrics.response_times.map(m => m.value);
        analysis.response_time = {
          current: this.calculatePercentile(responseTimes, 95),
          average: this.calculateAverage(responseTimes),
          median: this.calculatePercentile(responseTimes, 50),
          p99: this.calculatePercentile(responseTimes, 99),
          rating: this.ratePerformance('response_time', this.calculatePercentile(responseTimes, 95)),
          trend: await this.calculateTrend(responseTimes)
        };
      }
      
      // Throughput analysis
      if (metrics.throughput.length > 0) {
        const throughputValues = metrics.throughput.map(m => m.value);
        analysis.throughput = {
          current: this.calculateAverage(throughputValues),
          peak: Math.max(...throughputValues),
          minimum: Math.min(...throughputValues),
          rating: this.ratePerformance('throughput', this.calculateAverage(throughputValues)),
          trend: await this.calculateTrend(throughputValues)
        };
      }
      
      // Error rate analysis
      if (metrics.error_rates.length > 0) {
        const errorRates = metrics.error_rates.map(m => m.value);
        analysis.error_rate = {
          current: this.calculateAverage(errorRates),
          peak: Math.max(...errorRates),
          rating: this.ratePerformance('error_rate', this.calculateAverage(errorRates)),
          trend: await this.calculateTrend(errorRates)
        };
      }
      
      // Resource usage analysis
      if (metrics.resource_usage.length > 0) {
        analysis.resource_usage = await this.analyzeResourceUsage(metrics.resource_usage);
      }
      
      // Database performance analysis
      if (metrics.database_performance.length > 0) {
        analysis.database_performance = await this.analyzeDatabasePerformance(metrics.database_performance);
      }
      
      // Blockchain performance analysis
      if (metrics.blockchain_performance.length > 0) {
        analysis.blockchain_performance = await this.analyzeBlockchainPerformance(metrics.blockchain_performance);
      }
      
      return analysis;
      
    } catch (error) {
      logger.error('Error analyzing current performance:', error);
      return {};
    }
  }

  /**
   * Analyze performance trends
   */
  async analyzeTrends(timeframe) {
    try {
      const trends = {};
      const timeframes = ['1h', '6h', '24h', '7d'];
      
      for (const tf of timeframes) {
        if (this.shouldAnalyzeTimeframe(tf, timeframe)) {
          const metrics = await this.getMetricsForTimeframe(tf);
          trends[tf] = await this.calculateTimeframeTrends(metrics);
        }
      }
      
      // Calculate trend directions and rates of change
      trends.summary = this.summarizeTrends(trends);
      
      return trends;
      
    } catch (error) {
      logger.error('Error analyzing trends:', error);
      return {};
    }
  }

  /**
   * Detect performance bottlenecks
   */
  async detectBottlenecks(timeframe) {
    try {
      const bottlenecks = [];
      const metrics = await this.getMetricsForTimeframe(timeframe);
      
      // Response time bottlenecks
      await this.detectResponseTimeBottlenecks(metrics, bottlenecks);
      
      // Throughput bottlenecks
      await this.detectThroughputBottlenecks(metrics, bottlenecks);
      
      // Resource bottlenecks
      await this.detectResourceBottlenecks(metrics, bottlenecks);
      
      // Database bottlenecks
      await this.detectDatabaseBottlenecks(metrics, bottlenecks);
      
      // Blockchain bottlenecks
      await this.detectBlockchainBottlenecks(metrics, bottlenecks);
      
      // Sort by impact severity
      bottlenecks.sort((a, b) => b.impact - a.impact);
      
      return bottlenecks;
      
    } catch (error) {
      logger.error('Error detecting bottlenecks:', error);
      return [];
    }
  }

  /**
   * Generate performance recommendations
   */
  async generateRecommendations(timeframe) {
    try {
      const recommendations = [];
      const analysis = await this.analyzeCurrentPerformance(timeframe);
      const bottlenecks = await this.detectBottlenecks(timeframe);
      
      // Response time recommendations
      if (analysis.response_time?.rating === 'poor') {
        recommendations.push({
          category: 'response_time',
          priority: 'high',
          title: 'Optimize Response Time',
          description: 'Response times are above acceptable thresholds',
          recommendations: [
            'Enable response caching for frequently accessed endpoints',
            'Optimize database queries and add appropriate indexes',
            'Implement connection pooling',
            'Consider adding load balancing'
          ],
          estimated_impact: 'high'
        });
      }
      
      // Throughput recommendations
      if (analysis.throughput?.rating === 'poor') {
        recommendations.push({
          category: 'throughput',
          priority: 'high',
          title: 'Improve Throughput',
          description: 'System throughput is below optimal levels',
          recommendations: [
            'Scale horizontally by adding more server instances',
            'Optimize application code for better performance',
            'Implement request queuing and batch processing',
            'Upgrade hardware resources'
          ],
          estimated_impact: 'high'
        });
      }
      
      // Error rate recommendations
      if (analysis.error_rate?.rating === 'poor') {
        recommendations.push({
          category: 'error_rate',
          priority: 'critical',
          title: 'Reduce Error Rate',
          description: 'Error rate is above acceptable thresholds',
          recommendations: [
            'Implement better error handling and validation',
            'Add retry mechanisms for transient failures',
            'Improve input validation and sanitization',
            'Monitor and fix frequent error patterns'
          ],
          estimated_impact: 'critical'
        });
      }
      
      // Bottleneck-specific recommendations
      for (const bottleneck of bottlenecks.slice(0, 5)) {
        const bottleneckRec = await this.generateBottleneckRecommendation(bottleneck);
        if (bottleneckRec) {
          recommendations.push(bottleneckRec);
        }
      }
      
      // Sort by priority and impact
      recommendations.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      
      return recommendations;
      
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Generate performance predictions
   */
  async generatePredictions(timeframe) {
    try {
      const predictions = {};
      const metrics = await this.getMetricsForTimeframe('7d'); // Use longer timeframe for predictions
      
      // Response time predictions
      if (metrics.response_times.length > 0) {
        predictions.response_time = await this.predictResponseTime(metrics.response_times);
      }
      
      // Throughput predictions
      if (metrics.throughput.length > 0) {
        predictions.throughput = await this.predictThroughput(metrics.throughput);
      }
      
      // Error rate predictions
      if (metrics.error_rates.length > 0) {
        predictions.error_rate = await this.predictErrorRate(metrics.error_rates);
      }
      
      // Resource usage predictions
      if (metrics.resource_usage.length > 0) {
        predictions.resource_usage = await this.predictResourceUsage(metrics.resource_usage);
      }
      
      return predictions;
      
    } catch (error) {
      logger.error('Error generating predictions:', error);
      return {};
    }
  }

  /**
   * Check for performance alerts
   */
  async checkPerformanceAlerts(timeframe) {
    try {
      const alerts = [];
      const analysis = await this.analyzeCurrentPerformance(timeframe);
      
      // Response time alerts
      if (analysis.response_time?.current > this.benchmarks.response_time.poor) {
        alerts.push({
          type: 'response_time_critical',
          severity: 'critical',
          message: `Response time (${analysis.response_time.current}ms) exceeds critical threshold`,
          value: analysis.response_time.current,
          threshold: this.benchmarks.response_time.poor
        });
      }
      
      // Throughput alerts
      if (analysis.throughput?.current < this.benchmarks.throughput.poor) {
        alerts.push({
          type: 'throughput_low',
          severity: 'high',
          message: `Throughput (${analysis.throughput.current} req/s) below minimum threshold`,
          value: analysis.throughput.current,
          threshold: this.benchmarks.throughput.poor
        });
      }
      
      // Error rate alerts
      if (analysis.error_rate?.current > this.benchmarks.error_rate.poor) {
        alerts.push({
          type: 'error_rate_high',
          severity: 'critical',
          message: `Error rate (${analysis.error_rate.current}%) exceeds critical threshold`,
          value: analysis.error_rate.current,
          threshold: this.benchmarks.error_rate.poor
        });
      }
      
      return alerts;
      
    } catch (error) {
      logger.error('Error checking performance alerts:', error);
      return [];
    }
  }

  /**
   * Get performance dashboard data
   */
  async getDashboardData(timeframe = '1h') {
    this._checkInitialized();
    
    try {
      const [currentPerformance, trends, bottlenecks, recommendations] = await Promise.all([
        this.analyzeCurrentPerformance(timeframe),
        this.analyzeTrends(timeframe),
        this.detectBottlenecks(timeframe),
        this.generateRecommendations(timeframe)
      ]);
      
      return {
        timestamp: new Date().toISOString(),
        timeframe,
        current_performance: currentPerformance,
        trends,
        bottlenecks: bottlenecks.slice(0, 10), // Top 10 bottlenecks
        recommendations: recommendations.slice(0, 5), // Top 5 recommendations
        health_score: this.calculateHealthScore(currentPerformance),
        summary: this.generateDashboardSummary(currentPerformance, trends, bottlenecks)
      };
      
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      throw new AppError('Failed to get dashboard data', 500, 'DASHBOARD_ERROR');
    }
  }

  // Utility methods for calculations
  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = this.calculateAverage(firstHalf);
    const secondAvg = this.calculateAverage(secondHalf);
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  ratePerformance(metricType, value) {
    const benchmark = this.benchmarks[metricType];
    if (!benchmark) return 'unknown';
    
    if (metricType === 'error_rate') {
      // Lower is better for error rates
      if (value <= benchmark.excellent) return 'excellent';
      if (value <= benchmark.good) return 'good';
      if (value <= benchmark.acceptable) return 'acceptable';
      return 'poor';
    } else {
      // Higher is better for response time and throughput
      if (value <= benchmark.excellent) return 'excellent';
      if (value <= benchmark.good) return 'good';
      if (value <= benchmark.acceptable) return 'acceptable';
      return 'poor';
    }
  }

  calculateHealthScore(performance) {
    const scores = [];
    
    if (performance.response_time) {
      const rating = performance.response_time.rating;
      scores.push(this.ratingToScore(rating));
    }
    
    if (performance.throughput) {
      const rating = performance.throughput.rating;
      scores.push(this.ratingToScore(rating));
    }
    
    if (performance.error_rate) {
      const rating = performance.error_rate.rating;
      scores.push(this.ratingToScore(rating));
    }
    
    if (scores.length === 0) return 50; // Default score
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  ratingToScore(rating) {
    const scoreMap = {
      excellent: 95,
      good: 80,
      acceptable: 65,
      poor: 30,
      unknown: 50
    };
    return scoreMap[rating] || 50;
  }

  // Store metric in Redis for real-time access
  async storeMetricInRedis(metric) {
    try {
      const key = `metrics:${metric.type}`;
      await redisClient.lpush(key, JSON.stringify(metric));
      await redisClient.ltrim(key, 0, 999); // Keep last 1000 entries
      await redisClient.expire(key, 86400); // Expire after 24 hours
    } catch (error) {
      logger.error('Error storing metric in Redis:', error);
    }
  }

  isCriticalMetric(metricType) {
    return ['response_times', 'error_rates', 'resource_usage'].includes(metricType);
  }

  async performRealTimeAnalysis(metric) {
    // Implement real-time analysis for critical metrics
    // This could trigger immediate alerts or adjustments
  }

  _checkInitialized() {
    if (!this.initialized) {
      throw new AppError('PerformanceAnalyticsService not initialized', 500, 'SERVICE_NOT_INITIALIZED');
    }
  }
}

module.exports = PerformanceAnalyticsService;
