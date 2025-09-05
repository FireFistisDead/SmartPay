const { ethers } = require('ethers');
const config = require('../config/config');
const logger = require('../utils/logger');
const Event = require('../models/Event');
const Job = require('../models/Job');
const User = require('../models/User');
const NotificationService = require('./notificationService');
const redisClient = require('../config/redis');

class BlockchainEventListener {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.isListening = false;
    this.lastProcessedBlock = 0;
    this.retryAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
    this.batchSize = config.blockchain.eventBatchSize || 1000;
    this.blockRange = config.blockchain.blockRange || 10000;
    this.notificationService = new NotificationService();
    
    // Contract ABI for events (minimal ABI with just events)
    this.contractABI = [
      "event JobCreated(uint256 indexed jobId, address indexed client, address indexed arbiter, uint256 totalAmount, string ipfsHash)",
      "event JobAccepted(uint256 indexed jobId, address indexed freelancer)",
      "event MilestoneSubmitted(uint256 indexed jobId, uint256 milestoneIndex, address indexed freelancer, string deliverableHash)",
      "event MilestoneApproved(uint256 indexed jobId, uint256 milestoneIndex, address indexed client, uint256 amount)",
      "event JobCompleted(uint256 indexed jobId, address indexed freelancer, uint256 totalAmount)",
      "event DisputeRaised(uint256 indexed jobId, address indexed raiser, string reason)",
      "event DisputeResolved(uint256 indexed jobId, address indexed arbiter, address winner, uint256 amount)",
      "event FundsReleased(uint256 indexed jobId, address indexed to, uint256 amount)",
      "event JobCancelled(uint256 indexed jobId, address indexed client, string reason)"
    ];
  }

  async initialize() {
    try {
      const network = config.blockchain.networks[config.blockchain.defaultNetwork];
      
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(network.rpcUrl);
      
      // Test connection
      await this.provider.getNetwork();
      logger.info(`Connected to ${network.name} (Chain ID: ${network.chainId})`);
      
      // Initialize contract
      if (!config.blockchain.contractAddress) {
        throw new Error('Contract address not configured');
      }
      
      this.contract = new ethers.Contract(
        config.blockchain.contractAddress,
        this.contractABI,
        this.provider
      );
      
      // Get last processed block from Redis or database
      await this.loadLastProcessedBlock();
      
      logger.info('Blockchain event listener initialized successfully');
      return true;
      
    } catch (error) {
      logger.error('Failed to initialize blockchain event listener:', error);
      throw error;
    }
  }

  async loadLastProcessedBlock() {
    try {
      // Try to get from Redis first
      const cachedBlock = await redisClient.get('last_processed_block');
      if (cachedBlock) {
        this.lastProcessedBlock = parseInt(cachedBlock);
        logger.info(`Loaded last processed block from cache: ${this.lastProcessedBlock}`);
        return;
      }
      
      // Fallback to database
      const lastEvent = await Event.findOne({}, {}, { sort: { blockNumber: -1 } });
      if (lastEvent) {
        this.lastProcessedBlock = lastEvent.blockNumber;
        logger.info(`Loaded last processed block from database: ${this.lastProcessedBlock}`);
      } else {
        // Start from current block if no previous events
        this.lastProcessedBlock = await this.provider.getBlockNumber();
        logger.info(`Starting from current block: ${this.lastProcessedBlock}`);
      }
      
      // Cache in Redis
      await redisClient.set('last_processed_block', this.lastProcessedBlock.toString());
      
    } catch (error) {
      logger.error('Error loading last processed block:', error);
      // Default to current block
      this.lastProcessedBlock = await this.provider.getBlockNumber();
    }
  }

  async saveLastProcessedBlock(blockNumber) {
    try {
      this.lastProcessedBlock = blockNumber;
      await redisClient.set('last_processed_block', blockNumber.toString());
    } catch (error) {
      logger.error('Error saving last processed block:', error);
    }
  }

  async start() {
    if (this.isListening) {
      logger.warn('Event listener is already running');
      return;
    }

    try {
      await this.initialize();
      
      // Process historical events first
      await this.processHistoricalEvents();
      
      // Start listening for new events
      this.isListening = true;
      this.setupEventListeners();
      
      // Start polling for new blocks
      this.startBlockPolling();
      
      logger.info('Blockchain event listener started successfully');
      
    } catch (error) {
      logger.error('Failed to start event listener:', error);
      await this.handleError(error);
    }
  }

  async stop() {
    this.isListening = false;
    
    if (this.contract) {
      this.contract.removeAllListeners();
    }
    
    if (this.blockPollingInterval) {
      clearInterval(this.blockPollingInterval);
    }
    
    logger.info('Blockchain event listener stopped');
  }

  async processHistoricalEvents() {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const startBlock = Math.max(this.lastProcessedBlock + 1, currentBlock - this.blockRange);
      
      if (startBlock >= currentBlock) {
        logger.info('No historical events to process');
        return;
      }
      
      logger.info(`Processing historical events from block ${startBlock} to ${currentBlock}`);
      
      // Process events in batches
      for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += this.batchSize) {
        const toBlock = Math.min(fromBlock + this.batchSize - 1, currentBlock);
        
        try {
          await this.processEventsInRange(fromBlock, toBlock);
          await this.saveLastProcessedBlock(toBlock);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          logger.error(`Error processing events in range ${fromBlock}-${toBlock}:`, error);
          // Continue with next batch
        }
      }
      
      logger.info('Historical event processing completed');
      
    } catch (error) {
      logger.error('Error in historical event processing:', error);
      throw error;
    }
  }

  async processEventsInRange(fromBlock, toBlock) {
    try {
      // Get all events for the contract in this range
      const filter = {
        address: config.blockchain.contractAddress,
        fromBlock,
        toBlock
      };
      
      const logs = await this.provider.getLogs(filter);
      
      for (const log of logs) {
        try {
          await this.processLog(log);
        } catch (error) {
          logger.error(`Error processing log ${log.transactionHash}:`, error);
          // Continue with next log
        }
      }
      
      logger.debug(`Processed ${logs.length} logs from blocks ${fromBlock}-${toBlock}`);
      
    } catch (error) {
      logger.error(`Error getting logs for blocks ${fromBlock}-${toBlock}:`, error);
      throw error;
    }
  }

  async processLog(log) {
    try {
      // Parse the log using contract interface
      const parsedLog = this.contract.interface.parseLog(log);
      if (!parsedLog) {
        logger.warn(`Could not parse log: ${log.transactionHash}`);
        return;
      }
      
      // Check if event already exists
      const existingEvent = await Event.findOne({ transactionHash: log.transactionHash });
      if (existingEvent) {
        logger.debug(`Event already processed: ${log.transactionHash}`);
        return;
      }
      
      // Get block details for timestamp
      const block = await this.provider.getBlock(log.blockNumber);
      
      // Create event record
      const eventData = await this.extractEventData(parsedLog);
      const event = new Event({
        eventName: parsedLog.name,
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        blockHash: log.blockHash,
        logIndex: log.index,
        jobId: eventData.jobId,
        client: eventData.client,
        freelancer: eventData.freelancer,
        arbiter: eventData.arbiter,
        eventData,
        timestamp: new Date(block.timestamp * 1000)
      });
      
      await event.save();
      
      // Process the event
      await this.handleEvent(event, parsedLog);
      
      logger.debug(`Processed event: ${parsedLog.name} for job ${eventData.jobId}`);
      
    } catch (error) {
      logger.error(`Error processing log:`, error);
      throw error;
    }
  }

  extractEventData(parsedLog) {
    const data = {
      jobId: parsedLog.args.jobId ? Number(parsedLog.args.jobId) : null
    };
    
    // Extract common addresses
    if (parsedLog.args.client) data.client = parsedLog.args.client.toLowerCase();
    if (parsedLog.args.freelancer) data.freelancer = parsedLog.args.freelancer.toLowerCase();
    if (parsedLog.args.arbiter) data.arbiter = parsedLog.args.arbiter.toLowerCase();
    
    // Extract event-specific data
    switch (parsedLog.name) {
      case 'JobCreated':
        data.totalAmount = parsedLog.args.totalAmount.toString();
        data.ipfsHash = parsedLog.args.ipfsHash;
        break;
        
      case 'MilestoneSubmitted':
        data.milestoneIndex = Number(parsedLog.args.milestoneIndex);
        data.deliverableHash = parsedLog.args.deliverableHash;
        break;
        
      case 'MilestoneApproved':
        data.milestoneIndex = Number(parsedLog.args.milestoneIndex);
        data.amount = parsedLog.args.amount.toString();
        break;
        
      case 'DisputeRaised':
        data.raiser = parsedLog.args.raiser.toLowerCase();
        data.reason = parsedLog.args.reason;
        break;
        
      case 'DisputeResolved':
        data.winner = parsedLog.args.winner.toLowerCase();
        data.amount = parsedLog.args.amount.toString();
        break;
        
      case 'FundsReleased':
        data.to = parsedLog.args.to.toLowerCase();
        data.amount = parsedLog.args.amount.toString();
        break;
        
      case 'JobCancelled':
        data.reason = parsedLog.args.reason;
        break;
    }
    
    return data;
  }

  async handleEvent(event, parsedLog) {
    try {
      switch (event.eventName) {
        case 'JobCreated':
          await this.handleJobCreated(event);
          break;
          
        case 'JobAccepted':
          await this.handleJobAccepted(event);
          break;
          
        case 'MilestoneSubmitted':
          await this.handleMilestoneSubmitted(event);
          break;
          
        case 'MilestoneApproved':
          await this.handleMilestoneApproved(event);
          break;
          
        case 'JobCompleted':
          await this.handleJobCompleted(event);
          break;
          
        case 'DisputeRaised':
          await this.handleDisputeRaised(event);
          break;
          
        case 'DisputeResolved':
          await this.handleDisputeResolved(event);
          break;
          
        case 'FundsReleased':
          await this.handleFundsReleased(event);
          break;
          
        case 'JobCancelled':
          await this.handleJobCancelled(event);
          break;
          
        default:
          logger.warn(`Unknown event type: ${event.eventName}`);
      }
      
      await event.markAsProcessed();
      
      // Emit real-time update via WebSocket
      this.emitRealtimeUpdate(event);
      
    } catch (error) {
      logger.error(`Error handling ${event.eventName} event:`, error);
      await event.markAsProcessed(error.message);
      throw error;
    }
  }

  async handleJobCreated(event) {
    // Job creation is typically handled by the frontend/API
    // But we can update our database if needed
    const job = await Job.findOne({ jobId: event.jobId });
    if (job) {
      job.transactionHash = event.transactionHash;
      job.blockNumber = event.blockNumber;
      await job.save();
    }
    
    // Send notification
    await this.notificationService.sendJobCreatedNotification(event);
  }

  async handleJobAccepted(event) {
    const job = await Job.findOne({ jobId: event.jobId });
    if (job) {
      job.freelancer = event.eventData.freelancer;
      job.status = 'assigned';
      job.acceptedAt = event.timestamp;
      await job.save();
      
      // Update user stats
      const freelancer = await User.findByAddress(event.eventData.freelancer);
      if (freelancer) {
        freelancer.stats.jobsCreated += 1;
        await freelancer.save();
      }
    }
    
    await this.notificationService.sendJobAcceptedNotification(event);
  }

  async handleMilestoneSubmitted(event) {
    const job = await Job.findOne({ jobId: event.jobId });
    if (job && job.milestones[event.eventData.milestoneIndex]) {
      const milestone = job.milestones[event.eventData.milestoneIndex];
      milestone.status = 'submitted';
      milestone.deliverableHash = event.eventData.deliverableHash;
      milestone.submittedAt = event.timestamp;
      
      await job.save();
    }
    
    await this.notificationService.sendMilestoneSubmittedNotification(event);
  }

  async handleMilestoneApproved(event) {
    const job = await Job.findOne({ jobId: event.jobId });
    if (job && job.milestones[event.eventData.milestoneIndex]) {
      const milestone = job.milestones[event.eventData.milestoneIndex];
      milestone.status = 'approved';
      milestone.approvedAt = event.timestamp;
      
      // Check if all milestones are completed
      const allCompleted = job.milestones.every(m => m.status === 'approved');
      if (allCompleted) {
        job.status = 'completed';
        job.completedAt = event.timestamp;
      }
      
      await job.save();
      
      // Update freelancer stats
      const freelancer = await User.findByAddress(job.freelancer);
      if (freelancer) {
        const currentEarned = parseFloat(freelancer.stats.totalEarned || '0');
        const milestoneAmount = parseFloat(event.eventData.amount || '0');
        freelancer.stats.totalEarned = (currentEarned + milestoneAmount).toString();
        await freelancer.save();
      }
    }
    
    await this.notificationService.sendMilestoneApprovedNotification(event);
  }

  async handleJobCompleted(event) {
    const job = await Job.findOne({ jobId: event.jobId });
    if (job) {
      job.status = 'completed';
      job.completedAt = event.timestamp;
      await job.save();
      
      // Update both parties' stats
      const [freelancer, client] = await Promise.all([
        User.findByAddress(job.freelancer),
        User.findByAddress(job.client)
      ]);
      
      if (freelancer) {
        freelancer.stats.jobsCompleted += 1;
        await freelancer.save();
      }
      
      if (client) {
        const currentSpent = parseFloat(client.stats.totalSpent || '0');
        const jobAmount = parseFloat(job.totalAmount || '0');
        client.stats.totalSpent = (currentSpent + jobAmount).toString();
        await client.save();
      }
    }
    
    await this.notificationService.sendJobCompletedNotification(event);
  }

  async handleDisputeRaised(event) {
    const job = await Job.findOne({ jobId: event.jobId });
    if (job) {
      job.disputeRaised = true;
      job.disputeRaisedAt = event.timestamp;
      job.disputeReason = event.eventData.reason;
      job.status = 'disputed';
      await job.save();
    }
    
    await this.notificationService.sendDisputeRaisedNotification(event);
  }

  async handleDisputeResolved(event) {
    const job = await Job.findOne({ jobId: event.jobId });
    if (job) {
      job.disputeResolvedAt = event.timestamp;
      job.status = 'completed'; // or 'cancelled' depending on resolution
      await job.save();
    }
    
    await this.notificationService.sendDisputeResolvedNotification(event);
  }

  async handleFundsReleased(event) {
    // Update any relevant records
    logger.info(`Funds released for job ${event.jobId}: ${event.eventData.amount} to ${event.eventData.to}`);
  }

  async handleJobCancelled(event) {
    const job = await Job.findOne({ jobId: event.jobId });
    if (job) {
      job.status = 'cancelled';
      await job.save();
    }
  }

  setupEventListeners() {
    // Listen for all events
    this.contract.on('*', async (event) => {
      try {
        logger.debug(`Received real-time event: ${event.event} in tx ${event.transactionHash}`);
        
        // Process the event
        const log = event.log;
        await this.processLog(log);
        
      } catch (error) {
        logger.error('Error processing real-time event:', error);
      }
    });
    
    logger.info('Real-time event listeners set up');
  }

  startBlockPolling() {
    // Poll for new blocks every 12 seconds (Polygon average block time)
    this.blockPollingInterval = setInterval(async () => {
      try {
        const currentBlock = await this.provider.getBlockNumber();
        
        if (currentBlock > this.lastProcessedBlock) {
          await this.processEventsInRange(this.lastProcessedBlock + 1, currentBlock);
          await this.saveLastProcessedBlock(currentBlock);
        }
        
      } catch (error) {
        logger.error('Error in block polling:', error);
      }
    }, 12000); // 12 seconds
    
    logger.info('Block polling started');
  }

  emitRealtimeUpdate(event) {
    if (global.io) {
      // Emit to specific job room
      global.io.to(`job_${event.jobId}`).emit('jobUpdate', {
        jobId: event.jobId,
        eventName: event.eventName,
        eventData: event.eventData,
        timestamp: event.timestamp
      });
      
      // Emit to general activity feed
      global.io.emit('blockchainActivity', {
        eventName: event.eventName,
        jobId: event.jobId,
        timestamp: event.timestamp
      });
    }
  }

  async handleError(error) {
    logger.error('Event listener error:', error);
    
    this.retryAttempts++;
    
    if (this.retryAttempts <= this.maxRetries) {
      logger.info(`Retrying in ${this.retryDelay}ms... (Attempt ${this.retryAttempts}/${this.maxRetries})`);
      
      setTimeout(() => {
        this.start();
      }, this.retryDelay);
      
      // Exponential backoff
      this.retryDelay *= 2;
    } else {
      logger.error('Max retry attempts reached. Event listener stopped.');
      this.stop();
    }
  }

  // Health check method
  async getStatus() {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const unprocessedEvents = await Event.countDocuments({ processed: false });
      
      return {
        isListening: this.isListening,
        currentBlock,
        lastProcessedBlock: this.lastProcessedBlock,
        blocksBehind: currentBlock - this.lastProcessedBlock,
        unprocessedEvents,
        retryAttempts: this.retryAttempts,
        contractAddress: config.blockchain.contractAddress
      };
    } catch (error) {
      logger.error('Error getting event listener status:', error);
      return {
        isListening: false,
        error: error.message
      };
    }
  }
}

module.exports = BlockchainEventListener;
