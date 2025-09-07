const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// CORS configuration
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Server is running successfully'
  });
});

// Test API routes
app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    status: 'success',
    data: {
      totalJobs: 0,
      activeJobs: 0,
      completedJobs: 0,
      totalUsers: 0,
      message: 'Mock dashboard data - database not connected'
    }
  });
});

app.get('/api/jobs', (req, res) => {
  res.json({
    status: 'success',
    data: [],
    message: 'Mock jobs data - database not connected'
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    status: 'success',
    data: {
      token: 'mock-token',
      user: { id: 1, email: 'test@example.com', name: 'Test User' }
    },
    message: 'Mock login - authentication not implemented'
  });
});

// Catch all API routes
app.get('/api/*', (req, res) => {
  res.json({
    status: 'success',
    message: 'API GET endpoint reached - full implementation pending',
    endpoint: req.originalUrl,
    method: req.method
  });
});

app.post('/api/*', (req, res) => {
  res.json({
    status: 'success',
    message: 'API POST endpoint reached - full implementation pending',
    endpoint: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple test server running on http://localhost:${PORT}`);
  console.log(`✅ Health check available at: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
});
