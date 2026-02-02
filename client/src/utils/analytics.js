// Analytics tracking utility
let sessionId = null;
let sessionStartTime = Date.now();
let scrollDepth = 0;
let sectionViewTimes = {};

// Same base URL as api.js so production (HTTPS) requests hit backend
const getApiBase = () =>
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '');

// Initialize session
export const initSession = () => {
  sessionId = localStorage.getItem('sessionId') || generateSessionId();
  localStorage.setItem('sessionId', sessionId);
  trackEvent('session_start', { page: window.location.pathname });
};

// Generate session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Track event
export const trackEvent = async (eventType, data = {}) => {
  if (!sessionId) initSession();

  const event = {
    eventType,
    page: window.location.pathname,
    sessionId,
    ...data,
  };

  const base = getApiBase();
  if (!base) return;

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(event),
    });
    // #region agent log
    if (!res.ok) {
      fetch('http://127.0.0.1:7242/ingest/38a3d643-6b14-4c50-b906-466350701782', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'analytics.js:trackEvent', message: 'analytics_response_not_ok', data: { status: res.status, statusText: res.statusText }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H3' }) }).catch(() => {});
    }
    // #endregion
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/38a3d643-6b14-4c50-b906-466350701782', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'analytics.js:trackEvent', message: 'analytics_fetch_error', data: { errMsg: error && error.message }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H2' }) }).catch(() => {});
    // #endregion
    console.error('Analytics tracking error:', error);
  }
};

// Track page view
export const trackPageView = (page) => {
  trackEvent('page_view', { page });
};

// Track section view
export const trackSectionView = (sectionId, viewTime) => {
  if (!sectionViewTimes[sectionId]) {
    sectionViewTimes[sectionId] = Date.now();
    trackEvent('section_view', {
      section: sectionId,
      viewTime: 0,
    });
  } else {
    const duration = Date.now() - sectionViewTimes[sectionId];
    trackEvent('section_view', {
      section: sectionId,
      viewTime: duration,
    });
  }
};

// Track scroll depth
export const trackScroll = () => {
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const currentDepth = Math.round(
    ((scrollTop + windowHeight) / documentHeight) * 100
  );

  if (currentDepth > scrollDepth) {
    scrollDepth = currentDepth;
    trackEvent('scroll', {
      scrollDepth: currentDepth,
    });
  }
};

// Track click
export const trackClick = (elementId, elementType) => {
  trackEvent('click', {
    elementId,
    elementType,
  });
};

// End session
export const endSession = async () => {
  const duration = Date.now() - sessionStartTime;
  await trackEvent('session_end', {
    duration,
  });
  const base = getApiBase();
  if (base) {
    await fetch(`${base.replace(/\/$/, '')}/analytics/sessions/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ sessionId }),
    });
  }
};

// Setup scroll tracking
if (typeof window !== 'undefined') {
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(trackScroll, 100);
  });

  // Track before unload
  window.addEventListener('beforeunload', endSession);
}

