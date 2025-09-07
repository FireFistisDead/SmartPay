const User = require('../models/User');
const Job = require('../models/Job');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const cache = require('../config/redis');
const ipfsService = require('../services/ipfsService');
const firebaseAuthService = require('../services/firebaseAuthService');
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
    await cache.set(`nonce:${address.toLowerCase()}`, nonce, { ttl: 300 });
    
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
   * Simple register new user (for testing without signature)
   */
  async simpleRegister(req, res) {
    const { address, username, email, roles } = req.body;

    try {
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
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      logger.info(`New user registered via simple registration: ${user.address}`);

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
            createdAt: user.createdAt
          }
        }
      });
    } catch (error) {
      logger.error('Simple registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  }

  /**
   * Traditional signup with email and password
   */
  async traditionalSignup(req, res) {
    const { fullName, email, password, role } = req.body;

    try {
      // Check if user already exists in our database
      const existingUser = await User.findOne({ email: email.toLowerCase() });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Split full name
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Determine user role
      const userRole = role && ['client', 'freelancer'].includes(role) ? role : 'client';

      // Hash password for our database
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user in our database (without Firebase for now)
      const user = new User({
        email: email.toLowerCase(),
        password: hashedPassword,
        profile: {
          firstName,
          lastName
        },
        roles: [userRole],
        isEmailVerified: false, // Will be updated when Firebase verifies
        registeredAt: new Date(),
        lastLoginAt: new Date()
      });

      await user.save();

      // Generate JWT token (but user needs to verify email to fully activate)
      const token = jwt.sign(
        { 
          userId: user._id, 
          email: user.email,
          roles: user.roles,
          emailVerified: false
        },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      logger.info(`New user registered via traditional signup: ${user.email}`);

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            fullName: fullName,
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            roles: user.roles,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt
          },
          firebaseConfig: {
            apiKey: "AIzaSyDP8l0NzNT2HA3OD-1YbTFZbLduaJv5Stg",
            authDomain: "blockchain-9ff21.firebaseapp.com",
            projectId: "blockchain-9ff21"
          },
          message: 'Registration successful! Please verify your email to complete the process.'
        }
      });

    } catch (error) {
      logger.error('Traditional signup error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  }

  /**
   * Traditional login with email and password
   */
  async traditionalLogin(req, res) {
    const { email, password } = req.body;

    try {
      console.log('Login attempt for email:', email);
      
      // Find user with password field included
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      console.log('User found:', user ? 'Yes' : 'No');

      if (!user) {
        console.log('User not found for email:', email);
        return res.status(400).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      console.log('User password field exists:', user.password !== undefined);
      console.log('Password type:', typeof user.password);

      // Check if user has a password
      if (!user.password) {
        console.log('User has no password set');
        return res.status(400).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Password validation result:', isPasswordValid);

      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id, 
          email: user.email,
          roles: user.roles,
          emailVerified: user.isEmailVerified
        },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      logger.info(`User logged in via traditional login: ${user.email}`);

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            fullName: `${user.profile.firstName} ${user.profile.lastName}`.trim(),
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            roles: user.roles,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt
          }
        }
      });
    } catch (error) {
      logger.error('Traditional login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  /**
   * Verify email status from Firebase (called from frontend after Firebase verification)
   */
  async verifyEmail(req, res) {
    const { firebaseUID } = req.body;

    try {
      const { userId } = req.user; // From JWT middleware
      
      // Find user in our database
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update Firebase UID and mark email as verified
      if (firebaseUID) {
        user.firebaseUID = firebaseUID;
      }
      user.isEmailVerified = true;
      user.emailVerifiedAt = new Date();
      await user.save();

      // Generate new JWT token with verified status
      const newToken = jwt.sign(
        { 
          userId: user._id, 
          email: user.email,
          roles: user.roles,
          emailVerified: true
        },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      logger.info(`Email verified for user: ${user.email}`);

      res.json({
        success: true,
        data: {
          token: newToken,
          user: {
            id: user._id,
            email: user.email,
            fullName: `${user.profile.firstName} ${user.profile.lastName}`.trim(),
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            roles: user.roles,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt
          }
        },
        message: 'Email verified successfully! Welcome to SmartPay!'
      });

    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Email verification failed',
        error: error.message
      });
    }
  }

  /**
   * Initiate password reset (works with Firebase)
   */
  async forgotPassword(req, res) {
    const { email } = req.body;

    try {
      // Check if user exists in our database
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        // For security, don't reveal if email exists or not
        return res.json({
          success: true,
          message: 'If an account with this email exists, a password reset link has been sent.'
        });
      }

      // Return success and let frontend handle Firebase password reset
      res.json({
        success: true,
        data: {
          email: user.email,
          firebaseConfig: {
            apiKey: "AIzaSyDP8l0NzNT2HA3OD-1YbTFZbLduaJv5Stg",
            authDomain: "blockchain-9ff21.firebaseapp.com",
            projectId: "blockchain-9ff21"
          }
        },
        message: 'Password reset instructions will be sent to your email if the account exists.'
      });

    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request',
        error: error.message
      });
    }
  }

  /**
   * Reset password confirmation (after Firebase reset)
   */
  async resetPassword(req, res) {
    const { email, newPassword } = req.body;

    try {
      // Find user in our database
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Hash new password for our database
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password in our database
      user.password = hashedPassword;
      user.lastLoginAt = new Date();
      await user.save();

      // Generate new JWT token
      const token = jwt.sign(
        { 
          userId: user._id, 
          email: user.email,
          roles: user.roles,
          emailVerified: user.isEmailVerified
        },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      logger.info(`Password reset completed for user: ${user.email}`);

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            fullName: `${user.profile.firstName} ${user.profile.lastName}`.trim(),
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            roles: user.roles,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt
          }
        },
        message: 'Password reset successfully! You are now logged in.'
      });

    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset password',
        error: error.message
      });
    }
  }

  /**
   * Get user info for Firebase verification (frontend will handle resending)
   */
  async resendVerificationEmail(req, res) {
    try {
      const { userId } = req.user; // From JWT middleware
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
      }

      res.json({
        success: true,
        data: {
          email: user.email,
          firebaseConfig: {
            apiKey: "AIzaSyDP8l0NzNT2HA3OD-1YbTFZbLduaJv5Stg",
            authDomain: "blockchain-9ff21.firebaseapp.com",
            projectId: "blockchain-9ff21"
          }
        },
        message: 'Use Firebase client to resend verification email'
      });

    } catch (error) {
      logger.error('Resend verification email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to prepare email resend',
        error: error.message
      });
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(req, res) {
    console.log('getCurrentUser called');
    console.log('req.user:', req.user);
    
    const user = await User.findById(req.user.userId)
      .select('-__v')
      .lean();

    console.log('Found user:', user);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const response = {
      success: true,
      data: { user }
    };
    
    console.log('Sending response:', response);

    res.json(response);
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
