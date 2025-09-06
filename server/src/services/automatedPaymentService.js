const cron = require('node-cron');
const { ethers } = require('ethers');
const config = require('../config/config');
const logger = require('../utils/logger');
const ContractService = require('./contractService');
const PaymentService = require('./paymentService');
const MultiSigService = require('./multiSigService');
const Job = require('../models/Job');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const redisClient = require('../config/redis');

/**
 * Automated Payment Service - Handles automatic escrow releases and payment processing
 */
class AutomatedPaymentService {
  constructor() {
    this.contractService = new ContractService();
    this.paymentService = new PaymentService();
    this.multiSigService = new MultiSigService();
    this.initialized = false;
    this.scheduledJobs = new Map();
    this.automationRules = new Map();
    
    // Automation triggers
    this.triggers = {
      TIME_BASED: 'time_based',
      MILESTONE_COMPLETION: 'milestone_completion',
      APPROVAL_CONSENSUS: 'approval_consensus',
      EXTERNAL_VERIFICATION: 'external_verification',
      DISPUTE_RESOLUTION: 'dispute_resolution'
    };
    
    // Payment conditions
    this.conditions = {
      DELIVERABLE_SUBMITTED: 'deliverable_submitted',
      CLIENT_APPROVAL: 'client_approval',
      TIME_ELAPSED: 'time_elapsed',
      MULTI_SIG_CONSENSUS: 'multi_sig_consensus',
      ORACLE_VERIFICATION: 'oracle_verification'
    };
  }

  /**
   * Initialize automated payment service
   */
  async initialize() {
    try {
      await this.contractService.initialize();
      await this.paymentService.initialize();
      await this.multiSigService.initialize();
      
      // Load existing automation rules
      await this.loadAutomationRules();
      
      // Start scheduled tasks
      this.startScheduledTasks();
      
      this.initialized = true;
      logger.info('Automated payment service initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize automated payment service:', error);
      throw new AppError('Automated payment service initialization failed', 500, 'AUTOPAY_INIT_ERROR');
    }
  }

  /**
   * Create automation rule for a job
   */
  async createAutomationRule(ruleData) {
    this._checkInitialized();
    
    try {
      const {
        jobId,
        milestoneId,
        trigger,
        conditions,
        action,
        parameters,
        priority = 'normal',
        isActive = true
      } = ruleData;

      const ruleId = this._generateRuleId();
      const rule = {
        id: ruleId,
        jobId,
        milestoneId,
        trigger,
        conditions,
        action,
        parameters,
        priority,
        isActive,
        createdAt: new Date(),
        lastTriggered: null,
        triggerCount: 0,
        status: 'pending'
      };

      // Validate rule
      await this._validateAutomationRule(rule);
      
      // Store rule
      this.automationRules.set(ruleId, rule);
      await this._persistAutomationRule(rule);
      
      // Schedule if time-based
      if (trigger === this.triggers.TIME_BASED) {
        await this._scheduleTimeBased(rule);
      }

      logger.info('Automation rule created:', {
        ruleId,
        jobId,
        trigger,
        action
      });

      return {
        success: true,
        ruleId,
        rule,
        message: 'Automation rule created successfully'
      };

    } catch (error) {
      logger.error('Error creating automation rule:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create automation rule', 500, 'AUTOMATION_RULE_ERROR');
    }
  }

  /**
   * Process milestone completion trigger
   */
  async processMilestoneCompletion(jobId, milestoneId, completionData) {
    this._checkInitialized();
    
    try {
      const rules = this._getRulesForJobMilestone(jobId, milestoneId);
      
      for (const rule of rules) {
        if (rule.trigger === this.triggers.MILESTONE_COMPLETION && rule.isActive) {
          await this._processRule(rule, { completionData });
        }
      }

    } catch (error) {
      logger.error('Error processing milestone completion:', error);
      throw new AppError('Failed to process milestone completion', 500, 'MILESTONE_PROCESSING_ERROR');
    }
  }

  /**
   * Process approval consensus trigger
   */
  async processApprovalConsensus(jobId, approvalData) {
    this._checkInitialized();
    
    try {
      const rules = this._getRulesForJob(jobId);
      
      for (const rule of rules) {
        if (rule.trigger === this.triggers.APPROVAL_CONSENSUS && rule.isActive) {
          await this._processRule(rule, { approvalData });
        }
      }

    } catch (error) {
      logger.error('Error processing approval consensus:', error);
      throw new AppError('Failed to process approval consensus', 500, 'APPROVAL_PROCESSING_ERROR');
    }
  }

