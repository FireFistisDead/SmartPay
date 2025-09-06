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
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const BlockchainEventListener = require('./services/blockchainEventListener');

// Import routes
const jobRoutes = require('./routes/jobRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const ipfsRoutes = require('./routes/ipfsRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

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
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupSocketIO();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMaxRequests,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

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
        uptime: process.uptime()
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
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });

      socket.on('joinJob', (jobId) => {
        socket.join(`job_${jobId}`);
        logger.info(`Socket ${socket.id} joined job room: job_${jobId}`);
      });

      socket.on('leaveJob', (jobId) => {
        socket.leave(`job_${jobId}`);
        logger.info(`Socket ${socket.id} left job room: job_${jobId}`);
      });
    });

    // Make io available globally
    global.io = this.io;
  }

  async start() {
    try {
      // Connect to database
      await connectDB();
      logger.info('Database connected successfully');

      // Start blockchain event listener
      const eventListener = new BlockchainEventListener();
      await eventListener.start();
      logger.info('Blockchain event listener started');

      // Start server
      this.server.listen(this.port, () => {
        logger.info(`Server is running on port ${this.port} in ${process.env.NODE_ENV} mode`);
        logger.info(`Health check available at http://localhost:${this.port}/health`);
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async gracefulShutdown() {
    logger.info('Graceful shutdown initiated...');
    
    this.server.close(() => {
      logger.info('HTTP server closed');
      
      // Close database connections
      if (global.mongoose && global.mongoose.connection) {
        global.mongoose.connection.close();
        logger.info('Database connection closed');
      }

      // Close Redis connection
      if (global.redis) {
        global.redis.quit();
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
