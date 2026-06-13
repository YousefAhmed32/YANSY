import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

// ── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchPlans = createAsyncThunk(
  'billing/fetchPlans',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/billing/plans');
      return res.data.plans || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to load plans.');
    }
  }
);

export const fetchSubscription = createAsyncThunk(
  'billing/fetchSubscription',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/billing/subscription');
      return res.data.subscription;
    } catch (err) {
      // Non-critical — gracefully degrade
      return null;
    }
  }
);

export const createCheckout = createAsyncThunk(
  'billing/createCheckout',
  async ({ planId, billingCycle }, { rejectWithValue }) => {
    try {
      const res = await api.post('/billing/checkout', { planId, billingCycle });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to start checkout.');
    }
  }
);

export const createPortal = createAsyncThunk(
  'billing/createPortal',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post('/billing/portal');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to open billing portal.');
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  'billing/cancel',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post('/billing/cancel');
      return res.data.subscription;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to cancel subscription.');
    }
  }
);

export const reactivateSubscription = createAsyncThunk(
  'billing/reactivate',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post('/billing/reactivate');
      return res.data.subscription;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to reactivate subscription.');
    }
  }
);

export const fetchBillingHistory = createAsyncThunk(
  'billing/fetchHistory',
  async ({ page = 1 } = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/billing/history', { params: { page } });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to load billing history.');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const billingSlice = createSlice({
  name: 'billing',
  initialState: {
    subscription: null,
    plans:        [],
    history:      { invoices: [], total: 0, currentPage: 1, totalPages: 0 },
    loading:      false,
    plansLoading: false,
    historyLoading: false,
    error:        null,
  },
  reducers: {
    clearBillingError: (state) => { state.error = null; },
    // Used to update subscription from getMe response
    setSubscription: (state, action) => {
      state.subscription = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Plans
      .addCase(fetchPlans.pending,    (state) => { state.plansLoading = true; })
      .addCase(fetchPlans.fulfilled,  (state, action) => { state.plansLoading = false; state.plans = action.payload; })
      .addCase(fetchPlans.rejected,   (state) => { state.plansLoading = false; })

      // Subscription
      .addCase(fetchSubscription.pending,   (state) => { state.loading = true; })
      .addCase(fetchSubscription.fulfilled, (state, action) => { state.loading = false; state.subscription = action.payload; })
      .addCase(fetchSubscription.rejected,  (state) => { state.loading = false; })

      // Checkout
      .addCase(createCheckout.pending,    (state) => { state.loading = true; state.error = null; })
      .addCase(createCheckout.fulfilled,  (state) => { state.loading = false; })
      .addCase(createCheckout.rejected,   (state, action) => { state.loading = false; state.error = action.payload; })

      // Portal
      .addCase(createPortal.pending,    (state) => { state.loading = true; state.error = null; })
      .addCase(createPortal.fulfilled,  (state) => { state.loading = false; })
      .addCase(createPortal.rejected,   (state, action) => { state.loading = false; state.error = action.payload; })

      // Cancel
      .addCase(cancelSubscription.pending,    (state) => { state.loading = true; state.error = null; })
      .addCase(cancelSubscription.fulfilled,  (state, action) => { state.loading = false; state.subscription = action.payload; })
      .addCase(cancelSubscription.rejected,   (state, action) => { state.loading = false; state.error = action.payload; })

      // Reactivate
      .addCase(reactivateSubscription.pending,    (state) => { state.loading = true; state.error = null; })
      .addCase(reactivateSubscription.fulfilled,  (state, action) => { state.loading = false; state.subscription = action.payload; })
      .addCase(reactivateSubscription.rejected,   (state, action) => { state.loading = false; state.error = action.payload; })

      // History
      .addCase(fetchBillingHistory.pending,   (state) => { state.historyLoading = true; })
      .addCase(fetchBillingHistory.fulfilled, (state, action) => { state.historyLoading = false; state.history = action.payload; })
      .addCase(fetchBillingHistory.rejected,  (state) => { state.historyLoading = false; });
  },
});

export const { clearBillingError, setSubscription } = billingSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectCurrentPlan = (state) =>
  state.billing.subscription?.plan?.name || 'FREE';

export const selectSubscriptionStatus = (state) =>
  state.billing.subscription?.status || 'free';

export const selectIsTrialing = (state) => {
  const sub = state.billing.subscription;
  return sub?.status === 'trialing' && sub?.trialEndsAt && new Date(sub.trialEndsAt) > new Date();
};

export const selectTrialDaysLeft = (state) => {
  const sub = state.billing.subscription;
  if (!sub?.trialEndsAt || sub?.status !== 'trialing') return 0;
  const diff = new Date(sub.trialEndsAt) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const selectHasFeature = (featureName) => (state) => {
  const plan = state.billing.subscription?.plan;
  if (!plan) return false;
  return Boolean(plan.features?.[featureName]);
};

export const selectCanAccess = (requiredPlan) => (state) => {
  const hierarchy = { FREE: 0, PROFESSIONAL: 1, ENTERPRISE: 2 };
  const currentPlan = selectCurrentPlan(state);
  const status = selectSubscriptionStatus(state);

  // Check trial expiry
  if (status === 'trialing') {
    const sub = state.billing.subscription;
    if (sub?.trialEndsAt && new Date(sub.trialEndsAt) < new Date()) {
      return (hierarchy['FREE'] || 0) >= (hierarchy[requiredPlan] || 0);
    }
  }

  return (hierarchy[currentPlan] || 0) >= (hierarchy[requiredPlan] || 0);
};

export default billingSlice.reducer;
