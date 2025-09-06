const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../utils/logger');
const User = require('../models/User');
const redisClient = require('../config/redis');
const { AppError } = require('../middleware/errorHandler');

/**
 * Role-Based Access Control Service
 */
class RBACService {
  constructor() {
    // Singleton pattern to prevent duplicates
    if (RBACService.instance) {
      return RBACService.instance;
    }
    
    this.initialized = false;
    this.permissions = new Map();
    this.roles = new Map();
    this.cachePrefix = 'rbac:';
    
    RBACService.instance = this;
    
    // Define system permissions
    this.systemPermissions = {
      // User management
      'users:read': 'Read user information',
      'users:create': 'Create new users',
      'users:update': 'Update user information', 
      'users:delete': 'Delete users',
      'users:manage': 'Full user management',
      
      // Job management
      'jobs:read': 'Read job information',
      'jobs:create': 'Create new jobs',
      'jobs:update': 'Update job information',
      'jobs:delete': 'Delete jobs',
      'jobs:manage': 'Full job management',
      
      // Payment management
      'payments:read': 'Read payment information',
      'payments:process': 'Process payments',
      'payments:refund': 'Process refunds',
      'payments:manage': 'Full payment management',
      
      // Dispute management
      'disputes:read': 'Read dispute information',
      'disputes:create': 'Create disputes',
      'disputes:resolve': 'Resolve disputes',
      'disputes:manage': 'Full dispute management',
      
      // Analytics access
      'analytics:read': 'Read analytics data',
      'analytics:export': 'Export analytics data',
      'analytics:manage': 'Full analytics management',
      
      // System administration
      'system:config': 'Modify system configuration',
      'system:monitor': 'Monitor system health',
      'system:backup': 'Perform system backups',
      'system:admin': 'Full system administration',
      
      // Multi-signature operations
      'multisig:propose': 'Propose multi-sig transactions',
      'multisig:sign': 'Sign multi-sig transactions',
      'multisig:execute': 'Execute multi-sig transactions',
      'multisig:manage': 'Full multi-sig management',
      
      // Automation
      'automation:read': 'Read automation rules',
      'automation:create': 'Create automation rules',
      'automation:modify': 'Modify automation rules',
      'automation:manage': 'Full automation management'
    };
    
    // Define system roles
    this.systemRoles = {
      'guest': {
        name: 'Guest',
        description: 'Unauthenticated user',
        permissions: [],
        inherits: []
      },
      'user': {
        name: 'Regular User',
        description: 'Basic authenticated user',
        permissions: [
          'jobs:read', 'jobs:create', 'jobs:update',
          'payments:read', 'disputes:create'
        ],
        inherits: ['guest']
      },
      'freelancer': {
        name: 'Freelancer',
        description: 'Service provider',
        permissions: [
          'jobs:read', 'jobs:create', 'jobs:update',
          'payments:read', 'disputes:create',
          'users:read'
        ],
        inherits: ['user']
      },
      'client': {
        name: 'Client',
        description: 'Service buyer',
        permissions: [
          'jobs:read', 'jobs:create', 'jobs:update', 'jobs:delete',
          'payments:read', 'payments:process', 'disputes:create',
          'users:read'
        ],
        inherits: ['user']
      },
      'moderator': {
        name: 'Moderator',
        description: 'Platform moderator',
        permissions: [
          'jobs:read', 'jobs:manage',
          'disputes:read', 'disputes:resolve',
          'users:read', 'users:update',
          'analytics:read'
        ],
        inherits: ['user']
      },
      'admin': {
        name: 'Administrator',
        description: 'Platform administrator',
        permissions: [
          'users:manage', 'jobs:manage', 'payments:manage',
          'disputes:manage', 'analytics:manage', 'system:config',
          'system:monitor', 'multisig:manage', 'automation:manage'
        ],
        inherits: ['moderator']
      },
      'super_admin': {
        name: 'Super Administrator',
        description: 'System super administrator',
        permissions: Object.keys(this.systemPermissions),
        inherits: ['admin']
      }
    };
  }

