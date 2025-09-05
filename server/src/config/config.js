const path = require('path');

const config = {
  // Server Configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/freelance_escrow',
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

  // Blockchain Configuration
  blockchain: {
    networks: {
      polygonAmoy: {
        name: 'Polygon Amoy Testnet',
        chainId: 80002,
        rpcUrl: process.env.RPC_URL_POLYGON_AMOY || 'https://rpc-amoy.polygon.technology',
        blockConfirmations: 3,
        gasLimit: 3000000,
      },
      polygonMainnet: {
        name: 'Polygon Mainnet',
        chainId: 137,
        rpcUrl: process.env.RPC_URL_POLYGON_MAINNET || 'https://polygon-rpc.com',
        blockConfirmations: 5,
        gasLimit: 3000000,
      }
    },
    defaultNetwork: process.env.NODE_ENV === 'production' ? 'polygonMainnet' : 'polygonAmoy',
    privateKey: process.env.PRIVATE_KEY,
    contractAddress: process.env.CONTRACT_ADDRESS,
    eventBatchSize: 1000,
    blockRange: 10000,
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
    secret: process.env.JWT_SECRET || 'your-secret-key',
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
  },

  // External Services
  external: {
    tenderly: {
      accessKey: process.env.TENDERLY_ACCESS_KEY,
      project: process.env.TENDERLY_PROJECT,
      username: process.env.TENDERLY_USERNAME
    },
    sentry: {
      dsn: process.env.SENTRY_DSN
    }
  },

  // Monitoring
  monitoring: {
    enabled: process.env.ENABLE_METRICS === 'true',
    port: parseInt(process.env.METRICS_PORT) || 9090
  },

  // Security
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || 'default-encryption-key',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
    trustedProxies: process.env.TRUSTED_PROXIES ? process.env.TRUSTED_PROXIES.split(',') : [],
  }
};

module.exports = config;