  /**
   * Check and execute automated payments
   */
  async checkAutomatedPayments() {
    this._checkInitialized();
    
    try {
      const now = new Date();
      logger.info('Starting automated payment check');
      
      // Get all active automation rules
      const activeRules = Array.from(this.automationRules.values())
        .filter(rule => rule.isActive && rule.status === 'pending');
      
      for (const rule of activeRules) {
        try {
          await this._evaluateRule(rule, now);
        } catch (error) {
          logger.error(`Error evaluating rule ${rule.id}:`, error);
          // Continue with other rules
        }
      }
      
      logger.info(`Automated payment check completed. Evaluated ${activeRules.length} rules`);

    } catch (error) {
      logger.error('Error in automated payment check:', error);
      throw new AppError('Automated payment check failed', 500, 'AUTOPAY_CHECK_ERROR');
    }
  }

  /**
   * Execute automatic payment
   */
  async executeAutomaticPayment(paymentData) {
    this._checkInitialized();
    
    try {
      const {
        jobId,
        milestoneId,
        recipientAddress,
        amount,
        paymentType,
        ruleId,
        requiresMultiSig = false
      } = paymentData;

      // Get job and milestone details
      const job = await Job.findById(jobId);
      if (!job) {
        throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
      }

      const milestone = job.milestones.find(m => m._id.toString() === milestoneId);
      if (!milestone) {
        throw new AppError('Milestone not found', 404, 'MILESTONE_NOT_FOUND');
      }

      // Security checks
      await this._performSecurityChecks(job, milestone, paymentData);

      let executionResult;

      if (requiresMultiSig) {
        // Create multi-sig proposal
        executionResult = await this._createMultiSigPayment(paymentData);
      } else {
        // Execute direct payment
        executionResult = await this._executeDirectPayment(paymentData);
      }

      // Update automation rule
      if (ruleId) {
        await this._updateRuleAfterExecution(ruleId, executionResult);
      }

      // Update job/milestone status
      await this._updateJobAfterPayment(jobId, milestoneId, executionResult);

      logger.info('Automatic payment executed:', {
        jobId,
        milestoneId,
        amount,
        paymentType,
        transactionHash: executionResult.transactionHash
      });

      return executionResult;

    } catch (error) {
      logger.error('Error executing automatic payment:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to execute automatic payment', 500, 'AUTOPAY_EXECUTION_ERROR');
    }
  }

  /**
   * Smart contract conditions checking
   */
  async checkSmartContractConditions(jobId, conditionType) {
    this._checkInitialized();
    
    try {
      let conditionMet = false;
      let conditionData = {};

      switch (conditionType) {
        case this.conditions.DELIVERABLE_SUBMITTED:
          conditionData = await this._checkDeliverableSubmitted(jobId);
          conditionMet = conditionData.submitted;
          break;

        case this.conditions.CLIENT_APPROVAL:
          conditionData = await this._checkClientApproval(jobId);
          conditionMet = conditionData.approved;
          break;

        case this.conditions.TIME_ELAPSED:
          conditionData = await this._checkTimeElapsed(jobId);
          conditionMet = conditionData.elapsed;
          break;

        case this.conditions.MULTI_SIG_CONSENSUS:
          conditionData = await this._checkMultiSigConsensus(jobId);
          conditionMet = conditionData.consensusReached;
          break;

        case this.conditions.ORACLE_VERIFICATION:
          conditionData = await this._checkOracleVerification(jobId);
          conditionMet = conditionData.verified;
          break;

        default:
          throw new AppError('Unknown condition type', 400, 'UNKNOWN_CONDITION');
      }

      return {
        conditionMet,
        conditionData,
        checkedAt: new Date()
      };

    } catch (error) {
      logger.error('Error checking smart contract conditions:', error);
      throw new AppError('Failed to check conditions', 500, 'CONDITION_CHECK_ERROR');
    }
  }

