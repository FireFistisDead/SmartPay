const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  amount: {
    type: String, // Store as string to handle large numbers precisely
    required: true,
    validate: {
      validator: function(v) {
        return /^\d+(\.\d{1,18})?$/.test(v); // Validate decimal with up to 18 decimals
      },
      message: 'Invalid amount format'
    }
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'approved', 'disputed'],
    default: 'pending'
  },
  deliverableHash: {
    type: String, // IPFS hash
    default: null
  },
  submittedAt: {
    type: Date,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

const jobSchema = new mongoose.Schema({
  // Blockchain Data
  jobId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  transactionHash: {
    type: String,
    required: true,
    unique: true
  },
  blockNumber: {
    type: Number,
    required: true
  },

  // Job Details
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  category: {
    type: String,
    required: true,
    enum: ['development', 'design', 'writing', 'marketing', 'consulting', 'other']
  },
  skills: [{
    type: String,
    trim: true
  }],
  
  // Parties
  client: {
    type: String, // Ethereum address
    required: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Invalid Ethereum address'
    }
  },
  freelancer: {
    type: String, // Ethereum address
    default: null,
    lowercase: true,
    validate: {
      validator: function(v) {
        return v === null || /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Invalid Ethereum address'
    }
  },
  arbiter: {
    type: String, // Ethereum address
    required: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Invalid Ethereum address'
    }
  },

  // Financial
  totalAmount: {
    type: String, // Store as string to handle large numbers precisely
    required: true
  },
  token: {
    type: String, // Token contract address (USDC)
    required: true,
    lowercase: true
  },
  
  // Milestones
  milestones: [milestoneSchema],
  
  // Status and Workflow
  status: {
    type: String,
    enum: ['open', 'assigned', 'in_progress', 'completed', 'disputed', 'cancelled'],
    default: 'open'
  },
  
  // Timestamps
  deadline: {
    type: Date,
    required: true
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  
  // Dispute Management
  disputeRaised: {
    type: Boolean,
    default: false
  },
  disputeRaisedAt: {
    type: Date,
    default: null
  },
  disputeReason: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  disputeResolvedAt: {
    type: Date,
    default: null
  },
  disputeResolution: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Metadata
  ipfsHash: {
    type: String, // IPFS hash for additional job data
    default: null
  },
  attachments: [{
    name: String,
    ipfsHash: String,
    mimeType: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  applications: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
jobSchema.index({ client: 1, status: 1 });
jobSchema.index({ freelancer: 1, status: 1 });
jobSchema.index({ arbiter: 1, status: 1 });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ deadline: 1 });
jobSchema.index({ 'milestones.status': 1 });

// Virtual for completed milestones count
jobSchema.virtual('completedMilestonesCount').get(function() {
  return this.milestones.filter(m => m.status === 'approved').length;
});

// Virtual for progress percentage
jobSchema.virtual('progressPercentage').get(function() {
  if (this.milestones.length === 0) return 0;
  return Math.round((this.completedMilestonesCount / this.milestones.length) * 100);
});

// Pre-save middleware
jobSchema.pre('save', function(next) {
  // Update job status based on milestones
  const totalMilestones = this.milestones.length;
  const completedMilestones = this.milestones.filter(m => m.status === 'approved').length;
  
  if (totalMilestones > 0 && completedMilestones === totalMilestones) {
    this.status = 'completed';
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else if (this.freelancer && this.status === 'open') {
    this.status = 'assigned';
    if (!this.acceptedAt) {
      this.acceptedAt = new Date();
    }
  }
  
  next();
});

// Instance methods
jobSchema.methods.canBeAccepted = function() {
  return this.status === 'open' && !this.freelancer;
};

jobSchema.methods.canSubmitMilestone = function(milestoneIndex, userAddress) {
  if (this.freelancer?.toLowerCase() !== userAddress?.toLowerCase()) {
    return false;
  }
  
  const milestone = this.milestones[milestoneIndex];
  return milestone && milestone.status === 'pending';
};

jobSchema.methods.canApproveMilestone = function(milestoneIndex, userAddress) {
  if (this.client.toLowerCase() !== userAddress?.toLowerCase()) {
    return false;
  }
  
  const milestone = this.milestones[milestoneIndex];
  return milestone && milestone.status === 'submitted';
};

jobSchema.methods.canRaiseDispute = function(userAddress) {
  const isParty = this.client.toLowerCase() === userAddress?.toLowerCase() || 
                  this.freelancer?.toLowerCase() === userAddress?.toLowerCase();
  return isParty && !this.disputeRaised && this.status !== 'completed';
};

// Static methods
jobSchema.statics.findByParty = function(address, role = null) {
  const query = {};
  
  if (role === 'client') {
    query.client = address.toLowerCase();
  } else if (role === 'freelancer') {
    query.freelancer = address.toLowerCase();
  } else if (role === 'arbiter') {
    query.arbiter = address.toLowerCase();
  } else {
    query.$or = [
      { client: address.toLowerCase() },
      { freelancer: address.toLowerCase() },
      { arbiter: address.toLowerCase() }
    ];
  }
  
  return this.find(query);
};

jobSchema.statics.getStatsByAddress = function(address) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { client: address.toLowerCase() },
          { freelancer: address.toLowerCase() }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        completedJobs: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalValue: {
          $sum: { $toDouble: '$totalAmount' }
        },
        averageValue: {
          $avg: { $toDouble: '$totalAmount' }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Job', jobSchema);
