console.log('🚀 Starting SmartPay Server...');

// Step 1: Load basic modules
console.log('📦 Loading modules...');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('✅ Basic modules loaded');

// Step 2: Create Express app
console.log('🔧 Creating Express app...');
const app = express();
const port = process.env.PORT || 3001;

console.log('✅ Express app created');

// Step 3: Basic middleware
console.log('🔧 Setting up middleware...');
app.use(cors());
app.use(express.json());

console.log('✅ Middleware configured');

// Step 4: Basic route
console.log('🛣️ Setting up routes...');
app.get('/', (req, res) => {
  res.json({
    message: 'SmartPay Server is running!',
    timestamp: new Date().toISOString(),
    port: port
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Routes configured');

// Step 5: Start server
console.log('🚀 Starting server...');
const server = app.listen(port, () => {
  console.log('🎉 SUCCESS! SmartPay Server is running!');
  console.log(`📡 Server: http://localhost:${port}`);
  console.log(`💊 Health: http://localhost:${port}/health`);
  console.log('Press Ctrl+C to stop the server');
});

// Error handling
server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

console.log('✅ Server setup completed');
