const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  const clerkUid = req.headers['x-user-uid'] || req.headers['x-clerk-user-id'];
  const userEmail = req.headers['x-user-email'];

  try {
    let userFound = null;

    // 1. Try resolving user by JWT token if present
    if (token) {
      try {
        const decoded = jwt.decode(token);
        if (decoded && (decoded.sub || decoded.id || decoded.email)) {
          const userId = decoded.id || decoded.sub;
          userFound = await User.findOne({
            $or: [
              ...(userId ? [{ _id: userId }, { clerkId: userId }] : []),
              ...(decoded.email ? [{ email: decoded.email }] : []),
            ],
          }).select('-password');
        }
      } catch (tokenErr) {
        // Token decode fallback
      }
    }

    // 2. Fallback to Clerk user email / uid headers for strict per-user identification
    if (!userFound && (userEmail || clerkUid)) {
      const emailLower = userEmail ? userEmail.trim().toLowerCase() : '';

      if (emailLower) {
        userFound = await User.findOne({ email: emailLower });
      } else if (clerkUid) {
        userFound = await User.findOne({ clerkId: clerkUid });
      }

      if (!userFound && emailLower) {
        // Auto-provision user in MongoDB for new Clerk user
        userFound = await User.create({
          name: req.headers['x-user-name'] || emailLower.split('@')[0] || 'WAGH Customer',
          email: emailLower,
          clerkId: clerkUid || '',
          password: 'clerk_auth_user_' + Math.random().toString(36).substring(2),
          role: 'customer',
        });
      } else if (userFound && clerkUid && !userFound.clerkId) {
        userFound.clerkId = clerkUid;
        await userFound.save();
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
