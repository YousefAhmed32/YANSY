'use strict';
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { initGridFS } = require('./config/gridfs');

// Security & performance — graceful degradation if not yet installed
let helmet, rateLimit, compression;
try { helmet      = require('helmet');             } catch (_) { console.warn('[server] helmet not installed — run: npm install helmet'); }
try { rateLimit   = require('express-rate-limit'); } catch (_) { console.warn('[server] express-rate-limit not installed'); }
try { compression = require('compression');        } catch (_) { console.warn('[server] compression not installed'); }

const { createServer } = require('http');
const { Server } = require('socket.io');

const errorHandler = require('./middleware/errorHandler');
const { trackEvent, trackSession } = require('./middleware/analytics');
const { sanitizeBody, sanitizeQuery } = require('./middleware/sanitize');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const projectRequestRoutes = require('./routes/projectRequests');
const messageRoutes = require('./routes/messages');
const analyticsRoutes = require('./routes/analytics');
const fileRoutes = require('./routes/files');
const feedbackRoutes = require('./routes/feedback');
const portfolioRoutes = require('./routes/portfolio.routes');
const introRoutes = require('./routes/intro.routes');
const homepageVideoRoutes = require('./routes/homepageVideo.routes');
const clientLogosRoutes = require('./routes/clientLogos.routes');
const mediaLibraryRoutes = require('./routes/media.library.routes');
const { mountLibraryRoutes } = require('./routes/libraries.routes');
const startProjectRoutes = require('./routes/startProject.routes');
const notificationRoutes = require('./routes/notifications');
const proposalsRoutes = require('./routes/proposals.routes');
const publicProposalsRoutes = require('./routes/publicProposals.routes');
const { mountProposalLibraryRoutes } = require('./routes/proposalLibraries.routes');

// Activity log route
const activityRoutes = require('./routes/activity');

// Optional routes — loaded only when their files exist
let auditRoutes, invoiceRoutes, searchRoutes, billingRoutes, aiRoutes, settingsRoutes, reportRoutes, supportRoutes, blogRoutes;
let billingController;
try { auditRoutes    = require('./routes/audit');    } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') console.error('[routes] audit:',    e.message); }
try { invoiceRoutes  = require('./routes/invoices'); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') console.error('[routes] invoices:', e.message); }
try { searchRoutes   = require('./routes/search');   } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') console.error('[routes] search:',   e.message); }
try {
  billingRoutes = require('./routes/billing');
  billingController = require('./controllers/billingController');
} catch (e) { if (e.code !== 'MODULE_NOT_FOUND') console.error('[routes] billing:',  e.message); }
try { aiRoutes       = require('./routes/ai');       } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') console.error('[routes] ai:',       e.message); }
try { settingsRoutes = require('./routes/settings'); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') console.error('[routes] settings:', e.message); }
try { reportRoutes   = require('./routes/reports');  } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') console.error('[routes] reports:',  e.message); }
try { supportRoutes  = require('./routes/support');  } catch (e) { console.error('[routes] support:', e.message); }
try { blogRoutes     = require('./routes/blog.routes.js'); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') console.error('[routes] blog:', e.message); }

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

// Disable Mongoose buffering so operations fail immediately instead of queuing
// for up to 10 s when the DB is down. Controllers already handle these errors.
mongoose.set('bufferCommands', false);

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 3000,   // fail fast — surface DB errors to callers quickly
  connectTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 50,
  minPoolSize: 5,
})
  .then(() => {
    console.log('✅ MongoDB connected');
    initGridFS();
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   URI attempted:', MONGODB_URI.replace(/:\/\/[^@]+@/, '://***@'));
    console.error('   readyState:', mongoose.connection.readyState);
    // Don't crash — Mongoose will keep retrying on subsequent requests
  });

mongoose.connection.on('error',        err => console.error('❌ MongoDB error:', err.message));
mongoose.connection.on('disconnected', ()  => console.warn ('⚠️  MongoDB disconnected'));
mongoose.connection.on('reconnected',  ()  => console.log  ('✅ MongoDB reconnected'));

app.set('trust proxy', 1);

/* ================== SECURITY HEADERS ================== */
if (helmet) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://accounts.google.com'],
        styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://accounts.google.com'],
        fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
        imgSrc:     ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", ...ALLOWED_ORIGINS, 'https://oauth2.googleapis.com', 'https://accounts.google.com'],
        frameSrc:   ["'self'", 'https://accounts.google.com'],
        objectSrc:  ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    // Portfolio/media images are served from this origin (or a different
    // subdomain in prod) but rendered on the client origin — same-origin
    // CORP (helmet's default) silently blocks the browser from painting
    // them with no console-visible cause beyond a cryptic NotSameOrigin.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
}

