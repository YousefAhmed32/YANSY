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

const app = express();
const httpServer = createServer(app);

/* ================== MongoDB — support both MONGODB_URI and MONGO_URI ================== */
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/yansy';

/* ================== CORS — multiple origins, credentials for HTTPS/cookies ================== */
const CLIENT_URL_RAW = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'https://yansytech.com' : 'http://localhost:5173,http://127.0.0.1:5173');
const ALLOWED_ORIGINS = CLIENT_URL_RAW.split(',').map((s) => s.trim()).filter(Boolean);
const corsOptions = {
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. Postman, same-origin, server-side)
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    if (process.env.NODE_ENV === 'development') return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

/* ================== SOCKET ================== */
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS.length === 1 ? ALLOWED_ORIGINS[0] : ALLOWED_ORIGINS,
    credentials: true
  }
});

/* ================== DB ================== */
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err.message));

app.set('trust proxy', 1);

/* ================== MIDDLEWARE ================== */
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(trackEvent);
app.use(trackSession);

app.use((req, res, next) => {
  req.io = io;
  next();
});

/* ================== ROUTES ================== */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/project-requests', projectRequestRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/feedback', feedbackRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/* ================== SOCKET AUTH ================== */
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
  if (!token) return next(new Error('Auth error'));

  try {
    const jwt = require('jsonwebtoken');
    const User = require('./models/User');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return next(new Error('Invalid user'));
    socket.user = user;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

/* ================== ERROR ================== */
app.use(errorHandler);
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

/* ================== SERVER ================== */
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  // #region agent log
  require('http').request({ hostname: '127.0.0.1', port: 7242, path: '/ingest/38a3d643-6b14-4c50-b906-466350701782', method: 'POST', headers: { 'Content-Type': 'application/json' } }, () => {}).on('error', () => {}).end(JSON.stringify({ location: 'server.js:listen', message: 'server_listening', data: { port: PORT }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H2' }));
  // #endregion
  console.log(`🚀 Server running on ${PORT}`);
});
