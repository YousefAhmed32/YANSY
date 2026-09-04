import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CreditCard, Zap, Crown, Star, AlertTriangle,
  Clock, RefreshCw, FileText, ExternalLink,
} from 'lucide-react';
import {
  fetchPlans, fetchSubscription, fetchBillingHistory,
  createCheckout, createPortal, cancelSubscription, reactivateSubscription,
  selectCurrentPlan, selectSubscriptionStatus, selectIsTrialing, selectTrialDaysLeft,
  clearBillingError,
} from '../store/billingSlice';
import { useLanguage } from '../contexts/LanguageContext';
import { trackInitiateCheckout, trackPurchase } from '../utils/metaPixel';
import { TK } from '../admin-ui';

const PLAN_ICONS = { FREE: Star, PROFESSIONAL: Zap, ENTERPRISE: Crown };

const STATUS_CFG = (ar) => ({
  trialing:   { label: ar ? 'تجريبي' : 'Trial',       color: TK.accent, bg: TK.accentBg },
  active:     { label: ar ? 'نشط' : 'Active',          color: TK.green,  bg: TK.greenBg },
  past_due:   { label: ar ? 'متأخر السداد' : 'Past Due', color: TK.red,  bg: TK.redBg },
  cancelled:  { label: ar ? 'ملغي' : 'Cancelled',       color: TK.red,   bg: TK.redBg },
  free:       { label: ar ? 'مجاني' : 'Free',           color: TK.textMuted, bg: 'rgba(107,114,128,0.08)' },
  paused:     { label: ar ? 'متوقف مؤقتاً' : 'Paused',  color: TK.amber, bg: TK.amberBg },
  incomplete: { label: ar ? 'غير مكتمل' : 'Incomplete', color: TK.amber, bg: TK.amberBg },
});

