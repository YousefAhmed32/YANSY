import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X, ChevronLeft, ChevronRight, Check, Sparkles, Target,
  Mail, Phone, Building2, Tag, Link as LinkIcon, Clock, AlertCircle,
  MessageCircle, FileText, Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../utils/api';
import { gsap } from 'gsap';
import { PROJECT_TYPES, FEATURE_TAGS, BUDGET_OPTIONS, TIMELINE_OPTIONS, COMPANY_SIZE_OPTIONS } from '../constants/projectOptions';
import { trackStartProjectChoice, trackFormStep, trackWhatsAppClick, trackContactForm } from '../utils/ga4';

/* ═══════════════════════════════════════════════════════════════
   YANSY — Start Your Project flow (v4, Minimal Tech White)

   Screen 0: Decision — WhatsApp vs. Website Form (equally weighted)
   Screen A: WhatsApp quick-brief — name + optional context, then
             redirect to wa.me with a pre-filled localized message
   Screen B: Full 4-step project request form

   Rendered through a portal directly under <body>, independent of
   any page-level stacking context (PageTransition's animated
   wrapper, a transformed ancestor, etc.) — this is what guarantees
   it always paints above the fixed site header (z-index 1000)
   regardless of where in the tree it's mounted.
   ═══════════════════════════════════════════════════════════════ */

// Highest tier of the app's overlay stack (site header = 1000, sticky
// banners/mobile nav = 999, floating widgets' full-screen states = 9999-10000).
// A user-initiated modal must never be obscured by any of those, so it
// shares the top tier rather than picking an arbitrary bigger number.
const MODAL_Z = 10000;

const DEFAULT_SETTINGS = {
  whatsappEnabled: true,
  formEnabled: true,
  whatsappNumber: '+201090385390',
  whatsappTitle: {}, whatsappDescription: {}, whatsappResponseTime: {},
  formTitle: {}, formDescription: {}, formResponseTime: {},
  buttonOrder: 'whatsapp-first',
  defaultOption: null,
};

const beacon = (type, extra) => {
  api.post('/start-project/event', { type, ...extra }).catch(() => {});
};

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* ─── Small shared bits ───────────────────────────────────────── */
const FieldError = ({ msg }) =>
  msg ? (
    <p className="flex items-center gap-2 mt-2 text-xs" style={{ color: '#DC2626' }}>
      <AlertCircle style={{ width: 13, height: 13, flexShrink: 0 }} />
      {msg}
    </p>
  ) : null;

const T = {
  bg: '#FFFFFF', surface: '#FAFAFA', subtle: '#F6F7F9',
  border: '#E8EBF0', borderStrong: '#C9CDD6',
  text: '#0D1117', textSecondary: '#5C6370', textTertiary: '#9BA3AE',
  accent: '#2563EB', accentLight: '#EFF6FF', accentMuted: '#DBEAFE', accentHover: '#1D4ED8',
  whatsapp: '#25D366', whatsappLight: '#ECFDF5', whatsappMuted: '#D1FAE5',
  danger: '#DC2626',
};

