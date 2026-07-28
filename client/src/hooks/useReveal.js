import { useState, useRef, useLayoutEffect } from 'react';

/**
 * Scroll-reveal state machine, built so content can never get stuck invisible.
 *
 * Three states, and the order matters:
 *
 *   'idle'  — the markup's natural, fully-visible state. This is what the DOM
 *             renders with, so if JS never runs, throws on mount, or the
 *             IntersectionObserver is unavailable, the section is simply *there*.
 *             Every previous implementation on this page started from an inline
 *             `opacity: 0` and depended on JS arriving to undo it, which turns
 *             any script failure into permanently invisible content.
 *   'armed' — hidden, waiting to be scrolled into view.
 *   'shown' — revealed.
 *
 * The idle → armed transition happens in `useLayoutEffect`, i.e. after mount but
 * before the browser paints, so arming is invisible to the user — no flash of
 * the un-animated state.
 *
 * Reduced motion skips straight to 'shown'.
 */
/**
 * `threshold` stays 0 on purpose. Triggering on an intersection *ratio* breaks
 * for elements taller than the viewport: a 2,200px section in a 500px viewport
 * can never exceed a ratio of ~0.23, so any threshold above that never fires
 * and the section stays hidden forever. A zero threshold plus a negative bottom
 * `rootMargin` fires when the element's top edge crosses 88% of the viewport,
 * which behaves identically no matter how tall the element is.
 */
export const useReveal = ({ threshold = 0, rootMargin = '0px 0px -12% 0px' } = {}) => {
  const ref = useRef(null);
  const [state, setState] = useState('idle');

  /* The synchronous setState below is the mechanism, not an oversight:
     rendering visible first and arming in a layout effect is what makes the
     reveal degrade safely (see the state machine above). Deriving 'armed'
     during render would put the un-revealed state into the initial HTML —
     precisely the failure mode this replaces. useLayoutEffect runs before
     paint, so the extra render never reaches the screen. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || typeof IntersectionObserver === 'undefined') {
      setState('shown');
      return undefined;
    }

    // Already on screen at mount (above the fold): reveal on the next frame
    // rather than arming, so the first paint isn't a blank section.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setState('armed');
      const raf = requestAnimationFrame(() => setState('shown'));
      return () => cancelAnimationFrame(raf);
    }

    setState('armed');
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('shown');
          io.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // 'idle' and 'shown' both render as visible; only 'armed' hides.
  return { ref, revealed: state !== 'armed', state };
};

/**
 * Inline style for one item in a revealed group. `index` staggers the delay.
 *
 * Apply this to a *wrapper* around the animated element, never to an element
 * that also animates on hover. A reveal delay of e.g. 0.21s stays on the node
 * after the reveal finishes, so a hover lift sharing the same `transform`
 * property would sit still for 210ms before moving — which is exactly the lag
 * the old per-card reveal styles had. Wrapping keeps reveal and hover on
 * separate nodes so neither delays the other. `<Reveal>` does this for you.
 */
export const revealStyle = (revealed, index = 0, { distance = 20, duration = 0.6, step = 0.07, max = 0.35 } = {}) => ({
  opacity: revealed ? 1 : 0,
  transform: revealed ? 'none' : `translateY(${distance}px)`,
  transition: revealed
    ? `opacity ${duration}s cubic-bezier(0.16,1,0.3,1) ${Math.min(index * step, max)}s, transform ${duration}s cubic-bezier(0.16,1,0.3,1) ${Math.min(index * step, max)}s`
    : 'none',
});
