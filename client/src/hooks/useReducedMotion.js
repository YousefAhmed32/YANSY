/**
 * useReducedMotion — respects OS accessibility setting
 *
 * Returns `true` when the user has enabled "Reduce Motion" in their OS
 * or browser. Use this to conditionally disable or simplify animations.
 *
 * Usage:
 *   const prefersReduced = useReducedMotion();
 *   if (prefersReduced) return; // skip GSAP animation
 */
import { useEffect, useState } from 'react';

export const useReducedMotion = () => {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setPrefersReduced(e.matches);
    // Use addEventListener with compatibility fallback
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      // Safari < 14 fallback
      mq.addListener(handler);
      return () => mq.removeListener(handler);
    }
  }, []);

  return prefersReduced;
};
