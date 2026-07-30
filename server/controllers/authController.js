const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const User   = require('../models/User');
const emailService = require('../utils/emailService');
const { logActivity } = require('./activityController');
const { normalizePhone, phoneLooksReasonable } = require('../utils/phone');

// ── Helpers ────────────────────────────────────────────────────────────────────
const generateEmailVerificationToken = () => {
  const raw    = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hashed };
};

const COOKIE_NAME        = 'token';
const COOKIE_MAX_AGE_MS  = 7 * 24 * 60 * 60 * 1000; // 7 days
const DB_QUERY_TIMEOUT   = 8_000;

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const setTokenCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE_MS,
    // 'none' was only ever needed if the API lived on a different *site*
    // (eTLD+1) than the frontend. It's deployed as api.yansytech.com behind
    // yansytech.com (see deploy/nginx) — same registrable domain, so 'lax'
    // still attaches the cookie on legitimate cross-subdomain fetches while
    // actually blocking the cross-site form-POST CSRF vector 'none' opened
    // up (there's no CSRF token anywhere in this app to otherwise guard it).
    sameSite: 'lax',
    secure: isProd,
    path: '/',
  });
};

const clearTokenCookie = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
  });
};

const log = {
  info:  (ctx, msg, data = {}) => console.log (`[AUTH] [${ctx}]`, msg, data),
  warn:  (ctx, msg, data = {}) => console.warn(`[AUTH] [${ctx}]`, msg, data),
  error: (ctx, msg, err)       => {
    console.error(`[AUTH] [${ctx}] ${msg}`);
    if (err) {
      console.error(`  name   : ${err.name}`);
      console.error(`  message: ${err.message}`);
      if (err.code) console.error(`  code   : ${err.code}`);
      if (process.env.NODE_ENV !== 'production') console.error(err.stack);
    }
  },
};

// Shared user response shape
const userResponse = (user) => ({
  _id:              user._id,
  email:            user.email,
  fullName:         user.fullName,
  phoneNumber:      user.phoneNumber,
  brandName:        user.brandName,
  companyName:      user.companyName,
  role:             user.role,
  emailVerified:    user.emailVerified,
  avatar:           user.avatar,
  authProvider:     user.authProvider,
  lastLoginMethod:  user.lastLoginMethod,
  createdAt:        user.createdAt,
  lastLoginAt:      user.lastLoginAt,
  stripeCustomerId: user.stripeCustomerId,
  // Onboarding + CRM fields
  isProfileComplete: user.isProfileComplete,
  country:          user.country,
  city:             user.city,
  businessType:     user.businessType,
  jobRole:          user.jobRole,
  website:          user.website,
  howFound:         user.howFound,
  primaryGoal:      user.primaryGoal,
  customerStatus:   user.customerStatus,
  leadScore:        user.leadScore,
  tags:             user.tags,
});

