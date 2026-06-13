# YANSY — Phase 3: Revenue Engine
> Billing System Architecture & Implementation Plan
> Date: 2026-05-29

---

## ARCHITECTURE ANALYSIS

### Existing Foundation (What We Build On)
- **User model**: `email`, `role`, `isActive`, `passwordResetToken` — no subscription field
- **Invoice model**: Full CRUD, multi-currency, Stripe PaymentIntent field already exists
- **Auth middleware**: `authenticate` + `requireAdmin` — no plan-level gating
- **Redux store**: `auth`, `projects`, `messages`, `notifications` slices — no billing slice
- **Email service**: All transactional emails working, templates ready

### What We Are Building
```
User ──→ Subscription ──→ Plan (FREE / PROFESSIONAL / ENTERPRISE)
     ↓                         ↓
stripeCustomerId          featureFlags {}
                               ↓
                         requirePlan() middleware
                               ↓
                         Feature-gated routes
```

---

## DATA MODELS

### Plan Model
```javascript
{
  name:         'FREE' | 'PROFESSIONAL' | 'ENTERPRISE',
  displayName:  string,
  price:        { monthly: number, annual: number },     // in cents
  currency:     'USD',
  stripePriceId:{ monthly: string, annual: string },    // Stripe Price IDs
  stripeProductId: string,
  features: {
    maxProjects:       number,   // -1 = unlimited
    maxStorageGb:      number,
    maxTeamMembers:    number,   // -1 = unlimited
    aiFeatures:        boolean,
    invoicing:         boolean,
    apiAccess:         boolean,
    customBranding:    boolean,
    prioritySupport:   boolean,
    advancedAnalytics: boolean,
    whiteLabel:        boolean,
    sso:               boolean,
  },
  trialDays:    number,    // 14 for PROFESSIONAL, 0 for others
  isActive:     boolean,
  order:        number,    // display order on pricing page
}
```

### Subscription Model
```javascript
{
  user:                ObjectId → User,
  plan:                ObjectId → Plan,
  status:              'trialing' | 'active' | 'past_due' | 'cancelled' | 'paused' | 'incomplete',
  billingCycle:        'monthly' | 'annual',
  
  // Trial
  trialStartedAt:      Date,
  trialEndsAt:         Date,
  
  // Billing period
  currentPeriodStart:  Date,
  currentPeriodEnd:    Date,
  cancelAtPeriodEnd:   boolean,
  cancelledAt:         Date,
  
  // Stripe IDs
  stripeSubscriptionId: string,
  stripeCustomerId:     string,   // mirrored from User for query speed
  stripePaymentMethodId: string,  // last used payment method
  
  // Metadata
  upgradedFrom:        ObjectId → Plan,
  downgradedFrom:      ObjectId → Plan,
  lastEventAt:         Date,
}
```

### User Model additions
```javascript
{
  // existing fields...
  stripeCustomerId: string,   // Stripe customer ID
  subscription:     ObjectId → Subscription (virtual or populated)
}
```

---

## STRIPE INTEGRATION DESIGN

### Stripe Events We Handle
| Event | Action |
|---|---|
| `checkout.session.completed` | Activate subscription after checkout |
| `customer.subscription.updated` | Sync status, plan, dates |
| `customer.subscription.deleted` | Mark cancelled, downgrade to FREE |
| `invoice.payment_succeeded` | Record payment, extend billing period |
| `invoice.payment_failed` | Mark past_due, notify user |
| `payment_intent.succeeded` | Mark YANSY invoice as paid |
| `customer.subscription.trial_will_end` | Send trial ending email (3 days before) |

### Checkout Flow
```
Client clicks "Upgrade" 
  → POST /api/billing/checkout { planId, billingCycle }
  → Server creates Stripe Checkout Session
  → Client redirects to Stripe hosted checkout
  → Stripe redirects back to /app/billing?success=1
  → Webhook: checkout.session.completed
  → Subscription activated in DB
```

### Customer Portal Flow
```
Client clicks "Manage Billing"
  → POST /api/billing/portal
  → Server creates Stripe Customer Portal Session
  → Client redirects to Stripe portal
  → User changes plan/payment method/cancels there
  → Webhooks sync changes back to DB
```

### Invoice Payment Flow (one-time)
```
Client views invoice on /app/invoices/:id
  → Client clicks "Pay Now"
  → POST /api/billing/invoice/:id/checkout
  → Server creates Stripe Payment Intent
  → Client uses Stripe Elements to pay
  → Webhook: payment_intent.succeeded
  → YANSY Invoice marked as paid
```

---

## FEATURE FLAG MIDDLEWARE

```javascript
// Usage in routes:
router.post('/ai/insight', authenticate, requirePlan('PROFESSIONAL'), ctrl.getInsight);
router.get('/api-keys',    authenticate, requirePlan('ENTERPRISE'),    ctrl.listApiKeys);

// Middleware:
const requirePlan = (...plans) => async (req, res, next) => {
  const sub = await Subscription.findOne({ user: req.user._id })
                                 .populate('plan');
  if (!sub || !plans.includes(sub.plan.name)) {
    return res.status(402).json({
      error: 'This feature requires a higher plan.',
      requiredPlan: plans[0],
      currentPlan: sub?.plan?.name || 'FREE',
    });
  }
  req.subscription = sub;
  next();
};
```

---

## TRIAL SYSTEM

