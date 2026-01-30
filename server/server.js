const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { createServer } = require('http');
const { Server } = require('socket.io');

const errorHandler = require('./middleware/errorHandler');
const { trackEvent, trackSession } = require('./middleware/analytics');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const projectRequestRoutes = require('./routes/projectRequests');
const messageRoutes = require('./routes/messages');
const analyticsRoutes = require('./routes/analytics');
const fileRoutes = require('./routes/files');
const feedbackRoutes = require('./routes/feedback');

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production');
  }
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required in production');
  }
  if (!process.env.CLIENT_URL) {
    throw new Error('CLIENT_URL is required in production');
  }
}

const app = express();
const httpServer = createServer(app);

// CORS configuration - use CLIENT_URL from env, fallback only for development
const clientUrl = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? null : 'http://localhost:5173');
if (!clientUrl && process.env.NODE_ENV === 'production') {
  throw new Error('CLIENT_URL must be set in production');
}

const io = new Server(httpServer, {
  cors: {
    origin: clientUrl,
    credentials: true
  }
});

// Database connection
const MONGODB_URI = process.env.MONGO_URI || (process.env.NODE_ENV === 'production' ? null : 'mongodb://localhost:27017/yansy');
if (!MONGODB_URI && process.env.NODE_ENV === 'production') {
  throw new Error('MONGO_URI must be set in production');
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Server will continue but database operations will fail');
    console.log('💡 Make sure MongoDB is running or update MONGO_URI in .env');
  });

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Analytics tracking middleware
app.use(trackEvent);
app.use(trackSession);

// Attach io to requests for real-time updates
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/project-requests', projectRequestRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io for real-time messaging
io.use(async (socket, next) => {
  // Authentication middleware for socket
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const User = require('./models/User');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('Invalid user'));
    }
    
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user's room
  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
  });

  // Join thread room
  socket.on('join-thread', (threadId) => {
    socket.join(`thread:${threadId}`);
  });

  // Join project room
  socket.on('join-project', (projectId) => {
    socket.join(`project:${projectId}`);
  });

  // Handle new message
  socket.on('new-message', (data) => {
    io.to(`thread:${data.threadId}`).emit('message-received', data);
    io.to(`user:${data.recipientId}`).emit('notification', {
      type: 'new-message',
      ...data
    });
    // Also emit to project room if project exists
    if (data.projectId) {
      io.to(`project:${data.projectId}`).emit('project-message', data);
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(`thread:${data.threadId}`).emit('user-typing', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? null : 5000);
if (!PORT && process.env.NODE_ENV === 'production') {
  throw new Error('PORT must be set in production');
}

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready`);
});

module.exports = { app, io };

