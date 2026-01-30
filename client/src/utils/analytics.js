// Analytics tracking utility
let sessionId = null;
let sessionStartTime = Date.now();
let scrollDepth = 0;
let sectionViewTimes = {};

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

  try {
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(event),
    });
  } catch (error) {
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
  await fetch('/api/analytics/sessions/end', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ sessionId }),
  });
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