  /**
   * Initialize RBAC service
   */
  async initialize() {
    try {
      logger.info('Initializing RBAC service...');
      
      // Load permissions and roles
      await this.loadPermissions();
      await this.loadRoles();
      
      // Create default roles if they don't exist
      await this.createDefaultRoles();
      
      this.initialized = true;
      logger.info('RBAC service initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize RBAC service:', error);
      throw new AppError('RBAC service initialization failed', 500, 'RBAC_INIT_ERROR');
    }
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(userId, permission, resource = null) {
    this._checkInitialized();
    
    try {
      // Get user with roles
      const user = await this._getUserWithRoles(userId);
      if (!user) {
        return false;
      }

      // Super admin has all permissions
      if (this._isSuperAdmin(user)) {
        return true;
      }

      // Get all user permissions (including inherited)
      const userPermissions = await this._getAllUserPermissions(user);
      
      // Check direct permission
      if (userPermissions.includes(permission)) {
        return true;
      }

      // Check resource-specific permissions
      if (resource) {
        return await this._checkResourcePermission(user, permission, resource);
      }

      return false;

    } catch (error) {
      logger.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check multiple permissions (OR logic)
   */
  async hasAnyPermission(userId, permissions, resource = null) {
    this._checkInitialized();
    
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission, resource)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check multiple permissions (AND logic)
   */
  async hasAllPermissions(userId, permissions, resource = null) {
    this._checkInitialized();
    
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission, resource))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Assign role to user
   */
  async assignRole(userId, roleName) {
    this._checkInitialized();
    
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const role = this.roles.get(roleName);
      if (!role) {
        throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
      }

      // Add role if not already assigned
      if (!user.roles.includes(roleName)) {
        user.roles.push(roleName);
        await user.save();
        
        // Clear user permissions cache
        await this._clearUserCache(userId);
        
        logger.info('Role assigned:', { userId, roleName });
      }

      return true;

    } catch (error) {
      logger.error('Error assigning role:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to assign role', 500, 'ROLE_ASSIGNMENT_ERROR');
    }
  }

  /**
   * Remove role from user
   */
  async removeRole(userId, roleName) {
    this._checkInitialized();
    
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Remove role
      user.roles = user.roles.filter(role => role !== roleName);
      await user.save();
      
      // Clear user permissions cache
      await this._clearUserCache(userId);
      
      logger.info('Role removed:', { userId, roleName });
      return true;

    } catch (error) {
      logger.error('Error removing role:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to remove role', 500, 'ROLE_REMOVAL_ERROR');
    }
  }

  /**
   * Create custom permission
   */
  async createPermission(permissionData) {
    this._checkInitialized();
    
    try {
      const { name, description, category = 'custom' } = permissionData;
      
      if (this.permissions.has(name)) {
        throw new AppError('Permission already exists', 400, 'PERMISSION_EXISTS');
      }

      const permission = {
        name,
        description,
        category,
        createdAt: new Date(),
        isCustom: true
      };

      this.permissions.set(name, permission);
      await this._persistPermission(permission);
      
      logger.info('Permission created:', { name, description });
      return permission;

    } catch (error) {
      logger.error('Error creating permission:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create permission', 500, 'PERMISSION_CREATION_ERROR');
    }
  }

  /**
   * Create custom role
   */
  async createRole(roleData) {
    this._checkInitialized();
    
    try {
      const { name, description, permissions = [], inherits = [] } = roleData;
      
      if (this.roles.has(name)) {
        throw new AppError('Role already exists', 400, 'ROLE_EXISTS');
      }

      // Validate permissions exist
      for (const permission of permissions) {
        if (!this.permissions.has(permission)) {
          throw new AppError(`Permission ${permission} does not exist`, 400, 'INVALID_PERMISSION');
        }
      }

      // Validate inherited roles exist
      for (const inheritedRole of inherits) {
        if (!this.roles.has(inheritedRole)) {
          throw new AppError(`Role ${inheritedRole} does not exist`, 400, 'INVALID_INHERITED_ROLE');
        }
      }

      const role = {
        name,
        description,
        permissions,
        inherits,
        createdAt: new Date(),
        isCustom: true
      };

      this.roles.set(name, role);
      await this._persistRole(role);
      
      logger.info('Role created:', { name, description, permissions: permissions.length });
      return role;

    } catch (error) {
      logger.error('Error creating role:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create role', 500, 'ROLE_CREATION_ERROR');
    }
  }

