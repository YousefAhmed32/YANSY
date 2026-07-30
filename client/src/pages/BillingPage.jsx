import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CreditCard, Zap, Crown, Star, Check, X, AlertTriangle,
  Clock, ChevronRight, RefreshCw, FileText, ExternalLink,
} from 'lucide-react';
import {
  fetchPlans, fetchSubscription, fetchBillingHistory,
  createCheckout, createPortal, cancelSubscription, reactivateSubscription,
  selectCurrentPlan, selectSubscriptionStatus, selectIsTrialing, selectTrialDaysLeft,
  clearBillingError,
} from '../store/billingSlice';
import { useLanguage } from '../contexts/LanguageContext';
import { trackInitiateCheckout, trackPurchase } from '../utils/metaPixel';

const PLAN_ICONS  = { FREE: Star, PROFESSIONAL: Zap, ENTERPRISE: Crown };
const STATUS_CFG  = {
  trialing:   { label: 'Trial',      color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  active:     { label: 'Active',     color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  past_due:   { label: 'Past Due',   color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  cancelled:  { label: 'Cancelled',  color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  free:       { label: 'Free',       color: 'rgba(0,0,0,0.45)', bg: 'rgba(0,0,0,0.04)' },
  paused:     { label: 'Paused',     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  incomplete: { label: 'Incomplete', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
};

const BillingPage = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { dir }    = useLanguage();

  const { subscription, plans, history, loading, historyLoading, error } = useSelector(s => s.billing);
  const currentPlan = useSelector(selectCurrentPlan);
  const status      = useSelector(selectSubscriptionStatus);
  const isTrialing  = useSelector(selectIsTrialing);
  const daysLeft    = useSelector(selectTrialDaysLeft);

  const [selectedPlan,   setSelectedPlan]   = useState(null);
  const [billingCycle,   setBillingCycle]   = useState('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading,  setPortalLoading]  = useState(false);
  const [cancelConfirm,  setCancelConfirm]  = useState(false);
  const [successMsg,     setSuccessMsg]     = useState('');
  const pendingPurchaseRef = useRef(false);

  const gold      = '#2563EB';
  const bg        = '#fafaf9';
  const surface   = 'rgba(0,0,0,0.03)';
  const border    = 'rgba(0,0,0,0.08)';
  const textMain  = '#0a0a0a';
  const textMuted = 'rgba(0,0,0,0.4)';

  useEffect(() => {
    dispatch(fetchPlans());
    dispatch(fetchSubscription());
    dispatch(fetchBillingHistory());

    // Handle return from Stripe checkout
    const params = new URLSearchParams(location.search);
    if (params.get('checkout') === 'success') {
      setSuccessMsg('Payment successful! Your subscription has been activated.');
      pendingPurchaseRef.current = true;
      dispatch(fetchSubscription());
      navigate('/app/billing', { replace: true });
    }
    if (params.get('checkout') === 'cancelled') {
      navigate('/app/billing', { replace: true });
    }

    // Handle plan pre-selection from Pricing page
    if (location.state?.selectPlan) {
      setSelectedPlan(location.state.selectPlan);
      if (location.state.billingCycle) setBillingCycle(location.state.billingCycle);
    }
  }, []);

  // Fire Purchase once the freshly-activated subscription (with its real plan/price)
  // has loaded back in — firing it eagerly at the `checkout=success` redirect would
  // have no plan/value data yet since fetchSubscription hasn't resolved.
  useEffect(() => {
    if (pendingPurchaseRef.current && !loading && subscription) {
      pendingPurchaseRef.current = false;
      const cycle = subscription.billingCycle || billingCycle;
      const value = currentPlan?.price
        ? (cycle === 'annual' ? currentPlan.price.annual : currentPlan.price.monthly)
        : undefined;
      trackPurchase(value, 'USD', { content_name: currentPlan?.name, content_type: 'subscription' });
    }
  }, [loading, subscription, currentPlan, billingCycle]);

  const handleUpgrade = async (plan) => {
    if (plan.price?.monthly === 0) return;
    setCheckoutLoading(true);
    try {
      const result = await dispatch(createCheckout({ planId: plan._id, billingCycle })).unwrap();
      if (result.checkoutUrl) {
        const value = billingCycle === 'annual' ? plan.price?.annual : plan.price?.monthly;
        trackInitiateCheckout({ value, currency: 'USD', content_name: plan.name, content_type: 'subscription' });
        window.location.href = result.checkoutUrl;
      }
    } catch {
      // error in redux state
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const result = await dispatch(createPortal()).unwrap();
      if (result.portalUrl) window.location.href = result.portalUrl;
    } catch {} finally { setPortalLoading(false); }
  };

  const handleCancel = async () => {
    await dispatch(cancelSubscription());
    setCancelConfirm(false);
    setSuccessMsg('Your subscription will be cancelled at the end of the billing period.');
  };

  const handleReactivate = async () => {
    await dispatch(reactivateSubscription());
    setSuccessMsg('Your subscription has been reactivated.');
  };

  const sub     = subscription;
  const stCfg   = STATUS_CFG[status] || STATUS_CFG.free;
  const Icon    = PLAN_ICONS[currentPlan] || Star;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const formatAmount = (amount, currency = 'USD') =>
    `${amount || 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: bg, color: textMain, padding: '32px 32px 80px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 600, color: textMain, margin: '0 0 6px', fontFamily: "'Inter',system-ui,sans-serif" }}>
          Billing & Subscription
        </h1>
        <p style={{ fontSize: '13px', color: textMuted }}>Manage your plan, payment method, and billing history.</p>
      </div>

      {/* Success message */}
      {successMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#34d399' }}>
          {successMsg}
          <button onClick={() => setSuccessMsg('')} style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', fontSize: '12px' }}>✕</button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#f87171' }}>
          {error}
          <button onClick={() => dispatch(clearBillingError())} style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '12px' }}>✕</button>
        </div>
      )}

      {/* Current plan card */}
      <div style={{ padding: '24px', background: surface, border: `1px solid ${currentPlan !== 'FREE' ? 'rgba(37,99,235,0.2)' : border}`, borderRadius: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon style={{ width: '22px', height: '22px', color: gold }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px', fontWeight: 300, color: textMain, fontFamily: "'Inter',system-ui,sans-serif" }}>
                  {sub?.plan?.displayName || 'Starter'} Plan
                </span>
                <span style={{
                  padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 300,
                  background: stCfg.bg, color: stCfg.color, border: `1px solid ${stCfg.color}25`,
                }}>
                  {stCfg.label}
                </span>
              </div>
              {isTrialing && (
                <div style={{ fontSize: '12px', color: gold, marginTop: '4px' }}>
                  <Clock style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
                  Trial ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                  {sub?.trialEndsAt && ` — ${formatDate(sub.trialEndsAt)}`}
                </div>
              )}
              {sub?.currentPeriodEnd && status === 'active' && (
                <div style={{ fontSize: '11px', color: textMuted, marginTop: '4px' }}>
                  Renews {formatDate(sub.currentPeriodEnd)}
                  {sub.cancelAtPeriodEnd && (
                    <span style={{ marginLeft: '8px', color: '#f87171' }}>· Cancels on this date</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(status === 'active' || status === 'past_due') && sub?.stripeSubscriptionId && (
              <>
                {sub.cancelAtPeriodEnd ? (
                  <button
                    onClick={handleReactivate}
                    disabled={loading}
                    style={{ padding: '8px 16px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '7px', color: '#34d399', fontSize: '11px', fontWeight: 400, letterSpacing: '0.08em', cursor: 'pointer' }}
                  >
                    Reactivate
                  </button>
                ) : (
                  !cancelConfirm && (
                    <button
                      onClick={() => setCancelConfirm(true)}
                      style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${border}`, borderRadius: '7px', color: textMuted, fontSize: '11px', fontWeight: 300, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  )
                )}
                <button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'transparent', border: `1px solid ${border}`, borderRadius: '7px', color: textMuted, fontSize: '11px', fontWeight: 300, cursor: 'pointer' }}
                >
                  {portalLoading ? <RefreshCw style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} /> : <ExternalLink style={{ width: '12px', height: '12px' }} />}
                  Manage Billing
                </button>
              </>
            )}
          </div>
        </div>

        {/* Cancel confirm */}
        {cancelConfirm && (
          <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <AlertTriangle style={{ width: '14px', height: '14px', color: '#f87171' }} />
              <span style={{ fontSize: '12px', fontWeight: 400, color: '#f87171' }}>Confirm cancellation</span>
            </div>
            <p style={{ fontSize: '12px', color: textMuted, marginBottom: '12px' }}>
              Your subscription will remain active until the end of the current billing period. You won't be charged again.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCancel} disabled={loading} style={{ padding: '7px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '6px', color: '#f87171', fontSize: '11px', cursor: 'pointer' }}>
                Yes, cancel
              </button>
              <button onClick={() => setCancelConfirm(false)} style={{ padding: '7px 14px', background: 'transparent', border: `1px solid ${border}`, borderRadius: '6px', color: textMuted, fontSize: '11px', cursor: 'pointer' }}>
                Keep subscription
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Past due warning */}
      {status === 'past_due' && (
        <div style={{ padding: '14px 16px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle style={{ width: '16px', height: '16px', color: '#f87171', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 400, color: '#f87171', marginBottom: '2px' }}>Payment failed</div>
            <div style={{ fontSize: '11px', color: textMuted }}>Please update your payment method to restore full access.</div>
          </div>
          <button onClick={handlePortal} style={{ marginLeft: 'auto', padding: '7px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '6px', color: '#f87171', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Update Payment
          </button>
        </div>
      )}

      {/* Plan comparison */}
      {(currentPlan === 'FREE' || isTrialing || status === 'trialing') && (
        <div style={{ padding: '24px', background: surface, border: `1px solid ${border}`, borderRadius: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 400, color: textMain, margin: 0 }}>Upgrade your plan</h2>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.04)', borderRadius: '8px', padding: '3px', gap: '3px' }}>
              {['monthly', 'annual'].map(c => (
                <button key={c} onClick={() => setBillingCycle(c)} style={{ padding: '5px 12px', background: billingCycle === c ? gold : 'transparent', border: 'none', borderRadius: '6px', color: billingCycle === c ? '#000' : textMuted, fontSize: '10px', fontWeight: billingCycle === c ? 600 : 300, cursor: 'pointer', textTransform: 'capitalize' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {plans.filter(p => p.name !== 'FREE').map(plan => {
              const PIcon = PLAN_ICONS[plan.name] || Zap;
              const isPro = plan.name === 'PROFESSIONAL';
              const cents = billingCycle === 'annual' ? Math.round(plan.price.annual / 12) : plan.price.monthly;
              const isCurrentPlan = plan.name === currentPlan;

              return (
                <div key={plan._id} style={{ padding: '20px', background: isPro ? 'rgba(37,99,235,0.06)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isPro ? 'rgba(37,99,235,0.25)' : border}`, borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <PIcon style={{ width: '16px', height: '16px', color: isPro ? gold : textMuted }} />
                    <span style={{ fontSize: '13px', fontWeight: 300, color: textMain }}>{plan.displayName}</span>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 600, color: textMain, letterSpacing: '-0.02em', marginBottom: '4px', fontFamily: "'Inter',system-ui,sans-serif" }}>
                    ${Math.round(cents / 100)}
                    <span style={{ fontSize: '12px', fontWeight: 300, color: textMuted }}>/mo</span>
                  </div>
                  {plan.trialDays > 0 && !isCurrentPlan && (
                    <div style={{ fontSize: '10px', color: gold, marginBottom: '14px' }}>
                      {plan.trialDays}-day free trial
                    </div>
                  )}
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={checkoutLoading || isCurrentPlan}
                    style={{
                      width: '100%', padding: '9px',
                      background: isCurrentPlan ? 'transparent' : (isPro ? gold : 'transparent'),
                      border: `1px solid ${isCurrentPlan ? border : (isPro ? gold : border)}`,
                      borderRadius: '7px',
                      color: isCurrentPlan ? textMuted : (isPro ? '#000' : textMain),
                      fontSize: '11px', fontWeight: isCurrentPlan ? 300 : (isPro ? 600 : 300),
                      letterSpacing: '0.08em', cursor: isCurrentPlan ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {checkoutLoading ? 'Loading...' : isCurrentPlan ? 'Current plan' : `Upgrade to ${plan.displayName}`}
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Billing history */}
      <div style={{ padding: '24px', background: surface, border: `1px solid ${border}`, borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <FileText style={{ width: '14px', height: '14px', color: gold }} />
          <h2 style={{ fontSize: '12px', fontWeight: 400, color: textMain, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
            Billing History
          </h2>
        </div>

        {historyLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(37,99,235,0.15)', borderTopColor: gold, animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : history.invoices.length === 0 ? (
          <p style={{ fontSize: '12px', color: textMuted, textAlign: 'center', padding: '20px 0' }}>
            No billing history yet.
          </p>
        ) : (
          history.invoices.map(inv => (
            <div key={inv._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 300, color: textMain }}>#{inv.invoiceNumber}</div>
                <div style={{ fontSize: '10px', color: textMuted }}>{formatDate(inv.createdAt)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 300, color: textMain }}>
                  ${formatAmount(inv.total)} {inv.currency}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '9px', background: inv.status === 'paid' ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)', color: inv.status === 'paid' ? '#34d399' : '#f59e0b' }}>
                  {inv.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default BillingPage;
