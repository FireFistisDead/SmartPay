console.log('🔍 SmartPay Server Diagnostic Mode');
console.log('Loading modules step by step...\n');

try {
  console.log('1️⃣ Loading basic modules...');
  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  const morgan = require('morgan');
  const compression = require('compression');
  const rateLimit = require('express-rate-limit');
  const { Server: SocketServer } = require('socket.io');
  const http = require('http');
  require('dotenv').config();
  console.log('✅ Basic modules loaded successfully\n');

  console.log('2️⃣ Loading config modules...');
  const config = require('./src/config/config');
  console.log('✅ Config loaded');
  
  const connectDB = require('./src/config/database');
  console.log('✅ Database config loaded');
  
  const redisClient = require('./src/config/redis');
  console.log('✅ Redis config loaded');
  
  const logger = require('./src/utils/logger');
  console.log('✅ Logger loaded');
  
  const { errorHandler } = require('./src/middleware/errorHandler');
  console.log('✅ Error handler loaded');
  console.log('✅ Config modules loaded successfully\n');

  console.log('3️⃣ Loading service modules...');
  const BlockchainEventListener = require('./src/services/blockchainEventListener');
  console.log('✅ BlockchainEventListener loaded');
  
  const WebSocketService = require('./src/services/webSocketService');
  console.log('✅ WebSocketService loaded');
  
  const SecurityService = require('./src/services/securityService');
  console.log('✅ SecurityService loaded');
  console.log('✅ Service modules loaded successfully\n');

  console.log('4️⃣ Loading route modules...');
  const jobRoutes = require('./src/routes/jobRoutes');
  console.log('✅ Job routes loaded');
  
  const milestoneRoutes = require('./src/routes/milestoneRoutes');
  console.log('✅ Milestone routes loaded');
  
  const ipfsRoutes = require('./src/routes/ipfsRoutes');
  console.log('✅ IPFS routes loaded');
  
  const disputeRoutes = require('./src/routes/disputeRoutes');
  console.log('✅ Dispute routes loaded');
  
  const userRoutes = require('./src/routes/userRoutes');
  console.log('✅ User routes loaded');
  
  const analyticsRoutes = require('./src/routes/analyticsRoutes');
  console.log('✅ Analytics routes loaded');
  
  const paymentRoutes = require('./src/routes/paymentRoutes');
  console.log('✅ Payment routes loaded');
  
  const advancedRoutes = require('./src/routes/advancedRoutes');
  console.log('✅ Advanced routes loaded');
  console.log('✅ Route modules loaded successfully\n');

  console.log('5️⃣ Creating Express app...');
  const app = express();
  const server = http.createServer(app);
  const io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });
  console.log('✅ Express app created successfully\n');

  console.log('6️⃣ Setting up middleware...');
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  console.log('✅ Middleware configured successfully\n');

  console.log('7️⃣ Setting up routes...');
  app.use('/api/jobs', jobRoutes);
  app.use('/api/milestones', milestoneRoutes);
  app.use('/api/ipfs', ipfsRoutes);
  app.use('/api/disputes', disputeRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/advanced', advancedRoutes);
  
  app.get('/', (req, res) => {
    res.json({
      message: 'SmartPay Server Diagnostic - All modules loaded successfully!',
      timestamp: new Date().toISOString(),
      status: 'healthy'
    });
  });
  console.log('✅ Routes configured successfully\n');

  console.log('8️⃣ Starting server...');
  const port = config.port;
  server.listen(port, () => {
    console.log('🎉 SUCCESS! Server diagnostic completed!');
    console.log(`📡 Server: http://localhost:${port}`);
    console.log('All modules loaded successfully - no errors detected!');
  });

} catch (error) {
  console.error('\n❌ ERROR DETECTED:');
  console.error('Error message:', error.message);
  console.error('Stack trace:', error.stack);
  console.error('\n🔧 This is the source of your errors!');
}
