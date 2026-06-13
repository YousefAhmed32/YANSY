// Analytics tracking utility
let sessionId = null;
let sessionStartTime = Date.now();
let scrollDepth = 0;
let sectionViewTimes = {};

const getApiBase = () =>
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '');

// Initialize session
export const initSession = () => {
  sessionId = localStorage.getItem('sessionId') || generateSessionId();
  localStorage.setItem('sessionId', sessionId);
  trackEvent('session_start', { page: window.location.pathname });
};

const generateSessionId = () =>
  `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
    await fetch(`${base.replace(/\/$/, '')}/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(event),
    });
  } catch {
    // Analytics is non-critical — swallow errors silently
  }
};

export const trackPageView = (page) => {
  trackEvent('page_view', { page });
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
