const path = require('path');

const config = {
  // Server Configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://bhav:Y%40sh1234@smartpay.jbzwr4r.mongodb.net/?retryWrites=true&w=majority&appName=SmartPay',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    options: {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    }
  },

  // Security Configuration
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || '32-byte-encryption-key-here-12345',
    hashRounds: parseInt(process.env.HASH_ROUNDS) || 12,
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 86400000, // 24 hours
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 900000, // 15 minutes
    rateLimiting: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',
    }
  },

  // WebSocket Configuration
  websocket: {
    enabled: process.env.WEBSOCKET_ENABLED !== 'false',
    maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS) || 1000,
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000, // 30 seconds
    messageRateLimit: parseInt(process.env.WS_MESSAGE_RATE_LIMIT) || 10, // per second
    roomSizeLimit: parseInt(process.env.WS_ROOM_SIZE_LIMIT) || 100,
  },

  // CORS Configuration
  cors: {
    origin: function(origin, callback) {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5000',
        'https://smartpay-2qq5.onrender.com',
        'https://smartpay-v1-0.onrender.com'
      ];

      const allowedPatterns = [
        /^https:\/\/.*\.vercel\.app$/,
        /^https:\/\/.*\.netlify\.app$/,
        /^https:\/\/.*\.render\.com$/,
        /^https:\/\/.*\.github\.io$/
      ];

      // Add production origins from environment variable
      if (process.env.ALLOWED_ORIGINS) {
        const prodOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
        allowedOrigins.push(...prodOrigins);
      }

      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      // Check exact matches
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }

      // Check pattern matches
      for (const pattern of allowedPatterns) {
        if (pattern.test(origin)) {
          return callback(null, true);
        }
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
    preflightContinue: false,
    optionsSuccessStatus: 200
  },

  // Advanced Analytics Configuration
  analytics: {
    enabled: process.env.ANALYTICS_ENABLED !== 'false',
    mlModelsPath: process.env.ML_MODELS_PATH || './models',
    batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE) || 1000,
    retrainingInterval: parseInt(process.env.RETRAINING_INTERVAL) || 86400000, // 24 hours
    predictionThreshold: parseFloat(process.env.PREDICTION_THRESHOLD) || 0.7,
    cacheTTL: parseInt(process.env.ANALYTICS_CACHE_TTL) || 3600, // 1 hour
  },

  // Multi-signature Configuration
  multisig: {
    enabled: process.env.MULTISIG_ENABLED !== 'false',
    defaultThreshold: parseInt(process.env.MULTISIG_THRESHOLD) || 2,
    proposalExpiry: parseInt(process.env.MULTISIG_PROPOSAL_EXPIRY) || 86400000, // 24 hours
    maxSigners: parseInt(process.env.MULTISIG_MAX_SIGNERS) || 10,
    contractAddress: process.env.MULTISIG_CONTRACT_ADDRESS,
  },

  // Automation Configuration
  automation: {
    enabled: process.env.AUTOMATION_ENABLED !== 'false',
    checkInterval: parseInt(process.env.AUTOMATION_CHECK_INTERVAL) || 300000, // 5 minutes
    maxRulesPerJob: parseInt(process.env.MAX_AUTOMATION_RULES) || 10,
    executionTimeout: parseInt(process.env.AUTOMATION_TIMEOUT) || 300000, // 5 minutes
    retryAttempts: parseInt(process.env.AUTOMATION_RETRY_ATTEMPTS) || 3,
  },

  // Blockchain Configuration
  blockchain: {
    networks: {
      polygonAmoy: {
        name: 'Polygon Amoy Testnet',
        chainId: 80002,
        rpcUrl: process.env.RPC_URL_POLYGON_AMOY || 'https://rpc-amoy.polygon.technology',
        blockConfirmations: parseInt(process.env.BLOCK_CONFIRMATIONS) || 3,
        gasLimit: parseInt(process.env.GAS_LIMIT) || 3000000,
        gasPriceGwei: parseInt(process.env.GAS_PRICE_GWEI) || 20,
      },
      polygonMainnet: {
        name: 'Polygon Mainnet',
        chainId: 137,
        rpcUrl: process.env.RPC_URL_POLYGON_MAINNET || 'https://polygon-rpc.com',
        blockConfirmations: parseInt(process.env.BLOCK_CONFIRMATIONS) || 5,
        gasLimit: parseInt(process.env.GAS_LIMIT) || 3000000,
        gasPriceGwei: parseInt(process.env.GAS_PRICE_GWEI) || 25,
      }
    },
    defaultNetwork: process.env.NODE_ENV === 'production' ? 'polygonMainnet' : 'polygonAmoy',
    privateKey: process.env.PRIVATE_KEY,
    contractAddress: process.env.CONTRACT_ADDRESS,
    usdcContractAddress: process.env.USDC_CONTRACT_ADDRESS,
    
    // Token Configuration
    tokenAddress: process.env.TOKEN_ADDRESS || process.env.USDC_CONTRACT_ADDRESS,
    tokenSymbol: process.env.TOKEN_SYMBOL || 'USDC',
    tokenDecimals: parseInt(process.env.TOKEN_DECIMALS) || 6,
    
    // Payment Configuration
    paymentService: {
      enabled: process.env.PAYMENT_SERVICE_ENABLED === 'true' || true,
      maxTransactionAmount: process.env.MAX_TRANSACTION_AMOUNT || '10000', // in token units
      minTransactionAmount: process.env.MIN_TRANSACTION_AMOUNT || '0.01',
      escrowFeePercentage: parseFloat(process.env.ESCROW_FEE_PERCENTAGE) || 2.5, // 2.5%
      gasFeeBuffer: parseFloat(process.env.GAS_FEE_BUFFER) || 1.2, // 20% buffer
    },
    
    // Price Oracle Configuration
    priceOracle: {
      enabled: process.env.PRICE_ORACLE_ENABLED === 'true' || true,
      primaryProvider: process.env.PRICE_ORACLE_PRIMARY || 'coingecko',
      fallbackProvider: process.env.PRICE_ORACLE_FALLBACK || 'coinbase',
      cacheDuration: parseInt(process.env.PRICE_CACHE_DURATION) || 300, // 5 minutes
      apiTimeout: parseInt(process.env.PRICE_API_TIMEOUT) || 10000, // 10 seconds
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'INR'],
      supportedTokens: ['ETH', 'MATIC', 'USDC', 'USDT', 'DAI', 'BTC'],
    },
    
    eventBatchSize: 1000,
    blockRange: 10000,
    
    // Transaction settings
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    confirmationTimeout: 300000, // 5 minutes
  },

  // Monitoring Configuration
  monitoring: {
    enabled: process.env.ENABLE_METRICS === 'true',
    port: parseInt(process.env.METRICS_PORT) || 9090,
    
    // External monitoring services (optional)
    tenderly: {
      project: process.env.TENDERLY_PROJECT,
      username: process.env.TENDERLY_USERNAME,
      accessKey: process.env.TENDERLY_ACCESS_KEY,
    },
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
    }
  },

  // IPFS Configuration
  ipfs: {
    web3Storage: {
      token: process.env.WEB3_STORAGE_TOKEN,
      endpoint: 'https://api.web3.storage'
    },
    pinata: {
      apiKey: process.env.PINATA_API_KEY,
      secretKey: process.env.PINATA_SECRET_KEY,
      endpoint: 'https://api.pinata.cloud'
    },
    gateway: process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs/',
    timeout: 30000,
    maxFileSize: 100 * 1024 * 1024, // 100MB
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
    expiresIn: '7d',
    issuer: 'freelance-escrow',
    audience: 'freelance-escrow-users',
  },

  // Email Configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.SMTP_USER || 'noreply@freelance-escrow.com',
    templates: {
      jobCreated: 'job-created',
      milestoneApproved: 'milestone-approved',
      disputeRaised: 'dispute-raised',
      jobCompleted: 'job-completed'
    }
  },

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  // File Upload
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ],
    uploadDir: path.join(__dirname, '../../uploads')
  }
};

module.exports = config;
