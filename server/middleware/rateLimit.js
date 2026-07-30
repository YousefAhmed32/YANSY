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
 * Factory for a per-IP, in-memory sliding-window submission limiter.
 * Each named bucket gets its own counter so different endpoints don't
 * share (or steal) each other's quota.
 */
const createSubmissionLimiter = ({ bucket, max, windowMs = 60 * 60 * 1000, message }) => (req, res, next) => {
  // Skip rate limiting for authenticated users
  if (req.user) {
    return next();
  }

  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  const key = `${bucket}:${ipAddress}`;
  const now = Date.now();

  const entry = submissionStore.get(key) || { count: 0, timestamp: now };

  if (now - entry.timestamp > windowMs) {
    entry.count = 0;
    entry.timestamp = now;
  }

  if (entry.count >= max) {
    return res.status(429).json({
      error: message || 'Too many submissions. Please try again later.',
    });
  }

  entry.count++;
  submissionStore.set(key, entry);

  next();
};

/**
 * Rate limit middleware for guest feedback submissions
 * Allows 3 submissions per hour per IP address
 */
const rateLimitFeedback = createSubmissionLimiter({
  bucket: 'feedback',
  max: 3,
  windowMs: 60 * 60 * 1000,
  message: 'Too many submissions. Please try again later or log in to submit unlimited feedback.',
});

/**
 * Rate limit for the public lead-capture endpoints (project-requests submit/ai-lead).
 * Looser than feedback (legitimate visitors may retry after fixing a validation
 * error) but far tighter than the blanket 300/min API limiter these previously
 * relied on alone — 10 submissions/hour/IP is enough headroom for a real visitor,
 * not for a scripted flood.
 */
const rateLimitLeadSubmission = createSubmissionLimiter({
  bucket: 'lead',
  max: 10,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests submitted. Please try again later or reach us on WhatsApp.',
});

/**
 * Rate limit for the public (unauthenticated) AI chat widget. Every request
 * here costs real, metered LLM API spend with no per-user budget to fall
 * back on (unlike the authenticated AI routes, which are gated by
 * `aiRateLimit`'s daily-plan quota) — the blanket 300/min `apiLimiter` alone
 * left this endpoint open to sustained cost-draining abuse from a single IP.
 * 30/hour is generous for a real visitor's chat session, not for a script.
 */
const rateLimitAIChat = createSubmissionLimiter({
  bucket: 'ai-chat',
  max: 30,
  windowMs: 60 * 60 * 1000,
  message: 'Too many messages sent. Please try again later or contact us via WhatsApp.',
});

module.exports = { rateLimitFeedback, rateLimitLeadSubmission, rateLimitAIChat, createSubmissionLimiter };
