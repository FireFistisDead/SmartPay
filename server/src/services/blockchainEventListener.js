const { ethers } = require('ethers');
const config = require('../config/config');
const logger = require('../utils/logger');
const Event = require('../models/Event');
const Job = require('../models/Job');
const User = require('../models/User');
const NotificationService = require('./notificationService');
const ContractService = require('./contractService');
const redisClient = require('../config/redis');
const { AppError } = require('../middleware/errorHandler');

class BlockchainEventListener {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.contractService = new ContractService();
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
      // Check if already initialized
      if (this.provider && this.contract) {
        logger.info('Blockchain event listener already initialized');
        return true;
      }

      const network = config.blockchain.networks[config.blockchain.defaultNetwork];
      
      if (!network) {
        throw new AppError(`Network configuration not found for: ${config.blockchain.defaultNetwork}`, 500, 'NETWORK_CONFIG_MISSING');
      }
      
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(network.rpcUrl);
      
      // Test connection with timeout
      const networkInfo = await Promise.race([
        this.provider.getNetwork(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network connection timeout')), 10000)
        )
      ]);
      
      logger.info(`Connected to ${network.name} (Chain ID: ${networkInfo.chainId})`);
      
      // Validate chain ID
      if (Number(networkInfo.chainId) !== network.chainId) {
        throw new AppError(`Chain ID mismatch. Expected: ${network.chainId}, Got: ${networkInfo.chainId}`, 500, 'CHAIN_ID_MISMATCH');
      }
      
      // Initialize contract
      if (!config.blockchain.contractAddress) {
        throw new AppError('Contract address not configured', 500, 'CONTRACT_ADDRESS_MISSING');
      }
      
      // Validate contract address format
      if (!ethers.isAddress(config.blockchain.contractAddress)) {
        throw new AppError('Invalid contract address format', 500, 'INVALID_CONTRACT_ADDRESS');
      }
      
      this.contract = new ethers.Contract(
        config.blockchain.contractAddress,
        this.contractABI,
        this.provider
      );
      
      // Test contract connection
      try {
        await this.contract.getAddress();
      } catch (error) {
        throw new AppError('Contract not found at specified address', 500, 'CONTRACT_NOT_FOUND');
      }
      
      // Initialize dependencies
      try {
        await this.contractService.initialize();
        logger.info('ContractService initialized in BlockchainEventListener');
      } catch (error) {
        logger.warn('ContractService initialization failed in BlockchainEventListener:', error.message);
      }
      
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
      // Ensure Redis connection is available
      if (!redisClient.isConnected) {
        logger.warn('Redis not connected, using database for last processed block');
      } else {
        // Try to get from Redis first
        const cachedBlock = await redisClient.get('last_processed_block');
        if (cachedBlock && !isNaN(parseInt(cachedBlock))) {
          this.lastProcessedBlock = parseInt(cachedBlock);
          logger.info(`Loaded last processed block from cache: ${this.lastProcessedBlock}`);
          return;
        }
      }
      
      // Fallback to database
      const lastEvent = await Event.findOne({}, {}, { sort: { blockNumber: -1 } });
      if (lastEvent && lastEvent.blockNumber) {
        this.lastProcessedBlock = lastEvent.blockNumber;
        logger.info(`Loaded last processed block from database: ${this.lastProcessedBlock}`);
      } else {
        // Start from current block if no previous events
        const currentBlock = await this.provider.getBlockNumber();
        this.lastProcessedBlock = Math.max(0, currentBlock - 1000); // Start 1000 blocks back for safety
        logger.info(`Starting from block: ${this.lastProcessedBlock}`);
      }
      