  /**
   * Generate access token with permissions
   */
  async generateAccessToken(userId) {
    this._checkInitialized();
    
    try {
      const user = await this._getUserWithRoles(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const permissions = await this._getAllUserPermissions(user);
      
      const tokenPayload = {
        userId: user._id,
        email: user.email,
        roles: user.roles,
        permissions,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      };

      const token = jwt.sign(tokenPayload, config.jwt.secret);
      
      // Cache token payload for quick access
      const cacheKey = `${this.cachePrefix}token:${userId}`;
      await redisClient.setex(cacheKey, 86400, JSON.stringify(tokenPayload));
      
      return token;

    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new AppError('Failed to generate access token', 500, 'TOKEN_GENERATION_ERROR');
    }
  }

  /**
   * Middleware for permission checking
   */
  requirePermission(permission, options = {}) {
    return async (req, res, next) => {
      try {
        const { allowOwner = false, resourceParam = null } = options;
        const userId = req.user?.id;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        // Check owner access if allowed
        if (allowOwner && resourceParam) {
          const resourceId = req.params[resourceParam];
          if (await this._isResourceOwner(userId, resourceParam, resourceId)) {
            return next();
          }
        }

        // Check permission
        const hasAccess = await this.hasPermission(userId, permission, req.params);
        
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions',
            required: permission
          });
        }

        next();

      } catch (error) {
        logger.error('Permission middleware error:', error);
        res.status(500).json({
          success: false,
          message: 'Permission check failed'
        });
      }
    };
  }

  /**
   * Middleware for role checking
   */
  requireRole(roles) {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    
    return async (req, res, next) => {
      try {
        const userId = req.user?.id;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        const user = await this._getUserWithRoles(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        // Check if user has any of the required roles
        const hasRole = roleArray.some(role => user.roles.includes(role));
        
        if (!hasRole) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient role',
            required: roleArray
          });
        }

        next();

      } catch (error) {
        logger.error('Role middleware error:', error);
        res.status(500).json({
          success: false,
          message: 'Role check failed'
        });
      }
    };
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId) {
    this._checkInitialized();
    
    try {
      const user = await this._getUserWithRoles(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const permissions = await this._getAllUserPermissions(user);
      
      return {
        userId,
        roles: user.roles,
        permissions,
        effectivePermissions: this._getEffectivePermissions(permissions)
      };

    } catch (error) {
      logger.error('Error getting user permissions:', error);
      throw new AppError('Failed to get user permissions', 500, 'PERMISSIONS_ERROR');
    }
  }

  /**
   * Get all roles
   */
  getAllRoles() {
    this._checkInitialized();
    
    return Array.from(this.roles.entries()).map(([name, role]) => ({
      name,
      ...role
    }));
  }

  /**
   * Get all permissions
   */
  getAllPermissions() {
    this._checkInitialized();
    
    return Array.from(this.permissions.entries()).map(([name, permission]) => ({
      name,
      ...permission
    }));
  }

  /**
   * Private helper methods
   */

  async loadPermissions() {
    // Load system permissions
    for (const [name, description] of Object.entries(this.systemPermissions)) {
      this.permissions.set(name, {
        name,
        description,
        category: 'system',
        isCustom: false
      });
    }

    // Load custom permissions from database/cache
    const customPermissions = await this._loadCustomPermissions();
    for (const permission of customPermissions) {
      this.permissions.set(permission.name, permission);
    }
  }

  async loadRoles() {
    // Load system roles
    for (const [name, role] of Object.entries(this.systemRoles)) {
      this.roles.set(name, {
        ...role,
        isCustom: false
      });
    }

    // Load custom roles from database/cache
    const customRoles = await this._loadCustomRoles();
    for (const role of customRoles) {
      this.roles.set(role.name, role);
    }
  }

  async createDefaultRoles() {
    // Ensure default roles exist in the system
    // This would create them in the database if they don't exist
  }

  async _getUserWithRoles(userId) {
    const cacheKey = `${this.cachePrefix}user:${userId}`;
    
    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get from database
    const user = await User.findById(userId).select('email roles createdAt');
    if (user) {
      // Cache for 30 minutes
      await redisClient.setex(cacheKey, 1800, JSON.stringify(user));
    }
    
    return user;
  }

  async _getAllUserPermissions(user) {
    const cacheKey = `${this.cachePrefix}permissions:${user._id}`;
    
    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const allPermissions = new Set();
    
    // Process each role
    for (const roleName of user.roles) {
      const permissions = await this._getRolePermissions(roleName);
      permissions.forEach(permission => allPermissions.add(permission));
    }

    const permissions = Array.from(allPermissions);
    
    // Cache for 15 minutes
    await redisClient.setex(cacheKey, 900, JSON.stringify(permissions));
    
    return permissions;
  }

  async _getRolePermissions(roleName, visited = new Set()) {
    if (visited.has(roleName)) {
      return []; // Prevent infinite recursion
    }
    
    visited.add(roleName);
    const role = this.roles.get(roleName);
    
    if (!role) {
      return [];
    }

    const permissions = new Set(role.permissions);
    
    // Add inherited permissions
    for (const inheritedRole of role.inherits) {
      const inheritedPermissions = await this._getRolePermissions(inheritedRole, visited);
      inheritedPermissions.forEach(permission => permissions.add(permission));
    }

    return Array.from(permissions);
  }

  _isSuperAdmin(user) {
    return user.roles.includes('super_admin');
  }

  async _checkResourcePermission(user, permission, resource) {
    // Check if user has permission for specific resource
    // This would implement resource-specific access control
    return false;
  }

  async _isResourceOwner(userId, resourceType, resourceId) {
    // Check if user owns the resource
    try {
      switch (resourceType) {
        case 'jobId':
          const job = await Job.findById(resourceId);
          return job && (job.client.toString() === userId || job.freelancer.toString() === userId);
        case 'userId':
          return resourceId === userId;
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  async _clearUserCache(userId) {
    const keys = [
      `${this.cachePrefix}user:${userId}`,
      `${this.cachePrefix}permissions:${userId}`,
      `${this.cachePrefix}token:${userId}`
    ];
    
    for (const key of keys) {
      await redisClient.del(key);
    }
  }

  _getEffectivePermissions(permissions) {
    // Group permissions by category for better organization
    const grouped = {};
    
    for (const permission of permissions) {
      const [category] = permission.split(':');
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(permission);
    }
    
    return grouped;
  }

  async _loadCustomPermissions() {
    try {
      // Load custom permissions from Redis cache first if available
      if (redisClient && redisClient.isConnected) {
        try {
          const cached = await redisClient.get(`${this.cachePrefix}custom_permissions`);
          if (cached) {
            return JSON.parse(cached);
          }
        } catch (cacheError) {
          logger.warn('Failed to get cached custom permissions:', cacheError.message);
        }
      }

      // In a production environment, this would load from database
      // For now, return empty array as custom permissions can be added dynamically
      const customPermissions = [];
      
      // Cache the result if Redis is available
      if (redisClient && redisClient.isConnected) {
        try {
          await redisClient.setex(`${this.cachePrefix}custom_permissions`, 3600, JSON.stringify(customPermissions));
        } catch (cacheError) {
          logger.warn('Failed to cache custom permissions:', cacheError.message);
        }
      }
      
      return customPermissions;
    } catch (error) {
      logger.error('Error loading custom permissions:', error);
      return [];
    }
  }

  async _loadCustomRoles() {
    try {
      // Load custom roles from Redis cache first if available
      if (redisClient && redisClient.isConnected) {
        try {
          const cached = await redisClient.get(`${this.cachePrefix}custom_roles`);
          if (cached) {
            return JSON.parse(cached);
          }
        } catch (cacheError) {
          logger.warn('Failed to get cached custom roles:', cacheError.message);
        }
      }

      // In a production environment, this would load from database
      // For now, return empty array as custom roles can be added dynamically
      const customRoles = [];
      
      // Cache the result if Redis is available
      if (redisClient && redisClient.isConnected) {
        try {
          await redisClient.setex(`${this.cachePrefix}custom_roles`, 3600, JSON.stringify(customRoles));
        } catch (cacheError) {
          logger.warn('Failed to cache custom roles:', cacheError.message);
        }
      }
      
      return customRoles;
    } catch (error) {
      logger.error('Error loading custom roles:', error);
      return [];
    }
  }

  async _persistPermission(permission) {
    // Save permission to database
    const key = `${this.cachePrefix}permission:${permission.name}`;
    await redisClient.setex(key, 86400, JSON.stringify(permission));
  }

  async _persistRole(role) {
    // Save role to database
    const key = `${this.cachePrefix}role:${role.name}`;
    await redisClient.setex(key, 86400, JSON.stringify(role));
  }

  _checkInitialized() {
    if (!this.initialized) {
      throw new AppError('RBAC service not initialized', 500, 'RBAC_NOT_INITIALIZED');
    }
  }
}

module.exports = RBACService;
