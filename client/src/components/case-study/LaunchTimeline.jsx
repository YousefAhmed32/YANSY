import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Compass, PenTool, Hammer, FlaskConical, Rocket } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { RevealItems } from '../Reveal';

gsap.registerPlugin(ScrollTrigger);

const PHASES = [
  { Icon: Compass, en: 'Discovery', ar: 'الاستكشاف' },
  { Icon: PenTool, en: 'Design', ar: 'التصميم' },
  { Icon: Hammer, en: 'Build', ar: 'البناء' },
  { Icon: FlaskConical, en: 'Test', ar: 'الاختبار' },
  { Icon: Rocket, en: 'Launch', ar: 'الإطلاق' },
];

/**
 * A smooth multi-segment cubic Bézier through N anchor points that all sit
 * on the same Y (the node row). Points on a straight line carry zero
 * curvature by definition — the only way to get a flowing journey path
 * through them is to deliberately inject it, so every anchor gets a "bow"
 * handle whose magnitude follows a half-cosine envelope across the whole
 * sequence: full strength leaving the first node (the open "gentle curve,
 * then diagonal"), fading to ~0 at the midpoint ("gradually horizontal"),
 * then growing again with the opposite sign into the last node (the
 * "subtle upward curve toward launch").
 *
 * Each interior anchor's bow value is shared by BOTH the segment ending
 * there and the segment starting there — that's what keeps every join
 * tangent-continuous (no kink), not just visually close enough.
 */