      // Cache in Redis if available
      if (redisClient.isConnected) {
        await redisClient.set('last_processed_block', this.lastProcessedBlock.toString());
      }
      
    } catch (error) {
      logger.error('Error loading last processed block:', error);
      // Default to recent block
      try {
        const currentBlock = await this.provider.getBlockNumber();
        this.lastProcessedBlock = Math.max(0, currentBlock - 1000);
        logger.info(`Defaulting to block: ${this.lastProcessedBlock}`);
      } catch (providerError) {
        logger.error('Error getting current block number:', providerError);
        this.lastProcessedBlock = 0;
      }
    }
  }

  async saveLastProcessedBlock(blockNumber) {
    try {
      if (!blockNumber || blockNumber < 0) {
        logger.warn('Invalid block number provided for saving:', blockNumber);
        return;
      }

      this.lastProcessedBlock = blockNumber;
      
      // Save to Redis if available
      if (redisClient.isConnected) {
        await redisClient.set('last_processed_block', blockNumber.toString());
      } else {
        logger.warn('Redis not connected, block number not cached');
      }
      
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
    try {
      logger.info('Stopping blockchain event listener...');
      
      this.isListening = false;
      
      // Remove all event listeners
      if (this.contract) {
        this.contract.removeAllListeners();
        logger.debug('Contract event listeners removed');
      }
      
      // Clear polling interval
      if (this.blockPollingInterval) {
        clearInterval(this.blockPollingInterval);
        this.blockPollingInterval = null;
        logger.debug('Block polling interval cleared');
      }
      
      // Close provider connection if it exists
      if (this.provider && this.provider.destroy) {
        try {
          this.provider.destroy();
        } catch (error) {
          logger.warn('Error destroying provider:', error);
        }
      }
      
      // Reset state
      this.provider = null;
      this.contract = null;
      this.retryAttempts = 0;
      this.retryDelay = 5000;
      
      logger.info('Blockchain event listener stopped successfully');
      
    } catch (error) {
      logger.error('Error stopping blockchain event listener:', error);
    }
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
    try {
      const job = await Job.findOne({ jobId: event.jobId });
      if (!job) {
        logger.warn(`Job not found for JobAccepted event: ${event.jobId}`);
        return;
      }

      // Validate freelancer address
      if (!event.eventData.freelancer || !ethers.isAddress(event.eventData.freelancer)) {
        logger.error(`Invalid freelancer address in JobAccepted event: ${event.eventData.freelancer}`);
        return;
      }

      job.freelancer = event.eventData.freelancer;
      job.status = 'assigned';
      job.acceptedAt = event.timestamp;
      await job.save();
      
      // Update user stats
      const freelancer = await User.findByAddress(event.eventData.freelancer);
      if (freelancer) {
        freelancer.stats.jobsCreated += 1;
        await freelancer.save();
        logger.debug(`Updated freelancer stats for ${event.eventData.freelancer}`);
      }

      await this.notificationService.sendJobAcceptedNotification(event);
      logger.debug(`Processed JobAccepted event for job ${event.jobId}`);

    } catch (error) {
      logger.error(`Error handling JobAccepted event for job ${event.jobId}:`, error);
      throw error;
    }
  }

  async handleMilestoneSubmitted(event) {
    try {
      const job = await Job.findOne({ jobId: event.jobId });
      if (!job) {
        logger.warn(`Job not found for MilestoneSubmitted event: ${event.jobId}`);
        return;
      }

      const milestoneIndex = event.eventData.milestoneIndex;
      if (milestoneIndex < 0 || milestoneIndex >= job.milestones.length) {
        logger.error(`Invalid milestone index ${milestoneIndex} for job ${event.jobId}`);
        return;
      }

      const milestone = job.milestones[milestoneIndex];
      milestone.status = 'submitted';
      milestone.deliverableHash = event.eventData.deliverableHash;
      milestone.submittedAt = event.timestamp;
      
      await job.save();
      
      await this.notificationService.sendMilestoneSubmittedNotification(event);
      logger.debug(`Processed MilestoneSubmitted event for job ${event.jobId}, milestone ${milestoneIndex}`);

    } catch (error) {
      logger.error(`Error handling MilestoneSubmitted event for job ${event.jobId}:`, error);
      throw error;
    }
  }

  async handleMilestoneApproved(event) {
    try {
      const job = await Job.findOne({ jobId: event.jobId });
      if (!job) {
        logger.warn(`Job not found for MilestoneApproved event: ${event.jobId}`);
        return;
      }

      const milestoneIndex = event.eventData.milestoneIndex;
      if (milestoneIndex < 0 || milestoneIndex >= job.milestones.length) {
        logger.error(`Invalid milestone index ${milestoneIndex} for job ${event.jobId}`);
        return;
      }

      const milestone = job.milestones[milestoneIndex];
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
      if (job.freelancer) {
        const freelancer = await User.findByAddress(job.freelancer);
        if (freelancer) {
          const currentEarned = parseFloat(freelancer.stats.totalEarned || '0');
          const milestoneAmount = parseFloat(event.eventData.amount || '0');
          freelancer.stats.totalEarned = (currentEarned + milestoneAmount).toString();
          await freelancer.save();
          logger.debug(`Updated freelancer earnings for ${job.freelancer}`);
        }
      }

      await this.notificationService.sendMilestoneApprovedNotification(event);
      logger.debug(`Processed MilestoneApproved event for job ${event.jobId}, milestone ${milestoneIndex}`);

    } catch (error) {
      logger.error(`Error handling MilestoneApproved event for job ${event.jobId}:`, error);
      throw error;
    }
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
    try {
      // Use WebSocketService if available
      if (global.webSocketService && global.webSocketService.initialized) {
        // Emit to specific job room
        global.webSocketService.broadcastToRoom(`job_${event.jobId}`, 'jobUpdate', {
          jobId: event.jobId,
          eventName: event.eventName,
          eventData: event.eventData,
          timestamp: event.timestamp
        });
        
        // Emit to general activity feed
        global.webSocketService.broadcast('blockchainActivity', {
          eventName: event.eventName,
          jobId: event.jobId,
          timestamp: event.timestamp
        });
      } 
      // Fallback to global.io if WebSocketService not available
      else if (global.io) {
        global.io.to(`job_${event.jobId}`).emit('jobUpdate', {
          jobId: event.jobId,
          eventName: event.eventName,
          eventData: event.eventData,
          timestamp: event.timestamp
        });
        
        global.io.emit('blockchainActivity', {
          eventName: event.eventName,
          jobId: event.jobId,
          timestamp: event.timestamp
        });
      }
    } catch (error) {
      logger.error('Error emitting real-time update:', error);
    }
  }

  async handleError(error) {
    logger.error('Event listener error:', error);
    
    this.retryAttempts++;
    
    // Stop listening to prevent further errors
    this.isListening = false;
    
    // Different retry strategies based on error type
    let shouldRetry = true;
    let delay = this.retryDelay;
    
    if (error.code === 'NETWORK_ERROR' || error.message.includes('network')) {
      delay = Math.min(this.retryDelay * 2, 60000); // Cap at 1 minute
    } else if (error.code === 'RATE_LIMITED') {
      delay = Math.min(this.retryDelay * 3, 120000); // Cap at 2 minutes for rate limiting
    } else if (error.code === 'CONTRACT_NOT_FOUND' || error.code === 'INVALID_CONTRACT_ADDRESS') {
      shouldRetry = false; // Don't retry configuration errors
    }
    
    if (shouldRetry && this.retryAttempts <= this.maxRetries) {
      logger.info(`Retrying in ${delay}ms... (Attempt ${this.retryAttempts}/${this.maxRetries})`);
      
      setTimeout(async () => {
        try {
          await this.start();
        } catch (retryError) {
          logger.error('Retry failed:', retryError);
          await this.handleError(retryError);
        }
      }, delay);
      
      // Exponential backoff
      this.retryDelay = Math.min(delay * 1.5, 300000); // Cap at 5 minutes
    } else {
      logger.error(`Max retry attempts reached or unrecoverable error. Event listener stopped.`);
      this.stop();
      
      // Reset retry attempts and delay for future attempts
      this.retryAttempts = 0;
      this.retryDelay = 5000;
      
      // Emit critical error event
      if (global.webSocketService) {
        global.webSocketService.broadcast('systemAlert', {
          type: 'critical',
          message: 'Blockchain event listener stopped',
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // Health check method
  async getStatus() {
    try {
      const status = {
        isListening: this.isListening,
        lastProcessedBlock: this.lastProcessedBlock,
        retryAttempts: this.retryAttempts,
        contractAddress: config.blockchain.contractAddress,
        network: config.blockchain.defaultNetwork,
        provider: null,
        contract: null,
        currentBlock: null,
        blocksBehind: null,
        unprocessedEvents: null,
        isHealthy: true,
        errors: []
      };

      // Check provider status
      if (this.provider) {
        try {
          const network = await this.provider.getNetwork();
          status.provider = {
            connected: true,
            chainId: Number(network.chainId),
            name: network.name
          };
          
          const currentBlock = await this.provider.getBlockNumber();
          status.currentBlock = currentBlock;
          status.blocksBehind = Math.max(0, currentBlock - this.lastProcessedBlock);
          
        } catch (error) {
          status.provider = { connected: false, error: error.message };
          status.errors.push(`Provider error: ${error.message}`);
          status.isHealthy = false;
        }
      } else {
        status.provider = { connected: false };
        status.errors.push('Provider not initialized');
        status.isHealthy = false;
      }

      // Check contract status
      if (this.contract) {
        try {
          const address = await this.contract.getAddress();
          status.contract = {
            connected: true,
            address: address
          };
        } catch (error) {
          status.contract = { connected: false, error: error.message };
          status.errors.push(`Contract error: ${error.message}`);
          status.isHealthy = false;
        }
      } else {
        status.contract = { connected: false };
        status.errors.push('Contract not initialized');
        status.isHealthy = false;
      }

      // Check unprocessed events
      try {
        const unprocessedEvents = await Event.countDocuments({ processed: false });
        status.unprocessedEvents = unprocessedEvents;
        
        if (unprocessedEvents > 1000) {
          status.errors.push(`High number of unprocessed events: ${unprocessedEvents}`);
          status.isHealthy = false;
        }
      } catch (error) {
        status.errors.push(`Database error: ${error.message}`);
        status.isHealthy = false;
      }

      // Check if we're too far behind
      if (status.blocksBehind !== null && status.blocksBehind > 100) {
        status.errors.push(`Behind by ${status.blocksBehind} blocks`);
        status.isHealthy = false;
      }

      return status;
      
    } catch (error) {
      logger.error('Error getting event listener status:', error);
      return {
        isListening: false,
        isHealthy: false,
        error: error.message,
        errors: [error.message]
      };
    }
  }

  /**
   * Get detailed metrics for monitoring
   */
  async getMetrics() {
    try {
      const status = await this.getStatus();
      
      // Get event processing statistics
      const eventStats = await Event.aggregate([
        {
          $group: {
            _id: '$eventName',
            count: { $sum: 1 },
            processed: { $sum: { $cond: ['$processed', 1, 0] } },
            failed: { $sum: { $cond: ['$processingError', 1, 0] } }
          }
        }
      ]);

      // Get recent processing performance
      const recentEvents = await Event.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).countDocuments();

      return {
        ...status,
        eventStats,
        recentEvents24h: recentEvents,
        performance: {
          averageProcessingTime: null, // Could be calculated if we track processing times
          eventsPerHour: Math.round(recentEvents / 24)
        }
      };
      
    } catch (error) {
      logger.error('Error getting event listener metrics:', error);
      return { error: error.message };
    }
  }

  /**
   * Force resync from a specific block
   */
  async forceResync(fromBlock = null) {
    try {
      logger.info('Starting forced resync...');
      
      // Stop current listening
      await this.stop();
      
      // Set starting block
      if (fromBlock !== null) {
        this.lastProcessedBlock = fromBlock;
        if (redisClient.isConnected) {
          await redisClient.set('last_processed_block', fromBlock.toString());
        }
      }
      
      // Restart
      await this.start();
      
      logger.info('Forced resync completed');
      return true;
      
    } catch (error) {
      logger.error('Error during forced resync:', error);
      throw error;
    }
  }

  /**
   * Graceful restart of the event listener
   */
  async restart() {
    try {
      logger.info('Restarting blockchain event listener...');
      
      await this.stop();
      
      // Wait a moment before restarting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await this.start();
      
      logger.info('Blockchain event listener restarted successfully');
      return true;
      
    } catch (error) {
      logger.error('Error restarting blockchain event listener:', error);
      throw error;
    }
  }

  /**
   * Cleanup method for graceful shutdown
   */
  async cleanup() {
    try {
      logger.info('Cleaning up blockchain event listener...');
      
      // Stop the listener
      await this.stop();
      
      // Save current state
      if (this.lastProcessedBlock > 0 && redisClient.isConnected) {
        await redisClient.set('last_processed_block', this.lastProcessedBlock.toString());
      }
      
      logger.info('Blockchain event listener cleanup completed');
      
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

module.exports = BlockchainEventListener;
