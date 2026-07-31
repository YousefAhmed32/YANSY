const DB_ERROR_NAMES = new Set([
  'MongoServerSelectionError',
  'MongoNetworkError',
  'MongoNetworkTimeoutError',
  'MongoTimeoutError',
  'MongooseServerSelectionError',
  'MongoNotConnectedError',
  'MongoExpiredSessionError',
  'MongooseError',
]);

const isDbError = (err) =>
  DB_ERROR_NAMES.has(err.name) ||
  err.message?.includes('buffering timed out') ||
  err.message?.includes('ECONNREFUSED') ||
  err.message?.includes('timed out') ||
  err.message?.includes('not connected') ||
  err.message?.includes('Client must be connected');

const errorHandler = (err, req, res, next) => {
  // ── 503 Database unavailable ───────────────────────────────────────────────
  if (isDbError(err)) {
    console.error('[errorHandler] DB error on', req.method, req.path, '—', err.message);
    return res.status(503).json({
      error:      'Service temporarily unavailable. Please try again in a moment.',
      code:       'DB_UNAVAILABLE',
      retryAfter: 5,
    });
  }

  console.error('[errorHandler] Error on', req.method, req.path, ':', err.message || err);

  // ── 403 CORS ───────────────────────────────────────────────────────────────
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Not allowed by CORS' });
  }

  // ── 400 Mongoose validation ────────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation failed.', details: errors });
  }

  // ── 400 Duplicate key ─────────────────────────────────────────────────────
  if (err.code === 11000) {
    const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
    return res.status(400).json({ error: `${field} already exists.` });
  }

  // ── 400 Bad ObjectId / cast error ─────────────────────────────────────────
  // Previously fell through to the generic 500 branch below — a malformed ID in a
  // URL (e.g. GET /api/projects/not-an-id) is a client error, not a server fault.
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path || 'identifier'}.`, code: 'INVALID_ID' });
  }

  // ── 401 JWT ───────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token. Please log in again.', code: 'TOKEN_INVALID' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Session expired. Please log in again.', code: 'TOKEN_EXPIRED' });
  }

  // ── 500 Default ───────────────────────────────────────────────────────────
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({
    error: isDev ? (err.message || 'Internal server error') : 'An unexpected error occurred. Please try again.',
    code:  'INTERNAL_ERROR',
    ...(isDev && { stack: err.stack }),
  });
};

// Exposed so other middleware (e.g. the auth guard) can classify an error the
// same way this handler does, instead of maintaining a second copy of the list.
errorHandler.isDbError = isDbError;

module.exports = errorHandler;

