const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');
const { AppError } = require('../middleware/errorHandler');

/**
 * WebSocket Real-time Service - Handles real-time communication
 */
class WebSocketService {
  constructor() {
    // Singleton pattern to prevent duplicates
    if (WebSocketService.instance) {
      return WebSocketService.instance;
    }
    
    this.io = null;
    this.initialized = false;
    this.connectedUsers = new Map();
    this.userSockets = new Map();
    this.roomSubscriptions = new Map();
    this.rbacService = null; // Will be set via ServiceManager
    
    WebSocketService.instance = this;
    
    // Event types
    this.events = {
      // Job events
      JOB_CREATED: 'job:created',
      JOB_UPDATED: 'job:updated',
      JOB_COMPLETED: 'job:completed',
      JOB_CANCELLED: 'job:cancelled',
      
      // Milestone events
      MILESTONE_CREATED: 'milestone:created',
      MILESTONE_COMPLETED: 'milestone:completed',
      MILESTONE_APPROVED: 'milestone:approved',
      
      // Payment events
      PAYMENT_INITIATED: 'payment:initiated',
      PAYMENT_COMPLETED: 'payment:completed',
      PAYMENT_FAILED: 'payment:failed',
      PAYMENT_RELEASED: 'payment:released',
      
      // Communication events
      MESSAGE_SENT: 'message:sent',
      MESSAGE_READ: 'message:read',
      TYPING_START: 'typing:start',
      TYPING_STOP: 'typing:stop',
      
      // Notification events
      NOTIFICATION_NEW: 'notification:new',
      NOTIFICATION_READ: 'notification:read',
      
      // Dispute events
      DISPUTE_CREATED: 'dispute:created',
      DISPUTE_UPDATED: 'dispute:updated',
      DISPUTE_RESOLVED: 'dispute:resolved',
      
      // Multi-sig events
      MULTISIG_PROPOSAL: 'multisig:proposal',
      MULTISIG_SIGNED: 'multisig:signed',
      MULTISIG_EXECUTED: 'multisig:executed',
      
      // System events
      SYSTEM_MAINTENANCE: 'system:maintenance',
      SYSTEM_ALERT: 'system:alert',
      
      // Analytics events
      ANALYTICS_UPDATE: 'analytics:update',
      REALTIME_METRICS: 'realtime:metrics'
    };
    
    // Room types
    this.roomTypes = {
      USER: 'user',
      JOB: 'job',
      GLOBAL: 'global',
      ADMIN: 'admin',
      ANALYTICS: 'analytics'
    };
  }

  /**
   * Initialize WebSocket service
   */
  initialize(server) {
    try {
      logger.info('Initializing WebSocket service...');
      
      // Initialize Socket.IO
      this.io = socketIO(server, {
        cors: {
          origin: config.cors.origin,
          methods: ['GET', 'POST'],
          credentials: true
        },
        transports: ['websocket', 'polling']
      });

      // Get RBAC service from ServiceManager
      try {
        const serviceManager = require('./ServiceManager');
        if (serviceManager.hasService('RBACService')) {
          this.rbacService = serviceManager.getExistingService('RBACService');
        }
      } catch (error) {
        logger.warn('ServiceManager not available for WebSocket RBAC:', error.message);
      }
      
      // Setup authentication middleware
      this.setupAuthentication();
      
      // Setup connection handling
      this.setupConnectionHandling();
      
      // Setup event handlers
      this.setupEventHandlers();
      
      // Start periodic tasks
      this.startPeriodicTasks();
      
      this.initialized = true;
      logger.info('WebSocket service initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize WebSocket service:', error);
      throw new AppError('WebSocket service initialization failed', 500, 'WEBSOCKET_INIT_ERROR');
    }
  }

