const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // CORS rejection (from cors middleware)
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Not allowed by CORS' });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation error', details: errors });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
    return res.status(400).json({ error: `${field} already exists` });
  }

  // JWT errors (friendly messages for frontend)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token. Please login again.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired. Please login again.' });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

