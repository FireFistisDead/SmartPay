// Enhanced config that handles missing services gracefully
const config = {
  port: process.env.PORT || 3001,
  env: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key-for-development-only',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // Database Configuration with fallbacks
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smartpay',
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    }
  },

  // Redis Configuration with fallbacks
  redis: {
    url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
    options: {
      password: process.env.REDIS_PASSWORD || undefined,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true, // Don't connect immediately
      connectTimeout: 10000,
      commandTimeout: 5000,
    }
  },

  // Blockchain Configuration
  blockchain: {
    network: process.env.BLOCKCHAIN_NETWORK || 'polygon-amoy',
    rpcUrl: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
    privateKey: process.env.PRIVATE_KEY,
    contractAddress: process.env.CONTRACT_ADDRESS
  },

  // IPFS Configuration
  ipfs: {
    web3StorageToken: process.env.WEB3_STORAGE_TOKEN,
    pinataJwt: process.env.PINATA_JWT
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimiting: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    }
  },

  // Frontend Configuration
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

module.exports = config;