const buildJourneyPath = (points, amplitude) => {
  const n = points.length;
  if (n < 2) return '';
  if (n === 2 || amplitude <= 0) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }
  const bowAt = (i) => amplitude * Math.cos((Math.PI * i) / (n - 1));
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = (p1.x - p0.x) / 3;
    const cp1x = p0.x + dx;
    const cp1y = p0.y + bowAt(i);
    const cp2x = p1.x - dx;
    const cp2y = p1.y + bowAt(i + 1);
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p1.x} ${p1.y}`;
  }
  return d;
};

const LaunchTimeline = ({ duration, year, color = 'rgb(var(--accent))' }) => {
  const { isRTL } = useLanguage();
  const wrapRef = useRef(null);
  const rowRef = useRef(null);
  const dotRefs = useRef([]);
  const pathRef = useRef(null);
  const hasDrawnRef = useRef(false);

  const [viewBox, setViewBox] = useState({ w: 0, h: 0 });
  const [pathD, setPathD] = useState('');

  /**
   * Reads the real, rendered center of every step dot rather than assuming
   * evenly-spaced percentages — a CSS Grid gap alone is enough to throw
   * percentage math off, and this way the path is *guaranteed* to pass
   * through each node's center regardless of grid gap, label length,
   * viewport size, or text direction. Because it reads whatever the
   * browser actually placed, RTL "mirroring" needs no separate transform:
   * `dir="rtl"` already reverses the grid's visual order before this ever
   * runs, so the measured points — and the path built from them — come out
   * correctly mirrored on their own.
   */
  const measure = useCallback(() => {
    const wrap = rowRef.current;
    if (!wrap) return;
    const wrapRect = wrap.getBoundingClientRect();
    if (!wrapRect.width || !wrapRect.height) return;

    const points = dotRefs.current
      .filter(Boolean)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          x: r.left + r.width / 2 - wrapRect.left,
          y: r.top + r.height / 2 - wrapRect.top,
        };
      });
    if (points.length < 2) return;

    // Amplitude scales with the actual measured spacing (never a fixed px
    // value) but is capped so the curve stays a quiet accent on very wide
    // screens rather than a dramatic wave.
    const span = points[points.length - 1].x - points[0].x;
    const amplitude = Math.min(Math.abs(span) / (points.length * 3.2), 26);

    setViewBox({ w: wrapRect.width, h: wrapRect.height });
    setPathD(buildJourneyPath(points, amplitude));
  }, []);

  useLayoutEffect(() => {
    measure();
    const wrap = rowRef.current;
    if (!wrap || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => measure());
    ro.observe(wrap);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure, isRTL]);

  useEffect(() => {
    const path = pathRef.current;
    if (!path || !pathD) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const len = path.getTotalLength() || 1;

    if (reduced) {
      gsap.set(path, { strokeDasharray: 'none', strokeDashoffset: 0 });
      return undefined;
    }

    // Once the entrance has actually played, later remeasures (window
    // resize, font swap) just redraw the new shape fully visible instead
    // of replaying the draw-in — nothing should re-animate just because
    // the browser was resized after the user already scrolled past it.
    if (hasDrawnRef.current) {
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: 0 });
      return undefined;
    }

    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    const ctx = gsap.context(() => {
      gsap.to(path, {
        strokeDashoffset: 0,
        duration: 1.6,
        ease: 'power2.inOut',
        scrollTrigger: {
          trigger: wrapRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
          onEnter: () => { hasDrawnRef.current = true; },
        },
      });
    }, wrapRef);
    return () => ctx.revert();
  }, [pathD]);

  return (
    <div ref={wrapRef} className="launch-timeline" dir={isRTL ? 'rtl' : 'ltr'}>
      <style>{`
        .launch-timeline { padding-top: 4px; }
        .launch-timeline__wrap { position: relative; }
        .launch-timeline__row {
          position: relative; z-index: 1;
          display: grid; grid-template-columns: repeat(5, 1fr); gap: clamp(0.75rem, 2vw, 1.5rem);
        }
        .launch-timeline__line { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; z-index: 0; }
        .launch-timeline__path-ghost { opacity: 0.3; }
        .launch-timeline__step { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; }
        .launch-timeline__dot {
          width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center;
          background: rgb(var(--bg-elevated)); border: 1.5px solid rgb(var(--border));
          box-shadow: var(--shadow-sm); color: ${color}; flex-shrink: 0;
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .launch-timeline__step:hover .launch-timeline__dot {
          transform: translateY(-2px);
          border-color: ${color};
          box-shadow: 0 6px 16px -4px color-mix(in srgb, ${color} 30%, transparent);
        }
        .launch-timeline__dot svg { width: 22px; height: 22px; stroke-width: 1.75; }
        .launch-timeline__label { font-size: 12.5px; font-weight: 600; color: rgb(var(--text-secondary)); }
        .launch-timeline__step--final .launch-timeline__dot {
          background: linear-gradient(155deg, color-mix(in srgb, ${color} 92%, white), ${color});
          border-color: ${color}; color: #fff; box-shadow: 0 10px 26px -8px color-mix(in srgb, ${color} 55%, transparent);
        }
        .launch-timeline__step--final .launch-timeline__label { color: rgb(var(--text-primary)); font-weight: 700; }
        .launch-timeline__meta { font-size: 11px; color: rgb(var(--text-tertiary)); margin-top: -4px; }
        @media (max-width: 640px) {
          .launch-timeline__line { display: none; }
          .launch-timeline__row { grid-template-columns: repeat(3, 1fr); row-gap: 1.75rem; }
        }
      `}</style>

      <div ref={rowRef} className="launch-timeline__wrap">
        <svg
          className="launch-timeline__line"
          aria-hidden="true"
          viewBox={`0 0 ${viewBox.w || 1} ${viewBox.h || 1}`}
          preserveAspectRatio="none"
        >
          {pathD && (
            <>
              {/* Faint full-length guide so the eventual path never reads as
                  "missing" before the draw-in has scrolled into view. */}
              <path
                d={pathD}
                stroke="rgb(var(--border))"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                className="launch-timeline__path-ghost"
              />
              <path ref={pathRef} d={pathD} stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </>
          )}
        </svg>

        <RevealItems className="launch-timeline__row" distance={14} step={0.08}>
          {PHASES.map((p, i) => {
            const isFinal = i === PHASES.length - 1;
            return (
              <div
                key={p.en}
                ref={(el) => { dotRefs.current[i] = el; }}
                className={`launch-timeline__step${isFinal ? ' launch-timeline__step--final' : ''}`}
              >
                <div className="launch-timeline__dot"><p.Icon aria-hidden /></div>
                <span className="launch-timeline__label">{isRTL ? p.ar : p.en}</span>
                {isFinal && <span className="launch-timeline__meta">{duration} · {year}</span>}
              </div>
            );
          })}
        </RevealItems>
      </div>
    </div>
  );
};

export default LaunchTimeline;
