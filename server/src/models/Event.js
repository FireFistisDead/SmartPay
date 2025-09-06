const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  // Blockchain Event Data
  eventName: {
    type: String,
    required: true,
    enum: [
      'JobCreated',
      'JobAccepted', 
      'MilestoneSubmitted',
      'MilestoneApproved',
      'JobCompleted',
      'DisputeRaised',
      'DisputeResolved',
      'FundsReleased',
      'JobCancelled'
    ]
  },
  
  transactionHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  blockNumber: {
    type: Number,
    required: true,
    index: true
  },
  
  blockHash: {
    type: String,
    required: true
  },
  
  logIndex: {
    type: Number,
    required: true
  },
  
  // Event-specific data
  jobId: {
    type: Number,
    required: true,
    index: true
  },
  
  // Common addresses
  client: {
    type: String,
    lowercase: true
  },
  freelancer: {
    type: String,
    lowercase: true
  },
  arbiter: {
    type: String,
    lowercase: true
  },
  
  // Event-specific parameters
  eventData: {
    type: mongoose.Schema.Types.Mixed, // Flexible object to store any event data
    default: {}
  },
  
  // Processing status
  processed: {
    type: Boolean,
    default: false
  },
  
  processedAt: {
    type: Date,
    default: null
  },
  
  processingError: {
    type: String,
    default: null
  },
  
  retryCount: {
    type: Number,
    default: 0
  },
  
  // Metadata
  gasUsed: {
    type: String
  },
  
  gasPrice: {
    type: String
  },
  
  timestamp: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
eventSchema.index({ jobId: 1, eventName: 1, blockNumber: 1 });
eventSchema.index({ processed: 1, createdAt: 1 });
eventSchema.index({ eventName: 1, timestamp: -1 });
eventSchema.index({ client: 1, timestamp: -1 });
eventSchema.index({ freelancer: 1, timestamp: -1 });

// Instance methods
eventSchema.methods.markAsProcessed = function(error = null) {
  this.processed = error ? false : true;
  this.processedAt = new Date();
  this.processingError = error;
  if (error) {
    this.retryCount += 1;
  }
  return this.save();
};

eventSchema.methods.canRetry = function(maxRetries = 3) {
  return this.retryCount < maxRetries && this.processingError;
};

// Static methods
eventSchema.statics.findUnprocessed = function(limit = 100) {
  return this.find({ 
    processed: false,
    $or: [
      { processingError: null },
      { retryCount: { $lt: 3 } }
    ]
  })
    .sort({ blockNumber: 1, logIndex: 1 })
    .limit(limit);
};

eventSchema.statics.findByJob = function(jobId) {
  return this.find({ jobId })
    .sort({ blockNumber: 1, logIndex: 1 });
};

eventSchema.statics.findByAddress = function(address) {
  const addr = address.toLowerCase();
  return this.find({
    $or: [
      { client: addr },
      { freelancer: addr },
      { arbiter: addr }
    ]
  }).sort({ timestamp: -1 });
};

eventSchema.statics.getEventStats = function(timeframe = '24h') {
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case '1h':
      startDate = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$eventName',
        count: { $sum: 1 },
        latestTimestamp: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

eventSchema.statics.getProcessingStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalEvents: { $sum: 1 },
        processedEvents: {
          $sum: { $cond: ['$processed', 1, 0] }
        },
        failedEvents: {
          $sum: { $cond: ['$processingError', 1, 0] }
        },
        averageRetries: { $avg: '$retryCount' }
      }
    }
  ]);
};

eventSchema.statics.findRecentActivity = function(limit = 50) {
  return this.find({ processed: true })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('jobId'); // If you want to populate job details
};

module.exports = mongoose.model('Event', eventSchema);
