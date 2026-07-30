const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  const firebaseUid = req.headers['x-user-uid'];
  const userEmail = req.headers['x-user-email'];

  try {
    let userFound = null;

    // 1. Try resolving user by JWT token if present and valid
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'wagh_super_secret_jwt_key_2026_premium_accessories');
        userFound = await User.findById(decoded.id).select('-password');
      } catch (tokenErr) {
        // Token invalid or expired, fallback to firebase headers
      }
    }

    // 2. Fallback to Firebase user email / uid headers for strict per-user identification
    if (!userFound && userEmail) {
      const emailLower = userEmail.trim().toLowerCase();
      userFound = await User.findOne({ email: emailLower });

      if (!userFound) {
        // Auto-provision user in MongoDB for new Firebase Auth user
        userFound = await User.create({
          name: req.headers['x-user-name'] || emailLower.split('@')[0] || 'WAGH Customer',
          email: emailLower,
          password: 'firebase_auth_user_' + Math.random().toString(36).substring(2),
          role: 'customer',
        });
      }
    }

    if (!userFound) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    req.user = userFound;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Access denied: Requires ${roles.join(' or ')} role` });
    }
    next();
  };
};

const admin = requireRole('admin');

module.exports = { protect, admin, requireRole };
