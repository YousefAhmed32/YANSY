const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.cookies?.token;

    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required. Please provide a valid token.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token. User not found.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token. Please login again.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired. Please login again.' 
      });
    }
    return res.status(401).json({ 
      error: 'Authentication failed. Please try again.' 
    });
  }
};

/**
 * Role-based Authorization Middleware
 * @param {...string} roles - Required role(s)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    const userRole = req.user.role;
    const allowedRoles = roles.flat();

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
      });
    }

    next();
  };
};

// Convenience middleware for admin role
const requireAdmin = requireRole('ADMIN');

module.exports = { 
  authenticate, 
  requireRole, 
  requireAdmin 
};

