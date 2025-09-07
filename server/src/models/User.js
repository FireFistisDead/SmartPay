const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Blockchain Identity
  address: {
    type: String,
    // Make blockchain address optional for email/password users. When present, validate format.
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Invalid Ethereum address'
    }
  },
  
  // Profile Information
  username: {
    type: String,
    trim: true,
    maxlength: 50,
    sparse: true, // Allow null but unique if present
    unique: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    unique: true,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  
  // Local auth password (bcrypt hash)
  password: {
    type: String,
    select: false,
  },
  
  // Profile Details
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    avatar: {
      type: String, // IPFS hash or URL
      default: null
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100
    },
    timezone: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Invalid website URL'
      }
    },
    socialLinks: {
      github: String,
      linkedin: String,
      twitter: String,
      portfolio: String
    }
  },
  
  // User Roles and Capabilities
  roles: [{
    type: String,
    enum: ['guest', 'user', 'freelancer', 'client', 'moderator', 'admin', 'super_admin'],
    default: 'user'
  }],
  
  // RBAC and Security
  permissions: [{
    type: String,
    trim: true
  }],
  
  // Security tracking
  securityProfile: {
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    accountLocked: {
      type: Boolean,
      default: false
    },
    lockedUntil: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: String,
    sessionTokens: [{
      token: String,
      createdAt: Date,
      expiresAt: Date,
      deviceFingerprint: String
    }],
    passwordChangedAt: Date,
    securityQuestions: [{
      question: String,
      answerHash: String
    }]
  },
  
  // Freelancer-specific data
  freelancerProfile: {
    skills: [{
      name: {
        type: String,
        required: true
      },
      level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate'
      },
      yearsOfExperience: {
        type: Number,
        min: 0,
        max: 50
      }
    }],
    hourlyRate: {
      type: Number,
      min: 0
    },
    availability: {
      type: String,
      enum: ['available', 'full-time', 'part-time', 'contract', 'not-available'],
      default: 'available'
    },
    portfolio: [{
      title: String,
      description: String,
      imageHash: String, // IPFS hash
      url: String,
      technologies: [String],
      completedAt: Date
    }],
    certifications: [{
      name: String,
      issuer: String,
      url: String,
      issuedAt: Date
    }]
  },
  
  // Arbiter-specific data
  arbiterProfile: {
    expertise: [String], // Areas of expertise
    experience: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    qualifications: [String],
    disputesResolved: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  
  // Reputation and Statistics
  reputation: {
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  
  // Activity Statistics
  stats: {
    jobsCompleted: {
      type: Number,
      default: 0
    },
    jobsCreated: {
      type: Number,
      default: 0
    },
    totalEarned: {
      type: String, // Store as string for precision
      default: '0'
    },
    totalSpent: {
      type: String, // Store as string for precision
      default: '0'
    },
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    responseTime: {
      type: Number, // Average response time in hours
      default: 0
    }
  },
  
  // Account Settings
  settings: {
    emailNotifications: {
      jobUpdates: {
        type: Boolean,
        default: true
      },
      milestoneUpdates: {
        type: Boolean,
        default: true
      },
      disputes: {
        type: Boolean,
        default: true
      },
      marketing: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      showEmail: {
        type: Boolean,
        default: false
      },
      showLocation: {
        type: Boolean,
        default: true
      },
      showStats: {
        type: Boolean,
        default: true
      }
    },
    preferences: {
      currency: {
        type: String,
        default: 'USDC'
      },
      language: {
        type: String,
        default: 'en'
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto'
      }
    }
  },
  
  // Verification and Trust
  verification: {
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
    },
    isIdentityVerified: {
      type: Boolean,
      default: false
    },
    verificationLevel: {
      type: String,
      enum: ['none', 'basic', 'enhanced', 'premium'],
      default: 'none'
    },
    verifiedAt: Date,
    documents: [{
      type: String, // Document type
      hash: String, // IPFS hash
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Activity Tracking
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  
  // Account Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned', 'inactive'],
    default: 'active'
  },
  
  // Blockchain-related
  nonce: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ address: 1 });
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'roles': 1 });
userSchema.index({ 'reputation.score': -1 });
userSchema.index({ 'stats.jobsCompleted': -1 });
userSchema.index({ 'freelancerProfile.skills.name': 1 });
userSchema.index({ lastActiveAt: -1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username || this.address;
});

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  return this.username || this.fullName || this.address;
});

// Instance methods
userSchema.methods.isFreelancer = function() {
  return this.roles.includes('freelancer');
};

userSchema.methods.isClient = function() {
  return this.roles.includes('client');
};

userSchema.methods.isArbiter = function() {
  return this.roles.includes('arbiter');
};

userSchema.methods.updateLastActive = function() {
  this.lastActiveAt = new Date();
  this.isOnline = true;
  return this.save();
};

userSchema.methods.updateStats = function(statUpdates) {
  Object.keys(statUpdates).forEach(key => {
    if (this.stats[key] !== undefined) {
      this.stats[key] = statUpdates[key];
    }
  });
  return this.save();
};

userSchema.methods.addSkill = function(skill) {
  if (!this.freelancerProfile) {
    this.freelancerProfile = { skills: [] };
  }
  
  const existingSkill = this.freelancerProfile.skills.find(
    s => s.name.toLowerCase() === skill.name.toLowerCase()
  );
  
  if (!existingSkill) {
    this.freelancerProfile.skills.push(skill);
    return this.save();
  }
  
  return Promise.resolve(this);
};

userSchema.methods.removeSkill = function(skillName) {
  if (this.freelancerProfile && this.freelancerProfile.skills) {
    this.freelancerProfile.skills = this.freelancerProfile.skills.filter(
      s => s.name.toLowerCase() !== skillName.toLowerCase()
    );
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Static methods
userSchema.statics.findByAddress = function(address) {
  return this.findOne({ address: address.toLowerCase() });
};

userSchema.statics.findFreelancers = function(skills = []) {
  const query = { roles: 'freelancer' };
  
  if (skills.length > 0) {
    query['freelancerProfile.skills.name'] = { $in: skills.map(s => s.toLowerCase()) };
  }
  
  return this.find(query)
    .sort({ 'reputation.score': -1, 'stats.jobsCompleted': -1 });
};

userSchema.statics.findArbiters = function() {
  return this.find({ 
    roles: 'arbiter',
    'arbiterProfile.isVerified': true,
    status: 'active'
  }).sort({ 'arbiterProfile.disputesResolved': -1, 'reputation.score': -1 });
};

userSchema.statics.getTopFreelancers = function(limit = 10) {
  return this.find({ 
    roles: 'freelancer',
    status: 'active'
  })
    .sort({ 
      'reputation.score': -1, 
      'stats.jobsCompleted': -1,
      'reputation.averageRating': -1 
    })
    .limit(limit);
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Update reputation score based on ratings and completion rate
  if (this.stats.totalReviews > 0) {
    const baseScore = (this.reputation.averageRating / 5) * 50; // 50% from ratings
    const completionScore = Math.min(this.stats.successRate, 100) * 0.3; // 30% from success rate
    const experienceScore = Math.min(this.stats.jobsCompleted / 10, 1) * 20; // 20% from experience
    
    this.reputation.score = Math.round(baseScore + completionScore + experienceScore);
  }
  
  next();
});

module.exports = mongoose.model('User', userSchema);
