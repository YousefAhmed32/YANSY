const jwt = require('jsonwebtoken');
const User = require('../models/User');

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Set JWT as httpOnly cookie for HTTPS production (and optional local).
 * Frontend can still use Authorization header from localStorage; cookie is sent automatically.
 */
const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE_MS,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: '/'
  };
  res.cookie(COOKIE_NAME, token, cookieOptions);
};

/**
 * Clear JWT cookie (for logout).
 */
const clearTokenCookie = (res) => {
  res.clearCookie(COOKIE_NAME, { path: '/', httpOnly: true, sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', secure: process.env.NODE_ENV === 'production' });
};

/**
 * Register a new user
 * POST /auth/register
 * Duplicate email returns 400 (handled below); double-submit from client is mitigated by frontend disabled state.
 */
exports.register = async (req, res) => {
  try {
    const { email, password, fullName, phoneNumber, brandName, companyName, role } = req.body;

    // Validate required fields
    if (!email || !password || !fullName || !phoneNumber) {
      return res.status(400).json({ 
        error: 'Email, password, full name, and phone number are required' 
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Validate full name
    if (fullName.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Full name must be at least 2 characters' 
      });
    }

    // Validate phone number format
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ 
        error: 'Please provide a valid phone number' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email already exists' 
      });
    }

    // Only allow ADMIN role creation by existing admins (or first user)
    const userCount = await User.countDocuments();
    const finalRole = role === 'ADMIN' && userCount > 0 
      ? 'USER' // Prevent admin creation unless it's the first user
      : (role === 'ADMIN' && userCount === 0 ? 'ADMIN' : 'USER');

    // Validate that at least one of brandName or companyName is provided
    if (!brandName && !companyName) {
      return res.status(400).json({ 
        error: 'Either brand name or company name must be provided' 
      });
    }

    // Create user
    const user = new User({
      email: email.toLowerCase().trim(),
      password,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      brandName: brandName ? brandName.trim() : null,
      companyName: companyName ? companyName.trim() : null,
      role: finalRole
    });

    await user.save();

    // Generate token and set httpOnly cookie (HTTPS-safe)
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        brandName: user.brandName,
        companyName: user.companyName,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: messages.join(', ') 
      });
    }

    // Mongoose duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'email';
      return res.status(400).json({ 
        error: `User with this ${field} already exists` 
      });
    }

    // JWT error
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(500).json({ 
        error: 'Token generation failed. Please try again.' 
      });
    }

    // Database connection error
    if (error.name === 'MongoServerError' || error.message?.includes('MongoServerError')) {
      return res.status(500).json({ 
        error: 'Database connection error. Please try again later.' 
      });
    }

    // Expose error message in development, generic in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Registration failed'
      : 'Registration failed. Please try again.';
    
    res.status(500).json({ 
      error: errorMessage 
    });
  }
};

/**
 * Login user
 * POST /auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Generate token and set httpOnly cookie (HTTPS-safe)
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        brandName: user.brandName,
        companyName: user.companyName,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed. Please try again.' 
    });
  }
};

/**
 * Get current authenticated user
 * GET /auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        brandName: user.brandName,
        companyName: user.companyName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user information'
    });
  }
};

/**
 * Logout — clear JWT cookie so cookie-based auth is cleared on server.
 * POST /auth/logout
 */
exports.logout = (req, res) => {
  clearTokenCookie(res);
  res.json({ message: 'Logged out' });
};