// ─── Register ──────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  const t0 = Date.now();
  log.info('register', 'Request received', { email: req.body?.email });

  try {
    const { email, password, fullName, phoneNumber, brandName, companyName, role } = req.body;

    // ── Validation ─────────────────────────────────────────────────────────────
    if (!email || !password || !fullName || !phoneNumber) {
      return res.status(400).json({
        error: 'Email, password, full name, and phone number are required.',
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    if (fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    }

    // Permissive by design: normalize away formatting noise (spaces, dashes,
    // parens, Arabic-Indic digits, invisible bidi marks from a pasted number)
    // instead of rejecting it outright — a strict charset regex here is what
    // traps users in an unrecoverable "invalid number" retry loop.
    if (!phoneLooksReasonable(phoneNumber)) {
      return res.status(400).json({ error: 'That phone number looks too short or too long — please check the digits.' });
    }

    if (!brandName && !companyName) {
      return res.status(400).json({
        error: 'Either a brand name or company name must be provided.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Duplicate check ────────────────────────────────────────────────────────
    log.info('register', 'Checking for existing user…');
    const existingUser = await User.findOne({ email: normalizedEmail })
      .select('_id')
      .maxTimeMS(DB_QUERY_TIMEOUT);

    if (existingUser) {
      log.warn('register', 'Duplicate email', { email: normalizedEmail });
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // ── Role resolution ────────────────────────────────────────────────────────
    const userCount = await User.countDocuments().maxTimeMS(DB_QUERY_TIMEOUT);
    const finalRole =
      role === 'ADMIN' && userCount === 0 ? 'ADMIN' : 'USER';

    // ── Create user ────────────────────────────────────────────────────────────
    log.info('register', 'Creating user…');
    const user = new User({
      email: normalizedEmail,
      password,
      fullName: fullName.trim(),
      phoneNumber: normalizePhone(phoneNumber) || phoneNumber.trim(),
      brandName:   brandName   ? brandName.trim()   : null,
      companyName: companyName ? companyName.trim()  : null,
      role: finalRole,
      authProvider: 'local',
      lastLoginMethod: 'email',
    });

    await user.save();
    log.info('register', 'User created', { userId: user._id, ms: Date.now() - t0 });

    // ── Create trial subscription (non-critical, fire-and-forget) ─────────────
    setImmediate(async () => {
      try {
        const Plan         = require('../models/Plan');
        const Subscription = require('../models/Subscription');
        const stripeService = require('../utils/stripeService');

        const planCount = await Plan.countDocuments();
        if (planCount === 0) {
          const { seedPlans } = require('../seeds/plans');
          await seedPlans();
        }

        const proPlan  = await Plan.findOne({ name: 'PROFESSIONAL' });
        const freePlan = await Plan.findOne({ name: 'FREE' });
        const activePlan = proPlan || freePlan;

        if (!activePlan) return;

        let stripeCustomerId = null;
        try {
          if (stripeService.isStripeConfigured()) {
            const customer = await stripeService.ensureStripeCustomer(user);
            stripeCustomerId = customer.id;
          }
        } catch { /* Stripe not configured - skip */ }

        const trialEndsAt = proPlan && proPlan.trialDays > 0
          ? new Date(Date.now() + proPlan.trialDays * 24 * 60 * 60 * 1000)
          : null;

        await Subscription.create({
          user:            user._id,
          plan:            activePlan._id,
          status:          trialEndsAt ? 'trialing' : 'free',
          billingCycle:    'monthly',
          trialStartedAt:  trialEndsAt ? new Date() : null,
          trialEndsAt,
          stripeCustomerId,
        });

        log.info('register', 'Subscription created', { userId: user._id, plan: activePlan.name });
      } catch (err) {
        log.error('register', 'Failed to create subscription', err);
      }
    });

    // ── Send email verification (non-critical, fire-and-forget) ───────────────
    setImmediate(async () => {
      try {
        const { raw: verifyRaw, hashed: verifyHashed } = generateEmailVerificationToken();
        await User.findByIdAndUpdate(user._id, {
          emailVerificationToken:   verifyHashed,
          emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        const { createNotification } = require('./notificationController');
        createNotification({
          userId: user._id,
          type: 'info',
          title: 'Please Verify Your Email',
          message: `Hi ${user.fullName?.split(' ')[0] || 'there'}! Check your inbox to verify your email and activate your account.`,
          link: '/app/dashboard',
        }).catch(() => {});

        await emailService.sendEmailVerification(user, verifyRaw);
      } catch (err) {
        console.error('[auth] Failed to send verification email:', err.message);
      }
    });

    // ── Token + response ───────────────────────────────────────────────────────
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    log.info('register', 'Registration complete', { userId: user._id, ms: Date.now() - t0 });

    return res.status(201).json({ user: userResponse(user), token });

  } catch (error) {
    log.error('register', 'Unhandled error', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'email';
      return res.status(400).json({ error: `An account with this ${field} already exists.` });
    }

    if (
      error.name === 'MongoServerSelectionError' ||
      error.name === 'MongoNetworkError'         ||
      error.message?.includes('timed out')
    ) {
      return res.status(503).json({
        error: 'Database temporarily unavailable. Please try again in a moment.',
      });
    }

    const isDev = process.env.NODE_ENV !== 'production';
    return res.status(500).json({
      error: isDev ? error.message : 'Registration failed. Please try again.',
      ...(isDev && { type: error.name }),
    });
  }
};

// ─── Login ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  const t0 = Date.now();
  log.info('login', 'Request received', { email: req.body?.email });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password +loginAttempts +lockUntil')
      .maxTimeMS(DB_QUERY_TIMEOUT);

    if (!user) {
      log.warn('login', 'User not found', { email });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(429).json({
        error: `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`,
      });
    }

    // Check account suspended
    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    // Detect Google-only accounts (no password set)
    if (!user.password) {
      return res.status(400).json({
        error: 'This account uses Google Sign-In. Please click "Continue with Google" to sign in.',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      log.warn('login', 'Wrong password', { email });
      await user.incrementLoginAttempts();
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Reset login attempts on success
    await User.findByIdAndUpdate(user._id, {
      $set:   { lastLoginAt: new Date(), loginAttempts: 0, lastLoginMethod: 'email' },
      $unset: { lockUntil: 1 },
    });

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    log.info('login', 'Login success', { userId: user._id, ms: Date.now() - t0 });
    logActivity({ userId: user._id, type: 'login', description: 'Signed in via email', req });

    return res.json({ user: userResponse(user), token });

  } catch (error) {
    log.error('login', 'Unhandled error', error);

    if (
      error.name === 'MongoServerSelectionError' ||
      error.name === 'MongoNetworkError'         ||
      error.message?.includes('timed out')
    ) {
      return res.status(503).json({
        error: 'Database temporarily unavailable. Please try again.',
      });
    }

    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// ─── Google Authentication ─────────────────────────────────────────────────────

/**
 * POST /api/auth/google
 * Accepts an authorization code from the frontend Google OAuth popup,
 * exchanges it for tokens, verifies the ID token, then creates or links
 * the user account and returns a JWT.
 */
exports.googleAuth = async (req, res) => {
  const t0 = Date.now();
  log.info('googleAuth', 'Request received');

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required.' });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      log.error('googleAuth', 'Google credentials not configured');
      return res.status(503).json({ error: 'Google Sign-In is not configured on this server.' });
    }

    // ── Exchange authorization code for tokens ─────────────────────────────────
    const { OAuth2Client } = require('google-auth-library');
    const oauth2Client = new OAuth2Client({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri:  'postmessage', // Required for popup-based flow
    });

    let googlePayload;
    try {
      const { tokens } = await oauth2Client.getToken(code);
      if (!tokens.id_token) {
        throw new Error('No id_token in Google response');
      }

      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      googlePayload = ticket.getPayload();
    } catch (err) {
      log.warn('googleAuth', 'Google token verification failed', { message: err.message });
      return res.status(401).json({
        error: 'Google authentication failed. Please try again.',
      });
    }

    const {
      sub: googleId,
      email,
      name,
      picture,
      email_verified,
    } = googlePayload;

    if (!email || !googleId) {
      return res.status(400).json({ error: 'Google account is missing required information.' });
    }

    if (!email_verified) {
      return res.status(400).json({ error: 'Google account email is not verified.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Find existing user (by googleId first, then by email for linking) ──────
    let user = await User.findOne({ googleId }).maxTimeMS(DB_QUERY_TIMEOUT);

    if (!user) {
      user = await User.findOne({ email: normalizedEmail }).maxTimeMS(DB_QUERY_TIMEOUT);
    }

    let isNewUser = false;

    if (user) {
      // ── Link / update existing account ────────────────────────────────────────
      const updates = {
        googleId,
        lastLoginAt:    new Date(),
        lastLoginMethod: 'google',
        emailVerified:  true,
      };

      // Set avatar only if user doesn't already have one
      if (!user.avatar && picture) {
        updates.avatar = picture;
      }

      await User.findByIdAndUpdate(user._id, updates);

      // Re-fetch to get updated fields
      user = await User.findById(user._id).maxTimeMS(DB_QUERY_TIMEOUT);

      log.info('googleAuth', 'Existing user linked/signed in', { userId: user._id, ms: Date.now() - t0 });
    } else {
      // ── Create new user ────────────────────────────────────────────────────────
      isNewUser = true;
      const userCount = await User.countDocuments().maxTimeMS(DB_QUERY_TIMEOUT);

      user = new User({
        email:          normalizedEmail,
        fullName:       name || 'Google User',
        googleId,
        avatar:         picture || null,
        authProvider:   'google',
        lastLoginMethod: 'google',
        lastLoginAt:    new Date(),
        emailVerified:  true, // Google already verified the email
        role:           userCount === 0 ? 'ADMIN' : 'USER',
      });

      await user.save();
      log.info('googleAuth', 'New Google user created', { userId: user._id, ms: Date.now() - t0 });

      // ── Create trial subscription (fire-and-forget) ────────────────────────
      setImmediate(async () => {
        try {
          const Plan         = require('../models/Plan');
          const Subscription = require('../models/Subscription');
          const stripeService = require('../utils/stripeService');

          const planCount = await Plan.countDocuments();
          if (planCount === 0) {
            const { seedPlans } = require('../seeds/plans');
            await seedPlans();
          }

          const proPlan    = await Plan.findOne({ name: 'PROFESSIONAL' });
          const freePlan   = await Plan.findOne({ name: 'FREE' });
          const activePlan = proPlan || freePlan;
          if (!activePlan) return;

          let stripeCustomerId = null;
          try {
            if (stripeService.isStripeConfigured()) {
              const customer = await stripeService.ensureStripeCustomer(user);
              stripeCustomerId = customer.id;
            }
          } catch { /* Stripe not configured */ }

          const trialEndsAt = proPlan && proPlan.trialDays > 0
            ? new Date(Date.now() + proPlan.trialDays * 24 * 60 * 60 * 1000)
            : null;

          await Subscription.create({
            user:            user._id,
            plan:            activePlan._id,
            status:          trialEndsAt ? 'trialing' : 'free',
            billingCycle:    'monthly',
            trialStartedAt:  trialEndsAt ? new Date() : null,
            trialEndsAt,
            stripeCustomerId,
          });
        } catch (err) {
          log.error('googleAuth', 'Failed to create subscription', err);
        }
      });
    }

    // ── Generate JWT + cookie ──────────────────────────────────────────────────
    const token = generateToken(user._id);
    setTokenCookie(res, token);
    logActivity({ userId: user._id, type: isNewUser ? 'account_created' : 'login', description: isNewUser ? 'Account created via Google' : 'Signed in via Google' });

    return res.status(isNewUser ? 201 : 200).json({
      user:      userResponse(user),
      token,
      isNewUser,
    });

  } catch (error) {
    log.error('googleAuth', 'Unhandled error', error);

    if (
      error.name === 'MongoServerSelectionError' ||
      error.name === 'MongoNetworkError'         ||
      error.message?.includes('timed out')
    ) {
      return res.status(503).json({ error: 'Database temporarily unavailable. Please try again.' });
    }

    return res.status(500).json({ error: 'Google authentication failed. Please try again.' });
  }
};

// ─── Get current user ──────────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .maxTimeMS(DB_QUERY_TIMEOUT);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let subscription = null;
    try {
      const Subscription = require('../models/Subscription');
      subscription = await Subscription.findOne({ user: user._id })
        .populate('plan', 'name displayName features price trialDays')
        .lean()
        .maxTimeMS(5000);

      if (subscription?.status === 'trialing' && subscription?.trialEndsAt && new Date(subscription.trialEndsAt) < new Date()) {
        const Plan     = require('../models/Plan');
        const freePlan = await Plan.findOne({ name: 'FREE' });
        if (freePlan) {
          await Subscription.findByIdAndUpdate(subscription._id, {
            plan:   freePlan._id,
            status: 'free',
          });
          subscription.status = 'free';
          subscription.plan   = freePlan;
        }
      }
    } catch { /* non-critical */ }

    return res.json({ user: userResponse(user), subscription });
  } catch (error) {
    log.error('getMe', 'Unhandled error', error);
    return res.status(500).json({ error: 'Failed to retrieve user information.' });
  }
};

// ─── Logout ────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/logout
 */
exports.logout = (req, res) => {
  clearTokenCookie(res);
  return res.json({ message: 'Logged out successfully.' });
};

// ─── Forgot Password ───────────────────────────────────────────────────────────

/**
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password +passwordResetToken +passwordResetExpires')
      .maxTimeMS(DB_QUERY_TIMEOUT);

    // Always respond 200 to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account with that email exists, we sent a reset link.' });
    }

    // Google-only accounts cannot use password reset
    if (!user.password && user.authProvider === 'google') {
      return res.json({ message: 'If an account with that email exists, we sent a reset link.' });
    }

    const rawToken    = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken   = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    setImmediate(async () => {
      try {
        await emailService.sendPasswordReset(user, rawToken);
      } catch (err) {
        console.error('[auth] Failed to send reset email:', err.message);
        user.passwordResetToken   = null;
        user.passwordResetExpires = null;
        await user.save({ validateBeforeSave: false });
      }
    });

    return res.json({ message: 'If an account with that email exists, we sent a reset link.' });
  } catch (error) {
    log.error('forgotPassword', 'Unhandled error', error);
    return res.status(500).json({ error: 'Failed to process request. Please try again.' });
  }
};

// ─── Verify Email ──────────────────────────────────────────────────────────────

/**
 * GET /api/auth/verify-email/:token
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ error: 'Verification token is required.' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken:   hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({ error: 'Verification link is invalid or has expired. Please request a new one.' });
    }

    user.emailVerified            = true;
    user.emailVerificationToken   = null;
    user.emailVerificationExpires = null;
    await user.save({ validateBeforeSave: false });

    setImmediate(async () => {
      try {
        const { createNotification } = require('./notificationController');
        await createNotification({
          userId: user._id,
          type: 'success',
          title: 'Email Verified',
          message: 'Your email address has been successfully verified. Your account is fully active.',
        });
      } catch { /* non-critical */ }
    });

    log.info('verifyEmail', 'Email verified', { userId: user._id });
    return res.json({ message: 'Email verified successfully. Your account is now fully active.' });
  } catch (error) {
    log.error('verifyEmail', 'Unhandled error', error);
    return res.status(500).json({ error: 'Failed to verify email. Please try again.' });
  }
};

/**
 * POST /api/auth/resend-verification
 */
exports.resendVerification = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

    const user = await User.findById(req.user._id).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.emailVerified) return res.json({ message: 'Your email is already verified.' });

    if (user.emailVerificationExpires) {
      const tokenAge = Date.now() - (user.emailVerificationExpires.getTime() - 24 * 60 * 60 * 1000);
      if (tokenAge < 5 * 60 * 1000) {
        return res.status(429).json({ error: 'Please wait at least 5 minutes before requesting another verification email.' });
      }
    }

    const { raw, hashed } = generateEmailVerificationToken();
    user.emailVerificationToken   = hashed;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await emailService.sendEmailVerification(user, raw);

    return res.json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (error) {
    log.error('resendVerification', 'Unhandled error', error);
    return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
  }
};

// ─── Reset Password ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    user.password             = password;
    user.passwordResetToken   = null;
    user.passwordResetExpires = null;
    await user.save();

    const newToken = generateToken(user._id);
    setTokenCookie(res, newToken);

    return res.json({ message: 'Password reset successfully. You are now logged in.', token: newToken });
  } catch (error) {
    log.error('resetPassword', 'Unhandled error', error);
    return res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
};
