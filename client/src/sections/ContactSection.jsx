import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, Check, ChevronDown, Loader2, MessageCircle, Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useReveal, revealStyle } from '../hooks/useReveal';
import api from '../utils/api';
import { trackContactForm } from '../utils/ga4';
import { trackLead, trackContact } from '../utils/metaPixel';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

const WA_URL = 'https://wa.me/201090385390?text=Hello%2C%20I%27d%20like%20to%20discuss%20a%20project%20with%20YANSY.';

/* The two guarantees left over once "free consultation" and "48-hour
   proposal" moved into the process timeline below (steps 2 and 3) — see
   PROCESS_STEPS. Wording matches components/portfolio-detail/CTASection.jsx's
   GUARANTEES verbatim for the code-ownership promise; that file documents
   itself as the synced copy after a past drift where the two pages quoted
   different numbers, so it's the one this follows rather than re-diverging. */
const BADGES_EN = [
  'Milestone-based payments — you pay as we deliver',
  '100% code ownership after final delivery',
];
const BADGES_AR = [
  'دفع على مراحل — تدفع مع التسليم',
  'ملكية 100٪ للكود بعد التسليم النهائي',
];

const PROCESS_STEPS_EN = [
  { title: 'Tell us about your project', sub: 'Takes 2 minutes, no jargon needed' },
  { title: 'Free 30-minute consultation', sub: 'No pitch, no pressure' },
  { title: 'Receive a clear proposal', sub: 'Fixed scope & price, within 48 hours' },
  { title: 'We start building', sub: 'Weekly updates, not radio silence' },
];
const PROCESS_STEPS_AR = [
  { title: 'أخبرنا عن مشروعك', sub: 'يستغرق دقيقتين فقط' },
  { title: 'استشارة مجانية 30 دقيقة', sub: 'بدون ضغط، بدون بيع' },
  { title: 'تصلك خطة واضحة', sub: 'نطاق وسعر ثابتان، خلال 48 ساعة' },
  { title: 'نبدأ التنفيذ', sub: 'تحديثات أسبوعية، لا صمت مطبق' },
];

const PROJECT_TYPES_EN = [
  'Website / Landing Page',
  'E-commerce Platform',
  'SaaS / Web Application',
  'Mobile App',
  'ERP / CRM System',
  'Booking / Scheduling System',
  'Process Automation',
  'Not sure yet',
];
const PROJECT_TYPES_AR = [
  'موقع / صفحة هبوط',
  'منصة تجارة إلكترونية',
  'SaaS / تطبيق ويب',
  'تطبيق موبايل',
  'نظام ⁦ERP / CRM⁩',
  'نظام حجز وجدولة',
  'أتمتة عمليات',
  'غير متأكد بعد',
];

/* Deliberately permissive: this only has to catch typos like a missing @ or a
   trailing comma. Anything stricter starts rejecting valid addresses, and the
   server validates for real anyway. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Floating-label field. `placeholder=" "` (a real space, not empty) is what
 * makes the `:placeholder-shown` CSS selector work at all — with no
 * placeholder attribute, browsers never match it, and the label would never
 * float back down when the field is cleared. The label stays a real,
 * always-in-the-DOM `<label>` (not sr-only) so it satisfies WCAG 3.3.2 both
 * visually and programmatically, in every state.
 */
