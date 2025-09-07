const express = require('express');
const { body } = require('express-validator');
const { catchAsync } = require('../middleware/errorHandler');
const User = require('../models/User');
const SecurityService = require('../services/securityService');
const { JWTUtils } = require('../utils/helpers');
const router = express.Router();

const security = new SecurityService();

// POST /api/auth/signup - email/password signup
router.post('/signup',
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('username').optional().isLength({ min: 3 }),
  catchAsync(async (req, res) => {
    const { email, password, username, role } = req.body;
    const existing = await User.findOne({ email: (email || '').toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    const hashed = await security.hashPassword(password);

    const u = new User({
      email: email.toLowerCase(),
      password: hashed,
      username,
      roles: role ? [role] : ['client'],
      registeredAt: new Date(),
    });

    await u.save();

    const token = JWTUtils.generateToken({ userId: u._id, email: u.email, roles: u.roles });

    res.status(201).json({ success: true, data: { token, user: { id: u._id, email: u.email, username: u.username, roles: u.roles, profile: u.profile } } });
  })
);

// POST /api/auth/login - email/password login
router.post('/login',
  body('email').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
  catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const ok = await security.verifyPassword(password, user.password);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = JWTUtils.generateToken({ userId: user._id, email: user.email, roles: user.roles });

    res.json({ success: true, data: { token, user: { id: user._id, email: user.email, username: user.username, roles: user.roles, profile: user.profile } } });
  })
);

module.exports = router;