  /**
   * Schedule payment release
   */
  async schedulePaymentRelease(scheduleData) {
    this._checkInitialized();
    
    try {
      const {
        jobId,
        milestoneId,
        releaseDate,
        conditions,
        fallbackAction
      } = scheduleData;

      const scheduleId = this._generateScheduleId();
      const schedule = {
        id: scheduleId,
        jobId,
        milestoneId,
        releaseDate: new Date(releaseDate),
        conditions,
        fallbackAction,
        status: 'scheduled',
        createdAt: new Date()
      };

      // Store in cache for quick access
      const cacheKey = `scheduled_payment:${scheduleId}`;
      await redisClient.setex(cacheKey, 86400 * 7, JSON.stringify(schedule)); // 7 days

      // Add to cron job
      const cronTime = this._convertToCronTime(new Date(releaseDate));
      const job = cron.schedule(cronTime, async () => {
        await this._executeScheduledPayment(scheduleId);
      }, {
        scheduled: false,
        timezone: 'UTC'
      });

      this.scheduledJobs.set(scheduleId, job);
      job.start();

      logger.info('Payment release scheduled:', {
        scheduleId,
        jobId,
        milestoneId,
        releaseDate
      });

      return {
        success: true,
        scheduleId,
        schedule,
        message: 'Payment release scheduled successfully'
      };

    } catch (error) {
      logger.error('Error scheduling payment release:', error);
      throw new AppError('Failed to schedule payment release', 500, 'SCHEDULE_ERROR');
    }
  }

  /**
   * Get automation status for a job
   */
  async getAutomationStatus(jobId) {
    this._checkInitialized();
    
    try {
      const rules = this._getRulesForJob(jobId);
      const schedules = await this._getSchedulesForJob(jobId);
      
      const status = {
        jobId,
        totalRules: rules.length,
        activeRules: rules.filter(r => r.isActive).length,
        executedRules: rules.filter(r => r.status === 'executed').length,
        totalSchedules: schedules.length,
        pendingSchedules: schedules.filter(s => s.status === 'scheduled').length,
        rules: rules.map(r => ({
          id: r.id,
          trigger: r.trigger,
          action: r.action,
          status: r.status,
          triggerCount: r.triggerCount,
          lastTriggered: r.lastTriggered
        })),
        schedules: schedules.map(s => ({
          id: s.id,
          releaseDate: s.releaseDate,
          status: s.status,
          milestoneId: s.milestoneId
        }))
      };

      return status;

    } catch (error) {
      logger.error('Error getting automation status:', error);
      throw new AppError('Failed to get automation status', 500, 'AUTOMATION_STATUS_ERROR');
    }
  }

  /**
   * Private helper methods
   */