/* ================== COMPRESSION ================== */
if (compression) {
  app.use(compression({ level: 6, threshold: 1024 }));
}

/* ================== MIDDLEWARE ================== */
app.use(cors(corsOptions));

/* ================== STRIPE WEBHOOK — raw body, must precede express.json() ================
   Stripe's signature verification (stripeService.constructWebhookEvent) needs the exact
   unmodified request bytes. routes/billing.js used to mount this with express.raw() on its
   own router, but that router is registered *after* the global express.json() below — by
   the time it ran, the JSON parser had already consumed and parsed the body, so req.body was
   a plain object instead of a raw Buffer and every real Stripe webhook failed signature
   verification in production. Mounting it here, before the global JSON parser, is what
   actually gives the handler the raw bytes it needs. */
if (billingController) {
  app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), billingController.handleWebhook);
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

/* ================== NoSQL INJECTION SANITIZATION ================== */
// express-mongo-sanitize cannot reassign req.query in Express 5 (getter-only).
// We inline the sanitization: mutate body/params in-place, and shadow req.query
// with a plain cached object via Object.defineProperty.
app.use((req, res, next) => {
  const stripDollarKeys = (obj) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$')) {
        delete obj[key];
      } else {
        stripDollarKeys(obj[key]);
      }
    }
  };

  stripDollarKeys(req.body);
  stripDollarKeys(req.params);

  // Read the getter once, sanitize a plain copy, then shadow the getter
  try {
    const q = Object.assign({}, req.query);
    stripDollarKeys(q);
    Object.defineProperty(req, 'query', { value: q, writable: true, configurable: true });
  } catch (_) {}

  next();
});

/* ================== XSS SANITIZATION ================== */
app.use(sanitizeBody);
app.use(sanitizeQuery);

/* ================== MEDIA (GridFS streaming) ================== */
// Mounted before the /api rate limiter below — a single portfolio gallery page
// can easily fire more than the global per-minute cap in image requests alone.
app.use('/api/media', require('./media/media.routes'));

/* ================== RATE LIMITING ================== */
if (rateLimit) {
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { error: 'Too many attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    message: { error: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: { error: 'Too many password reset requests. Please try again in an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/auth/login',           authLimiter);
  app.use('/api/auth/register',        authLimiter);
  app.use('/api/auth/forgot-password', passwordResetLimiter);
  app.use('/api/search',               rateLimit({ windowMs: 60 * 1000, max: 30, message: { error: 'Search rate limit exceeded.' }, standardHeaders: true, legacyHeaders: false }));
  app.use('/api',                      apiLimiter);
}
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ─── Request timeout: protect against hung handlers ─────────────────────── */
app.use((req, res, next) => {
  // SSE streaming endpoints get extended timeout — they self-close via res.end().
  // /support/generate-document is a deliberate, occasional long-form generation
  // (full BRD/FRD/user-stories/architecture doc) that legitimately runs 60-90s+.
  // Use originalUrl, not path — path reflects whatever a sub-router has already
  // stripped by the time nested middleware sees it, which silently broke this
  // exact check before (verified via the timeout log showing a bare route
  // fragment instead of the full mounted path).
  const isSSE      = req.originalUrl.includes('/support/chat');
  const isLongForm = req.originalUrl.includes('/support/generate-document');
  const REQUEST_TIMEOUT_MS = isSSE ? 90_000 : isLongForm ? 120_000 : 30_000;
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      console.error(`[Timeout] ${req.method} ${req.originalUrl} exceeded ${REQUEST_TIMEOUT_MS}ms`);
      res.status(503).json({ error: 'Request timed out. Please try again.' });
    }
  }, REQUEST_TIMEOUT_MS);

  res.on('finish', () => clearTimeout(timer));
  res.on('close',  () => clearTimeout(timer));
  next();
});

