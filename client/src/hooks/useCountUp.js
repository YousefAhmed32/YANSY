import { useEffect, useState } from 'react';

/**
 * Animated count-up for a numeric string like "3x", "-80%", "€180K", "$42K".
 * Parses the first numeric run, eases it up with a cubic-out curve, and
 * leaves the original prefix/suffix around it untouched by the caller.
 * Only starts once `start` flips true (pair with an IntersectionObserver /
 * useReveal so off-screen numbers don't burn frames before they're seen).
 */
export const useCountUp = (end, duration = 1800, start = false) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return undefined;
    const raw = parseFloat(String(end).replace(/[^0-9.]/g, ''));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Every setValue below is deferred into a requestAnimationFrame callback
    // rather than called synchronously in the effect body — including the
    // "just jump to the final value" cases — so this never fires a setState
    // synchronously during the effect itself (react-hooks/set-state-in-effect).
    if (isNaN(raw) || reduced) {
      const settled = isNaN(raw) ? end : raw;
      const frameId = requestAnimationFrame(() => setValue(settled));
      return () => cancelAnimationFrame(frameId);
    }

    // Preserve the source's decimal precision — a naive Math.round would
    // animate "4.9★" up to a settled "5★", silently changing the figure.
    const decimalMatch = String(end).match(/\.(\d+)/);
    const decimals = decimalMatch ? decimalMatch[1].length : 0;
    let t0 = null;
    let frameId;
    const frame = ts => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setValue(Number(((1 - Math.pow(1 - p, 3)) * raw).toFixed(decimals)));
      if (p < 1) frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, [start, end, duration]);
  return value;
};
