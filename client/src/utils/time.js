/**
 * Returns a locale-aware relative time string.
 * Falls back to English if `lang` is not supported or Intl is unavailable.
 */
export const timeAgo = (date, lang = 'en') => {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);

  // Use Intl.RelativeTimeFormat if available
  if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    if (seconds < 60)   return rtf.format(-seconds, 'second');
    if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), 'minute');
    if (seconds < 86400) return rtf.format(-Math.floor(seconds / 3600), 'hour');
    return rtf.format(-Math.floor(seconds / 86400), 'day');
  }

  // Fallback for older environments
  if (seconds < 60)   return 'just now';
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

/**
 * Format a date for display.
 */
export const formatDate = (date, lang = 'en', options = {}) => {
  if (!date) return '';
  return new Intl.DateTimeFormat(lang, {
    day: 'numeric', month: 'short', year: 'numeric',
    ...options,
  }).format(new Date(date));
};
