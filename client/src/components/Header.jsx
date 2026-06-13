import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MessageCircle, ArrowUpRight } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { trackWhatsAppClick } from '../utils/ga4';

/* ═══════════════════════════════════════════════════════════════
   YANSY Header — Physical Glass Dock v4

   Architecture: Scroll-driven interpolation engine
   ─────────────────────────────────────────────────────────────
   ① No boolean state switching. Every CSS property is a
     continuous mathematical function of scroll position.

   ② rAF loop reads scrollY and writes styles directly to DOM —
     React never re-renders for visual updates.

   ③ Transition zone: 80px → 180px (100px window)
     progress p = clamp((scrollY - 80) / 100, 0, 1)

   ④ Each property eased at a different rate:
     - Width/geometry → easeOutHeavy (feels dense, has mass)
     - Border radius  → easeSpring   (elastic, physical)
     - Blur           → easeOutCrisp (snappy, immediate)
     - Shadow         → easeOut      (smooth build)
     - Background     → easeOut      (smooth opacity build)

   ⑤ React state (isDocked) only updates at p=0.5 threshold,
     used exclusively for JSX conditional content.
   ═══════════════════════════════════════════════════════════════ */


/* ─── Easing library ─────────────────────────────────────────── */

/** Cubic ease-out (standard) */
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/** Quartic ease-out — heavy, has mass, settles slowly */
const easeOutHeavy = (t) => 1 - Math.pow(1 - t, 4);

/** Quadratic ease-out — crisp, responsive */
const easeOutCrisp = (t) => 1 - Math.pow(1 - t, 2.2);

/**
 * Spring-like overshoot for border-radius.
 * Briefly over-radiuses then settles — feels elastic/physical.
 */
const easeSpring = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return Math.pow(2, -8 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 4.5)) + 1;
};

/** Linear interpolation */
const lerp = (a, b, t) => a + (b - a) * t;

/** Clamp value between min and max */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));


/* ─── Scroll-driven style engine ────────────────────────────── */
/**
 * Runs as a rAF loop. Reads scrollY every frame, computes
 * interpolated style values, and writes them directly to DOM refs.
 * Returns a cleanup function.
 */
