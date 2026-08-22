/**
 * Shared validation + labeling for a Portfolio project's external "live"
 * link (the `liveUrl` demo/production URL). Centralized so every place that
 * surfaces this action — cover overlays, MetaStrip, the Quick Showcase
 * title link, the admin table's quick-open icon — agrees on what counts as
 * a safe, openable URL and what to call the action, instead of each caller
 * re-deriving its own (and inevitably drifting).
 */

/**
 * Returns a trimmed, safe-to-open URL, or null. Only http(s) is allowed —
 * rejects `javascript:`, `data:`, and anything malformed. `new URL` both
 * validates structure and normalizes whitespace/case in the scheme, so a
 * string that fails to parse fails closed rather than getting rendered
 * as a raw, unvalidated href.
 */
export function sanitizeLiveUrl(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:' ? trimmed : null;
  } catch {
    return null;
  }
}

/**
 * A concept project's URL (if any) is a self-hosted demo, not a client's
 * live production site — the label must say so honestly rather than imply
 * a commissioned launch. `isConceptWork` should come from the existing
 * `project.deliveryStatus === 'concept'` check, never inferred from the
 * URL's domain.
 */
export function getLiveActionLabel(isRTL, isConceptWork) {
  return isConceptWork
    ? (isRTL ? 'فتح النسخة التجريبية' : 'Open Demo')
    : (isRTL ? 'زيارة الموقع' : 'Visit Site');
}