/* ═══════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════ */
const ProjectRequestForm = ({ isOpen, onClose }) => {
  const { t }          = useTranslation();
  const { dir, isRTL, language } = useLanguage();

  const TOTAL = 4;

  /* ── Settings (admin-configurable) ──────────────────────────── */
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  /* ── Flow state ──────────────────────────────────────────────── */
  const [view, setView] = useState('decision'); // 'decision' | 'whatsapp' | 'form'

  /* ── Full form state ─────────────────────────────────────────── */
  const [step,        setStep]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [errors,      setErrors]      = useState({});
  const [tagsOpen,    setTagsOpen]    = useState(false);
  const [charCount,   setCharCount]   = useState(0);
  const [form, setForm] = useState({
    projectType: '', projectDescription: '', referenceUrl: '', tags: [],
    budgetRange: '', timeline: '', clientType: '',
    fullName: '', phoneNumber: '', email: '', companyName: '', companySize: '',
  });

  /* ── WhatsApp quick-brief state ─────────────────────────────── */
  const [waForm, setWaForm]     = useState({ name: '', projectType: '', budgetRange: '', timeline: '' });
  const [waErrors, setWaErrors] = useState({});
  const [waRedirecting, setWaRedirecting] = useState(false);

  const backdropRef  = useRef(null);
  const modalRef      = useRef(null);
  const contentRef      = useRef(null);
  const scrollRef         = useRef(null);
  const firstInputRef      = useRef(null);
  const decisionFirstRef    = useRef(null);
  const formStartRef         = useRef(null);
  const firedDecisionView     = useRef(false);
  const triggerElRef           = useRef(null);

  const STEP_NAMES = [
    t('projectForm.steps.names.projectType'),
    t('projectForm.steps.names.idea'),
    t('projectForm.steps.names.details'),
    t('projectForm.steps.names.contact'),
  ];

  /* ── Localized override helper ──────────────────────────────── */
  const loc = (overrideObj, fallback) => {
    const val = overrideObj?.[language];
    return val && val.trim() ? val : fallback;
  };

  const doClose = useCallback(() => {
    if (loading) return;
    const isMobile = window.matchMedia('(max-width: 639px)').matches;
    gsap.to(modalRef.current, isMobile
      ? { y: '100%', opacity: 0.6, duration: 0.24, ease: 'power2.in' }
      : { opacity: 0, scale: 0.97, y: 12, duration: 0.2, ease: 'power2.in' }
    ).then(() => {
      setView('decision'); setStep(1); setSubmitted(false); setErrors({}); setTagsOpen(false);
      setForm({ projectType:'',projectDescription:'',referenceUrl:'',tags:[],
        budgetRange:'',timeline:'',clientType:'',fullName:'',phoneNumber:'',
        email:'',companyName:'',companySize:'', });
      setWaForm({ name: '', projectType: '', budgetRange: '', timeline: '' });
      setWaErrors({}); setWaRedirecting(false);
      firedDecisionView.current = false;
      onClose();
      triggerElRef.current?.focus?.();
    });
  }, [loading, onClose]);

  /* ── Remember the trigger element so focus can return to it ──── */
  useEffect(() => {
    if (isOpen) triggerElRef.current = document.activeElement;
  }, [isOpen]);

  /* ── Robust body scroll lock (iOS-safe: fixed + offset, not just
       `overflow:hidden`, which iOS Safari happily ignores while a
       touch-scroll gesture is already in progress) ──────────────── */
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = { overflow: body.style.overflow, position: body.style.position, top: body.style.top, width: body.style.width };
    Object.assign(body.style, { overflow: 'hidden', position: 'fixed', top: `-${scrollY}px`, width: '100%' });
    return () => {
      Object.assign(body.style, prev);
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  /* ── Escape closes ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e) => { if (e.key === 'Escape' && !loading) doClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [isOpen, loading, doClose]);

  /* ── Focus trap — Tab/Shift+Tab cycles within the dialog only ──── */
  const handleTrapTab = useCallback((e) => {
    if (e.key !== 'Tab' || !modalRef.current) return;
    const nodes = Array.from(modalRef.current.querySelectorAll(FOCUSABLE_SELECTOR))
      .filter((el) => el.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }, []);

  /* ── Keep the modal's usable height in sync with the real visual
       viewport (shrinks correctly when the mobile keyboard opens,
       instead of the sheet being pushed off-screen or the footer
       hiding behind the keyboard) ──────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    const vv = window.visualViewport;
    if (!vv || !modalRef.current) return;
    const update = () => modalRef.current?.style.setProperty('--sp-vvh', `${vv.height}px`);
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, [isOpen]);

  /* ── Fetch settings on open ─────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setSettingsLoaded(false);
    api.get('/start-project/settings')
      .then(({ data }) => { if (!cancelled) setSettings({ ...DEFAULT_SETTINGS, ...data.settings }); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setSettingsLoaded(true); });
    return () => { cancelled = true; };
  }, [isOpen]);

  /* ── Auto-skip decision screen when only one channel is enabled ── */
  useEffect(() => {
    if (!isOpen || !settingsLoaded) return;
    if (!settings.whatsappEnabled && settings.formEnabled) {
      setView('form');
      formStartRef.current = Date.now();
    } else if (settings.whatsappEnabled && !settings.formEnabled) {
      setView('whatsapp');
      beacon('whatsapp_click');
    }
  }, [isOpen, settingsLoaded, settings.whatsappEnabled, settings.formEnabled]);

  /* ── Decision-view analytics ────────────────────────────────── */
  useEffect(() => {
    if (!isOpen || !settingsLoaded || view !== 'decision' || firedDecisionView.current) return;
    beacon('decision_view');
    firedDecisionView.current = true;
  }, [isOpen, settingsLoaded, view]);

  /* ── Modal open animation — slide up on mobile (bottom sheet),
       scale + fade from center on desktop ─────────────────────── */
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const isMobile = window.matchMedia('(max-width: 639px)').matches;
      if (isMobile) {
        gsap.fromTo(modalRef.current, { y: '100%', opacity: 0.6 }, { y: 0, opacity: 1, duration: 0.36, ease: 'power3.out' });
      } else {
        gsap.fromTo(modalRef.current, { opacity: 0, scale: 0.96, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.32, ease: 'power2.out' });
      }
    }
  }, [isOpen]);

  /* ── View / step change animation ───────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    if (contentRef.current) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, x: isRTL ? -14 : 14 },
        { opacity: 1, x: 0, duration: 0.28, ease: 'power2.out' }
      );
    }
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => (firstInputRef.current || decisionFirstRef.current)?.focus(), 80);
  }, [step, view, isOpen, isRTL]);

  /* ── Form-step analytics ────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen || view !== 'form') return;
    beacon('form_step', { step });
    trackFormStep(step, TOTAL);
  }, [isOpen, view, step]);

  /* ── Char counter ───────────────────────────────────────────── */
  useEffect(() => { setCharCount(form.projectDescription.length); }, [form.projectDescription]);

  /* ── Helpers ────────────────────────────────────────────────── */
  const set = useCallback((field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: undefined }));
  }, []);

  const toggleTag = useCallback((key) => {
    setForm(p => ({
      ...p,
      tags: p.tags.includes(key) ? p.tags.filter(k => k !== key) : [...p.tags, key],
    }));
  }, []);

  /* ── Choice handlers ─────────────────────────────────────────── */
  const chooseWhatsApp = () => {
    trackStartProjectChoice('whatsapp');
    beacon('whatsapp_click');
    setView('whatsapp');
  };

  const chooseForm = () => {
    trackStartProjectChoice('form');
    beacon('form_open');
    formStartRef.current = Date.now();
    setStep(1);
    setView('form');
  };

  const backToDecision = () => {
    setView('decision');
    setWaErrors({});
  };

  /* ── WhatsApp quick-brief ───────────────────────────────────── */
  const setWa = (field, value) => {
    setWaForm(p => ({ ...p, [field]: value }));
    setWaErrors(p => ({ ...p, [field]: undefined }));
  };

  const buildWhatsAppMessage = () => {
    const lines = [t('projectForm.whatsappBrief.messageGreeting', { name: waForm.name.trim() })];
    const type = PROJECT_TYPES.find(o => o.value === waForm.projectType);
    if (type) lines.push(`${t('projectForm.whatsappBrief.messageProjectType')}: ${t(`projectForm.steps.projectType.options.${type.key}`)}`);
    const budget = BUDGET_OPTIONS.find(o => o.value === waForm.budgetRange);
    if (budget) lines.push(`${t('projectForm.whatsappBrief.messageBudget')}: ${t(`projectForm.budgetOptions.${budget.key}`)}`);
    const timeline = TIMELINE_OPTIONS.find(o => o.value === waForm.timeline);
    if (timeline) lines.push(`${t('projectForm.whatsappBrief.messageTimeline')}: ${t(`projectForm.steps.timeline.options.${timeline.key}`)}`);
    lines.push(t('projectForm.whatsappBrief.messageClosing'));
    return lines.join('\n');
  };

  const submitWhatsApp = (ev) => {
    ev.preventDefault();
    if (!waForm.name || waForm.name.trim().length < 2) {
      setWaErrors({ name: t('projectForm.whatsappBrief.nameError') });
      return;
    }
    const digits = (settings.whatsappNumber || '').replace(/[^\d]/g, '');
    const text = encodeURIComponent(buildWhatsAppMessage());
    beacon('whatsapp_submit');
    trackWhatsAppClick('start-project-flow');
    setWaRedirecting(true);
    window.open(`https://wa.me/${digits}?text=${text}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => doClose(), 1200);
  };

  /* ── Full-form validation ───────────────────────────────────── */
  const validate = (s) => {
    const e = {};
    if (s === 1 && !form.projectType)
      e.projectType = t('projectForm.steps.projectType.error');
    if (s === 2 && (!form.projectDescription || form.projectDescription.trim().length < 10))
      e.projectDescription = t('projectForm.steps.projectDescription.error');
    if (s === 3) {
      if (!form.budgetRange) e.budgetRange = t('projectForm.steps.budget.error');
      if (!form.timeline)    e.timeline    = t('projectForm.steps.timeline.error');
      if (!form.clientType)  e.clientType  = t('projectForm.steps.clientType.error');
    }
    if (s === 4) {
      if (!form.fullName || form.fullName.trim().length < 2)
        e.fullName = t('projectForm.steps.contact.fullNameError');
      if (!form.phoneNumber || form.phoneNumber.trim().length < 5)
        e.phoneNumber = t('projectForm.steps.contact.phoneNumberError');
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
        e.email = t('projectForm.steps.contact.emailError');
      if (form.clientType === 'company') {
        if (!form.companyName || form.companyName.trim().length < 2)
          e.companyName = t('projectForm.steps.contact.companyNameError');
        if (!form.companySize)
          e.companySize = t('projectForm.steps.contact.companySizeError');
      }
    }
    setErrors(e);
    return e;
  };

  const next = () => {
    const e = validate(step);
    if (!Object.keys(e).length) setStep(p => Math.min(p + 1, TOTAL));
    else {
      const first = scrollRef.current?.querySelector('[data-error]');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const back = () => {
    if (step === 1) { backToDecision(); return; }
    setStep(p => Math.max(p - 1, 1));
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate(4);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await api.post('/project-requests/submit', form);
      setSubmitted(true);
      const seconds = formStartRef.current ? (Date.now() - formStartRef.current) / 1000 : undefined;
      beacon('form_complete', { completionSeconds: seconds });
      trackContactForm('project-request');
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || t('projectForm.errors.submitFailed') });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  /* ── Shared styles ──────────────────────────────────────────── */
  const inputCls = [
    'w-full px-4 py-3.5 bg-white border transition-all outline-none text-base',
  ].join(' ');

  const charPct = Math.min((charCount / 300) * 100, 100);
  const charOk  = charCount >= 10;

  const bothEnabled = settings.whatsappEnabled && settings.formEnabled;
  const cardOrder = settings.buttonOrder === 'form-first' ? ['form', 'whatsapp'] : ['whatsapp', 'form'];

  const headerTitle =
    view === 'decision' ? t('projectForm.decision.title') :
    view === 'whatsapp' ? t('projectForm.whatsappBrief.title') :
    STEP_NAMES[step - 1];

  const showFooter = settingsLoaded && (
    (view === 'whatsapp' && !waRedirecting) ||
    (view === 'form')
  );

  /* ─────────────────────────────────────────────────────────────
     RENDER — portaled directly onto <body>, outside any page-level
     stacking context, so z-index alone is enough to sit above the
     fixed header (no matter whether the header is fixed, sticky,
     transparent, animated, or scrolled).
  ───────────────────────────────────────────────────────────── */
  return createPortal(
    <>
      <style>{`
        @keyframes sp-fadein  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sp-pop     { 0%{transform:scale(0.6);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes sp-spin    { to{ transform: rotate(360deg); } }
        .sp-fadein   { animation: sp-fadein .35s ease-out both; }
        .sp-fadein-d { animation: sp-fadein .4s ease-out .1s both; }
        .sp-pop      { animation: sp-pop .3s cubic-bezier(.34,1.56,.64,1) both; }

        @media (prefers-reduced-motion: reduce) {
          .sp-fadein,.sp-fadein-d,.sp-pop { animation: none !important; }
        }

        .sp-sr-only {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
        }

        .sp-scroll::-webkit-scrollbar      { width: 6px; }
        .sp-scroll::-webkit-scrollbar-track{ background: transparent; }
        .sp-scroll::-webkit-scrollbar-thumb{ background: ${T.border}; border-radius: 99px; }
        .sp-scroll::-webkit-scrollbar-thumb:hover { background: ${T.borderStrong}; }

        /* ── Modal shell — bottom sheet on mobile, centered card on desktop ── */
        .sp-modal {
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -8px 40px rgba(13,17,23,.14);
          max-height: min(92dvh, calc(var(--sp-vvh, 100dvh) - 16px));
        }
        @media (min-width: 640px) {
          .sp-modal {
            border-radius: 24px;
            box-shadow: 0 32px 64px -12px rgba(13,17,23,.22), 0 12px 24px -8px rgba(13,17,23,.10), 0 0 0 1px rgba(13,17,23,.04);
            max-height: min(88vh, calc(var(--sp-vvh, 100vh) - 48px));
          }
        }

        .sp-header-safe { padding-top: max(20px, env(safe-area-inset-top)); }
        .sp-footer-safe { padding-bottom: max(16px, env(safe-area-inset-bottom)); }

        /* Decision cards */
        .sp-choice-card { transition: border-color .18s ease, box-shadow .18s ease, transform .15s ease; }
        .sp-choice-card:hover  { border-color: ${T.borderStrong}; box-shadow: 0 8px 28px rgba(13,17,23,0.08); transform: translateY(-2px); }
        .sp-choice-card:focus-visible { outline: 2px solid ${T.accent}; outline-offset: 3px; }

        /* Type / option cards */
        .sp-opt-card { transition: border-color .16s ease, background .16s ease, transform .12s ease; }
        .sp-opt-card:hover { border-color: ${T.borderStrong}; background: ${T.subtle}; }
        .sp-opt-card.sel   { border-color: ${T.accent}; background: ${T.accentLight}; }
        .sp-opt-card:focus-visible { outline: 2px solid ${T.accent}; outline-offset: 2px; }

        .sp-opt-row { transition: border-color .16s ease, background .16s ease; }
        .sp-opt-row:hover { border-color: ${T.borderStrong}; background: ${T.subtle}; }
        .sp-opt-row.sel   { border-color: ${T.accent}; background: ${T.accentLight}; }

        .sp-tag { transition: border-color .16s ease, background .16s ease, color .16s ease; }
        .sp-tag:hover  { border-color: ${T.borderStrong}; background: ${T.subtle}; }
        .sp-tag.sel    { border-color: ${T.accent}; background: ${T.accentLight}; color: ${T.accent}; }

        .sp-btn-primary { transition: background .18s ease, box-shadow .18s ease, transform .1s ease; background: ${T.accent}; }
        .sp-btn-primary:hover:not(:disabled)  { background: ${T.accentHover}; box-shadow: 0 4px 16px rgba(37,99,235,.28); }
        .sp-btn-primary:active:not(:disabled) { transform: scale(.97); }

        .sp-btn-wa { transition: background .18s ease, box-shadow .18s ease, transform .1s ease; background: ${T.whatsapp}; }
        .sp-btn-wa:hover:not(:disabled)  { background: #1FB958; box-shadow: 0 4px 16px rgba(37,211,102,.3); }
        .sp-btn-wa:active:not(:disabled) { transform: scale(.97); }

        .sp-btn-back { transition: background .16s ease, border-color .16s ease; }
        .sp-btn-back:hover:not(:disabled) { background: ${T.subtle}; border-color: ${T.borderStrong}; }
        .sp-btn-back:active:not(:disabled) { transform: scale(.97); }

        .sp-close-btn { transition: background .15s ease, color .15s ease; color: ${T.textTertiary}; }
        .sp-close-btn:hover  { background: ${T.subtle}; color: ${T.text}; }
        .sp-close-btn:active { transform: scale(.92); }
        .sp-close-btn:focus-visible { outline: 2px solid ${T.accent}; outline-offset: 2px; }

        .sp-input { transition: border-color .16s ease, background .16s ease; }
        .sp-input:focus { border-color: ${T.accent} !important; background: #fff !important; }

        .sp-tags-body { overflow: hidden; transition: max-height .35s cubic-bezier(.4,0,.2,1), opacity .3s ease; }

        /* ── Fine-grained responsive fluidity, 320px → ultra-wide ── */
        .sp-type-grid  { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(6px, 2vw, 10px); }
        .sp-type-card  { padding: clamp(8px, 3vw, 14px); }
        @media (max-width: 359px) {
          .sp-client-grid { grid-template-columns: 1fr !important; }
        }

        /* ── Nav footer — wraps gracefully instead of overflowing on very narrow viewports ── */
        .sp-footer-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .sp-footer-row > * { flex: 0 0 auto; }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        ref={backdropRef}
        dir={dir}
        className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ zIndex: MODAL_Z, background: 'rgba(13,17,23,.55)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => { if (e.target === backdropRef.current) doClose(); }}
      >
        {/* ══ Modal ═════════════════════════════════════════════════ */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label={headerTitle}
          onKeyDown={handleTrapTab}
          className="sp-modal relative w-full sm:max-w-2xl flex flex-col overflow-hidden"
          style={{ background: T.bg, border: `1px solid ${T.border}` }}
        >
          {/* ── Top bar (always visible, never scrolls) ────────── */}
          <div className="sp-header-safe relative flex-shrink-0 flex items-center justify-between px-5 sm:px-6 pb-4"
            style={{ borderBottom: `1px solid ${T.border}` }}>

            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: T.accent }}>
                <Target style={{ width: 16, height: 16, color: '#fff' }} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate" style={{ fontSize: 'clamp(.9rem,3vw,1.05rem)', color: T.text, lineHeight: 1.25 }}>
                  {headerTitle}
                </p>
                {view === 'form' && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                      {Array.from({ length: TOTAL }).map((_, i) => (
                        <div key={i} className="rounded-full transition-all duration-300"
                          style={{ width: i < step ? 16 : 6, height: 4, background: i < step ? T.accent : (i === step ? T.accentMuted : T.border) }} />
                      ))}
                    </div>
                    <span className="ms-1" style={{ fontSize: 10, color: T.textTertiary }} aria-hidden="true">{step}/{TOTAL}</span>
                    <span className="sp-sr-only">{t('projectForm.steps.step', { step, total: TOTAL })}</span>
                  </div>
                )}
                {view === 'decision' && (
                  <p style={{ fontSize: 11.5, color: T.textSecondary }}>{t('projectForm.decision.subtitle')}</p>
                )}
              </div>
            </div>

            <button onClick={doClose} disabled={loading}
              className="sp-close-btn flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg"
              aria-label={t('projectForm.projectRequest.close')}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* ── Progress bar — form view only ─────────────────── */}
          {view === 'form' && (
            <div className="relative flex-shrink-0 h-[3px]" style={{ background: T.border }}>
              <div className="absolute inset-y-0 left-0"
                style={{ background: T.accent, width: `${(step / TOTAL) * 100}%`, transition: 'width .4s cubic-bezier(.4,0,.2,1)' }} />
            </div>
          )}

          {/* ── Scrollable body — the ONLY region that scrolls; header
               and footer stay pinned outside it so they're always visible ── */}
          <div ref={scrollRef} className="sp-scroll flex-1 overflow-y-auto px-5 sm:px-6 pt-5 pb-5" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
            <div ref={contentRef}>

            {/* ══════════════════════════════════════════════════
                SCREEN 0 — Decision
            ══════════════════════════════════════════════════ */}
            {!settingsLoaded ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 style={{ width: 26, height: 26, color: T.accent, animation: 'sp-spin .8s linear infinite' }} />
              </div>
            ) : view === 'decision' ? (
              <div className="sp-fadein">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cardOrder.map((kind, idx) => {
                    const isWa = kind === 'whatsapp';
                    const autoFocus = settings.defaultOption ? settings.defaultOption === kind : idx === 0;
                    const title = isWa
                      ? loc(settings.whatsappTitle, t('projectForm.decision.whatsapp.title'))
                      : loc(settings.formTitle, t('projectForm.decision.form.title'));
                    const desc = isWa
                      ? loc(settings.whatsappDescription, t('projectForm.decision.whatsapp.description'))
                      : loc(settings.formDescription, t('projectForm.decision.form.description'));
                    const respTime = isWa
                      ? loc(settings.whatsappResponseTime, t('projectForm.decision.whatsapp.responseTime'))
                      : loc(settings.formResponseTime, t('projectForm.decision.form.responseTime'));
                    const benefits = t(`projectForm.decision.${kind}.benefits`, { returnObjects: true });
                    const CardIcon = isWa ? MessageCircle : FileText;

                    return (
                      <button
                        key={kind}
                        ref={autoFocus ? decisionFirstRef : null}
                        type="button"
                        onClick={isWa ? chooseWhatsApp : chooseForm}
                        className="sp-choice-card text-start flex flex-col p-5 sm:p-6 rounded-2xl"
                        style={{ border: `1.5px solid ${T.border}`, background: T.bg }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ background: isWa ? T.whatsappLight : T.accentLight }}>
                            <CardIcon style={{ width: 22, height: 22, color: isWa ? T.whatsapp : T.accent }} />
                          </div>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                            style={{ background: T.subtle, border: `1px solid ${T.border}` }}>
                            <Clock style={{ width: 11, height: 11, color: T.textSecondary }} />
                            <span style={{ fontSize: 10.5, color: T.textSecondary, fontWeight: 500 }}>{respTime}</span>
                          </div>
                        </div>

                        <h3 className="font-semibold mb-1.5" style={{ fontSize: 17, color: T.text, letterSpacing: '-0.01em' }}>{title}</h3>
                        <p className="mb-4" style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.55 }}>{desc}</p>

                        <ul className="space-y-2 mt-auto">
                          {Array.isArray(benefits) && benefits.map((b, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Check style={{ width: 13, height: 13, color: isWa ? T.whatsapp : T.accent, flexShrink: 0 }} />
                              <span style={{ fontSize: 12.5, color: T.text }}>{b}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="flex items-center gap-1.5 mt-5 pt-4 font-medium" style={{ borderTop: `1px solid ${T.border}`, fontSize: 12.5, color: isWa ? T.whatsapp : T.accent }}>
                          {isWa ? t('projectForm.decision.whatsapp.title') : t('projectForm.decision.form.title')}
                          <ChevronRight style={{ width: 14, height: 14, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            /* ══════════════════════════════════════════════════
                SCREEN A — WhatsApp quick-brief
            ══════════════════════════════════════════════════ */
            ) : view === 'whatsapp' ? (
              waRedirecting ? (
                <div className="py-14 text-center sp-fadein">
                  <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 sp-pop" style={{ background: T.whatsappLight }}>
                    <Check style={{ width: 28, height: 28, color: T.whatsapp }} />
                  </div>
                  <h3 className="font-semibold mb-2" style={{ fontSize: 18, color: T.text }}>{t('projectForm.whatsappBrief.redirecting')}</h3>
                  <p style={{ fontSize: 13, color: T.textSecondary }}>{t('projectForm.whatsappBrief.redirectingDesc')}</p>
                </div>
              ) : (
                <form id="sp-form-whatsapp" onSubmit={submitWhatsApp} noValidate>
                  <p className="mb-5" style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>
                    {t('projectForm.whatsappBrief.subtitle')}
                  </p>

                  <div className="mb-5">
                    <label className="flex items-center gap-2 mb-2 font-medium" style={{ fontSize: 13, color: T.text }}>
                      👤 {t('projectForm.whatsappBrief.nameLabel')}
                      <span style={{ color: T.danger, fontSize: 12 }}>*</span>
                    </label>
                    <input ref={firstInputRef} type="text" autoComplete="name"
                      value={waForm.name} onChange={(e) => setWa('name', e.target.value)}
                      className={`${inputCls} sp-input rounded-lg`}
                      style={{ borderColor: waErrors.name ? T.danger : T.border, color: T.text }}
                      placeholder={t('projectForm.whatsappBrief.namePlaceholder')} />
                    {waErrors.name && <div data-error><FieldError msg={waErrors.name} /></div>}
                  </div>

                  <div className="mb-5">
                    <p className="mb-2.5 font-medium flex items-center gap-2" style={{ fontSize: 13, color: T.text }}>
                      {t('projectForm.whatsappBrief.projectTypeLabel')}
                      <span style={{ fontSize: 11, color: T.textTertiary, fontWeight: 400 }}>({t('projectForm.whatsappBrief.optional')})</span>
                    </p>
                    <div className="sp-type-grid">
                      {PROJECT_TYPES.map((opt) => {
                        const sel = waForm.projectType === opt.value;
                        return (
                          <button key={opt.value} type="button"
                            onClick={() => setWa('projectType', sel ? '' : opt.value)}
                            className={`sp-opt-card sp-type-card relative border text-center rounded-lg ${sel ? 'sel' : ''}`}
                            style={{ borderColor: sel ? T.accent : T.border }}
                            aria-pressed={sel}>
                            <div className="text-xl mb-1" style={{ lineHeight: 1 }}>{opt.icon}</div>
                            <div style={{ fontSize: 9.5, color: sel ? T.accent : T.textSecondary, fontWeight: 500 }}>
                              {t(`projectForm.steps.projectType.options.${opt.key}`)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mb-5">
                    <p className="mb-2.5 font-medium flex items-center gap-2" style={{ fontSize: 13, color: T.text }}>
                      💰 {t('projectForm.whatsappBrief.budgetLabel')}
                      <span style={{ fontSize: 11, color: T.textTertiary, fontWeight: 400 }}>({t('projectForm.whatsappBrief.optional')})</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {BUDGET_OPTIONS.map((opt) => {
                        const sel = waForm.budgetRange === opt.value;
                        return (
                          <button key={opt.value} type="button"
                            onClick={() => setWa('budgetRange', sel ? '' : opt.value)}
                            className={`sp-tag px-3 py-1.5 border rounded-full font-medium ${sel ? 'sel' : ''}`}
                            style={{ fontSize: 11.5, borderColor: sel ? T.accent : T.border, color: sel ? T.accent : T.textSecondary }}
                            aria-pressed={sel}>
                            {opt.icon} {t(`projectForm.budgetOptions.${opt.key}`)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mb-2">
                    <p className="mb-2.5 font-medium flex items-center gap-2" style={{ fontSize: 13, color: T.text }}>
                      <Clock style={{ width: 13, height: 13, color: T.accent }} />
                      {t('projectForm.whatsappBrief.timelineLabel')}
                      <span style={{ fontSize: 11, color: T.textTertiary, fontWeight: 400 }}>({t('projectForm.whatsappBrief.optional')})</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {TIMELINE_OPTIONS.map((opt) => {
                        const sel = waForm.timeline === opt.value;
                        return (
                          <button key={opt.value} type="button"
                            onClick={() => setWa('timeline', sel ? '' : opt.value)}
                            className={`sp-tag px-3 py-1.5 border rounded-full font-medium ${sel ? 'sel' : ''}`}
                            style={{ fontSize: 11.5, borderColor: sel ? T.accent : T.border, color: sel ? T.accent : T.textSecondary }}
                            aria-pressed={sel}>
                            {opt.icon} {t(`projectForm.steps.timeline.options.${opt.key}`)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </form>
              )

            /* ══════════════════════════════════════════════════
                SCREEN B — Full form
            ══════════════════════════════════════════════════ */
            ) : submitted ? (
              <div className="py-12 text-center sp-fadein">
                <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-7 sp-pop" style={{ background: T.accentLight }}>
                  <Check style={{ width: 34, height: 34, color: T.accent }} />
                </div>
                <h3 className="font-bold mb-3" style={{ fontSize: 'clamp(1.25rem,3.5vw,1.6rem)', color: T.text, letterSpacing: '-0.02em' }}>
                  {t('projectForm.projectRequest.requestSubmitted')}
                </h3>
                <p className="mb-8 max-w-xs mx-auto" style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.6 }}>
                  {t('projectForm.projectRequest.requestSubmittedDesc')}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {[
                    { icon: Sparkles, label: t('projectForm.projectRequest.receivedLabel') },
                    { icon: Check,    label: t('projectForm.projectRequest.notifiedLabel') },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ border: `1px solid ${T.border}`, background: T.subtle }}>
                      <item.icon style={{ width: 12, height: 12, color: T.accent, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: T.textSecondary }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form id="sp-form-main" onSubmit={submit} noValidate>

                {/* ══ STEP 1 — Project Type ═══════════════════════ */}
                {step === 1 && (
                  <div>
                    <p className="font-medium mb-5" style={{ fontSize: 'clamp(.95rem,3vw,1.1rem)', color: T.text }}>
                      {t('projectForm.steps.projectType.title')}
                    </p>
                    <div className="sp-type-grid">
                      {PROJECT_TYPES.map((opt) => {
                        const sel = form.projectType === opt.value;
                        return (
                          <button key={opt.value} type="button" ref={opt.value === PROJECT_TYPES[0].value ? firstInputRef : null}
                            onClick={() => set('projectType', opt.value)}
                            className={`sp-opt-card sp-type-card relative border text-center rounded-xl ${sel ? 'sel' : ''}`}
                            style={{ borderColor: sel ? T.accent : T.border }}
                            aria-pressed={sel}>
                            {sel && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center sp-pop" style={{ background: T.accent }}>
                                <Check style={{ width: 10, height: 10, color: '#fff' }} />
                              </div>
                            )}
                            <div className="text-2xl mb-1.5" style={{ lineHeight: 1 }}>{opt.icon}</div>
                            <div className="font-medium leading-tight" style={{ fontSize: 10, color: sel ? T.accent : T.textSecondary }}>
                              {t(`projectForm.steps.projectType.options.${opt.key}`)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {errors.projectType && <div data-error><FieldError msg={errors.projectType} /></div>}
                  </div>
                )}

                {/* ══ STEP 2 — Description + optional extras ═══════ */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <label className="flex items-center justify-between mb-2.5">
                        <span className="flex items-center gap-2 font-medium" style={{ fontSize: 'clamp(.95rem,3vw,1.1rem)', color: T.text }}>
                          <Sparkles style={{ width: 15, height: 15, color: T.accent, flexShrink: 0 }} />
                          {t('projectForm.steps.projectDescription.title')}
                        </span>
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-colors"
                          style={{ fontSize: 10, color: charOk ? '#16A34A' : T.textTertiary, background: charOk ? '#F0FDF4' : 'transparent', border: `1px solid ${charOk ? '#BBF7D0' : 'transparent'}` }}>
                          {charOk && <Check style={{ width: 9, height: 9 }} />}
                          {charCount}
                        </span>
                      </label>
                      <div className="h-[3px] mb-2.5 overflow-hidden rounded-full" style={{ background: T.border }}>
                        <div className="h-full transition-all duration-300 rounded-full"
                          style={{ width: `${charPct}%`, background: charOk ? '#22C55E' : T.accentMuted }} />
                      </div>
                      <textarea
                        ref={firstInputRef}
                        value={form.projectDescription}
                        onChange={(e) => set('projectDescription', e.target.value)}
                        rows={4}
                        className={`${inputCls} sp-input resize-none rounded-lg`}
                        style={{ borderColor: T.border, color: T.text, lineHeight: 1.65 }}
                        placeholder={t('projectForm.steps.projectDescription.placeholder')} />
                      {errors.projectDescription && <div data-error><FieldError msg={errors.projectDescription} /></div>}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 mb-2 font-medium" style={{ fontSize: 13, color: T.textSecondary }}>
                        <LinkIcon style={{ width: 13, height: 13, color: T.accent, flexShrink: 0 }} />
                        {t('projectForm.steps.reference.title')}
                        <span style={{ color: T.textTertiary, fontSize: 11 }}>({t('projectForm.steps.reference.optional')})</span>
                      </label>
                      <div className="relative">
                        <input type="url" value={form.referenceUrl}
                          onChange={(e) => set('referenceUrl', e.target.value)}
                          className={`${inputCls} sp-input rounded-lg`}
                          style={{ borderColor: T.border, color: T.text, paddingInlineEnd: form.referenceUrl ? 40 : undefined }}
                          placeholder={t('projectForm.steps.reference.placeholder')} />
                        {form.referenceUrl && (
                          <Check className="absolute top-1/2 -translate-y-1/2" style={{ width: 16, height: 16, color: '#16A34A', [isRTL ? 'left' : 'right']: 14 }} />
                        )}
                      </div>
                    </div>

                    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                      <button type="button"
                        onClick={() => setTagsOpen(p => !p)}
                        className="w-full flex items-center justify-between px-4 py-3 transition-colors"
                        style={{ background: tagsOpen ? T.accentLight : T.subtle }}
                        aria-expanded={tagsOpen}>
                        <span className="flex items-center gap-2" style={{ color: T.textSecondary, fontSize: 13 }}>
                          <Tag style={{ width: 13, height: 13, color: T.accent, flexShrink: 0 }} />
                          {t('projectForm.steps.tags.title')}
                          <span style={{ color: T.textTertiary, fontSize: 11 }}>({t('projectForm.steps.tags.optional')})</span>
                          {form.tags.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full" style={{ background: T.accentMuted, color: T.accent, fontSize: 10 }}>
                              {form.tags.length} ✓
                            </span>
                          )}
                        </span>
                        <ChevronRight style={{ width: 14, height: 14, color: T.textTertiary, transform: tagsOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .3s ease' }} />
                      </button>
                      <div className="sp-tags-body" style={{ maxHeight: tagsOpen ? 600 : 0, opacity: tagsOpen ? 1 : 0 }}>
                        <div className="px-4 pb-4 pt-1 space-y-4">
                          {FEATURE_TAGS.map((group) => (
                            <div key={group.categoryKey}>
                              <p className="flex items-center gap-1.5 mb-2" style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: T.textTertiary }}>
                                <span>{group.icon}</span>
                                {t(`projectForm.steps.tags.categories.${group.categoryKey}`)}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {group.tags.map((tagKey) => {
                                  const sel = form.tags.includes(tagKey);
                                  return (
                                    <button key={tagKey} type="button" onClick={() => toggleTag(tagKey)}
                                      className={`sp-tag px-3 py-1.5 border font-medium rounded-full ${sel ? 'sel' : ''}`}
                                      style={{ fontSize: 11, borderColor: sel ? T.accent : T.border, color: sel ? T.accent : T.textSecondary }}
                                      aria-pressed={sel}>
                                      {sel && '✓ '}{t(`projectForm.steps.tags.options.${tagKey}`)}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ══ STEP 3 — Budget + Timeline + Client ══════════ */}
                {step === 3 && (
                  <div className="space-y-7">
                    <div>
                      <p className="font-medium mb-3" style={{ fontSize: 'clamp(.95rem,3vw,1.1rem)', color: T.text }}>
                        💰 {t('projectForm.steps.budget.title')}
                      </p>
                      <div className="space-y-2">
                        {BUDGET_OPTIONS.map((opt) => {
                          const sel = form.budgetRange === opt.value;
                          return (
                            <button key={opt.value} type="button" ref={opt.value === BUDGET_OPTIONS[0].value ? firstInputRef : null}
                              onClick={() => set('budgetRange', opt.value)}
                              className={`sp-opt-row w-full flex items-center justify-between px-4 py-3.5 border text-start rounded-lg ${sel ? 'sel' : ''}`}
                              style={{ borderColor: sel ? T.accent : T.border }}
                              aria-pressed={sel}>
                              <div className="flex items-center gap-3">
                                <span style={{ fontSize: 20 }}>{opt.icon}</span>
                                <span className="font-medium" style={{ fontSize: 13, color: sel ? T.text : T.textSecondary }}>
                                  {t(`projectForm.budgetOptions.${opt.key}`)}
                                </span>
                              </div>
                              {sel ? (
                                <div className="w-5 h-5 rounded-full flex items-center justify-center sp-pop" style={{ background: T.accent, flexShrink: 0 }}>
                                  <Check style={{ width: 10, height: 10, color: '#fff' }} />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border" style={{ borderColor: T.border, flexShrink: 0 }} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {errors.budgetRange && <div data-error><FieldError msg={errors.budgetRange} /></div>}
                    </div>

                    <div>
                      <p className="flex items-center gap-2 font-medium mb-3" style={{ fontSize: 'clamp(.95rem,3vw,1.1rem)', color: T.text }}>
                        <Clock style={{ width: 15, height: 15, color: T.accent, flexShrink: 0 }} />
                        {t('projectForm.steps.timeline.title')}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {TIMELINE_OPTIONS.map((opt) => {
                          const sel = form.timeline === opt.value;
                          return (
                            <button key={opt.value} type="button" onClick={() => set('timeline', opt.value)}
                              className={`sp-opt-card relative p-3.5 border text-center rounded-lg ${sel ? 'sel' : ''}`}
                              style={{ borderColor: sel ? T.accent : T.border }}
                              aria-pressed={sel}>
                              {sel && (
                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center sp-pop" style={{ background: T.accent }}>
                                  <Check style={{ width: 10, height: 10, color: '#fff' }} />
                                </div>
                              )}
                              <div style={{ fontSize: 22, marginBottom: 6 }}>{opt.icon}</div>
                              <div className="font-medium" style={{ fontSize: 11, color: sel ? T.accent : T.textSecondary, lineHeight: 1.3 }}>
                                {t(`projectForm.steps.timeline.options.${opt.key}`)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {errors.timeline && <div data-error><FieldError msg={errors.timeline} /></div>}
                    </div>

                    <div>
                      <p className="font-medium mb-3" style={{ fontSize: 'clamp(.95rem,3vw,1.1rem)', color: T.text }}>
                        {t('projectForm.steps.clientType.title')}
                      </p>
                      <div className="sp-client-grid grid grid-cols-2 gap-3">
                        {[
                          { type: 'individual', icon: '👤', titleKey: 'individual', descKey: 'individualDesc' },
                          { type: 'company',    icon: '🏢', titleKey: 'company',    descKey: 'companyDesc'    },
                        ].map((opt) => {
                          const sel = form.clientType === opt.type;
                          return (
                            <button key={opt.type} type="button" onClick={() => set('clientType', opt.type)}
                              className={`sp-opt-card relative p-4 border text-start rounded-xl ${sel ? 'sel' : ''}`}
                              style={{ borderColor: sel ? T.accent : T.border }}
                              aria-pressed={sel}>
                              {sel && (
                                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center sp-pop" style={{ background: T.accent }}>
                                  <Check style={{ width: 10, height: 10, color: '#fff' }} />
                                </div>
                              )}
                              <div style={{ fontSize: 26, marginBottom: 8 }}>{opt.icon}</div>
                              <div className="font-medium mb-0.5" style={{ fontSize: 13, color: T.text }}>
                                {t(`projectForm.steps.clientType.${opt.titleKey}`)}
                              </div>
                              <div style={{ fontSize: 11, color: T.textTertiary, lineHeight: 1.4 }}>
                                {t(`projectForm.steps.clientType.${opt.descKey}`)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {errors.clientType && <div data-error><FieldError msg={errors.clientType} /></div>}
                    </div>
                  </div>
                )}

                {/* ══ STEP 4 — Contact ══════════════════════════════ */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 mb-2 font-medium" style={{ fontSize: 13, color: T.text }}>
                        👤 {t('projectForm.steps.contact.fullName')}
                        <span style={{ color: T.danger, fontSize: 12 }}>*</span>
                      </label>
                      <div className="relative">
                        <input ref={firstInputRef} type="text" autoComplete="name"
                          value={form.fullName} onChange={(e) => set('fullName', e.target.value)}
                          className={`${inputCls} sp-input rounded-lg`}
                          style={{ borderColor: errors.fullName ? T.danger : T.border, color: T.text, paddingInlineEnd: form.fullName ? 40 : undefined }}
                          placeholder={t('projectForm.steps.contact.fullNamePlaceholder')} />
                        {form.fullName && form.fullName.length >= 2 && (
                          <Check className="absolute top-1/2 -translate-y-1/2" style={{ width: 16, height: 16, color: '#16A34A', [isRTL ? 'left' : 'right']: 14 }} />
                        )}
                      </div>
                      {errors.fullName && <div data-error><FieldError msg={errors.fullName} /></div>}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 mb-2 font-medium" style={{ fontSize: 13, color: T.text }}>
                        <Phone style={{ width: 13, height: 13, color: T.accent, flexShrink: 0 }} />
                        {t('projectForm.steps.contact.phoneNumber')}
                        <span style={{ color: T.danger, fontSize: 12 }}>*</span>
                      </label>
                      <div className="relative">
                        <input type="tel" autoComplete="tel"
                          value={form.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)}
                          className={`${inputCls} sp-input rounded-lg`}
                          style={{ borderColor: errors.phoneNumber ? T.danger : T.border, color: T.text, paddingInlineEnd: form.phoneNumber ? 40 : undefined }}
                          placeholder={t('projectForm.steps.contact.phoneNumberPlaceholder')} />
                        {form.phoneNumber && form.phoneNumber.length >= 5 && (
                          <Check className="absolute top-1/2 -translate-y-1/2" style={{ width: 16, height: 16, color: '#16A34A', [isRTL ? 'left' : 'right']: 14 }} />
                        )}
                      </div>
                      {errors.phoneNumber && <div data-error><FieldError msg={errors.phoneNumber} /></div>}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 mb-2 font-medium" style={{ fontSize: 13, color: T.text }}>
                        <Mail style={{ width: 13, height: 13, color: T.accent, flexShrink: 0 }} />
                        {t('projectForm.steps.contact.email')}
                        <span style={{ fontSize: 11, color: T.textTertiary }}>({t('projectForm.steps.contact.emailOptional')})</span>
                      </label>
                      <div className="relative">
                        <input type="email" autoComplete="email"
                          value={form.email} onChange={(e) => set('email', e.target.value)}
                          className={`${inputCls} sp-input rounded-lg`}
                          style={{ borderColor: errors.email ? T.danger : T.border, color: T.text }}
                          placeholder={t('projectForm.steps.contact.emailPlaceholder')} />
                        {form.email && /^\S+@\S+\.\S+$/.test(form.email) && (
                          <Check className="absolute top-1/2 -translate-y-1/2" style={{ width: 16, height: 16, color: '#16A34A', [isRTL ? 'left' : 'right']: 14 }} />
                        )}
                      </div>
                      {errors.email && <div data-error><FieldError msg={errors.email} /></div>}
                    </div>

                    {form.clientType === 'company' && (
                      <>
                        <div>
                          <label className="flex items-center gap-2 mb-2 font-medium" style={{ fontSize: 13, color: T.text }}>
                            <Building2 style={{ width: 13, height: 13, color: T.accent, flexShrink: 0 }} />
                            {t('projectForm.steps.contact.companyName')}
                            <span style={{ color: T.danger, fontSize: 12 }}>*</span>
                          </label>
                          <div className="relative">
                            <input type="text" autoComplete="organization"
                              value={form.companyName} onChange={(e) => set('companyName', e.target.value)}
                              className={`${inputCls} sp-input rounded-lg`}
                              style={{ borderColor: errors.companyName ? T.danger : T.border, color: T.text }}
                              placeholder={t('projectForm.steps.contact.companyNamePlaceholder')} />
                            {form.companyName && form.companyName.length >= 2 && (
                              <Check className="absolute top-1/2 -translate-y-1/2" style={{ width: 16, height: 16, color: '#16A34A', [isRTL ? 'left' : 'right']: 14 }} />
                            )}
                          </div>
                          {errors.companyName && <div data-error><FieldError msg={errors.companyName} /></div>}
                        </div>

                        <div>
                          <label className="flex items-center gap-2 mb-2 font-medium" style={{ fontSize: 13, color: T.text }}>
                            👥 {t('projectForm.steps.contact.companySize')}
                            <span style={{ color: T.danger, fontSize: 12 }}>*</span>
                          </label>
                          <div className="space-y-2">
                            {COMPANY_SIZE_OPTIONS.map((opt) => {
                              const sel = form.companySize === opt.value;
                              return (
                                <button key={opt.value} type="button" onClick={() => set('companySize', opt.value)}
                                  className={`sp-opt-row w-full flex items-center justify-between px-4 py-3 border text-start rounded-lg ${sel ? 'sel' : ''}`}
                                  style={{ borderColor: sel ? T.accent : T.border }}
                                  aria-pressed={sel}>
                                  <div className="flex items-center gap-3">
                                    <span style={{ fontSize: 18 }}>{opt.icon}</span>
                                    <span style={{ fontSize: 13, fontWeight: 500, color: sel ? T.text : T.textSecondary }}>
                                      {t(`projectForm.companySizeOptions.${opt.key}`)}
                                    </span>
                                  </div>
                                  {sel ? (
                                    <div className="w-4 h-4 rounded-full flex items-center justify-center sp-pop" style={{ background: T.accent, flexShrink: 0 }}>
                                      <Check style={{ width: 9, height: 9, color: '#fff' }} />
                                    </div>
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border" style={{ borderColor: T.border, flexShrink: 0 }} />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {errors.companySize && <div data-error><FieldError msg={errors.companySize} /></div>}
                        </div>
                      </>
                    )}

                    {errors.submit && (
                      <div className="flex items-center gap-3 px-4 py-3.5 rounded-lg" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                        <AlertCircle style={{ width: 16, height: 16, color: T.danger, flexShrink: 0 }} />
                        <p style={{ fontSize: 13, color: T.danger }}>{errors.submit}</p>
                      </div>
                    )}
                  </div>
                )}
              </form>
            )}
            </div>
          </div>

          {/* ── Footer — pinned outside the scroll area, always visible
               above the mobile keyboard and above the safe-area home
               indicator. Submit buttons target their <form> by id since
               the form fields live inside the scrollable region. ─────── */}
          {showFooter && (
            <div className="sp-footer-safe flex-shrink-0 px-5 sm:px-6 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
              {view === 'whatsapp' ? (
                <div className="sp-footer-row">
                  <button type="button" onClick={backToDecision} disabled={!bothEnabled}
                    className="sp-btn-back flex items-center gap-2 px-5 py-3 border font-medium rounded-lg disabled:opacity-0 disabled:pointer-events-none"
                    style={{ fontSize: 12, color: T.textSecondary, borderColor: T.border, background: T.bg }}>
                    <ChevronLeft style={{ width: 14, height: 14, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                    {t('projectForm.navigation.backToOptions')}
                  </button>
                  <button type="submit" form="sp-form-whatsapp"
                    className="sp-btn-wa flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg"
                    style={{ fontSize: 12.5 }}>
                    <MessageCircle style={{ width: 15, height: 15 }} />
                    {t('projectForm.whatsappBrief.continueButton')}
                  </button>
                </div>
              ) : submitted ? (
                <div className="flex justify-center">
                  <button onClick={doClose} className="sp-btn-primary px-10 py-3.5 text-white font-semibold rounded-lg" style={{ fontSize: 12.5 }}>
                    {t('projectForm.projectRequest.close')}
                  </button>
                </div>
              ) : (
                <div className="sp-footer-row">
                  <button type="button" onClick={back} disabled={loading}
                    className="sp-btn-back flex items-center gap-2 px-5 py-3 border font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ fontSize: 12, color: T.textSecondary, borderColor: T.border, background: T.bg }}>
                    <ChevronLeft style={{ width: 14, height: 14, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                    {step === 1 ? t('projectForm.navigation.backToOptions') : t('projectForm.navigation.back')}
                  </button>

                  {step < TOTAL ? (
                    <button type="button" onClick={next}
                      className="sp-btn-primary flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg" style={{ fontSize: 12.5 }}>
                      {t('projectForm.navigation.next')}
                      <ChevronRight style={{ width: 14, height: 14, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                    </button>
                  ) : (
                    <button type="submit" form="sp-form-main" disabled={loading}
                      className="sp-btn-primary flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg disabled:opacity-60 disabled:cursor-not-allowed" style={{ fontSize: 12.5 }}>
                      {loading ? (
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      ) : (
                        <Sparkles style={{ width: 14, height: 14 }} />
                      )}
                      {loading ? t('projectForm.startProject.submitting') : t('projectForm.navigation.submit')}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default ProjectRequestForm;
