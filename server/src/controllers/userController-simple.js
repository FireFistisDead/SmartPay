// Basic User Controller - No external dependencies except logger
const logger = require('../utils/logger');

class UserController {
  // Get all users - Mock data
  async getAllUsers(req, res) {
    try {
      logger.info('Fetching all users');
      
      const mockUsers = [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          role: "client",
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: "Jane Smith",
          email: "jane@example.com",
          role: "freelancer",
          createdAt: new Date().toISOString()
        }
      ];

      res.status(200).json({
        success: true,
        data: mockUsers,
        message: "Users retrieved successfully"
      });
    } catch (error) {
      logger.error('Error in getAllUsers:', error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve users",
        error: error.message
      });
    }
  }

  // Get user by ID - Mock data
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      logger.info(`Fetching user with ID: ${id}`);

      const mockUser = {
        id: parseInt(id),
        name: "John Doe",
        email: "john@example.com",
        role: "client",
        profile: {
          bio: "Experienced client looking for quality work",
          skills: ["Project Management", "Communication"],
          rating: 4.8
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: mockUser,
        message: "User retrieved successfully"
      });
    } catch (error) {
      logger.error('Error in getUserById:', error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve user",
        error: error.message
      });
    }
  }

  // Register user - Mock registration
  async register(req, res) {
    try {
      const userData = req.body;
      logger.info('Registering new user:', { email: userData.email });

      const newUser = {
        id: Math.floor(Math.random() * 1000),
        name: userData.name,
        email: userData.email,
        role: userData.role || "client",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        data: newUser,
        message: "User registered successfully"
      });
    } catch (error) {
      logger.error('Error in register:', error);
      res.status(500).json({
        success: false,
        message: "Failed to register user",
        error: error.message
      });
    }
  }

  // Login user - Mock login
  async login(req, res) {
    try {
      const { email, password } = req.body;
      logger.info('User login attempt:', { email });

      // Mock authentication
      const mockUser = {
        id: 1,
        name: "John Doe",
        email: email,
        role: "client"
      };

      const mockToken = "mock-jwt-token-" + Date.now();

      res.status(200).json({
        success: true,
        data: {
          user: mockUser,
          token: mockToken
        },
        message: "Login successful"
      });
    } catch (error) {
      logger.error('Error in login:', error);
      res.status(500).json({
        success: false,
        message: "Login failed",
        error: error.message
      });
    }
  }

  // Update user profile - Mock update
  async updateProfile(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      logger.info(`Updating user profile ${id}:`, updateData);

      const updatedUser = {
        id: parseInt(id),
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: "Profile updated successfully"
      });
    } catch (error) {
      logger.error('Error in updateProfile:', error);
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
        error: error.message
      });
    }
  }

  // Get user dashboard - Mock dashboard data
  async getDashboard(req, res) {
    try {
      const { id } = req.params;
      logger.info(`Fetching dashboard for user ${id}`);

      const mockDashboard = {
        user: {
          id: parseInt(id),
          name: "John Doe",
          email: "john@example.com",
          role: "client"
        },
        stats: {
          totalJobs: 5,
          activeJobs: 2,
          completedJobs: 3,
          totalSpent: 5000
        },
        recentActivity: [
          { id: 1, action: "Created new job", timestamp: new Date().toISOString() },
          { id: 2, action: "Updated job requirements", timestamp: new Date().toISOString() }
        ]
      };

      res.status(200).json({
        success: true,
        data: mockDashboard,
        message: "Dashboard data retrieved successfully"
      });
    } catch (error) {
      logger.error('Error in getDashboard:', error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve dashboard data",
        error: error.message
      });
    }
  }
}

module.exports = new UserController();
