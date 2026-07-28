/**
 * Meta (Facebook) Pixel — thin wrapper around window.fbq, mirroring utils/ga4.js.
 *
 * The base fbq snippet + init call live in index.html (env-driven by
 * VITE_META_PIXEL_ID — see the "Meta Pixel" block there). If that env var is
 * unset, index.html's init call is skipped entirely, so `window.fbq` never
 * exists here and every call below silently no-ops instead of throwing.
 *
 * Standard events used across the app: PageView, Lead, Contact,
 * CompleteRegistration, ViewContent, InitiateCheckout, Purchase, Schedule.
 * trackCustomEvent covers anything else via fbq('trackCustom', ...).
 */
const fbq = (...args) => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq(...args);
  }
};

export const trackPageView = () => {
  fbq('track', 'PageView');
};

/** A lead/contact-intent form was successfully submitted (project request, AI-chat lead, etc). */
export const trackLead = (params) => {
  fbq('track', 'Lead', params);
};

/** Visitor initiated a direct contact channel (WhatsApp, phone, email, contact form). */
export const trackContact = (params) => {
  fbq('track', 'Contact', params);
};

/** Successful account creation. */
export const trackCompleteRegistration = (params) => {
  fbq('track', 'CompleteRegistration', { status: true, ...params });
};

/** Visitor viewed a content/product-like detail page (portfolio item, case study, blog post). */
export const trackViewContent = (params) => {
  fbq('track', 'ViewContent', params);
};

/** Visitor started a paid checkout flow (Stripe subscription/invoice checkout). */
export const trackInitiateCheckout = (params) => {
  fbq('track', 'InitiateCheckout', params);
};

/** A payment completed successfully. value should be a number, currency an ISO 4217 code. */
export const trackPurchase = (value, currency = 'USD', params) => {
  fbq('track', 'Purchase', { value, currency, ...params });
};

/** Visitor booked/requested a meeting or consultation slot. */
export const trackSchedule = (params) => {
  fbq('track', 'Schedule', params);
};

/** Escape hatch for anything not covered by a standard Meta event. */
export const trackCustomEvent = (name, params) => {
  fbq('trackCustom', name, params);
};
