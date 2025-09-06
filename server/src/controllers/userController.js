const User = require('../models/User');
const Job = require('../models/Job');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cache = require('../config/redis');
const ipfsService = require('../services/ipfsService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class UserController {
  /**
   * Generate nonce for signature authentication
   */
  async getNonce(req, res) {
    const { address } = req.body;
    
    const nonce = crypto.randomBytes(32).toString('hex');
    const message = `Welcome to SmartPay! Please sign this message to verify your identity. Nonce: ${nonce}`;
    
    // Store nonce in Redis with 5 minute expiration
    await cache.setex(`nonce:${address.toLowerCase()}`, 300, nonce);
    
    res.json({
      success: true,
      data: {
        nonce,
        message
      }
    });
  }

  /**
   * Login user with signature
   */
  async login(req, res) {
    const { address } = req.body;
    
    // Find or create user
    let user = await User.findOne({ address: address.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        address: user.address,
        roles: user.roles
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          address: user.address,
          username: user.username,
          email: user.email,
          roles: user.roles,
          profile: user.profile,
          isEmailVerified: user.isEmailVerified,
          reputation: user.reputation,
          createdAt: user.createdAt
        }
      }
    });
  }

  /**
   * Register new user
   */
  async register(req, res) {
    const { address, username, email, roles } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { address: address.toLowerCase() },
        ...(username ? [{ username }] : []),
        ...(email ? [{ email }] : [])
      ]
    });

    if (existingUser) {
      if (existingUser.address === address.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'User with this address already exists'
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
    }

    // Create new user
    const user = new User({
      address: address.toLowerCase(),
      username,
      email,
      roles: roles || ['client'],
      registeredAt: new Date(),
      lastLoginAt: new Date()
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        address: user.address,
        roles: user.roles
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info(`New user registered: ${user.address}`);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          address: user.address,
          username: user.username,
          email: user.email,
          roles: user.roles,
          profile: user.profile,
          isEmailVerified: user.isEmailVerified,
          reputation: user.reputation,
          createdAt: user.createdAt
        }
      }
    });
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(req, res) {
    const user = await User.findById(req.user.userId)
      .select('-__v')
      .lean();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user }
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    const { username, email, profile } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check username availability
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        throw new AppError('Username already taken', 400);
      }
      user.username = username;
    }

    // Check email availability
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new AppError('Email already registered', 400);
      }
      user.email = email;
      user.isEmailVerified = false; // Reset verification status
    }

    // Update profile fields
    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }

    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          address: user.address,
          username: user.username,
          email: user.email,
          roles: user.roles,
          profile: user.profile,
          isEmailVerified: user.isEmailVerified,
          reputation: user.reputation,
          updatedAt: user.updatedAt
        }
      }
    });
  }

  /**
   * Get user by address
   */
  async getUserByAddress(req, res) {
    const { address } = req.params;
    const currentUserId = req.user?.userId;

    const user = await User.findOne({ address: address.toLowerCase() })
      .select('-__v')
      .lean();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Hide sensitive information unless it's the user's own profile
    const isOwnProfile = currentUserId && user._id.toString() === currentUserId;
    
    if (!isOwnProfile) {
      delete user.email;
      delete user.settings;
      
      // Respect privacy settings
      if (user.settings?.privacy?.hideEmail) {
        delete user.email;
      }
      if (user.settings?.privacy?.hideProfile) {
        user.profile = { displayName: user.profile?.displayName || user.username };
      }
    }

    res.json({
      success: true,
      data: { user }
    });
  }

  /**
   * Get users with filtering
   */
  async getUsers(req, res) {
    const { role, skills, search, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    
    if (role) {
      filter.roles = role;
    }
    
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : JSON.parse(skills);
      filter['profile.skills.name'] = { $in: skillsArray };
    }
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { 'profile.bio': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('address username profile roles reputation createdAt')
        .sort({ 'reputation.overallScore': -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  }

  /**
   * Get top freelancers
   */
  async getTopFreelancers(req, res) {
    const { limit = 10 } = req.query;

    const freelancers = await User.find({ roles: 'freelancer' })
      .select('address username profile reputation createdAt')
      .sort({ 
        'reputation.overallScore': -1,
        'reputation.completedJobs': -1,
        'reputation.averageRating': -1 
      })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: { freelancers }
    });
  }

  /**
   * Get verified arbiters
   */
  async getVerifiedArbiters(req, res) {
    const arbiters = await User.find({ 
      roles: 'arbiter',
      isVerified: true 
    })
      .select('address username profile reputation')
      .sort({ 'reputation.overallScore': -1 })
      .lean();

    res.json({
      success: true,
      data: { arbiters }
    });
  }

  /**
   * Add skill to user profile
   */
  async addSkill(req, res) {
    const { name, level, yearsOfExperience } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if skill already exists
    const existingSkill = user.profile.skills.find(skill => 
      skill.name.toLowerCase() === name.toLowerCase()
    );

    if (existingSkill) {
      throw new AppError('Skill already exists', 400);
    }

    user.profile.skills.push({
      name: name.trim(),
      level: level || 'beginner',
      yearsOfExperience: yearsOfExperience || 0
    });

    await user.save();

    res.json({
      success: true,
      data: {
        skill: user.profile.skills[user.profile.skills.length - 1]
      }
    });
  }

  /**
   * Remove skill from user profile
   */
  async removeSkill(req, res) {
    const { skillName } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const skillIndex = user.profile.skills.findIndex(skill => 
      skill.name.toLowerCase() === skillName.toLowerCase()
    );

    if (skillIndex === -1) {
      throw new AppError('Skill not found', 404);
    }

    user.profile.skills.splice(skillIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: 'Skill removed successfully'
    });
  }

  /**
   * Update user settings
   */
  async updateSettings(req, res) {
    const { emailNotifications, privacy, preferences } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (emailNotifications) {
      user.settings.emailNotifications = { 
        ...user.settings.emailNotifications, 
        ...emailNotifications 
      };
    }

    if (privacy) {
      user.settings.privacy = { 
        ...user.settings.privacy, 
        ...privacy 
      };
    }

    if (preferences) {
      user.settings.preferences = { 
        ...user.settings.preferences, 
        ...preferences 
      };
    }

    await user.save();

    res.json({
      success: true,
      data: {
        settings: user.settings
      }
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(req, res) {
    const { address } = req.params;

    const user = await User.findOne({ address: address.toLowerCase() });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get job statistics
    const [asClient, asFreelancer] = await Promise.all([
      Job.aggregate([
        { $match: { client: user._id } },
        {
          $group: {
            _id: null,
            totalJobs: { $sum: 1 },
            completedJobs: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            totalSpent: { $sum: '$budget' },
            averageJobValue: { $avg: '$budget' }
          }
        }
      ]),
      Job.aggregate([
        { $match: { freelancer: user._id } },
        {
          $group: {
            _id: null,
            totalJobs: { $sum: 1 },
            completedJobs: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            totalEarned: { $sum: '$budget' },
            averageJobValue: { $avg: '$budget' }
          }
        }
      ])
    ]);

    const clientStats = asClient[0] || { totalJobs: 0, completedJobs: 0, totalSpent: 0, averageJobValue: 0 };
    const freelancerStats = asFreelancer[0] || { totalJobs: 0, completedJobs: 0, totalEarned: 0, averageJobValue: 0 };

    res.json({
      success: true,
      data: {
        user: {
          address: user.address,
          username: user.username,
          roles: user.roles,
          reputation: user.reputation,
          memberSince: user.createdAt
        },
        stats: {
          asClient: clientStats,
          asFreelancer: freelancerStats
        }
      }
    });
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(req, res) {
    const userId = req.user.userId;

    if (!req.file) {
      throw new AppError('No avatar file provided', 400);
    }

    // Upload to IPFS
    const ipfsHash = await ipfsService.uploadFile(req.file.buffer, req.file.originalname);

    // Update user profile
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.profile.avatar = ipfsHash;
    await user.save();

    res.json({
      success: true,
      data: {
        avatarHash: ipfsHash,
        avatarUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
      }
    });
  }
}

module.exports = new UserController();
