/**
 * Rate Limiting Middleware
 * Prevents spam submissions from guest users
 */

// Simple in-memory store (for production, use Redis)
const submissionStore = new Map();

const cleanOldEntries = () => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  for (const [key, value] of submissionStore.entries()) {
    if (now - value.timestamp > oneHour) {
      submissionStore.delete(key);
    }
  }
};

// Clean old entries every 10 minutes
setInterval(cleanOldEntries, 10 * 60 * 1000);

/**
 * Rate limit middleware for guest feedback submissions
 * Allows 3 submissions per hour per IP address
 */
const rateLimitFeedback = (req, res, next) => {
  // Skip rate limiting for authenticated users
  if (req.user) {
    return next();
  }

  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  // Get or create entry for this IP
  const entry = submissionStore.get(ipAddress) || { count: 0, timestamp: now };

  // Reset if more than 1 hour has passed
  if (now - entry.timestamp > oneHour) {
    entry.count = 0;
    entry.timestamp = now;
  }

  // Check limit (3 per hour)
  if (entry.count >= 3) {
    return res.status(429).json({
      error: 'Too many submissions. Please try again later or log in to submit unlimited feedback.'
    });
  }

  // Increment count
  entry.count++;
  submissionStore.set(ipAddress, entry);

  next();
};

module.exports = { rateLimitFeedback };