- Every new user gets 14 days FREE trial of PROFESSIONAL
- No credit card required for trial
- Trial tracked in Subscription model (`status: 'trialing'`)
- 3 days before end → email notification
- Trial ends → cron or webhook → downgrade to FREE
- Can upgrade (add payment) at any time during trial to continue PROFESSIONAL

**Trial activation on registration:**
```javascript
// authController.register — after user.save():
const freePlan = await Plan.findOne({ name: 'FREE' });
const proPlan  = await Plan.findOne({ name: 'PROFESSIONAL' });

// Create Stripe customer
const customer = await stripe.customers.create({ email: user.email, name: user.fullName });
user.stripeCustomerId = customer.id;
await user.save();

// Start FREE with 14-day PROFESSIONAL trial
await Subscription.create({
  user:            user._id,
  plan:            proPlan._id,
  status:          'trialing',
  billingCycle:    'monthly',
  trialStartedAt:  new Date(),
  trialEndsAt:     new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  stripeCustomerId: customer.id,
});
```

---

## FRONTEND ARCHITECTURE

### New Redux Slice: `billingSlice.js`
```javascript
{
  subscription: {
    plan: { name, displayName, features },
    status: 'trialing' | 'active' | 'cancelled',
    trialEndsAt: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: boolean,
  },
  plans: [],       // all available plans
  loading: false,
  error: null,
}
```

### New Pages
1. **PricingPage.jsx** — Public pricing comparison table (FREE/PRO/ENTERPRISE)
2. **BillingPage.jsx** — Authenticated billing management (current plan, usage, upgrade, history)

### Upgrade Flow UI
- Plan badge in sidebar/account card
- "Upgrade" CTAs on feature-gated areas
- Upgrade modal with plan comparison
- Stripe Checkout redirect
- Success/cancel return handling

### Feature Gate Component
```jsx
// Usage:
<FeatureGate requires="PROFESSIONAL">
  <AIInsightCard />
</FeatureGate>

// Shows upgrade prompt if user's plan < required
```

---

## API ENDPOINTS

```
GET    /api/billing/plans              — Public: list all active plans
GET    /api/billing/subscription       — Auth: get current user's subscription
POST   /api/billing/checkout           — Auth: create Stripe Checkout session
POST   /api/billing/portal             — Auth: create Stripe Customer Portal session
POST   /api/billing/cancel             — Auth: cancel subscription at period end
POST   /api/billing/reactivate         — Auth: undo cancellation
POST   /api/billing/invoice/:id/checkout — Auth: pay a YANSY invoice via Stripe
POST   /api/billing/webhook            — Stripe webhook (no auth, signature verified)

GET    /api/admin/billing/subscriptions — Admin: all subscriptions with pagination
PATCH  /api/admin/billing/:userId/plan  — Admin: manually change user plan
POST   /api/admin/billing/plans/seed    — Admin: seed/update plan definitions
GET    /api/admin/billing/revenue       — Admin: revenue metrics
```

---

## IMPLEMENTATION ORDER

1. ✅ Plan model (`server/models/Plan.js`)
2. ✅ Subscription model (`server/models/Subscription.js`)
3. ✅ User model — add `stripeCustomerId` field
4. ✅ Stripe service utility (`server/utils/stripeService.js`)
5. ✅ Plan seed script (`server/seeds/plans.js`)
6. ✅ Subscription middleware (`server/middleware/requirePlan.js`)
7. ✅ Billing controller (`server/controllers/billingController.js`)
8. ✅ Admin billing controller (`server/controllers/adminBillingController.js`)
9. ✅ Billing routes (`server/routes/billing.js`)
10. ✅ Webhook handler (inside billing routes)
11. ✅ Register hook — create Stripe customer + trial subscription
12. ✅ Auth `/me` — populate subscription in response
13. ✅ Email templates for billing events
14. ✅ `billingSlice.js` Redux slice
15. ✅ `PricingPage.jsx` — public pricing
16. ✅ `BillingPage.jsx` — user billing management
17. ✅ `FeatureGate.jsx` — component for plan-gated UI
18. ✅ `PlanBadge.jsx` — sidebar plan indicator
19. ✅ App.jsx — add billing routes
20. ✅ Layout.jsx — add billing nav + plan badge
21. ✅ Tests — billing middleware, plan model, subscription model
22. ✅ Build verification
23. ✅ PHASE3_REPORT.md

---

## RISK ANALYSIS

| Risk | Mitigation |
|---|---|
| Stripe not configured | Graceful degradation: all billing routes return 503 with clear error if `STRIPE_SECRET_KEY` not set |
| Webhook signature fails | Log and return 400; never process unverified webhooks |
| Trial expiry timing | Trial handled on-request (middleware checks `trialEndsAt < now`) not by cron |
| User has no subscription | Always has one — created on registration; if missing, treated as FREE |
| Plan prices change | Stored in DB; admin can update; Stripe prices are separate |
| Duplicate webhooks | Idempotency: check Stripe event ID before processing |

---

## ENVIRONMENT VARIABLES REQUIRED

```
STRIPE_SECRET_KEY=sk_live_...          (or sk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_...        (from Stripe CLI or dashboard)
STRIPE_PUBLISHABLE_KEY=pk_live_...     (sent to frontend)
```

---

## DEPENDENCY

```bash
cd server && npm install stripe
```

No new client dependencies (uses existing fetch/axios).

---

*PHASE3_PLAN.md — Approved implementation plan. Beginning execution.*
