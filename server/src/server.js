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
const serviceManager = require('./services/ServiceManager');
const BlockchainEventListener = require('./services/blockchainEventListener');
const SecurityService = require('./services/securityService');

// Phase 5 services - temporarily commented out
// const AdvancedErrorHandlingService = require('./services/advancedErrorHandlingService');
// const ComprehensiveMonitoringService = require('./services/comprehensiveMonitoringService');
// const RealTimeAlertingService = require('./services/realTimeAlertingService');
// const PerformanceAnalyticsService = require('./services/performanceAnalyticsService');
// const OperationalDashboardService = require('./services/operationalDashboardService');

// Import routes
const jobRoutes = require('./routes/jobRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const ipfsRoutes = require('./routes/ipfsRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const advancedRoutes = require('./routes/advancedRoutes');
// const phase4Routes = require('./routes/phase4Routes'); // Temporarily commented out
// const phase5Routes = require('./routes/phase5Routes'); // Temporarily commented out

class Server {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketServer(this.server, {
      cors: {
        origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5000"],
        methods: ["GET", "POST"],
        credentials: true
      }
    });
    this.port = config.port;
    
    // Services will be initialized through ServiceManager
    this.webSocketService = null;
    this.securityService = new SecurityService();
    
    // Initialize Phase 5 services - temporarily commented out
    // this.errorHandlingService = new AdvancedErrorHandlingService();
    // this.monitoringService = new ComprehensiveMonitoringService();
    // this.alertingService = new RealTimeAlertingService();
    // this.performanceService = new PerformanceAnalyticsService();
    // this.dashboardService = new OperationalDashboardService();
    
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
      origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5000"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
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

    // API documentation endpoint
    this.app.get('/api', (req, res) => {
      res.status(200).json({
        name: 'SmartPay Freelance Escrow API',
        version: '1.0.0',
        description: 'Decentralized freelance work platform API',
        endpoints: {
          '/health': 'Server health check',
          '/api': 'This documentation',
          '/api/users': 'User management endpoints',
          '/api/jobs': 'Job management endpoints',
          '/api/milestones': 'Milestone management endpoints',
          '/api/payments': 'Payment processing endpoints',
          '/api/disputes': 'Dispute resolution endpoints',
          '/api/ipfs': 'IPFS file storage endpoints',
          '/api/analytics': 'Platform analytics endpoints',
          '/api/advanced': 'Advanced features (multi-sig, automation, RBAC)',
        },
        examples: {
          'GET /api/users': 'List all users',
          'GET /api/jobs': 'List all jobs',
          'GET /api/analytics/platform': 'Get platform statistics',
          'GET /api/advanced/health': 'Advanced features health check',
        },
        authentication: 'Most endpoints require Bearer token authentication',
        documentation: 'Visit the endpoints for detailed API documentation'
      });
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.status(200).json({
        message: 'Welcome to SmartPay Freelance Escrow API',
        version: '1.0.0',
        status: 'Server is running',
        documentation: '/api',
        health: '/health',
        timestamp: new Date().toISOString()
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
    // this.app.use('/api/phase4', phase4Routes); // Temporarily commented out
    // this.app.use('/api/phase5', phase5Routes); // Temporarily commented out

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
      // In development, don't shut down for unhandled rejections
      if (config.nodeEnv === 'production') {
        this.gracefulShutdown();
      }
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      // Always shut down for uncaught exceptions as they can leave the process in an undefined state
      this.gracefulShutdown();
    });
  }

  async setupSocketIO() {
    // Initialize WebSocket service through ServiceManager
    this.webSocketService = await serviceManager.initializeWebSocketService(this.server);
    
    logger.info('Advanced WebSocket service configured');
  }

  async initializePhase5Services() {
    try {
      // Skip Phase 5 services if they're not initialized (temporarily disabled)
      if (!this.errorHandlingService || !this.monitoringService || !this.alertingService || 
          !this.performanceService || !this.dashboardService) {
        logger.info('Phase 5 services disabled - skipping initialization');
        return;
      }

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

      // Initialize core services through ServiceManager
      await serviceManager.initializeCoreServices();

      // Initialize WebSocket service
      await this.setupSocketIO();

      // Start blockchain event listener
      const eventListener = new BlockchainEventListener();
      await eventListener.start();
      logger.info('Blockchain event listener started');

      // Initialize advanced services
      await serviceManager.initializeAdvancedServices();

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
