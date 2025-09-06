const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
require('dotenv').config();

const config = require('./config/config');
const logger = require('./utils/logger');

// Import basic routes only (no problematic routes)
const jobRoutes = require('./routes/jobRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const userRoutes = require('./routes/userRoutes');

class Server {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = config.port;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Basic security
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true
    }));

    // Basic rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
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
        port: this.port,
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      });
    });

    // Basic info endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'SmartPay API Server',
        version: '1.0.0',
        status: 'Running',
        port: this.port,
        endpoints: {
          health: '/health',
          jobs: '/api/jobs',
          milestones: '/api/milestones',
          users: '/api/users'
        }
      });
    });
  }

  setupRoutes() {
    // API routes
    this.app.use('/api/jobs', jobRoutes);
    this.app.use('/api/milestones', milestoneRoutes);
    this.app.use('/api/users', userRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        availableRoutes: ['/health', '/api/jobs', '/api/milestones', '/api/users']
      });
    });
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error:', error);
      
      res.status(error.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  }

  async start() {
    try {
      // Try to connect to database (optional)
      try {
        const connectDB = require('./config/database');
        await connectDB();
        logger.info('Database connected successfully');
      } catch (dbError) {
        logger.warn('Database connection failed, continuing without DB:', dbError.message);
      }

      // Start server
      this.server.listen(this.port, () => {
        logger.info(`🚀 SmartPay Server is running on port ${this.port}`);
        logger.info(`📍 Health check: http://localhost:${this.port}/health`);
        logger.info(`🌐 API Base URL: http://localhost:${this.port}/api`);
        logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('\n' + '='.repeat(50));
        console.log('🎉 SmartPay Server Started Successfully!');
        console.log('='.repeat(50));
        console.log(`📡 Server: http://localhost:${this.port}`);
        console.log(`💊 Health: http://localhost:${this.port}/health`);
        console.log(`📋 Jobs API: http://localhost:${this.port}/api/jobs`);
        console.log(`👥 Users API: http://localhost:${this.port}/api/users`);
        console.log('='.repeat(50));
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.gracefulShutdown());
      process.on('SIGINT', () => this.gracefulShutdown());

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  gracefulShutdown() {
    logger.info('Received shutdown signal, shutting down gracefully...');
    this.server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  }
}

// Create and start server
const server = new Server();
server.start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = server;
