const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

// Simple User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'client' }
});

const User = mongoose.model('SimpleUser', userSchema);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartpay');

// Simple signup
app.post('/signup', async (req, res) => {
  try {
    const { email, password, role = 'client' } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      email,
      password: hashedPassword,
      role
    });
    
    await user.save();
    
    const token = jwt.sign({ userId: user._id, email }, 'secret', { expiresIn: '7d' });
    
    res.json({
      success: true,
      token,
      user: { id: user._id, email, role }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Simple login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id, email }, 'secret', { expiresIn: '7d' });
    
    res.json({
      success: true,
      token,
      user: { id: user._id, email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(3002, () => {
  console.log('Simple auth server running on port 3002');
});
