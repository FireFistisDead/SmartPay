const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB with timeout
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/freelance_escrow', {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

// Import User model
const User = require('./src/models/User');

async function debugLogin() {
  try {
    console.log('Debugging login issue...');
    
    // Find user with email
    const user = await User.findOne({ email: 'test@example.com' });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (user) {
      console.log('User fields:', Object.keys(user.toObject()));
      console.log('Password field exists in user object:', user.password !== undefined);
    }
    
    // Find user with password explicitly selected
    const userWithPassword = await User.findOne({ email: 'test@example.com' }).select('+password');
    console.log('User with password found:', userWithPassword ? 'Yes' : 'No');
    
    if (userWithPassword) {
      console.log('Password field in selected user:', userWithPassword.password !== undefined);
      console.log('Password value:', userWithPassword.password ? 'exists' : 'null/undefined');
      
      if (userWithPassword.password) {
        try {
          const isValid = await bcrypt.compare('testpass123', userWithPassword.password);
          console.log('Password comparison result:', isValid);
        } catch (err) {
          console.log('bcrypt.compare error:', err.message);
        }
      }
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    process.exit(0);
  }
}

debugLogin();