  _generateRuleId() {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _generateScheduleId() {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async _validateAutomationRule(rule) {
    // Validate trigger
    if (!Object.values(this.triggers).includes(rule.trigger)) {
      throw new AppError('Invalid trigger type', 400, 'INVALID_TRIGGER');
    }

    // Validate conditions
    for (const condition of rule.conditions) {
      if (!Object.values(this.conditions).includes(condition.type)) {
        throw new AppError('Invalid condition type', 400, 'INVALID_CONDITION');
      }
    }

    // Validate job exists
    const job = await Job.findById(rule.jobId);
    if (!job) {
      throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
    }

    // Validate milestone if specified
    if (rule.milestoneId) {
      const milestone = job.milestones.find(m => m._id.toString() === rule.milestoneId);
      if (!milestone) {
        throw new AppError('Milestone not found', 404, 'MILESTONE_NOT_FOUND');
      }
    }
  }

  async _processRule(rule, context) {
    try {
      rule.triggerCount += 1;
      rule.lastTriggered = new Date();
      
      // Check conditions
      const conditionsResult = await this._checkAllConditions(rule, context);
      
      if (conditionsResult.allMet) {
        await this._executeRuleAction(rule, conditionsResult.data);
        rule.status = 'executed';
      }
      
      await this._persistAutomationRule(rule);

    } catch (error) {
      logger.error(`Error processing rule ${rule.id}:`, error);
      rule.status = 'error';
      await this._persistAutomationRule(rule);
    }
  }

  async _evaluateRule(rule, currentTime) {
    // Time-based evaluation is handled by cron jobs
    if (rule.trigger === this.triggers.TIME_BASED) {
      return;
    }

    // Check if rule conditions are met
    const conditionsResult = await this._checkAllConditions(rule, { currentTime });
    
    if (conditionsResult.allMet) {
      await this._executeRuleAction(rule, conditionsResult.data);
      rule.status = 'executed';
      await this._persistAutomationRule(rule);
    }
  }

  async _checkAllConditions(rule, context) {
    const results = [];
    let allMet = true;

    for (const condition of rule.conditions) {
      const result = await this.checkSmartContractConditions(rule.jobId, condition.type);
      results.push(result);
      
      if (!result.conditionMet) {
        allMet = false;
      }
    }

    return {
      allMet,
      data: results
    };
  }

  async _executeRuleAction(rule, conditionData) {
    switch (rule.action) {
      case 'release_payment':
        await this.executeAutomaticPayment({
          jobId: rule.jobId,
          milestoneId: rule.milestoneId,
          recipientAddress: rule.parameters.recipientAddress,
          amount: rule.parameters.amount,
          paymentType: 'milestone_release',
          ruleId: rule.id,
          requiresMultiSig: rule.parameters.requiresMultiSig
        });
        break;

      case 'create_multisig_proposal':
        await this.multiSigService.proposeTransaction({
          jobId: rule.jobId,
          transactionType: rule.parameters.transactionType,
          destination: rule.parameters.destination,
          amount: rule.parameters.amount,
          proposer: rule.parameters.proposer,
          description: rule.parameters.description
        });
        break;

      default:
        throw new AppError('Unknown rule action', 400, 'UNKNOWN_ACTION');
    }
  }

  async _performSecurityChecks(job, milestone, paymentData) {
    // Check job status
    if (job.status === 'cancelled' || job.status === 'disputed') {
      throw new AppError('Cannot process payment for cancelled or disputed job', 400, 'INVALID_JOB_STATUS');
    }

    // Check milestone status
    if (milestone.status !== 'completed') {
      throw new AppError('Milestone is not completed', 400, 'MILESTONE_NOT_COMPLETED');
    }

    // Check payment amount
    if (paymentData.amount > milestone.amount) {
      throw new AppError('Payment amount exceeds milestone amount', 400, 'AMOUNT_EXCEEDS_MILESTONE');
    }

    // Check sufficient funds
    const hasBalance = await this.contractService.checkSufficientBalance(
      job.contractAddress,
      paymentData.amount
    );
    
    if (!hasBalance) {
      throw new AppError('Insufficient contract balance', 400, 'INSUFFICIENT_BALANCE');
    }
  }

  async _createMultiSigPayment(paymentData) {
    return await this.multiSigService.proposeTransaction({
      jobId: paymentData.jobId,
      transactionType: 'release_payment',
      destination: paymentData.recipientAddress,
      amount: paymentData.amount,
      proposer: 'system',
      description: `Automated payment for milestone ${paymentData.milestoneId}`
    });
  }

  async _executeDirectPayment(paymentData) {
    return await this.paymentService.releaseMilestonePayment({
      jobId: paymentData.jobId,
      milestoneId: paymentData.milestoneId,
      recipientAddress: paymentData.recipientAddress,
      amount: paymentData.amount
    });
  }

  _getRulesForJob(jobId) {
    return Array.from(this.automationRules.values())
      .filter(rule => rule.jobId === jobId);
  }

  _getRulesForJobMilestone(jobId, milestoneId) {
    return Array.from(this.automationRules.values())
      .filter(rule => rule.jobId === jobId && rule.milestoneId === milestoneId);
  }

  async _getSchedulesForJob(jobId) {
    try {
      // Get all automation rules for this job that have scheduling
      const rules = Array.from(this.automationRules.values())
        .filter(rule => rule.jobId === jobId && rule.trigger.type === 'time_based');
      
      const schedules = [];
      
      for (const rule of rules) {
        if (rule.trigger.schedule) {
          schedules.push({
            ruleId: rule.id,
            jobId: rule.jobId,
            schedule: rule.trigger.schedule,
            nextExecution: rule.nextExecution,
            enabled: rule.enabled,
            action: rule.action
          });
        }
      }
      
      return schedules;
    } catch (error) {
      logger.error('Error getting schedules for job:', error);
      return [];
    }
  }

  async _checkDeliverableSubmitted(jobId) {
    const job = await Job.findById(jobId);
    return {
      submitted: job.deliverables && job.deliverables.length > 0,
      count: job.deliverables ? job.deliverables.length : 0
    };
  }

  async _checkClientApproval(jobId) {
    const job = await Job.findById(jobId);
    return {
      approved: job.clientApproval === true,
      approvalDate: job.approvalDate
    };
  }

  async _checkTimeElapsed(jobId) {
    const job = await Job.findById(jobId);
    const now = new Date();
    const deadline = new Date(job.deadline);
    
    return {
      elapsed: now > deadline,
      deadline: deadline,
      currentTime: now
    };
  }

  async _checkMultiSigConsensus(jobId) {
    // Check if there are any pending multi-sig proposals for this job
    const proposals = await this.multiSigService.listProposals({ jobId });
    const readyProposals = proposals.proposals.filter(p => p.status === 'ready_for_execution');
    
    return {
      consensusReached: readyProposals.length > 0,
      proposalsCount: readyProposals.length
    };
  }

  async _checkOracleVerification(jobId) {
    try {
      // In a production environment, this would integrate with external oracles
      // For now, implement basic verification logic
      
      const Job = require('../models/Job');
      const job = await Job.findOne({ jobId });
      
      if (!job) {
        return { verified: false, oracleResponse: 'Job not found' };
      }

      // Basic verification checks
      const verificationChecks = {
        jobExists: !!job,
        hasFreelancer: !!job.freelancer,
        isInProgress: job.status === 'in_progress',
        hasValidDeadline: new Date(job.deadline) > new Date(),
        milestonesConfigured: job.milestones.length > 0
      };

      const passed = Object.values(verificationChecks).every(check => check === true);
      
      return {
        verified: passed,
        oracleResponse: {
          checks: verificationChecks,
          timestamp: new Date(),
          verdict: passed ? 'approved' : 'rejected',
          reason: passed ? 'All verification checks passed' : 'One or more verification checks failed'
        }
      };
    } catch (error) {
      logger.error('Error in oracle verification:', error);
      return {
        verified: false,
        oracleResponse: {
          error: error.message,
          timestamp: new Date()
        }
      };
    }
  }

  async _persistAutomationRule(rule) {
    const key = `automation_rule:${rule.id}`;
    await redisClient.setex(key, 86400 * 30, JSON.stringify(rule)); // 30 days
  }

  async loadAutomationRules() {
    // Load from database/cache
    const keys = await redisClient.keys('automation_rule:*');
    
    for (const key of keys) {
      const ruleData = await redisClient.get(key);
      if (ruleData) {
        const rule = JSON.parse(ruleData);
        this.automationRules.set(rule.id, rule);
      }
    }
  }

  startScheduledTasks() {
    // Main automation check every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.checkAutomatedPayments();
      } catch (error) {
        logger.error('Error in scheduled automation check:', error);
      }
    });