const createScrollEngine = ({
  headerEl,
  barEl,
  barFillEl,
  isDark,
  onDockedChange,      // (isDocked: boolean) => void — throttled React updater
}) => {
  const SCROLL_START = 80;
  const SCROLL_END   = 180;

  let lastP        = -1;
  let lastDocked   = false;
  let rafId        = null;

  const tick = () => {
    if (!headerEl) { rafId = requestAnimationFrame(tick); return; }

    const scrollY = window.scrollY;
    const rawP    = clamp((scrollY - SCROLL_START) / (SCROLL_END - SCROLL_START), 0, 1);

    // Only update DOM if progress changed meaningfully (< 0.001 → skip)
    if (Math.abs(rawP - lastP) > 0.0008) {
      lastP = rawP;
      const p = rawP;

      // ── Per-property easing (different rates = physical feel) ──
      const pGeo    = easeOutHeavy(p);  // geometry — slow/heavy
      const pRadius = easeSpring(p);    // radius   — spring
      const pBlur   = easeOutCrisp(p);  // blur     — snappy
      const pShadow = easeOut(p);       // shadow   — smooth build
      const pBg     = easeOut(p);       // bg alpha — smooth build
      const pTop    = easeOutHeavy(p);  // top float — slow (heavy glass)

      // ── Geometry ──
      // Side inset: 0px → 20px (glass "detaches" from edges)
      const sideInset = lerp(0, 20, pGeo);
      // Top float: 0px → 12px
      const topFloat  = lerp(0, 12, pTop);
      // Border radius: 0px → 14px (with spring)
      const radius    = lerp(0, 14, pRadius);
      // Height: 72px → 56px
      const height    = lerp(72, 56, easeOut(p));

      // ── Blur & saturation ──
      const blurAmt  = lerp(0, 28, pBlur);
      const saturate = lerp(1, 1.5, pBlur);

      // ── Background opacity ──
      // Kept high to maintain readability (NOT fading out)
      const bgAlpha = isDark
        ? lerp(0, 0.93, pBg)
        : lerp(0, 0.95, pBg);
      const bgColor = isDark
        ? `rgba(7,6,4,${bgAlpha.toFixed(3)})`
        : `rgba(252,251,248,${bgAlpha.toFixed(3)})`;

      // ── Border (gold-tinted ring) ──
      const borderAlpha = lerp(0, isDark ? 0.18 : 0.16, easeOutCrisp(p));
      const borderColor = `rgba(212,175,55,${borderAlpha.toFixed(3)})`;

      // ── Shadow — 4-layer composite for depth ──
      let shadow = 'none';
      if (p > 0.02) {
        // Gold identity ring
        const r1 = lerp(0, isDark ? 0.16 : 0.13, pShadow);
        // Deep drop shadow (elevation)
        const r2 = lerp(0, isDark ? 0.62 : 0.11, pShadow);
        const d2y = Math.round(lerp(0, 30, pShadow));
        const d2b = Math.round(lerp(0, 44, pShadow));
        // Close ambient (grounding)
        const r3 = lerp(0, isDark ? 0.42 : 0.07, pShadow);
        const d3y = Math.round(lerp(0, 6, pShadow));
        const d3b = Math.round(lerp(0, 14, pShadow));
        // Inset glass highlight (top edge)
        const r4 = lerp(0, isDark ? 0.055 : 0.75, pShadow);

        shadow = [
          `0 0 0 1px rgba(212,175,55,${r1.toFixed(3)})`,
          `0 ${d2y}px ${d2b}px rgba(0,0,0,${r2.toFixed(3)})`,
          `0 ${d3y}px ${d3b}px rgba(0,0,0,${r3.toFixed(3)})`,
          `inset 0 1px 0 rgba(255,255,255,${r4.toFixed(3)})`,
        ].join(', ');
      }

      // ── Progress bar: opacity fades in after p>0.25 ──
      const barOpacity = p > 0.25 ? lerp(0, 1, clamp((p - 0.25) / 0.5, 0, 1)) : 0;

      // ── Write to DOM ──
      Object.assign(headerEl.style, {
        top             : `${topFloat.toFixed(2)}px`,
        left            : `${sideInset.toFixed(2)}px`,
        right           : `${sideInset.toFixed(2)}px`,
        height          : `${height.toFixed(1)}px`,
        borderRadius    : `${radius.toFixed(2)}px`,
        background      : bgColor,
        backdropFilter  : `blur(${blurAmt.toFixed(1)}px) saturate(${saturate.toFixed(2)})`,
        WebkitBackdropFilter: `blur(${blurAmt.toFixed(1)}px) saturate(${saturate.toFixed(2)})`,
        boxShadow       : shadow,
        borderColor     : borderColor,
      });



      // ── Notify React for JSX-level changes (throttled at 0.5) ──
      const nowDocked = p >= 0.5;
      if (nowDocked !== lastDocked) {
        lastDocked = nowDocked;
        onDockedChange(nowDocked);
      }
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
  };
};


/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const Header = ({ onStartProject }) => {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const { t }      = useTranslation();
  const { isDark } = useTheme();
  const { isRTL }  = useLanguage();

  // Only two React states — isDocked for CTA morphing, mobileMenuOpen for menu
  const [isDocked,       setIsDocked]       = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav,      setActiveNav]      = useState(null);
  const [mounted,        setMounted]        = useState(false);

  // DOM refs — written to directly by the scroll engine
  const headerRef   = useRef(null);
  const barRef      = useRef(null);
  const barFillRef  = useRef(null);
  const menuRef     = useRef(null);
  const firstFocRef = useRef(null);

  const whatsappUrl = `https://wa.me/201090385390?text=${encodeURIComponent(
    t('landing.whatsapp.message', 'Hello, I need help with YANSY')
  )}`;

  /* ── Mount entrance ─────────────────────────────────────────── */
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  /* ── Scroll engine ──────────────────────────────────────────── */
  useEffect(() => {
    const cleanup = createScrollEngine({
      headerEl   : headerRef.current,
      barEl      : barRef.current,
      barFillEl  : barFillRef.current,
      isDark,
      onDockedChange: setIsDocked,
    });
    return cleanup;
  }, [isDark]); // re-create if theme changes (color values differ)

  /* ── Body scroll lock (iOS safe) ───────────────────────────── */
  useEffect(() => {
    if (mobileMenuOpen) {
      const y = window.scrollY;
      Object.assign(document.body.style, {
        overflow: 'hidden', position: 'fixed', top: `-${y}px`, width: '100%',
      });
      setTimeout(() => firstFocRef.current?.focus(), 80);
    } else {
      const y = Math.abs(parseInt(document.body.style.top || '0', 10));
      Object.assign(document.body.style, { overflow: '', position: '', top: '', width: '' });
      if (y) window.scrollTo(0, y);
    }
    return () => Object.assign(document.body.style, { overflow: '', position: '', top: '', width: '' });
  }, [mobileMenuOpen]);

  /* ── Escape key ─────────────────────────────────────────────── */
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') setMobileMenuOpen(false); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  /* ── Mobile menu entrance animation ────────────────────────── */
  useEffect(() => {
    if (!menuRef.current || !mobileMenuOpen) return;
    const items = menuRef.current.querySelectorAll('[data-mi]');
    Object.assign(menuRef.current.style, { opacity: '0', transform: 'translateY(-10px)' });
    requestAnimationFrame(() => {
      if (!menuRef.current) return;
      Object.assign(menuRef.current.style, {
        transition: 'opacity .2s cubic-bezier(0.32,0.72,0,1), transform .2s cubic-bezier(0.32,0.72,0,1)',
        opacity: '1', transform: 'translateY(0)',
      });
    });
    items.forEach((el, i) => {
      Object.assign(el.style, { opacity: '0', transform: 'translateY(14px)' });
      setTimeout(() => {
        Object.assign(el.style, {
          transition: `opacity .28s cubic-bezier(0.32,0.72,0,1), transform .28s cubic-bezier(0.32,0.72,0,1)`,
          opacity: '1', transform: 'translateY(0)',
        });
      }, 48 + i * 38);
    });
  }, [mobileMenuOpen]);

  /* ── Scroll-to section ──────────────────────────────────────── */
  const scrollTo = useCallback((id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
  }, []);

  /* ── Design tokens ──────────────────────────────────────────── */
  const gold      = '#d4af37';
  const goldDim   = 'rgba(212,175,55,0.15)';
  const goldFaint = 'rgba(212,175,55,0.06)';
  const txtMain   = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.88)';
  // Contrast lifts when docked: glass bg is near-opaque, small text needs ≥4.5:1 (WCAG AA)
  const txtMuted  = isDark
    ? (isDocked ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.48)')
    : (isDocked ? 'rgba(0,0,0,0.68)'       : 'rgba(0,0,0,0.44)');
  // Slightly stronger borders in dock mode so controls don't dissolve into the glass
  const bdColor   = isDark
    ? (isDocked ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)')
    : (isDocked ? 'rgba(0,0,0,0.14)'       : 'rgba(0,0,0,0.08)');
  const mobileBg  = isDark ? 'rgba(5,4,3,0.99)'       : 'rgba(255,255,255,0.99)';

  /* ── Nav items ──────────────────────────────────────────────── */
  const NAV = [
    { id: 'work',      labelKey: 'landing.nav.work',     def: 'Our Work'  },
    { id: 'solutions', labelKey: 'landing.nav.solutions', def: 'Services', href: '/services' },
    { id: 'contact',   labelKey: 'landing.nav.contact',  def: 'Contact'   },
  ];

  /* ── CTA button shared styles ───────────────────────────────── */
  // Docked:   solid gold pill + glow (MORE prominent)
  // Undocked: ghost outline (present but not distracting)
  const ctaStyle = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: isDocked ? '9px 22px' : '8px 18px',
    fontSize: isDocked ? '10.5px' : '10px',
    fontWeight: isDocked ? 700 : 400,
    letterSpacing: isDocked ? '.1em' : '.18em',
    textTransform: 'uppercase', cursor: 'pointer',
    background   : isDocked ? gold : 'transparent',
    color        : isDocked ? '#000' : txtMain,
    border       : isDocked
      ? `1.5px solid ${gold}`
      : `1px solid rgba(212,175,55,.36)`,
    borderRadius : isDocked ? '9px' : '2px',
    boxShadow    : isDocked
      ? '0 0 22px rgba(212,175,55,0.30), 0 3px 10px rgba(0,0,0,0.24)'
      : 'none',
    transition: [
      'background .38s cubic-bezier(0.32,0.72,0,1)',
      'color .32s ease',
      'border .32s ease',
      'border-radius .55s cubic-bezier(0.32,0.72,0,1)',
      'padding .45s cubic-bezier(0.32,0.72,0,1)',
      'font-size .32s ease',
      'font-weight .28s ease',
      'box-shadow .48s ease',
    ].join(', '),
  };

  return (
    <>
      {/* ── Global CSS ─────────────────────────────────────────── */}
      <style>{`
        /* Nav underline — ink-reveal */
        .ynav {
          position: relative;
          font-size: 10.5px; font-weight: 500;
          text-transform: uppercase;
          letter-spacing: ${isRTL ? '0' : '.065em'};
          padding-bottom: 3px; white-space: nowrap;
          transition: color .22s ease;
          background: none; border: none; cursor: pointer;
          padding-inline: 0; line-height: 1;
        }
        .ynav::after {
          content: '';
          position: absolute; bottom: -1px;
          inset-inline-start: 0; inset-inline-end: 0;
          height: 1px; background: ${gold};
          transform: scaleX(0);
          transform-origin: ${isRTL ? 'right' : 'left'};
          transition: transform .32s cubic-bezier(.4,0,.2,1);
        }
        .ynav:hover::after, .ynav.active::after { transform: scaleX(1); }

        /* CTA shimmer sweep */
        .ycta { position: relative; overflow: hidden; }
        .ycta::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.22) 50%, transparent 65%);
          transform: translateX(-130%);
          transition: transform .65s ease;
        }
        .ycta:hover::before { transform: translateX(130%); }

        /* Mobile link hover */
        .ymob { position: relative; transition: color .18s; }
        .ymob::before {
          content: '';
          position: absolute;
          ${isRTL ? 'right' : 'left'}: 0;
          top: 50%; transform: translateY(-50%);
          width: 0; height: 1px;
          background: ${gold}; transition: width .24s ease;
        }
        .ymob:hover::before { width: 14px; }

        /* Pulse animation */
        @keyframes gpulse {
          0%,100% { opacity:.35; transform:scale(1); }
          50%      { opacity:1;  transform:scale(1.25); }
        }

        /* Hamburger bars */
        .hbar { display:block; height:1px; transition: all .28s ease; }

        /* Desktop visibility */
        .logo-dot, .desk-nav, .desk-right { display: none; }
        .mob-cluster { display: flex; }

        @media (min-width: 1024px) {
          .logo-dot   { display: block; }
          .desk-nav   { display: flex; }
          .desk-right { display: flex; }
          .mob-cluster { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ynav::after, .ycta::before, .ymob::before { transition: none !important; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════
          HEADER ELEMENT
          Visual state managed entirely by createScrollEngine()
          React only handles opacity mount-fade
      ══════════════════════════════════════════════════════════ */}
      <header
        ref={headerRef}
        role="banner"
        style={{
          position        : 'fixed',
          top             : '0',
          left            : '0',
          right           : '0',
          zIndex          : 1000,
          height          : '72px',
          /* Initial values — engine overwrites on first rAF frame */
          background      : 'transparent',
          backdropFilter  : 'blur(0px)',
          WebkitBackdropFilter: 'blur(0px)',
          borderRadius    : '0',
          border          : '1px solid transparent',
          boxShadow       : 'none',
          /* Mount fade (opacity only — engine never touches this) */
          opacity         : mounted ? 1 : 0,
          transition      : 'opacity .4s ease',
          /* GPU layer */
          willChange      : 'border-radius, box-shadow, transform',
          /* contain:paint removed — it clips child dropdowns at the header border-box.
             layout+style containment is kept for rendering performance. */
          contain         : 'layout style',
        }}
      >
   

        {/* Persistent top-edge gold shimmer */}
        <div aria-hidden style={{
          position: 'absolute', top: 0, left: '8%', right: '8%', height: '1px',
          background: `linear-gradient(to right, transparent, ${goldDim}, transparent)`,
          pointerEvents: 'none', opacity: 0.7,
        }} />

        {/* Inner layout container */}
        <div style={{
          maxWidth    : '88rem',
          margin      : '0 auto',
          paddingInline: 'clamp(20px, 3.5vw, 48px)',
          height      : '100%',
          display     : 'flex',
          alignItems  : 'center',
          justifyContent: 'space-between',
          gap         : '16px',
        }}>

          {/* ── Logo ─────────────────────────────────────────── */}
          <Link
            to="/"
            aria-label="YANSY — Home"
            style={{
              position: 'relative', zIndex: 10, flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: '10px',
              textDecoration: 'none',
            }}
          >
            <img
              src="/assets/image/logo/logo.png"
              alt="YANSY"
              style={{
                height: '32px', width: 'auto', objectFit: 'contain',
                transition: 'filter .3s ease',
              }}
            />
            <span className="logo-dot" aria-hidden style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: gold, flexShrink: 0,
              animation: 'gpulse 3.2s ease-in-out infinite',
            }} />
          </Link>

          {/* ── Desktop nav ──────────────────────────────────── */}
          <nav
            className="desk-nav"
            role="navigation"
            aria-label="Main navigation"
            style={{ alignItems: 'center', gap: '30px' }}
          >
            {NAV.map((item) =>
              item.href ? (
                <Link
                  key={item.id}
                  to={item.href}
                  className="ynav"
                  style={{ color: txtMuted, textDecoration: 'none' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = txtMain; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = txtMuted; }}
                >
                  {t(item.labelKey, item.def)}
                </Link>
              ) : (
                <button
                  key={item.id}
                  onClick={() => { setActiveNav(item.id); scrollTo(item.id); }}
                  className={`ynav${activeNav === item.id ? ' active' : ''}`}
                  style={{ color: activeNav === item.id ? gold : txtMuted }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = txtMain; }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = activeNav === item.id ? gold : txtMuted;
                  }}
                >
                  {t(item.labelKey, item.def)}
                </button>
              )
            )}
          </nav>

          {/* ── Desktop right cluster ────────────────────────── */}
          <div
            className="desk-right"
            style={{ alignItems: 'center', gap: '10px', flexShrink: 0 }}
          >
            <LanguageSelector />

            <div aria-hidden style={{ width: '1px', height: '14px', background: goldDim }} />

            {/* WhatsApp — label hides when docked */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsAppClick('header-desktop')}
              aria-label="WhatsApp Support"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 11px', fontSize: '10px', fontWeight: 300,
                letterSpacing: '.2em', textTransform: 'uppercase',
                color: txtMuted, textDecoration: 'none',
                border: `1px solid ${bdColor}`,
                borderRadius: isDocked ? '8px' : '2px',
                transition: 'color .2s, border-color .2s, background .2s, border-radius .5s cubic-bezier(0.32,0.72,0,1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = gold;
                e.currentTarget.style.borderColor = 'rgba(212,175,55,.45)';
                e.currentTarget.style.background = goldFaint;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = txtMuted;
                e.currentTarget.style.borderColor = bdColor;
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <MessageCircle style={{ width: '13px', height: '13px' }} aria-hidden />
              <span style={{
                maxWidth: isDocked ? '0' : '60px', overflow: 'hidden',
                whiteSpace: 'nowrap',
                transition: 'max-width .35s ease, opacity .3s ease',
                opacity: isDocked ? 0 : 1,
              }}>
                {t('landing.nav.support', 'Support')}
              </span>
            </a>

            <div aria-hidden style={{ width: '1px', height: '14px', background: goldDim }} />

            {/* Auth / CTA */}
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link
                  to="/app/dashboard"
                  style={{
                    fontSize: '10px', fontWeight: 300, letterSpacing: '.2em',
                    textTransform: 'uppercase', color: txtMuted, textDecoration: 'none',
                    transition: 'color .2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = txtMain; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = txtMuted; }}
                >
                  {t('dashboard.title', 'Dashboard')}
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/app/admin"
                    style={{
                      fontSize: '10px', fontWeight: 300, letterSpacing: '.2em',
                      textTransform: 'uppercase', color: txtMuted, textDecoration: 'none',
                      transition: 'color .2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = gold; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = txtMuted; }}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  to="/app/dashboard"
                  className="ycta"
                  style={{
                    ...ctaStyle, textDecoration: 'none',
                    display: 'flex', alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDocked ? '#bfa020' : gold;
                    e.currentTarget.style.color = '#000';
                    if (isDocked) e.currentTarget.style.boxShadow = '0 0 30px rgba(212,175,55,0.45), 0 4px 14px rgba(0,0,0,0.28)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDocked ? gold : 'transparent';
                    e.currentTarget.style.color = isDocked ? '#000' : txtMain;
                    e.currentTarget.style.boxShadow = isDocked ? '0 0 22px rgba(212,175,55,0.30), 0 3px 10px rgba(0,0,0,0.24)' : 'none';
                  }}
                >
                  <span>{t('common.goToApp', 'Go to App')}</span>
                  <ArrowUpRight style={{ width: '13px', height: '13px', flexShrink: 0 }} aria-hidden />
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Login — fades out when docked (CTA takes over) */}
           <Link
  to="/login"
  style={{
    fontSize: '10px',
    fontWeight: 300,
    letterSpacing: '.2em',
    textTransform: 'uppercase',
    color: txtMuted,
    textDecoration: 'none',
    padding: '4px 8px',
    transition: 'color .2s ease',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.color = gold;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.color = txtMuted;
  }}
>
  {t('common.login', 'Login')}
</Link>

                {/* ── PRIMARY CTA ─────────────────────────────── */}
                <button
                  onClick={onStartProject}
                  className="ycta"
                  style={ctaStyle}
                  onMouseEnter={(e) => {
                    if (isDocked) {
                      e.currentTarget.style.background  = '#bfa020';
                      e.currentTarget.style.borderColor = '#bfa020';
                      e.currentTarget.style.boxShadow   = '0 0 30px rgba(212,175,55,0.45), 0 4px 14px rgba(0,0,0,0.28)';
                    } else {
                      e.currentTarget.style.background  = gold;
                      e.currentTarget.style.borderColor = gold;
                      e.currentTarget.style.color       = '#000';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isDocked) {
                      e.currentTarget.style.background  = gold;
                      e.currentTarget.style.borderColor = gold;
                      e.currentTarget.style.boxShadow   = '0 0 22px rgba(212,175,55,0.30), 0 3px 10px rgba(0,0,0,0.24)';
                    } else {
                      e.currentTarget.style.background  = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(212,175,55,.36)';
                      e.currentTarget.style.color       = txtMain;
                    }
                  }}
                >
                  <span>{t('landing.hero.cta', 'Get Started')}</span>
                  <ArrowUpRight style={{ width: '13px', height: '13px', flexShrink: 0 }} aria-hidden />
                </button>
              </div>
            )}
          </div>

          {/* ── Mobile cluster ──────────────────────────────── */}
          <div
            className="mob-cluster"
            style={{ alignItems: 'center', gap: '8px' }}
          >
            {!isAuthenticated ? (
              <button
                onClick={onStartProject}
                className="ycta"
                aria-label="Start your project"
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '8px 13px', fontSize: '9px', fontWeight: 600,
                  letterSpacing: '.18em', textTransform: 'uppercase',
                  background: gold, color: '#000', border: 'none', cursor: 'pointer',
                  borderRadius: isDocked ? '8px' : '2px',
                  boxShadow: isDocked ? '0 0 14px rgba(212,175,55,0.24)' : 'none',
                  transition: 'border-radius .5s cubic-bezier(0.32,0.72,0,1), box-shadow .45s ease',
                  flexShrink: 0,
                }}
              >
                <span>{t('landing.hero.cta', 'Start')}</span>
                <ArrowUpRight style={{ width: '11px', height: '11px', flexShrink: 0 }} aria-hidden />
              </button>
            ) : (
              <Link
                to="/app/dashboard"
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '8px 13px', fontSize: '9px', fontWeight: 600,
                  letterSpacing: '.18em', textTransform: 'uppercase',
                  background: gold, color: '#000', textDecoration: 'none',
                  borderRadius: isDocked ? '8px' : '2px',
                  transition: 'border-radius .5s cubic-bezier(0.32,0.72,0,1)',
                }}
              >
                <span>App</span>
                <ArrowUpRight style={{ width: '11px', height: '11px' }} aria-hidden />
              </Link>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMobileMenuOpen((p) => !p)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              style={{
                position: 'relative', zIndex: 1060,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', gap: '5px',
                background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <span className="hbar" style={{
                width: '20px',
                background: mobileMenuOpen ? gold : (isDark ? 'rgba(255,255,255,.82)' : 'rgba(0,0,0,.75)'),
                transform: mobileMenuOpen ? 'rotate(45deg) translate(4px,4px)' : 'none',
              }} />
              <span className="hbar" style={{
                background: isDark ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.45)',
                width: mobileMenuOpen ? '0' : '13px',
                opacity: mobileMenuOpen ? 0 : 1,
                alignSelf: isRTL ? 'flex-end' : 'flex-start',
              }} />
              <span className="hbar" style={{
                width: '20px',
                background: mobileMenuOpen ? gold : (isDark ? 'rgba(255,255,255,.82)' : 'rgba(0,0,0,.75)'),
                transform: mobileMenuOpen ? 'rotate(-45deg) translate(4px,-4px)' : 'none',
              }} />
            </button>
          </div>

        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          MOBILE MENU
      ══════════════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            display: 'flex', flexDirection: 'column',
            background: mobileBg,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          <div aria-hidden style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: `linear-gradient(to right, transparent, ${gold}, transparent)`,
          }} />

          <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            overflowY: 'auto', paddingTop: '88px', paddingInline: '28px',
            paddingBottom: 'calc(2rem + env(safe-area-inset-bottom,0px))',
            WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
          }}>

            {/* Nav links */}
            <nav aria-label="Mobile navigation" style={{ marginBottom: '2rem' }}>
              {[
                ...NAV,
                { id: 'portfolio', labelKey: 'landing.nav.portfolio', def: 'Portfolio', href: '/portfolio' },
              ].map((item, i) => {
                const base = {
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingBlock: '18px', paddingInlineStart: '6px',
                  color: txtMain, borderBottom: `1px solid ${bdColor}`,
                };
                const text = {
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 'clamp(1.25rem,4.5vw,1.65rem)',
                  fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15,
                };
                const ico = (
                  <ArrowUpRight style={{
                    width: '18px', height: '18px', opacity: 0.24, flexShrink: 0,
                    transform: isRTL ? 'scaleX(-1)' : 'none',
                  }} aria-hidden />
                );
                return item.href ? (
                  <Link
                    key={item.id}
                    data-mi
                    ref={i === 0 ? firstFocRef : null}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="ymob"
                    style={{ ...base, textDecoration: 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = gold; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = txtMain; }}
                  >
                    <span style={text}>{t(item.labelKey, item.def)}</span>
                    {ico}
                  </Link>
                ) : (
                  <button
                    key={item.id}
                    data-mi
                    ref={i === 0 ? firstFocRef : null}
                    onClick={() => { scrollTo(item.id); setActiveNav(item.id); }}
                    className="ymob"
                    style={{
                      ...base, width: '100%',
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'start',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = gold; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = txtMain; }}
                  >
                    <span style={text}>{t(item.labelKey, item.def)}</span>
                    {ico}
                  </button>
                );
              })}
            </nav>

            {/* Utilities */}
            <div data-mi style={{ display: 'flex', gap: '10px', marginBottom: '2rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', flex: 1,
                border: `1px solid ${bdColor}`,
                background: isDark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.02)',
              }}>
                <span style={{
                  fontSize: '9px', textTransform: 'uppercase',
                  letterSpacing: '.28em', color: 'rgba(212,175,55,.56)', flexShrink: 0,
                }}>
                  {t('common.toggleLanguage', 'Lang')}
                </span>
                <LanguageSelector />
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { setMobileMenuOpen(false); trackWhatsAppClick('header-mobile'); }}
                aria-label="WhatsApp"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '6px', padding: '12px 16px', textDecoration: 'none', flexShrink: 0,
                  border: '1px solid rgba(37,211,102,.25)',
                  background: 'rgba(37,211,102,.06)',
                  color: 'rgba(37,211,102,.9)',
                }}
              >
                <MessageCircle style={{ width: '15px', height: '15px' }} aria-hidden />
                <span style={{ fontSize: '9px', letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 300 }}>WA</span>
              </a>
            </div>

            {/* Auth CTAs */}
            <div data-mi style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isAuthenticated ? (
                <>
                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/app/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        width: '100%', textAlign: 'center', padding: '15px',
                        fontSize: '11px', fontWeight: 300, letterSpacing: '.22em',
                        textTransform: 'uppercase', color: txtMain,
                        border: `1px solid ${bdColor}`, textDecoration: 'none',
                      }}
                    >
                      {t('common.admin', 'Admin Panel')}
                    </Link>
                  )}
                  <Link
                    to="/app/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="ycta"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '16px', fontSize: '11px', fontWeight: 600, letterSpacing: '.18em',
                      textTransform: 'uppercase', color: '#000',
                      background: gold, textDecoration: 'none',
                      boxShadow: '0 0 22px rgba(212,175,55,0.22)',
                    }}
                  >
                    {t('common.goToApp', 'Go to App')}
                    <ArrowUpRight style={{ width: '14px', height: '14px' }} aria-hidden />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      width: '100%', textAlign: 'center', padding: '15px',
                      fontSize: '11px', fontWeight: 300, letterSpacing: '.22em',
                      textTransform: 'uppercase', color: txtMain,
                      border: `1px solid ${bdColor}`, textDecoration: 'none',
                      transition: 'border-color .2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(212,175,55,.4)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = bdColor; }}
                  >
                    {t('common.login', 'Sign In')}
                  </Link>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onStartProject?.(); }}
                    className="ycta"
                    style={{
                      width: '100%', padding: '16px',
                      fontSize: '11px', fontWeight: 700, letterSpacing: '.15em',
                      textTransform: 'uppercase', color: '#000',
                      background: gold, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      boxShadow: '0 0 24px rgba(212,175,55,0.24)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#c4a030'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = gold; }}
                  >
                    {t('landing.hero.cta', 'Start a Project')}
                    <ArrowUpRight style={{ width: '14px', height: '14px' }} aria-hidden />
                  </button>
                </>
              )}
            </div>

            {/* Footer note */}
            <div data-mi style={{
              marginTop: '2rem', paddingTop: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderTop: `1px solid ${bdColor}`,
            }}>
              <p style={{ fontSize: '10px', letterSpacing: '.22em', color: 'rgba(212,175,55,.36)' }}>
                © 2025 YANSY
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} aria-hidden>
                {[0.5, 0.24, 0.1].map((o, i) => (
                  <div key={i} style={{
                    width: 4, height: 4, borderRadius: '50%', background: gold, opacity: o,
                  }} />
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Header;