app.use(trackEvent);
app.use(trackSession);

// ── Maintenance mode ──────────────────────────────────────────────────────────
app.use(async (req, res, next) => {
  // Skip health check, auth, and settings routes during maintenance
  const bypass = ['/api/health', '/api/auth/', '/api/admin/settings/public'];
  if (bypass.some(p => req.path.startsWith(p))) return next();

  try {
    const SystemSettings = require('./models/SystemSettings');
    const maintenance = await SystemSettings.get('platform.maintenanceMode', false);
    if (maintenance) {
      const message = await SystemSettings.get('platform.maintenanceMessage', 'Platform is under maintenance. Please try again shortly.');
      return res.status(503).json({ error: message, maintenance: true });
    }
  } catch (_) {
    // DB unavailable — don't block the request
  }
  next();
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

/* ================== DB AVAILABILITY GUARD ================== */
// Routes that work without a DB connection (no mongoose calls)
// NOTE: req.path inside app.use('/api', fn) is relative — no '/api' prefix here.
const DB_EXEMPT = new Set(['/health', '/auth/logout']);

app.use('/api', (req, res, next) => {
  if (DB_EXEMPT.has(req.path)) return next();
  const state = mongoose.connection.readyState;
  if (state === 1) return next(); // 1 = connected
  const statusLabel = ['disconnected', 'connected', 'connecting', 'disconnecting'][state] || 'unknown';
  console.warn(`[DB guard] Blocking ${req.method} ${req.path} — DB state: ${statusLabel}`);
  return res.status(503).json({
    error:      'Service temporarily unavailable. Please try again in a moment.',
    code:       'DB_UNAVAILABLE',
    retryAfter: 5,
  });
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
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/intro', introRoutes);
app.use('/api/homepage-video', homepageVideoRoutes);
app.use('/api/client-logos', clientLogosRoutes);
app.use('/api/media-library', mediaLibraryRoutes);
mountLibraryRoutes(app); // /api/team, /api/clients, /api/technologies, /api/tags, /api/testimonials, /api/awards, /api/categories, /api/industries, /api/services
app.use('/api/start-project', startProjectRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity',      activityRoutes);

// ── Proposal Management System ────────────────────────────────────────
app.use('/api/proposals', proposalsRoutes);               // admin CRUD + publish/duplicate/archive/versions
app.use('/api/public/proposals', publicProposalsRoutes);  // public /p/:slug data + view/accept/request-changes
mountProposalLibraryRoutes(app); // /api/proposal-clients, /api/proposal-services, /api/proposal-templates

if (auditRoutes)    app.use('/api/audit',          auditRoutes);
if (invoiceRoutes)  app.use('/api/invoices',       invoiceRoutes);
if (searchRoutes)   app.use('/api/search',         searchRoutes);
if (billingRoutes)  app.use('/api/billing',        billingRoutes);
if (aiRoutes)       app.use('/api/ai',             aiRoutes);
if (settingsRoutes) app.use('/api/admin/settings', settingsRoutes);
if (reportRoutes)   app.use('/api/reports',        reportRoutes);
if (supportRoutes)  app.use('/api/support',        supportRoutes);
if (blogRoutes)     app.use('/api/blog',           blogRoutes);

app.get('/api/health', (req, res) => {
  const dbState  = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
  res.json({
    status:    'ok',
    db:        dbStatus,
    uptime:    Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || 'development',
  });
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

/* ================== SOCKET EVENTS ================== */
// Room membership is authorized purely from `socket.user` (verified above by
// the JWT-checking io.use middleware) — never from a client-supplied id.
// The old `join`/`join-thread` handlers trusted whatever id the browser sent
// and joined that room unconditionally: any authenticated socket could pass
// another customer's user id or an arbitrary thread id and silently receive
// their private notifications/messages. `join` is gone entirely (the server
// already auto-joins the caller's own `user:<id>` room on connect — no
// client-provided id is ever needed); `join-thread` now checks real
// participation (or admin role) against the database before joining.
io.on('connection', (socket) => {
  const userId = socket.user?._id?.toString();
  const role   = socket.user?.role;
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  if (userId) {
    socket.join(`user_${userId}`);
    socket.join(`user:${userId}`);
    if (isAdmin) socket.join('admin_room');
  }

  socket.on('join-thread', async (threadId) => {
    if (!threadId || !userId) return;
    try {
      const { MessageThread } = require('./models/Message');
      const thread = await MessageThread.findById(threadId).select('participants').lean();
      if (!thread) return;
      const isParticipant = thread.participants.some((p) => p.toString() === userId);
      if (isAdmin || isParticipant) {
        socket.join(`thread:${threadId}`);
      }
      // Silently no-op for an unauthorized thread id — no error is echoed
      // back that would confirm/deny whether the id even exists.
    } catch {
      // Invalid ObjectId or transient DB error — ignore, no room joined.
    }
  });

  socket.on('leave-thread', (threadId) => {
    if (threadId) socket.leave(`thread:${threadId}`);
  });

  // Typing indicators — broadcast to other thread members. Membership in
  // the `thread:<id>` room (join-thread, above) is what actually gates who
  // receives this; no separate check needed here.
  socket.on('typing-start', ({ threadId } = {}) => {
    if (!threadId) return;
    socket.to(`thread:${threadId}`).emit('user-typing', {
      userId, threadId, typing: true,
    });
  });

  socket.on('typing-stop', ({ threadId } = {}) => {
    if (!threadId) return;
    socket.to(`thread:${threadId}`).emit('user-typing', {
      userId, threadId, typing: false,
    });
  });

  socket.on('disconnect', () => {
    // Auto-cleanup: rooms are left automatically on disconnect
  });
});

/* ================== ERROR ================== */
app.use(errorHandler);
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

/* ================== SERVER ================== */
const PORT = process.env.PORT || 5000;

/* ================== CRASH SAFETY & GRACEFUL SHUTDOWN ==================
 * Previously absent entirely — an unhandled rejection anywhere in the app
 * would just vanish into Node's default handler with no log line, and a
 * deploy/restart (or PM2 recycling the process) would hard-kill in-flight
 * requests and the Mongo connection instead of draining them. PM2's
 * `autorestart: true` is a crash safety net, not a substitute for this: it
 * only helps *after* the process has already died uncleanly.
 */
let shuttingDown = false;
const gracefulShutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} received — shutting down gracefully…`);

  const forceExitTimer = setTimeout(() => {
    console.error('⚠️  Graceful shutdown timed out — forcing exit.');
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  httpServer.close(async () => {
    try {
      // Best-effort — the proposal PDF service only ever launches Chromium
      // lazily on first use, so this is a no-op on instances that never hit it.
      try { await require('./services/proposals/pdfService').closeBrowser(); } catch (_) {}
      await mongoose.connection.close(false);
      console.log('✅ HTTP server and MongoDB connection closed.');
      clearTimeout(forceExitTimer);
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during shutdown:', err.message);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

// A rejected promise with no .catch() anywhere in the call chain — log it
// with full context rather than letting it disappear silently or crash the
// whole process (Node's default for unhandledRejection varies by version).
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Promise Rejection:', reason instanceof Error ? reason.stack : reason);
});

// An uncaught synchronous throw means the process may be in a corrupted
// state (per Node's own guidance) — log it and exit so PM2 restarts into a
// clean process, rather than continuing to serve requests from one that
// might have partially-broken internal state.
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.stack || err);
  process.exit(1);
});

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another process.`);
    console.error(`💡 Tip: Check and terminate the process holding port ${PORT}, or specify a different PORT in .env`);
  } else {
    console.error('❌ Server startup error:', err.message);
  }
  process.exit(1);
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

