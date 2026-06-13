const gtag = (...args) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
};

export const trackPageView = (path, title) => {
  gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
};

export const trackCTAClick = (ctaName, location) => {
  gtag('event', 'cta_click', {
    event_category: 'engagement',
    cta_name: ctaName,
    cta_location: location,
  });
};

export const trackWhatsAppClick = (source) => {
  gtag('event', 'whatsapp_click', {
    event_category: 'conversion',
    event_label: source,
  });
  gtag('event', 'contact', { method: 'whatsapp', source });
};

export const trackContactForm = (formType) => {
  gtag('event', 'generate_lead', {
    event_category: 'conversion',
    form_type: formType || 'contact',
  });
};

export const trackBookingRequest = (serviceType) => {
  gtag('event', 'booking_request', {
    event_category: 'conversion',
    service_type: serviceType || 'general',
  });
};

export const trackNavClick = (destination) => {
  gtag('event', 'navigation_click', {
    event_category: 'navigation',
    destination,
  });
};

export const trackConversion = (type, value) => {
  gtag('event', 'conversion', {
    event_category: 'conversion',
    conversion_type: type,
    value,
  });
};

export const trackScrollDepth = (depth) => {
  gtag('event', 'scroll', {
    event_category: 'engagement',
    percent_scrolled: depth,
  });
};

export const trackSearch = (term) => {
  gtag('event', 'search', { search_term: term });
};
