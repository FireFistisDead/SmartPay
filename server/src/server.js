const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { Server: SocketServer } = require('socket.io');
const http = require('http');
require('dotenv').config();

const config = require('./config/config');
const connectDB = require('./config/database');
const redisClient = require('./config/redis');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const BlockchainEventListener = require('./services/blockchainEventListener');
const WebSocketService = require('./services/webSocketService');
const SecurityService = require('./services/securityService');

// Phase 5 services
const AdvancedErrorHandlingService = require('./services/advancedErrorHandlingService');
const ComprehensiveMonitoringService = require('./services/comprehensiveMonitoringService');
const RealTimeAlertingService = require('./services/realTimeAlertingService');
const PerformanceAnalyticsService = require('./services/performanceAnalyticsService');
const OperationalDashboardService = require('./services/operationalDashboardService');

// Import routes
const jobRoutes = require('./routes/jobRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const ipfsRoutes = require('./routes/ipfsRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const advancedRoutes = require('./routes/advancedRoutes');
const phase4Routes = require('./routes/phase4Routes');
const phase5Routes = require('./routes/phase5Routes');

class Server {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketServer(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    this.port = config.port;
    
    // Initialize advanced services
    this.webSocketService = new WebSocketService();
    this.securityService = new SecurityService();
    
    // Initialize Phase 5 services
    this.errorHandlingService = new AdvancedErrorHandlingService();
    this.monitoringService = new ComprehensiveMonitoringService();
    this.alertingService = new RealTimeAlertingService();
    this.performanceService = new PerformanceAnalyticsService();
    this.dashboardService = new OperationalDashboardService();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupSocketIO();
  }

  setupMiddleware() {
    // Apply advanced security middleware
    this.app.use(...this.securityService.getSecurityMiddleware());
    
    // CORS
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true
    }));

    // Enhanced rate limiting with security service
    const advancedLimiter = this.securityService.createRateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMaxRequests,
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use('/api/', advancedLimiter);

    // Body parsing and compression
    this.app.use(compression());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Logging
    this.app.use(morgan('combined', {
      stream: { write: message => logger.info(message.trim()) }
    }));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        uptime: process.uptime(),
        services: {
          websocket: this.webSocketService.initialized,
          security: true
        }
      });
    });
  }

  setupRoutes() {
    // API routes
    this.app.use('/api/jobs', jobRoutes);
    this.app.use('/api/milestones', milestoneRoutes);
    this.app.use('/api/ipfs', ipfsRoutes);
    this.app.use('/api/disputes', disputeRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/analytics', analyticsRoutes);
    this.app.use('/api/payments', paymentRoutes);
    this.app.use('/api/advanced', advancedRoutes);
    this.app.use('/api/phase4', phase4Routes);
    this.app.use('/api/phase5', phase5Routes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: `Cannot ${req.method} ${req.originalUrl}`
      });
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);

    // Graceful shutdown
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown();
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.gracefulShutdown();
    });
  }

  setupSocketIO() {
    // Initialize advanced WebSocket service
    this.webSocketService.initialize(this.server);
    
    // Make WebSocket service available globally
    global.webSocketService = this.webSocketService;
    
    logger.info('Advanced WebSocket service configured');
  }

  async initializePhase5Services() {
    try {
      // Initialize error handling service
      await this.errorHandlingService.initialize();
      
      // Initialize monitoring service
      await this.monitoringService.initialize();
      
      // Initialize alerting service
      await this.alertingService.initialize();
      
      // Initialize performance analytics service
      await this.performanceService.initialize();
      
      // Initialize dashboard service with all other services
      await this.dashboardService.initialize({
        errorHandlingService: this.errorHandlingService,
        monitoringService: this.monitoringService,
        alertingService: this.alertingService,
        performanceService: this.performanceService
      });

      // Make services available globally for controllers
      global.phase5Services = {
        errorHandling: this.errorHandlingService,
        monitoring: this.monitoringService,
        alerting: this.alertingService,
        performance: this.performanceService,
        dashboard: this.dashboardService
      };

      // Start monitoring processes
      this.monitoringService.startMonitoring();
      this.performanceService.startAnalytics();

      logger.info('All Phase 5 services initialized and running');
    } catch (error) {
      logger.error('Failed to initialize Phase 5 services:', error);
      throw error;
    }
  }

  async start() {
    try {
      // Connect to database
      await connectDB();
      logger.info('Database connected successfully');

      // Connect to Redis
      await redisClient.connect();
      logger.info('Redis connected successfully');

      // Start blockchain event listener
      const eventListener = new BlockchainEventListener();
      await eventListener.start();
      logger.info('Blockchain event listener started');

      // Initialize Phase 5 services
      await this.initializePhase5Services();
      logger.info('Phase 5 services initialized successfully');

      // Start server
      this.server.listen(this.port, () => {
        logger.info(`Server is running on port ${this.port} in ${process.env.NODE_ENV} mode`);
        logger.info(`Health check available at http://localhost:${this.port}/health`);
        logger.info(`Phase 5 monitoring dashboard available at http://localhost:${this.port}/api/phase5/dashboard`);
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async gracefulShutdown() {
    logger.info('Graceful shutdown initiated...');
    
    this.server.close(async () => {
      logger.info('HTTP server closed');
      
      // Close database connections
      if (global.mongoose && global.mongoose.connection) {
        global.mongoose.connection.close();
        logger.info('Database connection closed');
      }

      // Close Redis connection
      if (redisClient && redisClient.isConnected) {
        await redisClient.disconnect();
        logger.info('Redis connection closed');
      }

      logger.info('Graceful shutdown completed');
      process.exit(0);
    });
  }
}

// Start server
const server = new Server();
server.start().catch(error => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});

module.exports = server;
