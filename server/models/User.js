const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    default: null,
    select: false,
    minlength: [6, 'Password must be at least 6 characters'],
    // Not required at schema level — controllers enforce it for email/password flow.
    // select:false means every read site that needs the hash (login, change/
    // delete-account password checks, the google-only detection in
    // forgotPassword) must explicitly `.select('+password')` — this is enforced
    // by schema now rather than by every future query remembering `-password`.
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters']
  },
  phoneNumber: {
    type: String,
    default: null,
    trim: true,
    match: [/^[\d\s\-\+\(\)]+$/, 'Please provide a valid phone number'],
    // Not required at schema level — controllers enforce it for email/password flow
  },
  brandName: {
    type: String,
    trim: true,
    default: null
  },
  companyName: {
    type: String,
    trim: true,
    default: null
  },
  role: {
    type: String,
    enum: ['USER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    default: 'USER',
  },
  // ── OAuth ──────────────────────────────────────────────────────────────────
  googleId: {
    type: String,
    default: null,
    index: { sparse: true }, // sparse: true so null values don't conflict
  },
  avatar: {
    type: String,
    default: null,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  lastLoginMethod: {
    type: String,
    enum: ['email', 'google'],
    default: 'email',
  },
  // ── Password reset ─────────────────────────────────────────────────────────
  passwordResetToken: {
    type: String,
    default: null,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    default: null,
    select: false,
  },
  // ── Account status ─────────────────────────────────────────────────────────
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  // ── Email verification ─────────────────────────────────────────────────────
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    default: null,
    select: false,
  },
  emailVerificationExpires: {
    type: Date,
    default: null,
    select: false,
  },
  // ── Account lockout after failed logins ───────────────────────────────────
  loginAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
  lockUntil: {
    type: Date,
    default: null,
    select: false,
  },
  // ── Stripe ─────────────────────────────────────────────────────────────────
  stripeCustomerId: {
    type: String,
    default: null,
    index: true,
  },

  // ── Onboarding / Profile Completion ───────────────────────────────────────
  isProfileComplete: {
    type: Boolean,
    default: false,
  },
  // When/how completion happened — lets us evolve the onboarding flow later
  // without breaking users who completed an earlier version of it.
  onboardingCompletedAt: { type: Date, default: null },
  onboardingVersion: { type: Number, default: null },
  communicationPreference: {
    type: String,
    enum: ['whatsapp', 'phone', 'email', null],
    default: null,
  },
  country: { type: String, trim: true, default: null },
  city: { type: String, trim: true, default: null },
  businessType: {
    type: String,
    enum: ['startup', 'agency', 'enterprise', 'freelancer', 'ecommerce', 'saas', 'other', null],
    default: null,
  },
  jobRole: { type: String, trim: true, default: null },
  website: { type: String, trim: true, default: null },
  howFound: {
    type: String,
    enum: ['google', 'social_media', 'referral', 'advertisement', 'blog', 'other', null],
    default: null,
  },
  primaryGoal: {
    type: String,
    enum: ['website', 'app', 'branding', 'marketing', 'saas', 'ecommerce', 'consulting', 'other', null],
    default: null,
  },

  // ── CRM (admin-managed) ────────────────────────────────────────────────────
  tags: [{ type: String, trim: true }],
  leadScore: { type: Number, min: 0, max: 100, default: 0 },
  customerStatus: {
    type: String,
    enum: ['lead', 'prospect', 'active', 'vip', 'churned', 'inactive'],
    default: 'lead',
  },
  adminNotes: { type: String, trim: true, default: null, select: false },
}, {
  timestamps: true,
});

// Compound indexes for performance
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving — skip for OAuth users with no password
userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Compare password — safe for OAuth users with null password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Account lockout helpers
userSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

userSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  const MAX_ATTEMPTS = 10;
  const LOCK_TIME_MS = 2 * 60 * 60 * 1000; // 2 hours
  if (this.loginAttempts + 1 >= MAX_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME_MS };
  }
  return this.updateOne(updates);
};

module.exports = mongoose.model('User', userSchema);