const BillingPage = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { language, isRTL, dir } = useLanguage();
  const ar = language === 'ar';

  const { subscription, plans, history, loading, historyLoading, error } = useSelector(s => s.billing);
  const currentPlan = useSelector(selectCurrentPlan);
  const status      = useSelector(selectSubscriptionStatus);
  const isTrialing  = useSelector(selectIsTrialing);
  const daysLeft    = useSelector(selectTrialDaysLeft);

  const [billingCycle,   setBillingCycle]   = useState('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading,  setPortalLoading]  = useState(false);
  const [cancelConfirm,  setCancelConfirm]  = useState(false);
  const [successMsg,     setSuccessMsg]     = useState('');
  const pendingPurchaseRef = useRef(false);

  useEffect(() => {
    dispatch(fetchPlans());
    dispatch(fetchSubscription());
    dispatch(fetchBillingHistory());

    // Handle return from Stripe checkout
    const params = new URLSearchParams(location.search);
    if (params.get('checkout') === 'success') {
      setSuccessMsg(ar ? 'تم الدفع بنجاح! تم تفعيل اشتراكك.' : 'Payment successful! Your subscription has been activated.');
      pendingPurchaseRef.current = true;
      dispatch(fetchSubscription());
      navigate('/app/billing', { replace: true });
    }
    if (params.get('checkout') === 'cancelled') {
      navigate('/app/billing', { replace: true });
    }

    // Handle plan pre-selection from Pricing page
    if (location.state?.selectPlan) {
      if (location.state.billingCycle) setBillingCycle(location.state.billingCycle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch { /* surfaced via redux `error` state elsewhere on the page */ } finally { setPortalLoading(false); }
  };

  const handleCancel = async () => {
    await dispatch(cancelSubscription());
    setCancelConfirm(false);
    setSuccessMsg(ar ? 'سيتم إلغاء اشتراكك في نهاية فترة الفوترة الحالية.' : 'Your subscription will be cancelled at the end of the billing period.');
  };

  const handleReactivate = async () => {
    await dispatch(reactivateSubscription());
    setSuccessMsg(ar ? 'تم إعادة تفعيل اشتراكك.' : 'Your subscription has been reactivated.');
  };

  const sub    = subscription;
  const stCfg  = STATUS_CFG(ar)[status] || STATUS_CFG(ar).free;
  const Icon   = PLAN_ICONS[currentPlan] || Star;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString(ar ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const formatAmount = (amount) => `${amount || 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const font = isRTL ? "'IBM Plex Sans Arabic',system-ui,sans-serif" : "'Inter',system-ui,sans-serif";

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: TK.bg, color: TK.text, padding: 'clamp(16px,3vw,32px)', paddingBottom: 80, maxWidth: '900px', margin: '0 auto', fontFamily: font }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: TK.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CreditCard style={{ width: '18px', height: '18px', color: TK.accent }} />
        </div>
        <div>
          <h1 style={{ fontSize: 'clamp(18px,3vw,22px)', fontWeight: 700, color: TK.text, margin: 0 }}>
            {ar ? 'الفوترة والاشتراك' : 'Billing & Subscription'}
          </h1>
          <p style={{ fontSize: '12.5px', color: TK.textMuted, margin: '3px 0 0' }}>
            {ar ? 'أدِر خطتك وطريقة الدفع وسجل الفوترة.' : 'Manage your plan, payment method, and billing history.'}
          </p>
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 16px', background: TK.greenBg, border: `1px solid ${TK.greenBd}`, borderRadius: '10px', marginBottom: '18px', fontSize: '13px', color: TK.green }}>
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} aria-label={ar ? 'إغلاق' : 'Dismiss'} style={{ background: 'none', border: 'none', color: TK.green, cursor: 'pointer', fontSize: '13px', flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 16px', background: TK.redBg, border: `1px solid ${TK.redBd}`, borderRadius: '10px', marginBottom: '18px', fontSize: '13px', color: TK.red }}>
          <span>{error}</span>
          <button onClick={() => dispatch(clearBillingError())} aria-label={ar ? 'إغلاق' : 'Dismiss'} style={{ background: 'none', border: 'none', color: TK.red, cursor: 'pointer', fontSize: '13px', flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* Current plan card */}
      <div style={{ padding: '22px 24px', background: TK.surface, border: `1px solid ${currentPlan !== 'FREE' ? TK.accentBd : TK.border}`, borderRadius: '14px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: TK.accentBg, border: `1px solid ${TK.accentBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon style={{ width: '22px', height: '22px', color: TK.accent }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: TK.text }}>
                  {sub?.plan?.displayName || (ar ? 'الخطة الأساسية' : 'Starter')} {ar ? '' : 'Plan'}
                </span>
                <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 500, background: stCfg.bg, color: stCfg.color }}>
                  {stCfg.label}
                </span>
              </div>
              {isTrialing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '12.5px', color: TK.accent, marginTop: '5px' }}>
                  <Clock style={{ width: '12px', height: '12px' }} />
                  {ar ? `تنتهي الفترة التجريبية خلال ${daysLeft} يوم` : `Trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
                  {sub?.trialEndsAt && ` — ${formatDate(sub.trialEndsAt)}`}
                </div>
              )}
              {sub?.currentPeriodEnd && status === 'active' && (
                <div style={{ fontSize: '11.5px', color: TK.textMuted, marginTop: '5px' }}>
                  {ar ? `يتجدد في ${formatDate(sub.currentPeriodEnd)}` : `Renews ${formatDate(sub.currentPeriodEnd)}`}
                  {sub.cancelAtPeriodEnd && (
                    <span style={{ [isRTL ? 'marginRight' : 'marginLeft']: 8, color: TK.red }}>· {ar ? 'ينتهي في هذا التاريخ' : 'Cancels on this date'}</span>
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
                    style={{ padding: '8px 16px', background: TK.greenBg, border: `1px solid ${TK.greenBd}`, borderRadius: '8px', color: TK.green, fontSize: '12.5px', fontWeight: 500, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit' }}
                  >
                    {ar ? 'إعادة التفعيل' : 'Reactivate'}
                  </button>
                ) : (
                  !cancelConfirm && (
                    <button
                      onClick={() => setCancelConfirm(true)}
                      style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${TK.border}`, borderRadius: '8px', color: TK.textMuted, fontSize: '12.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {ar ? 'إلغاء' : 'Cancel'}
                    </button>
                  )
                )}
                <button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'transparent', border: `1px solid ${TK.border}`, borderRadius: '8px', color: TK.textMuted, fontSize: '12.5px', fontWeight: 500, cursor: portalLoading ? 'default' : 'pointer', fontFamily: 'inherit' }}
                >
                  {portalLoading ? <RefreshCw style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> : <ExternalLink style={{ width: '13px', height: '13px' }} />}
                  {ar ? 'إدارة الفوترة' : 'Manage Billing'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Cancel confirm */}
        {cancelConfirm && (
          <div style={{ marginTop: '16px', padding: '14px 16px', background: TK.redBg, border: `1px solid ${TK.redBd}`, borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertTriangle style={{ width: '14px', height: '14px', color: TK.red }} />
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: TK.red }}>{ar ? 'تأكيد الإلغاء' : 'Confirm cancellation'}</span>
            </div>
            <p style={{ fontSize: '12.5px', color: TK.textMuted, margin: '0 0 12px', lineHeight: 1.6 }}>
              {ar
                ? 'سيبقى اشتراكك نشطاً حتى نهاية فترة الفوترة الحالية. لن يتم خصم أي مبلغ إضافي.'
                : "Your subscription will remain active until the end of the current billing period. You won't be charged again."}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCancel} disabled={loading} style={{ padding: '7px 14px', background: TK.redBg, border: `1px solid ${TK.redBd}`, borderRadius: '7px', color: TK.red, fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                {ar ? 'نعم، ألغِ الاشتراك' : 'Yes, cancel'}
              </button>
              <button onClick={() => setCancelConfirm(false)} style={{ padding: '7px 14px', background: 'transparent', border: `1px solid ${TK.border}`, borderRadius: '7px', color: TK.textMuted, fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                {ar ? 'الإبقاء على الاشتراك' : 'Keep subscription'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Past due warning */}
      {status === 'past_due' && (
        <div style={{ padding: '14px 16px', background: TK.redBg, border: `1px solid ${TK.redBd}`, borderRadius: '10px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <AlertTriangle style={{ width: '16px', height: '16px', color: TK.red, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: TK.red, marginBottom: '2px' }}>{ar ? 'فشل الدفع' : 'Payment failed'}</div>
            <div style={{ fontSize: '11.5px', color: TK.textMuted }}>{ar ? 'يرجى تحديث طريقة الدفع لاستعادة كامل الوصول.' : 'Please update your payment method to restore full access.'}</div>
          </div>
          <button onClick={handlePortal} style={{ padding: '7px 14px', background: TK.redBg, border: `1px solid ${TK.redBd}`, borderRadius: '7px', color: TK.red, fontSize: '11.5px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit' }}>
            {ar ? 'تحديث الدفع' : 'Update Payment'}
          </button>
        </div>
      )}

      {/* Plan comparison */}
      {(currentPlan === 'FREE' || isTrialing || status === 'trialing') && (
        <div style={{ padding: '22px 24px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: '18px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: TK.text, margin: 0 }}>{ar ? 'قم بترقية خطتك' : 'Upgrade your plan'}</h2>
            <div style={{ display: 'flex', background: TK.bg, borderRadius: '9px', padding: '3px', gap: '3px' }}>
              {[
                { id: 'monthly', label: ar ? 'شهري' : 'Monthly' },
                { id: 'annual',  label: ar ? 'سنوي' : 'Annual' },
              ].map(c => (
                <button key={c.id} onClick={() => setBillingCycle(c.id)} style={{ padding: '6px 14px', background: billingCycle === c.id ? TK.accent : 'transparent', border: 'none', borderRadius: '7px', color: billingCycle === c.id ? '#fff' : TK.textMuted, fontSize: '11.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {c.label}
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
                <div key={plan._id} style={{ padding: '18px', background: isPro ? TK.accentBg : TK.bg, border: `1px solid ${isPro ? TK.accentBd : TK.border}`, borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <PIcon style={{ width: '16px', height: '16px', color: isPro ? TK.accent : TK.textMuted }} />
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: TK.text }}>{plan.displayName}</span>
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: TK.text, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                    ${Math.round(cents / 100)}
                    <span style={{ fontSize: '12px', fontWeight: 400, color: TK.textMuted }}>/{ar ? 'شهر' : 'mo'}</span>
                  </div>
                  {plan.trialDays > 0 && !isCurrentPlan && (
                    <div style={{ fontSize: '11px', color: TK.accent, marginBottom: '14px', fontWeight: 500 }}>
                      {ar ? `${plan.trialDays} يوم تجربة مجانية` : `${plan.trialDays}-day free trial`}
                    </div>
                  )}
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={checkoutLoading || isCurrentPlan}
                    style={{
                      width: '100%', padding: '10px',
                      background: isCurrentPlan ? 'transparent' : (isPro ? TK.accent : 'transparent'),
                      border: `1px solid ${isCurrentPlan ? TK.border : (isPro ? TK.accent : TK.border)}`,
                      borderRadius: '8px',
                      color: isCurrentPlan ? TK.textMuted : (isPro ? '#fff' : TK.text),
                      fontSize: '12.5px', fontWeight: 500,
                      cursor: isCurrentPlan ? 'default' : 'pointer',
                      transition: 'opacity 0.2s', fontFamily: 'inherit',
                    }}
                  >
                    {checkoutLoading ? (ar ? 'جارٍ التحميل...' : 'Loading...') : isCurrentPlan ? (ar ? 'خطتك الحالية' : 'Current plan') : (ar ? `الترقية إلى ${plan.displayName}` : `Upgrade to ${plan.displayName}`)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Billing history */}
      <div style={{ padding: '22px 24px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <FileText style={{ width: '15px', height: '15px', color: TK.accent }} />
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: TK.text, margin: 0 }}>
            {ar ? 'سجل الفوترة' : 'Billing History'}
          </h2>
        </div>

        {historyLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${TK.accentBg}`, borderTopColor: TK.accent, animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : history.invoices.length === 0 ? (
          <p style={{ fontSize: '12.5px', color: TK.textMuted, textAlign: 'center', padding: '20px 0', margin: 0 }}>
            {ar ? 'لا يوجد سجل فوترة بعد.' : 'No billing history yet.'}
          </p>
        ) : (
          history.invoices.map(inv => (
            <div key={inv._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 0', borderBottom: `1px solid ${TK.border}`, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 500, color: TK.text }}>#{inv.invoiceNumber}</div>
                <div style={{ fontSize: '11px', color: TK.textLight }}>{formatDate(inv.createdAt)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: TK.text }}>
                  ${formatAmount(inv.total)} {inv.currency}
                </span>
                <span style={{ padding: '2px 9px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 500, background: inv.status === 'paid' ? TK.greenBg : TK.amberBg, color: inv.status === 'paid' ? TK.green : TK.amber }}>
                  {inv.status === 'paid' ? (ar ? 'مدفوعة' : 'Paid') : (ar ? 'معلقة' : inv.status)}
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