  /**
   * Setup authentication middleware
   */
  setupAuthentication() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, config.jwt.secret);
        const userId = decoded.userId;
        
        // Verify user permissions
        const hasPermission = await this.rbacService.hasPermission(userId, 'users:read');
        if (!hasPermission) {
          return next(new Error('Insufficient permissions'));
        }

        // Attach user info to socket
        socket.userId = userId;
        socket.userRoles = decoded.roles || [];
        socket.userPermissions = decoded.permissions || [];
        
        next();

      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup connection handling
   */
  setupConnectionHandling() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new connection
   */
  async handleConnection(socket) {
    try {
      const userId = socket.userId;
      
      // Store connection info
      this.connectedUsers.set(userId, {
        socketId: socket.id,
        connectedAt: new Date(),
        lastActivity: new Date(),
        rooms: new Set()
      });

      // Store socket reference
      this.userSockets.set(socket.id, socket);
      
      // Join user-specific room
      await this.joinRoom(socket, this.roomTypes.USER, userId);
      
      // Join global room for all users
      await this.joinRoom(socket, this.roomTypes.GLOBAL, 'all');
      
      // Join role-based rooms
      for (const role of socket.userRoles) {
        await this.joinRoom(socket, 'role', role);
      }

      logger.info('User connected:', {
        userId,
        socketId: socket.id,
        roles: socket.userRoles
      });

      // Setup event handlers for this socket
      this.setupSocketEventHandlers(socket);
      
      // Emit connection success
      socket.emit('connected', {
        userId,
        timestamp: new Date(),
        rooms: Array.from(this.connectedUsers.get(userId).rooms)
      });

      // Notify others about user online status
      this.broadcastUserStatus(userId, 'online');

    } catch (error) {
      logger.error('Error handling connection:', error);
      socket.disconnect();
    }
  }

  /**
   * Setup event handlers for individual socket
   */
  setupSocketEventHandlers(socket) {
    const userId = socket.userId;
    
    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Handle room join requests
    socket.on('join_room', async (data) => {
      try {
        await this.handleJoinRoom(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room', error: error.message });
      }
    });

    // Handle room leave requests
    socket.on('leave_room', async (data) => {
      try {
        await this.handleLeaveRoom(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to leave room', error: error.message });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('typing_stop', (data) => {
      this.handleTypingStop(socket, data);
    });

    // Handle message sending
    socket.on('send_message', async (data) => {
      try {
        await this.handleSendMessage(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message', error: error.message });
      }
    });

    // Handle notification acknowledgment
    socket.on('notification_read', async (data) => {
      try {
        await this.handleNotificationRead(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to mark notification as read', error: error.message });
      }
    });

    // Handle subscription to analytics updates
    socket.on('subscribe_analytics', async (data) => {
      try {
        await this.handleAnalyticsSubscription(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to subscribe to analytics', error: error.message });
      }
    });

    // Update last activity
    socket.on('activity', () => {
      this.updateUserActivity(userId);
    });
  }

  /**
   * Handle disconnection
   */
  handleDisconnection(socket) {
    const userId = socket.userId;
    
    // Remove from connected users
    this.connectedUsers.delete(userId);
    this.userSockets.delete(socket.id);
    
    // Clean up room subscriptions
    this.cleanupUserRooms(userId);
    
    logger.info('User disconnected:', {
      userId,
      socketId: socket.id
    });

    // Notify others about user offline status
    this.broadcastUserStatus(userId, 'offline');
  }

  /**
   * Join a room
   */
  async joinRoom(socket, roomType, roomId) {
    const roomName = `${roomType}:${roomId}`;
    
    // Check permissions for room access
    if (!(await this.checkRoomPermission(socket, roomType, roomId))) {
      throw new AppError('Insufficient permissions to join room', 403, 'ROOM_PERMISSION_DENIED');
    }

    await socket.join(roomName);
    
    // Track room subscription
    const userId = socket.userId;
    const userInfo = this.connectedUsers.get(userId);
    if (userInfo) {
      userInfo.rooms.add(roomName);
    }

    logger.debug('User joined room:', {
      userId,
      roomName
    });
  }

  /**
   * Leave a room
   */
  async leaveRoom(socket, roomType, roomId) {
    const roomName = `${roomType}:${roomId}`;
    
    await socket.leave(roomName);
    
    // Remove from room subscriptions
    const userId = socket.userId;
    const userInfo = this.connectedUsers.get(userId);
    if (userInfo) {
      userInfo.rooms.delete(roomName);
    }

    logger.debug('User left room:', {
      userId,
      roomName
    });
  }

  /**
   * Broadcast event to specific room
   */
  async broadcastToRoom(roomType, roomId, event, data) {
    this._checkInitialized();
    
    const roomName = `${roomType}:${roomId}`;
    
    this.io.to(roomName).emit(event, {
      ...data,
      timestamp: new Date(),
      room: roomName
    });

    logger.debug('Event broadcasted to room:', {
      roomName,
      event,
      dataKeys: Object.keys(data)
    });
  }

  /**
   * Send event to specific user
   */
  async sendToUser(userId, event, data) {
    this._checkInitialized();
    
    const roomName = `${this.roomTypes.USER}:${userId}`;
    
    this.io.to(roomName).emit(event, {
      ...data,
      timestamp: new Date()
    });

    logger.debug('Event sent to user:', {
      userId,
      event,
      dataKeys: Object.keys(data)
    });
  }

  /**
   * Broadcast event globally
   */
  async broadcastGlobal(event, data) {
    this._checkInitialized();
    
    this.io.emit(event, {
      ...data,
      timestamp: new Date()
    });

    logger.debug('Event broadcasted globally:', {
      event,
      dataKeys: Object.keys(data)
    });
  }

  /**
   * Job-related event handlers
   */
  async emitJobCreated(jobData) {
    await this.broadcastToRoom(this.roomTypes.GLOBAL, 'all', this.events.JOB_CREATED, jobData);
    
    // Notify client and freelancer specifically
    if (jobData.client) {
      await this.sendToUser(jobData.client, this.events.JOB_CREATED, jobData);
    }
  }

  async emitJobUpdated(jobData) {
    await this.broadcastToRoom(this.roomTypes.JOB, jobData._id, this.events.JOB_UPDATED, jobData);
    
    // Notify stakeholders
    const stakeholders = [jobData.client, jobData.freelancer].filter(Boolean);
    for (const userId of stakeholders) {
      await this.sendToUser(userId, this.events.JOB_UPDATED, jobData);
    }
  }

  async emitJobCompleted(jobData) {
    await this.broadcastToRoom(this.roomTypes.JOB, jobData._id, this.events.JOB_COMPLETED, jobData);
    
    // Notify stakeholders
    const stakeholders = [jobData.client, jobData.freelancer].filter(Boolean);
    for (const userId of stakeholders) {
      await this.sendToUser(userId, this.events.JOB_COMPLETED, jobData);
    }
  }

  /**
   * Payment-related event handlers
   */
  async emitPaymentInitiated(paymentData) {
    const { jobId, client, freelancer } = paymentData;
    
    await this.broadcastToRoom(this.roomTypes.JOB, jobId, this.events.PAYMENT_INITIATED, paymentData);
    
    // Notify stakeholders
    if (client) await this.sendToUser(client, this.events.PAYMENT_INITIATED, paymentData);
    if (freelancer) await this.sendToUser(freelancer, this.events.PAYMENT_INITIATED, paymentData);
  }

  async emitPaymentCompleted(paymentData) {
    const { jobId, client, freelancer } = paymentData;
    
    await this.broadcastToRoom(this.roomTypes.JOB, jobId, this.events.PAYMENT_COMPLETED, paymentData);
    
    // Notify stakeholders
    if (client) await this.sendToUser(client, this.events.PAYMENT_COMPLETED, paymentData);
    if (freelancer) await this.sendToUser(freelancer, this.events.PAYMENT_COMPLETED, paymentData);
  }

  /**
   * Multi-sig event handlers
   */
  async emitMultiSigProposal(proposalData) {
    const { jobId } = proposalData;
    
    await this.broadcastToRoom(this.roomTypes.JOB, jobId, this.events.MULTISIG_PROPOSAL, proposalData);
    
    // Notify admins
    await this.broadcastToRoom('role', 'admin', this.events.MULTISIG_PROPOSAL, proposalData);
  }

  async emitMultiSigSigned(signatureData) {
    const { proposalId, jobId } = signatureData;
    
    await this.broadcastToRoom(this.roomTypes.JOB, jobId, this.events.MULTISIG_SIGNED, signatureData);
    
    // Notify admins
    await this.broadcastToRoom('role', 'admin', this.events.MULTISIG_SIGNED, signatureData);
  }

  /**
   * Real-time analytics
   */
  async emitAnalyticsUpdate(analyticsData) {
    // Send to analytics subscribers only
    await this.broadcastToRoom(this.roomTypes.ANALYTICS, 'updates', this.events.ANALYTICS_UPDATE, analyticsData);
  }

  async emitRealTimeMetrics(metricsData) {
    // Send to admin and analytics rooms
    await this.broadcastToRoom(this.roomTypes.ADMIN, 'all', this.events.REALTIME_METRICS, metricsData);
    await this.broadcastToRoom(this.roomTypes.ANALYTICS, 'updates', this.events.REALTIME_METRICS, metricsData);
  }

  /**
   * System notifications
   */
  async emitSystemAlert(alertData) {
    await this.broadcastGlobal(this.events.SYSTEM_ALERT, alertData);
  }

  async emitMaintenanceNotice(maintenanceData) {
    await this.broadcastGlobal(this.events.SYSTEM_MAINTENANCE, maintenanceData);
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get user connection status
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get room members count
   */
  getRoomMembersCount(roomType, roomId) {
    const roomName = `${roomType}:${roomId}`;
    const room = this.io.sockets.adapter.rooms.get(roomName);
    return room ? room.size : 0;
  }

  /**
   * Private helper methods
   */

  async handleJoinRoom(socket, data) {
    const { roomType, roomId } = data;
    await this.joinRoom(socket, roomType, roomId);
    
    socket.emit('room_joined', {
      roomType,
      roomId,
      timestamp: new Date()
    });
  }

  async handleLeaveRoom(socket, data) {
    const { roomType, roomId } = data;
    await this.leaveRoom(socket, roomType, roomId);
    
    socket.emit('room_left', {
      roomType,
      roomId,
      timestamp: new Date()
    });
  }

  handleTypingStart(socket, data) {
    const { roomType, roomId } = data;
    const roomName = `${roomType}:${roomId}`;
    
    socket.to(roomName).emit(this.events.TYPING_START, {
      userId: socket.userId,
      roomType,
      roomId,
      timestamp: new Date()
    });
  }

  handleTypingStop(socket, data) {
    const { roomType, roomId } = data;
    const roomName = `${roomType}:${roomId}`;
    
    socket.to(roomName).emit(this.events.TYPING_STOP, {
      userId: socket.userId,
      roomType,
      roomId,
      timestamp: new Date()
    });
  }

  async handleSendMessage(socket, data) {
    const { roomType, roomId, message } = data;
    
    // Validate message
    if (!message || !message.trim()) {
      throw new AppError('Message cannot be empty', 400, 'EMPTY_MESSAGE');
    }

    // Check permissions
    if (!(await this.checkRoomPermission(socket, roomType, roomId))) {
      throw new AppError('Insufficient permissions to send message', 403, 'MESSAGE_PERMISSION_DENIED');
    }

    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: socket.userId,
      message: message.trim(),
      roomType,
      roomId,
      timestamp: new Date()
    };

    // Broadcast to room
    const roomName = `${roomType}:${roomId}`;
    this.io.to(roomName).emit(this.events.MESSAGE_SENT, messageData);
    
    // Store message (implementation would save to database)
    await this.storeMessage(messageData);
  }

  async handleNotificationRead(socket, data) {
    const { notificationId } = data;
    
    // Mark notification as read (implementation would update database)
    await this.markNotificationAsRead(socket.userId, notificationId);
    
    socket.emit(this.events.NOTIFICATION_READ, {
      notificationId,
      timestamp: new Date()
    });
  }

  async handleAnalyticsSubscription(socket, data) {
    const { subscribe } = data;
    
    // Check analytics permission
    const hasPermission = await this.rbacService.hasPermission(socket.userId, 'analytics:read');
    if (!hasPermission) {
      throw new AppError('Insufficient permissions for analytics', 403, 'ANALYTICS_PERMISSION_DENIED');
    }

    if (subscribe) {
      await this.joinRoom(socket, this.roomTypes.ANALYTICS, 'updates');
    } else {
      await this.leaveRoom(socket, this.roomTypes.ANALYTICS, 'updates');
    }
    
    socket.emit('analytics_subscription', {
      subscribed: subscribe,
      timestamp: new Date()
    });
  }

  async checkRoomPermission(socket, roomType, roomId) {
    const userId = socket.userId;
    
    switch (roomType) {
      case this.roomTypes.USER:
        return roomId === userId; // Users can only join their own room
        
      case this.roomTypes.JOB:
        // Check if user is involved in the job
        return await this.isUserInvolvedInJob(userId, roomId);
        
      case this.roomTypes.ADMIN:
        return socket.userRoles.includes('admin') || socket.userRoles.includes('super_admin');
        
      case this.roomTypes.ANALYTICS:
        return await this.rbacService.hasPermission(userId, 'analytics:read');
        
      case this.roomTypes.GLOBAL:
        return true; // All authenticated users can join global rooms
        
      default:
        return false;
    }
  }

  async isUserInvolvedInJob(userId, jobId) {
    try {
      const Job = require('../models/Job');
      const job = await Job.findOne({ jobId: parseInt(jobId) });
      
      if (!job) return false;
      
      const userAddress = userId.toLowerCase();
      return (
        job.client.toLowerCase() === userAddress ||
        job.freelancer?.toLowerCase() === userAddress ||
        job.arbiter.toLowerCase() === userAddress
      );
    } catch (error) {
      logger.error('Error checking user job involvement:', error);
      return false;
    }
  }

  broadcastUserStatus(userId, status) {
    this.io.emit('user_status', {
      userId,
      status,
      timestamp: new Date()
    });
  }

  updateUserActivity(userId) {
    const userInfo = this.connectedUsers.get(userId);
    if (userInfo) {
      userInfo.lastActivity = new Date();
    }
  }

  cleanupUserRooms(userId) {
    // Remove user from room subscriptions
    for (const [roomName, subscribers] of this.roomSubscriptions.entries()) {
      subscribers.delete(userId);
      if (subscribers.size === 0) {
        this.roomSubscriptions.delete(roomName);
      }
    }
  }

  async storeMessage(messageData) {
    try {
      // Store message in Redis for chat history
      const messageKey = `chat:${messageData.room}:${Date.now()}`;
      
      if (global.redis) {
        await global.redis.setEx(messageKey, 86400, JSON.stringify({ // 24 hour TTL
          id: messageKey,
          userId: messageData.userId,
          content: messageData.content,
          timestamp: new Date(),
          room: messageData.room,
          type: messageData.type || 'message'
        }));
        
        // Add to room message list
        const roomMessagesKey = `chat:${messageData.room}:messages`;
        await global.redis.lPush(roomMessagesKey, messageKey);
        await global.redis.lTrim(roomMessagesKey, 0, 99); // Keep last 100 messages
        await global.redis.expire(roomMessagesKey, 86400);
      }
      
      logger.debug('Message stored:', messageData);
    } catch (error) {
      logger.error('Error storing message:', error);
    }
  }

  async markNotificationAsRead(userId, notificationId) {
    try {
      if (global.redis) {
        const notificationKey = `notification:${userId}:${notificationId}`;
        const notification = await global.redis.get(notificationKey);
        
        if (notification) {
          const notificationData = JSON.parse(notification);
          notificationData.read = true;
          notificationData.readAt = new Date();
          
          await global.redis.setEx(notificationKey, 86400, JSON.stringify(notificationData));
          
          // Emit read confirmation
          const socket = this.getUserSocket(userId);
          if (socket) {
            socket.emit('notification_read', { notificationId, readAt: notificationData.readAt });
          }
        }
      }
      
      logger.debug('Notification marked as read:', { userId, notificationId });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  }

  startPeriodicTasks() {
    // Send periodic analytics updates
    setInterval(async () => {
      if (this.getRoomMembersCount(this.roomTypes.ANALYTICS, 'updates') > 0) {
        const metrics = {
          connectedUsers: this.getConnectedUsersCount(),
          activeRooms: this.io.sockets.adapter.rooms.size,
          timestamp: new Date()
        };
        
        await this.emitRealTimeMetrics(metrics);
      }
    }, 30000); // Every 30 seconds

    // Clean up inactive connections
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 300000); // Every 5 minutes
  }

  cleanupInactiveConnections() {
    const now = new Date();
    const inactivityThreshold = 10 * 60 * 1000; // 10 minutes
    
    for (const [userId, userInfo] of this.connectedUsers.entries()) {
      if (now - userInfo.lastActivity > inactivityThreshold) {
        const socket = this.userSockets.get(userInfo.socketId);
        if (socket) {
          socket.disconnect();
        }
      }
    }
  }

  setupEventHandlers() {
    // Setup handlers for external events that should be broadcasted
    // This would typically be called by other services
  }

  _checkInitialized() {
    if (!this.initialized) {
      throw new AppError('WebSocket service not initialized', 500, 'WEBSOCKET_NOT_INITIALIZED');
    }
  }
}

module.exports = WebSocketService;
