// Analytics tracking utility
let sessionId = null;
let sessionStartTime = Date.now();
let scrollDepth = 0;
let sectionViewTimes = {};

const getApiBase = () =>
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '');

// Extract user identity from stored JWT token
const getUserIdentity = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return { isAdmin: false, visitorType: 'guest' };
    const base64Url = token.split('.')[1];
    if (!base64Url) return { isAdmin: false, visitorType: 'guest' };
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    const role = decoded?.role || '';
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    return {
      userId: decoded?.userId || decoded?.id,
      isAdmin,
      visitorType: isAdmin ? 'admin' : 'client',
      userEmail: decoded?.email,
      userName: decoded?.fullName,
    };
  } catch {
    return { isAdmin: false, visitorType: 'guest' };
  }
};

const generateSessionId = () =>
  `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getUTMParams = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    if (params.get('utm_source'))   utm.source   = params.get('utm_source');
    if (params.get('utm_medium'))   utm.medium   = params.get('utm_medium');
    if (params.get('utm_campaign')) utm.campaign = params.get('utm_campaign');
    if (params.get('utm_term'))     utm.term     = params.get('utm_term');
    if (params.get('utm_content'))  utm.content  = params.get('utm_content');

    if (Object.keys(utm).length > 0) {
      sessionStorage.setItem('yansy_utm', JSON.stringify(utm));
      return utm;
    }

    const saved = sessionStorage.getItem('yansy_utm');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const getVisitCount = () => {
  try {
    let count = parseInt(localStorage.getItem('yansy_visit_count') || '0', 10);
    if (!sessionStorage.getItem('yansy_session_counted')) {
      count += 1;
      localStorage.setItem('yansy_visit_count', String(count));
      sessionStorage.setItem('yansy_session_counted', '1');
    }
    return count || 1;
  } catch {
    return 1;
  }
};

const getEnvironmentMeta = () => ({
  screenResolution: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
  language: typeof navigator !== 'undefined' ? (navigator.language || 'en') : undefined,
  utm: getUTMParams(),
  visitCount: getVisitCount(),
});

// Initialize session
export const initSession = () => {
  sessionId = localStorage.getItem('sessionId') || generateSessionId();
  localStorage.setItem('sessionId', sessionId);

  const identity = getUserIdentity();

  // Tag Microsoft Clarity if loaded
  if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
    window.clarity('set', 'user_type', identity.isAdmin ? 'admin' : identity.visitorType);
    if (identity.userId) {
      window.clarity('identify', String(identity.userId));
    }
  }

  trackEvent('session_start', {
    page: window.location.pathname,
    title: document.title,
    ...identity,
  });
};

// Track event
export const trackEvent = async (eventType, data = {}) => {
  if (!sessionId) initSession();

  const identity = getUserIdentity();
  const envMeta = getEnvironmentMeta();

  const event = {
    eventType,
    page: window.location.pathname,
    title: document.title,
    sessionId,
    ...identity,
    ...envMeta,
    ...data,
  };

  const base = getApiBase();
  if (!base) return;

  try {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    await fetch(`${base.replace(/\/$/, '')}/analytics/events`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(event),
    });
  } catch {
    // Analytics is non-critical — swallow errors silently
  }
};

export const trackPageView = (page, title) => {
  trackEvent('page_view', {
    page: page || window.location.pathname,
    title: title || document.title,
  });
};

export const trackWhatsAppClick = (source = 'button') => {
  trackEvent('whatsapp_click', {
    elementId: 'whatsapp_cta',
    elementType: 'button',
    metadata: { source },
  });
};

export const trackCTAClick = (elementId, location) => {
  trackEvent('cta_click', {
    elementId,
    elementType: 'button',
    metadata: { location },
  });
};

export const trackContactForm = (formType = 'contact') => {
  trackEvent('contact_form', {
    elementId: `${formType}_form`,
    elementType: 'form',
    metadata: { formType },
  });
};

export const trackBookingRequest = (serviceType = 'general') => {
  trackEvent('booking_request', {
    elementId: 'booking_request_btn',
    elementType: 'button',
    metadata: { serviceType },
  });
};

export const trackSectionView = (sectionId, viewTime) => {
  if (!sectionViewTimes[sectionId]) {
    sectionViewTimes[sectionId] = Date.now();
    trackEvent('section_view', { section: sectionId, viewTime: 0 });
  } else {
    const duration = Date.now() - sectionViewTimes[sectionId];
    trackEvent('section_view', { section: sectionId, viewTime: duration });
  }
};

export const trackScroll = () => {
  const windowHeight  = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop     = window.pageYOffset || document.documentElement.scrollTop;
  const currentDepth  = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);

  if (currentDepth > scrollDepth) {
    scrollDepth = currentDepth;
    trackEvent('scroll', { scrollDepth: currentDepth });
  }
};

export const trackClick = (elementId, elementType) => {
  trackEvent('click', { elementId, elementType });
};

export const endSession = async () => {
  const duration = Date.now() - sessionStartTime;
  await trackEvent('session_end', { duration });

  const base = getApiBase();
  if (base) {
    await fetch(`${base.replace(/\/$/, '')}/analytics/sessions/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ sessionId }),
    }).catch(() => {});
  }
};

if (typeof window !== 'undefined') {
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(trackScroll, 100);
  });
  window.addEventListener('beforeunload', endSession);
}

