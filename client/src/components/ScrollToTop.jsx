import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Owns scroll position on every route change.
 *
 * - No hash in the URL → always reset to the very top (scrollY = 0). This is
 *   what makes every fresh page load and every in-app navigation start at
 *   the top instead of wherever the browser/last page happened to leave it.
 * - A hash in the URL (`/contact#faq`, or a same-page `<a href="#faq">`
 *   click) → scroll the matching element into view instead. React Router
 *   never does this for us: <Link> and same-document <a href="#..."> clicks
 *   both go through history.pushState, which — unlike a real full-page
 *   anchor navigation — the browser does NOT auto-scroll for. Without this
 *   branch, hash links would silently do nothing (or get force-reset to
 *   top by the branch above), which breaks the "anchor links keep working"
 *   requirement.
 *
 * `history.scrollRestoration` is set to 'manual' once, at module load —
 * this hands scroll position fully to us and stops the browser's own
 * back/forward restoration from fighting with the logic above (e.g. on a
 * refresh, or a back-navigation to a route with lazy-loaded content whose
 * layout height wasn't known yet when the browser tried to restore).
 */
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return undefined;
    }

    // Lazy-loaded sections (Home's below-the-fold chunks, etc.) may not have
    // mounted yet on the same tick the route resolves — retry across a few
    // animation frames instead of a single synchronous query.
    let frame;
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      attempts += 1;
      if (attempts < 20) frame = requestAnimationFrame(tryScroll);
    };
    tryScroll();
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