const FloatingField = ({
  as = 'input', id, name, label, rtl, error, required, valid, trailing, children, ...rest
}) => {
  const Tag = as;
  return (
    <div className="ff-wrap">
      <div className={`ff-box${error ? ' has-error' : ''}`}>
        <Tag
          id={id}
          name={name}
          placeholder=" "
          className="ff-control"
          dir={rtl ? 'rtl' : 'ltr'}
          aria-required={required ? 'true' : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          {...rest}
        >
          {children}
        </Tag>
        <label htmlFor={id} className="ff-label">
          {label}{required && ' *'}
        </label>
        {valid && !error && (
          <span className="ff-check" aria-hidden>
            <Check size={13} strokeWidth={3} />
          </span>
        )}
        {trailing}
      </div>
      {error && (
        <p id={`${id}-err`} className="ff-error" style={{ flexDirection: rtl ? 'row-reverse' : 'row' }}>
          <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden style={{ flexShrink: 0 }}>
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3.5a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 4.5zM8 11.75a.9.9 0 110-1.8.9.9 0 010 1.8z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

const ContactSection = ({ isRTL: isRTLProp }) => {
  const { isRTL: ctxRTL } = useLanguage();
  const rtl = isRTLProp ?? ctxRTL;
  const font = rtl ? FONT_AR : FONT_EN;

  const [submitted, setSubmitted] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | loading | success
  const [error, setError] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', projectType: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [ripples, setRipples] = useState([]);
  const formRef = useRef(null);

  const { ref: sectionRef, revealed } = useReveal({ threshold: 0.06 });
  const cardRef = useRef(null);

  // Same lazy-loaded-homepage-section rule as WhyYANSY/TechSection: no
  // ScrollTrigger (its cached trigger position goes stale once later lazy
  // siblings shift page height — verified bug, see ImagePlaceholder.jsx).
  // `useReveal`'s IntersectionObserver re-checks continuously instead, gates
  // `revealed`, and GSAP only plays after that's already true, only on
  // dedicated wrapper elements, always with clearProps at the end.
  useEffect(() => {
    if (!revealed || !cardRef.current) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;

    const ctx = gsap.context(() => {
      const fields = cardRef.current.querySelectorAll('[data-ff-slot]');
      const btn = cardRef.current.querySelector('[data-submit-slot]');
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (fields.length) {
        tl.fromTo(fields, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, clearProps: 'opacity,transform' });
      }
      if (btn) {
        tl.fromTo(btn, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, clearProps: 'opacity,transform' }, '-=0.25');
      }
    }, cardRef);
    return () => ctx.revert();
  }, [revealed]);

  const validate = (values) => {
    const errs = {};
    if (!values.name.trim()) {
      errs.name = rtl ? 'من فضلك أدخل اسمك.' : 'Please enter your name.';
    }
    if (!values.email.trim()) {
      errs.email = rtl ? 'من فضلك أدخل بريدك الإلكتروني.' : 'Please enter your email address.';
    } else if (!EMAIL_RE.test(values.email.trim())) {
      errs.email = rtl ? 'هذا البريد الإلكتروني لا يبدو صحيحاً.' : "That email address doesn't look right.";
    }
    if (!values.message.trim()) {
      errs.message = rtl ? 'أخبرنا باختصار عما تريد بناءه.' : 'Tell us briefly what you want to build.';
    }
    return errs;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const addRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.4;
    const id = Date.now();
    setRipples(r => [...r, { id, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 650);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate(form);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      formRef.current?.querySelector(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }
    setPhase('loading');
    setError(false);
    try {
      // Was previously `fetch('/api/contact', ...)` — that endpoint has never
      // existed on the backend, so every submission silently failed. Routed
      // through the existing lead-capture endpoint via the shared `api`
      // client so it respects VITE_API_URL in every environment.
      await api.post('/project-requests/ai-lead', {
        name: form.name,
        contact: form.email,
        service: form.projectType || undefined,
        message: form.message,
        source: 'Homepage Contact Form',
      });
      trackContactForm('homepage-contact-form');
      trackLead({ content_name: 'homepage-contact-form', content_category: form.projectType || undefined });
      trackContact({ content_name: 'homepage-contact-form' });
      setPhase('success');
      // A brief confirmed-on-the-button beat before the whole card swaps to
      // the full success panel — immediate feedback at the point of the
      // click, instead of a single abrupt cut straight to the panel.
      setTimeout(() => setSubmitted(true), 550);
    } catch {
      setError(true);
      setPhase('idle');
    }
  };

  const badges = rtl ? BADGES_AR : BADGES_EN;
  const steps = rtl ? PROCESS_STEPS_AR : PROCESS_STEPS_EN;
  const projectTypes = rtl ? PROJECT_TYPES_AR : PROJECT_TYPES_EN;

  return (
    <section
      ref={sectionRef}
      id="contact"
      dir={rtl ? 'rtl' : 'ltr'}
      className="section-shell contact-section"
      style={{
        background: 'rgb(var(--bg-contrast))',
        borderTop: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="contact-bg-grid" aria-hidden />
      <div className="contact-bg-grain" aria-hidden />
      <div className="contact-glow contact-glow--a" aria-hidden />
      <div className="contact-glow contact-glow--b" aria-hidden />
      <div className="contact-stars" aria-hidden>
        {[...Array(7)].map((_, i) => <span key={i} className={`contact-star contact-star--${i}`} />)}
      </div>

      <style>{`
        .contact-grid { display: grid; grid-template-columns: 5fr 7fr; gap: clamp(3rem, 7vw, 7rem); align-items: start; }
        @media (max-width: 860px) { .contact-grid { grid-template-columns: 1fr; } }

        .contact-bg-grid {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background-image: radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 32px 32px;
        }
        .contact-bg-grain {
          position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.03; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
        }
        .contact-glow { position: absolute; z-index: 0; pointer-events: none; border-radius: 50%; filter: blur(90px); animation: contactDrift 20s ease-in-out infinite; }
        .contact-glow--a { width: 460px; height: 460px; top: -180px; ${rtl ? 'left' : 'right'}: -140px; background: radial-gradient(circle, rgba(37,99,235,0.22), transparent 70%); }
        .contact-glow--b { width: 380px; height: 380px; bottom: -160px; ${rtl ? 'right' : 'left'}: -120px; background: radial-gradient(circle, rgba(37,99,235,0.1), transparent 70%); animation-delay: -10s; }
        @keyframes contactDrift { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(0, 20px); } }
        @media (prefers-reduced-motion: reduce) { .contact-glow { animation: none; } }

        .contact-stars { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
        .contact-star {
          position: absolute; width: 2.5px; height: 2.5px; border-radius: 50%;
          background: #fff; animation: contactTwinkle 3.6s ease-in-out infinite;
        }
        .contact-star--0 { top: 12%; left: 8%; animation-delay: 0s; }
        .contact-star--1 { top: 22%; left: 42%; animation-delay: -1.1s; }
        .contact-star--2 { top: 8%; left: 68%; animation-delay: -2.3s; }
        .contact-star--3 { top: 46%; left: 88%; animation-delay: -0.6s; }
        .contact-star--4 { top: 68%; left: 15%; animation-delay: -1.8s; }
        .contact-star--5 { top: 78%; left: 60%; animation-delay: -2.9s; }
        .contact-star--6 { top: 35%; left: 25%; animation-delay: -3.2s; }
        @keyframes contactTwinkle { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.65; } }
        @media (prefers-reduced-motion: reduce) { .contact-star { animation: none; opacity: 0.3; } }

        .contact-badge {
          display: inline-flex; align-items: center; gap: 7px; font-size: 10.5px; font-weight: 700;
          color: #93C5FD; letter-spacing: ${rtl ? '0' : '0.07em'}; text-transform: ${rtl ? 'none' : 'uppercase'};
          background: rgba(37,99,235,0.12); border: 1px solid rgba(37,99,235,0.22);
          padding: 5px 14px; border-radius: 100px; flex-direction: ${rtl ? 'row-reverse' : 'row'};
        }
        .contact-badge-dot { width: 5px; height: 5px; border-radius: 50%; background: #93C5FD; flex-shrink: 0; animation: pulseDot 2.2s ease-in-out infinite; }
        @keyframes pulseDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @media (prefers-reduced-motion: reduce) { .contact-badge-dot { animation: none; } }

        .contact-headline-line { display: block; opacity: 0; transform: translateY(14px); }
        .contact-headline.is-in .contact-headline-line {
          opacity: 1; transform: translateY(0);
          transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1) var(--d, 0s), transform 0.6s cubic-bezier(0.16,1,0.3,1) var(--d, 0s);
        }

        /* ── Social proof strip ── */
        .contact-proof { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; margin: 0 0 clamp(2rem, 4vw, 2.75rem); }
        [dir="rtl"] .contact-proof { justify-content: flex-end; }
        .contact-proof-item { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: rgba(255,255,255,0.55); font-weight: 500; }
        .contact-proof-divider { width: 3px; height: 3px; border-radius: 50%; background: rgba(255,255,255,0.22); flex-shrink: 0; }
        .contact-proof-stars { display: flex; gap: 1px; color: #FBBF24; }
        .contact-proof-rating { color: rgba(255,255,255,0.85); font-weight: 700; }

        /* ── Process timeline ── */
        .contact-timeline { position: relative; margin: 0 0 clamp(2rem, 4vw, 2.75rem); padding: 0; list-style: none; }
        .contact-timeline-item { position: relative; display: flex; gap: 14px; padding-bottom: 20px; }
        [dir="rtl"] .contact-timeline-item { flex-direction: row-reverse; }
        .contact-timeline-item:last-child { padding-bottom: 0; }
        .contact-timeline-item::before {
          content: ''; position: absolute; top: 26px; bottom: -6px; ${rtl ? 'right' : 'left'}: 12.5px; width: 1.5px;
          background: linear-gradient(180deg, rgba(96,165,250,0.4), rgba(96,165,250,0.08));
        }
        .contact-timeline-item:last-child::before { display: none; }
        .contact-timeline-node {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; position: relative; z-index: 1;
          display: flex; align-items: center; justify-content: center;
          background: rgba(37,99,235,0.14); border: 1.5px solid rgba(96,165,250,0.4);
          font-size: 10.5px; font-weight: 800; color: #93C5FD; font-variant-numeric: tabular-nums;
        }
        .contact-timeline-body { padding-top: 2px; }
        .contact-timeline-title { font-size: 13.5px; font-weight: 700; color: #fff; margin: 0 0 2px; letter-spacing: ${rtl ? '0' : '-0.01em'}; }
        .contact-timeline-sub { font-size: 12px; color: rgba(255,255,255,0.45); margin: 0; }

        /* ── Guarantee badges ── */
        .contact-badges { display: flex; flex-direction: column; gap: 10px; margin-bottom: clamp(1.5rem, 3vw, 2rem); }
        .contact-guarantee { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.5; }
        .contact-guarantee-check {
          width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; margin-top: 1.5px;
          background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.22);
          display: flex; align-items: center; justify-content: center;
        }

        .contact-wa-btn {
          display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border-radius: 10px;
          background: rgba(37,211,102,0.08); border: 1.5px solid rgba(37,211,102,0.22); color: #4ADE80;
          font-size: 14px; font-weight: 600; text-decoration: none;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .contact-wa-btn:hover { background: rgba(37,211,102,0.15); border-color: rgba(37,211,102,0.35); transform: translateY(-2px); }
        .contact-wa-btn svg { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .contact-wa-btn:hover svg { transform: scale(1.15) rotate(-6deg); }

        /* ── Form card ── */
        .contact-card {
          position: relative; background: rgb(var(--bg-elevated)); border-radius: var(--radius-xl);
          padding: clamp(24px, 3.5vw, 44px); max-width: 560px;
          box-shadow: 0 40px 90px -20px rgba(0,0,0,0.55), 0 12px 32px -8px rgba(37,99,235,0.18);
          border: 1px solid rgba(255,255,255,0.06);
        }
        @media (max-width: 860px) { .contact-card { max-width: none; } }

        .contact-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 480px) { .contact-row-2 { grid-template-columns: 1fr; } }

        /* Floating-label field system */
        .ff-wrap { margin-bottom: 12px; }
        .ff-box { position: relative; }
        .ff-control {
          width: 100%; padding: 21px 16px 8px; border-radius: 12px;
          border: 1.5px solid rgb(var(--border)); background: rgb(var(--bg-secondary));
          font-size: 14px; color: rgb(var(--text-primary)); outline: none; box-sizing: border-box;
          font-family: inherit; line-height: 1.5; appearance: none; -webkit-appearance: none; -moz-appearance: none;
          transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }
        select.ff-control { padding-inline-end: 38px; cursor: pointer; }
        select.ff-control:invalid { color: rgb(var(--text-tertiary)); }
        textarea.ff-control { resize: vertical; min-height: 96px; padding-top: 24px; }
        .ff-control::placeholder { color: transparent; }
        .ff-control:focus {
          border-color: rgb(var(--accent)); background: rgb(var(--bg-elevated));
          box-shadow: 0 0 0 4px rgb(var(--accent) / 0.12);
        }
        .ff-box.has-error .ff-control { border-color: rgb(var(--danger)); animation: ffShake 0.4s ease; }
        @keyframes ffShake { 20%, 60% { transform: translateX(-3px); } 40%, 80% { transform: translateX(3px); } }
        @media (prefers-reduced-motion: reduce) { .ff-box.has-error .ff-control { animation: none; } }

        .ff-label {
          position: absolute; top: 15px; ${rtl ? 'right' : 'left'}: 17px; ${rtl ? 'left' : 'right'}: 34px;
          font-size: 14px; color: rgb(var(--text-tertiary)); pointer-events: none;
          transform-origin: ${rtl ? 'right' : 'left'} top; transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ff-control:focus ~ .ff-label,
        .ff-control:not(:placeholder-shown) ~ .ff-label,
        .ff-control:-webkit-autofill ~ .ff-label {
          top: 7px; transform: scale(0.8) translateY(0);
        }
        /* <select> has no ":placeholder-shown" equivalent, and its own closed-
           state text would otherwise sit exactly where a resting label does —
           so its label always stays in the floated position; the field's own
           display (blank while unset, the option text once chosen) carries
           the rest. */
        select.ff-control ~ .ff-label { top: 7px; transform: scale(0.8) translateY(0); }
        .ff-control:focus ~ .ff-label { color: rgb(var(--accent)); }

        .ff-check {
          position: absolute; top: 50%; transform: translateY(-50%); ${rtl ? 'left' : 'right'}: 14px;
          width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          background: rgb(var(--success-light)); color: rgb(var(--success));
          animation: ffPop 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes ffPop { from { opacity: 0; transform: translateY(-50%) scale(0.5); } to { opacity: 1; transform: translateY(-50%) scale(1); } }
        .ff-select-chevron {
          position: absolute; top: 50%; transform: translateY(-50%); ${rtl ? 'left' : 'right'}: 14px;
          color: rgb(var(--text-tertiary)); pointer-events: none;
        }
        .ff-error {
          font-size: 12px; color: rgb(var(--danger)); margin: 6px 2px 0; text-align: ${rtl ? 'right' : 'left'};
          display: flex; align-items: center; gap: 5px;
          animation: ffErrorIn 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes ffErrorIn { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: translateY(0); } }

        /* ── Submit button ── */
        .contact-submit {
          position: relative; overflow: hidden; width: 100%; justify-content: center;
          font-size: 14.5px; padding: 15px 24px; gap: 8px;
          transition: background 0.2s ease, box-shadow 0.25s ease, transform 0.15s ease, opacity 0.2s ease;
        }
        .contact-submit:not(:disabled):hover { box-shadow: 0 10px 30px rgba(37,99,235,0.35); transform: translateY(-2px); }
        .contact-submit:not(:disabled):active { transform: translateY(0) scale(0.985); }
        .contact-submit svg.arrow-icon { transition: transform 0.25s cubic-bezier(0.16,1,0.3,1); }
        .contact-submit:not(:disabled):hover svg.arrow-icon { transform: ${rtl ? 'translateX(-4px)' : 'translateX(4px)'}; }
        .contact-submit.is-success { background: rgb(var(--success)); border-color: rgb(var(--success)); }
        .btn-ripple { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.35); transform: scale(0); animation: rippleAnim 0.65s ease-out forwards; pointer-events: none; }
        @keyframes rippleAnim { to { transform: scale(1); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .btn-ripple { display: none; } }
        .spin-icon { animation: spinIcon 0.8s linear infinite; }
        @keyframes spinIcon { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .spin-icon { animation: spinIcon 1.6s linear infinite; } }

        .contact-success-icon { animation: successPop 0.5s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes successPop { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <div className="section-inner" style={{ position: 'relative', zIndex: 1 }}>
        <div className="contact-grid">

          {/* Left: Pitch */}
          <div style={{ textAlign: rtl ? 'right' : 'left' }}>
            <span className="contact-badge" style={{ marginBottom: 32, ...revealStyle(revealed, 0, { distance: 10 }) }}>
              <span className="contact-badge-dot" aria-hidden />
              {rtl ? 'ابدأ اليوم' : 'Start today'}
            </span>

            <h2
              className={`contact-headline${revealed ? ' is-in' : ''}`}
              style={{
                fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', fontWeight: 800, lineHeight: 1.05,
                letterSpacing: rtl ? 0 : '-0.04em', color: 'rgb(var(--on-contrast))',
                margin: '0 0 clamp(16px, 2.5vw, 24px)', fontFamily: font,
              }}
            >
              {rtl ? (
                <>
                  <span className="contact-headline-line" style={{ '--d': '0.05s' }}>أخبرنا ما تريد</span>
                  <span className="contact-headline-line" style={{ '--d': '0.15s' }}>بناءه. سنخبرك</span>
                  <span className="contact-headline-line" style={{ '--d': '0.25s', color: '#60A5FA' }}>كيف نوصلك إليه.</span>
                </>
              ) : (
                <>
                  <span className="contact-headline-line" style={{ '--d': '0.05s' }}>Tell us what you</span>
                  <span className="contact-headline-line" style={{ '--d': '0.15s' }}>want to build. We'll</span>
                  <span className="contact-headline-line" style={{ '--d': '0.25s', color: '#60A5FA' }}>tell you how to get there.</span>
                </>
              )}
            </h2>

            <p style={{
              fontSize: 'clamp(0.9375rem, 1.1vw, 1.0625rem)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75,
              margin: '0 0 clamp(1.5rem, 3vw, 2rem)', maxWidth: 420, fontFamily: font,
              ...revealStyle(revealed, 1, { distance: 14 }),
            }}>
              {rtl
                ? 'اترك لنا الأمر. نحن نتولى التصميم والبناء والإطلاق — بينما تركز على عملك.'
                : "Leave it to us. We handle the design, build, and launch — while you focus on your business."}
            </p>

            {/* Social proof */}
            <div className="contact-proof" style={revealStyle(revealed, 2, { distance: 12 })}>
              <span className="contact-proof-item">
                <span className="contact-proof-stars" aria-hidden>
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" strokeWidth={0} />)}
                </span>
                <span className="contact-proof-rating">4.9/5</span>
              </span>
              <span className="contact-proof-divider" aria-hidden />
              <span className="contact-proof-item">{rtl ? 'رد خلال ساعتين' : 'Reply within 2 hours'}</span>
              <span className="contact-proof-divider" aria-hidden />
              <span className="contact-proof-item">{rtl ? 'موثوق من شركات ناشئة ونامية' : 'Trusted by startups & growing businesses'}</span>
            </div>

            {/* Process timeline — what happens after you hit send */}
            <ol className="contact-timeline" style={revealStyle(revealed, 3, { distance: 16 })}>
              {steps.map((s, i) => (
                <li className="contact-timeline-item" key={i}>
                  <span className="contact-timeline-node" dir="ltr" aria-hidden>{i + 1}</span>
                  <div className="contact-timeline-body">
                    <p className="contact-timeline-title" style={{ fontFamily: font }}>{s.title}</p>
                    <p className="contact-timeline-sub" style={{ fontFamily: font }}>{s.sub}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Guarantee badges */}
            <div className="contact-badges" style={revealStyle(revealed, 4, { distance: 10 })}>
              {badges.map((b, i) => (
                <div key={i} className="contact-guarantee" style={{ flexDirection: rtl ? 'row-reverse' : 'row', textAlign: rtl ? 'right' : 'left' }}>
                  <span className="contact-guarantee-check" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" width="9" height="9">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span style={{ fontFamily: font }}>{b}</span>
                </div>
              ))}
            </div>

            {/* WhatsApp */}
            <div style={revealStyle(revealed, 5, { distance: 10 })}>
              <a
                href={WA_URL} target="_blank" rel="noopener noreferrer"
                className="contact-wa-btn" style={{ flexDirection: rtl ? 'row-reverse' : 'row' }}
              >
                <MessageCircle style={{ width: 16, height: 16, flexShrink: 0 }} aria-hidden />
                {rtl ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
              </a>
            </div>
          </div>

          {/* Right: Form */}
          <div ref={cardRef} className="contact-card" style={revealStyle(revealed, 1, { distance: 24, duration: 0.7 })}>
            {submitted ? (
              <div role="status" style={{ textAlign: 'center', padding: 'clamp(40px, 6vw, 60px) 0' }}>
                <div className="contact-success-icon" style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: 'rgb(var(--success-light))', margin: '0 auto 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="rgb(var(--success))" strokeWidth="2.5" width="26" height="26" aria-hidden>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: 'rgb(var(--text-primary))', margin: '0 0 8px', letterSpacing: '-0.02em', fontFamily: font }}>
                  {rtl ? 'تم الإرسال!' : 'Message sent!'}
                </h3>
                <p style={{ fontSize: 14, color: 'rgb(var(--text-secondary))', margin: 0, fontFamily: font }}>
                  {rtl ? 'سنرد عليك خلال ساعتين.' : "We'll get back to you within 2 hours."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate ref={formRef}>
                <div style={{ textAlign: rtl ? 'right' : 'left', marginBottom: 22 }}>
                  <h3 style={{ fontSize: 'clamp(1.125rem, 1.5vw, 1.375rem)', fontWeight: 700, color: 'rgb(var(--text-primary))', margin: '0 0 6px', letterSpacing: rtl ? 0 : '-0.02em', fontFamily: font }}>
                    {rtl ? 'أخبرنا عن مشروعك' : 'Tell us about your project'}
                  </h3>
                  <p style={{ fontSize: 13, color: 'rgb(var(--text-secondary))', margin: 0, fontFamily: font }}>
                    {rtl ? 'مجاني · بدون التزام · رد خلال ساعتين' : 'Free · No commitment · Reply within 2 hours'}
                  </p>
                </div>

                <div className="contact-row-2">
                  <div data-ff-slot>
                    <FloatingField
                      id="contact-name" name="name" rtl={rtl} required
                      label={rtl ? 'الاسم' : 'Name'}
                      error={fieldErrors.name}
                      valid={form.name.trim().length > 1}
                      value={form.name} onChange={handleChange}
                      autoComplete="name"
                    />
                  </div>
                  <div data-ff-slot>
                    <FloatingField
                      id="contact-email" name="email" type="email" rtl={rtl} required
                      label={rtl ? 'البريد الإلكتروني' : 'Email'}
                      error={fieldErrors.email}
                      valid={EMAIL_RE.test(form.email.trim())}
                      value={form.email} onChange={handleChange}
                      autoComplete="email" inputMode="email"
                    />
                  </div>
                </div>

                <div data-ff-slot>
                  <FloatingField
                    as="select" id="contact-type" name="projectType" rtl={rtl}
                    label={rtl ? 'نوع المشروع (اختياري)' : 'Project type (optional)'}
                    value={form.projectType} onChange={handleChange}
                    trailing={<ChevronDown size={14} className="ff-select-chevron" aria-hidden />}
                  >
                    <option value="" />
                    {projectTypes.map((t, i) => (
                      <option key={i} value={t}>{t}</option>
                    ))}
                  </FloatingField>
                </div>

                <div data-ff-slot>
                  <FloatingField
                    as="textarea" id="contact-message" name="message" rtl={rtl} required
                    label={rtl ? 'وصف المشروع' : 'Project description'}
                    error={fieldErrors.message}
                    value={form.message} onChange={handleChange}
                    rows={4}
                  />
                </div>

                {/* Submit-level failure. role="alert" so it is announced the
                    moment it appears. */}
                {error && (
                  <p role="alert" style={{
                    fontSize: 12.5, color: 'rgb(var(--danger))', margin: '0 0 12px', textAlign: rtl ? 'right' : 'left',
                    background: 'rgb(var(--danger-light))', border: '1px solid rgb(var(--danger) / 0.25)',
                    borderRadius: 8, padding: '10px 12px', fontFamily: font,
                  }}>
                    {rtl ? 'تعذر إرسال طلبك. حاول مرة أخرى أو راسلنا عبر واتساب.' : "Couldn't send your request. Please try again or reach us on WhatsApp."}
                  </p>
                )}

                <div data-submit-slot>
                  <button
                    type="submit"
                    disabled={phase !== 'idle'}
                    onClick={addRipple}
                    className={`btn-primary contact-submit${phase === 'success' ? ' is-success' : ''}`}
                    style={{ opacity: phase === 'loading' ? 0.85 : 1, cursor: phase === 'loading' ? 'wait' : 'pointer' }}
                  >
                    {ripples.map(r => (
                      <span key={r.id} className="btn-ripple" style={{ left: r.x, top: r.y, width: r.size, height: r.size }} aria-hidden />
                    ))}
                    {phase === 'loading' && <Loader2 size={16} className="spin-icon" aria-hidden />}
                    {phase === 'success' && <Check size={16} aria-hidden />}
                    {phase === 'loading'
                      ? (rtl ? 'جارٍ الإرسال...' : 'Sending...')
                      : phase === 'success'
                        ? (rtl ? 'تم الإرسال!' : 'Sent!')
                        : (rtl ? 'أرسل طلبك' : 'Send Your Request')}
                    {phase === 'idle' && (
                      <ArrowRight className="arrow-icon" style={{ width: 15, height: 15, transform: rtl ? 'scaleX(-1)' : 'none' }} aria-hidden />
                    )}
                  </button>
                </div>

                <p style={{ fontSize: 11.5, color: 'rgb(var(--text-secondary))', textAlign: 'center', margin: '14px 0 0', fontFamily: font }}>
                  {rtl ? 'نرد في الغالب خلال ساعتين' : 'We typically respond within 2 hours'}
                </p>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

export default ContactSection;