    logger.info('Scheduled automation tasks started');
  }

  _convertToCronTime(date) {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    return `${minute} ${hour} ${day} ${month} *`;
  }

  async _executeScheduledPayment(scheduleId) {
    try {
      const cacheKey = `scheduled_payment:${scheduleId}`;
      const scheduleData = await redisClient.get(cacheKey);
      
      if (!scheduleData) {
        logger.warn(`Scheduled payment ${scheduleId} not found`);
        return;
      }

      const schedule = JSON.parse(scheduleData);
      
      // Check conditions before executing
      if (schedule.conditions && schedule.conditions.length > 0) {
        const conditionsResult = await this._checkAllConditions({ 
          jobId: schedule.jobId, 
          conditions: schedule.conditions 
        }, {});
        
        if (!conditionsResult.allMet) {
          logger.info(`Scheduled payment ${scheduleId} conditions not met, skipping`);
          return;
        }
      }

      // Execute payment
      await this.executeAutomaticPayment({
        jobId: schedule.jobId,
        milestoneId: schedule.milestoneId,
        recipientAddress: schedule.recipientAddress,
        amount: schedule.amount,
        paymentType: 'scheduled_release'
      });

      // Update schedule status
      schedule.status = 'executed';
      schedule.executedAt = new Date();
      await redisClient.setex(cacheKey, 86400, JSON.stringify(schedule));

      // Remove from scheduled jobs
      const job = this.scheduledJobs.get(scheduleId);
      if (job) {
        job.stop();
        this.scheduledJobs.delete(scheduleId);
      }

      logger.info(`Scheduled payment ${scheduleId} executed successfully`);

    } catch (error) {
      logger.error(`Error executing scheduled payment ${scheduleId}:`, error);
    }
  }

  async _updateRuleAfterExecution(ruleId, executionResult) {
    const rule = this.automationRules.get(ruleId);
    if (rule) {
      rule.lastExecution = {
        timestamp: new Date(),
        result: executionResult,
        success: executionResult.success
      };
      await this._persistAutomationRule(rule);
    }
  }

  async _updateJobAfterPayment(jobId, milestoneId, executionResult) {
    try {
      const job = await Job.findById(jobId);
      if (job) {
        const milestone = job.milestones.find(m => m._id.toString() === milestoneId);
        if (milestone) {
          milestone.paymentStatus = 'released';
          milestone.paymentTransactionHash = executionResult.transactionHash;
          milestone.paymentDate = new Date();
          await job.save();
        }
      }
    } catch (error) {
      logger.error('Error updating job after payment:', error);
    }
  }

  _checkInitialized() {
    if (!this.initialized) {
      throw new AppError('Automated payment service not initialized', 500, 'AUTOPAY_NOT_INITIALIZED');
    }
  }
}

module.exports = AutomatedPaymentService;
