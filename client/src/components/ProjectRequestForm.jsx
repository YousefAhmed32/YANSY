import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import {
  X, ChevronLeft, ChevronRight, Check, Sparkles, Target,
  Mail, Phone, Building2, Link as LinkIcon, Clock, AlertCircle,
  MessageCircle, FileText, Loader2, BadgeCheck, Languages,
  Wallet, Users, Pencil,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../utils/api';
import { gsap } from 'gsap';
import { PROJECT_TYPES, FEATURE_TAGS, BUDGET_OPTIONS, TIMELINE_OPTIONS, COMPANY_SIZE_OPTIONS } from '../constants/projectOptions';
import { trackStartProjectChoice, trackFormStep, trackWhatsAppClick, trackContactForm } from '../utils/ga4';
import { trackLead, trackContact } from '../utils/metaPixel';
import { validatePhone } from '../utils/phone';
import CapabilityPicker from './CapabilityPicker';

// A reference URL is only "valid" (green check) once it actually parses as
// a URL — accepts bare domains like "example.com" by trying an https://
// prefix first, same tolerance users get everywhere else in this form.
const isValidReferenceUrl = (raw) => {
  const v = (raw || '').trim();
  if (!v) return false;
  try { new URL(v); return true; } catch { /* fall through */ }
  try { new URL(`https://${v}`); return /\.[a-z]{2,}/i.test(v); } catch { return false; }
};

const PHONE_REASON_KEYS = {
  empty:         'projectForm.steps.contact.phoneNumberErrorEmpty',
  invalid_chars: 'projectForm.steps.contact.phoneNumberErrorChars',
  too_short:     'projectForm.steps.contact.phoneNumberErrorShort',
  too_long:      'projectForm.steps.contact.phoneNumberErrorLong',
};
const PHONE_REASON_FALLBACK = {
  empty:         'Please enter your phone number so we can reach you.',
  invalid_chars: 'That number has letters or symbols in it — keep only digits, spaces, dashes, or a leading +.',
  too_short:     'That number looks too short — double-check the digits.',
  too_long:      'That number looks too long — check for extra digits.',
};

/* ═══════════════════════════════════════════════════════════════
   YANSY — Start Your Project flow (v5, guided-workspace redesign)

   Screen 0: Decision — WhatsApp vs. Website Form (equally weighted)
   Screen A: WhatsApp quick-brief — name + optional context, then
             redirect to wa.me with a pre-filled localized message
   Screen B: Full 5-step project request:
             1 Project type · 2 Brief · 3 Capabilities · 4 Scope
             · 5 Review & Contact

   Rendered through a portal directly under <body>, independent of
   any page-level stacking context (PageTransition's animated
   wrapper, a transformed ancestor, etc.) — this is what guarantees
   it always paints above the fixed site header (z-index 1000)
   regardless of where in the tree it's mounted.
   ═══════════════════════════════════════════════════════════════ */

const MODAL_Z = 10000;

const EMPTY_FORM = {
  projectType: '', projectDescription: '', referenceUrl: '', tags: [],
  budgetRange: '', timeline: '', clientType: '',
  fullName: '', phoneNumber: '', email: '', companyName: '', companySize: '',
};

const DEFAULT_SETTINGS = {
  whatsappEnabled: true,
  formEnabled: true,
  whatsappNumber: '+201090385390',
  whatsappTitle: {}, whatsappDescription: {}, whatsappResponseTime: {},
  formTitle: {}, formDescription: {}, formResponseTime: {},
  buttonOrder: 'whatsapp-first',
  defaultOption: null,
};

// Draft persistence — a full project brief is real work; an accidental
// close/refresh must never destroy it. Cleared only on confirmed
// submission or the explicit "Start over" action.
const DRAFT_KEY = 'yansy_project_request_draft_v1';

const hasMeaningfulData = (f) => !!(
  f.projectType || f.projectDescription.trim() || f.referenceUrl.trim() ||
  f.tags.length || f.budgetRange || f.timeline || f.clientType
);

const beacon = (type, extra) => {
  api.post('/start-project/event', { type, ...extra }).catch(() => {});
};

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* ─── Small shared bits ───────────────────────────────────────── */
const FieldError = ({ msg }) =>
  msg ? (
    <p className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'rgb(var(--danger))' }}>
      <AlertCircle style={{ width: 13, height: 13, flexShrink: 0 }} />
      {msg}
    </p>
  ) : null;

const T = {
  bg: 'rgb(var(--bg-elevated))', surface: 'rgb(var(--bg-secondary))', subtle: 'rgb(var(--bg-surface))',
  border: 'rgb(var(--border))', borderStrong: 'rgb(var(--border-strong))',
  text: 'rgb(var(--text-primary))', textSecondary: 'rgb(var(--text-secondary))', textTertiary: 'rgb(var(--text-tertiary))',
  accent: 'rgb(var(--accent))', accentLight: 'rgb(var(--accent-light))', accentMuted: 'rgb(var(--accent-muted))', accentHover: 'rgb(var(--accent-hover))',
  whatsapp: '#25D366', whatsappLight: '#ECFDF5', whatsappMuted: '#D1FAE5',
  danger: 'rgb(var(--danger))', dangerLight: 'rgb(var(--danger-light))',
};

const STEP_COUNT = 5;

/* ═══════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════ */
const ProjectRequestForm = ({ isOpen, onClose }) => {
  const { t }          = useTranslation();
  const { dir, isRTL, language, toggleLanguage } = useLanguage();
  const { user, isAuthenticated } = useSelector(s => s.auth);

  const TOTAL = STEP_COUNT;

  const prefillFromAccount = useCallback((base = EMPTY_FORM) => (
    isAuthenticated && user
      ? { ...base, fullName: user.fullName || '', email: user.email || '', phoneNumber: user.phoneNumber || '', companyName: user.companyName || '', clientType: base.clientType || (user.companyName ? 'company' : '') }
      : base
  ), [isAuthenticated, user]);

  /* ── Settings (admin-configurable) ──────────────────────────── */
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  /* ── Flow state ──────────────────────────────────────────────── */
  const [view, setView] = useState('decision'); // 'decision' | 'whatsapp' | 'form'

  /* ── Full form state ─────────────────────────────────────────── */
  const [step,        setStep]        = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [errors,      setErrors]      = useState({});
  const [charCount,   setCharCount]   = useState(0);
  const [phoneAttempts, setPhoneAttempts] = useState(0);
  const [phoneBypass,   setPhoneBypass]   = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [canScrollMore, setCanScrollMore] = useState(false);

  /* ── WhatsApp quick-brief state ─────────────────────────────── */
  const [waForm, setWaForm]     = useState({ name: '', projectType: '', budgetRange: '', timeline: '' });
  const [waErrors, setWaErrors] = useState({});
  const [waRedirecting, setWaRedirecting] = useState(false);

  const backdropRef  = useRef(null);
  const modalRef      = useRef(null);
  const contentRef      = useRef(null);
  const scrollRef         = useRef(null);
  const firedDecisionView     = useRef(false);
  const triggerElRef           = useRef(null);
  const draftCheckedRef        = useRef(false);

  const STEP_NAMES = [
    t('projectForm.steps.names.projectType'),
    t('projectForm.steps.names.brief'),
    t('projectForm.steps.names.capabilities'),
    t('projectForm.steps.names.scope'),
    t('projectForm.steps.names.review'),
  ];

  /* ── Localized override helper ──────────────────────────────── */
  const loc = (overrideObj, fallback) => {
    const val = overrideObj?.[language];
    return val && val.trim() ? val : fallback;
  };

  /* ── Restore a saved draft once, on first mount — doesn't force the
       modal open, just makes sure that whenever it IS opened next, it
       resumes exactly where the customer left off instead of the
       decision screen. ─────────────────────────────────────────── */
  useEffect(() => {
    if (draftCheckedRef.current) return;
    draftCheckedRef.current = true;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft?.form || !hasMeaningfulData(draft.form)) return;
      setForm(prefillFromAccount({ ...EMPTY_FORM, ...draft.form }));
      const savedStep = Math.min(Math.max(draft.step || 1, 1), TOTAL);
      setStep(savedStep);
      setMaxStepReached(savedStep);
      setView('form');
      setDraftRestored(true);
    } catch { /* corrupt/unavailable storage — just start fresh */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Persist the in-progress draft as it changes ──────────────── */
  useEffect(() => {
    if (view !== 'form' || submitted) return;
    try {
      if (!hasMeaningfulData(form)) { sessionStorage.removeItem(DRAFT_KEY); return; }
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step, ts: Date.now() }));
    } catch { /* storage unavailable — draft resume just won't work, non-fatal */ }
  }, [form, step, view, submitted]);

  const clearDraft = () => { try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* non-fatal */ } };

  const startOver = () => {
    clearDraft();
    setForm(prefillFromAccount());
    setStep(1); setMaxStepReached(1); setDraftRestored(false); setErrors({});
  };

  const doAnimateClose = useCallback((after) => {
    const isMobile = window.matchMedia('(max-width: 639px)').matches;
    gsap.to(modalRef.current, isMobile
      ? { y: '100%', opacity: 0.6, duration: 0.24, ease: 'power2.in' }
      : { opacity: 0, scale: 0.97, y: 12, duration: 0.2, ease: 'power2.in' }
    ).then(after);
  }, []);

  /* ── Actually close — leaves the in-progress draft alone unless the
       request was just submitted, in which case everything resets for
       a clean next visit. ────────────────────────────────────────── */
  const performClose = useCallback(() => {
    if (loading) return;
    doAnimateClose(() => {
      setShowCloseConfirm(false);
      if (submitted) {
        setView('decision'); setStep(1); setMaxStepReached(1); setSubmitted(false); setErrors({});
        setForm(prefillFromAccount());
        setDraftRestored(false);
        clearDraft();
      }
      setPhoneAttempts(0); setPhoneBypass(false);
      setWaForm({ name: '', projectType: '', budgetRange: '', timeline: '' });
      setWaErrors({}); setWaRedirecting(false);
      firedDecisionView.current = false;
      onClose();
      triggerElRef.current?.focus?.();
    });
  }, [loading, onClose, submitted, prefillFromAccount, doAnimateClose]);

  /* ── Requested close — pauses for a lightweight confirmation only
       when there's real unsaved-feeling progress worth flagging.
       (It's not actually at risk — the draft effect above already
       saved it — this is about the customer *knowing* that.) ─────── */
  const requestClose = useCallback(() => {
    if (loading) return;
    if (view === 'form' && !submitted && hasMeaningfulData(form)) {
      setShowCloseConfirm(true);
      return;
    }
    performClose();
  }, [loading, view, submitted, form, performClose]);

  /* ── Remember the trigger element so focus can return to it ──── */
  useEffect(() => {
    if (isOpen) triggerElRef.current = document.activeElement;
  }, [isOpen]);

  /* ── Authenticated customers: prefill known account data on open so
       name/email/phone/company are never asked for twice. Guests are
       untouched — form stays blank until they type. A restored draft's
       own values always win over the account default. ─────────────── */
  useEffect(() => {
    if (!isOpen || !isAuthenticated || !user) return;
    setForm(p => ({
      ...p,
      fullName:    p.fullName    || user.fullName    || '',
      email:       p.email       || user.email       || '',
      phoneNumber: p.phoneNumber || user.phoneNumber || '',
      companyName: p.companyName || user.companyName || '',
      clientType:  p.clientType  || (user.companyName ? 'company' : ''),
    }));
  }, [isOpen, isAuthenticated, user]);

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

  /* ── Escape closes (or dismisses the close-confirm first) ─────── */
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e) => {
      if (e.key !== 'Escape' || loading) return;
      if (showCloseConfirm) { setShowCloseConfirm(false); return; }
      requestClose();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [isOpen, loading, showCloseConfirm, requestClose]);

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
    if (!isOpen || !settingsLoaded || view !== 'decision') return;
    if (!settings.whatsappEnabled && settings.formEnabled) {
      setView('form');
    } else if (settings.whatsappEnabled && !settings.formEnabled) {
      setView('whatsapp');
      beacon('whatsapp_click');
    }
  }, [isOpen, settingsLoaded, settings.whatsappEnabled, settings.formEnabled, view]);

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

  /* ── View / step change: animate in, reset scroll to the top, and
       focus the step's first focusable control — WITHOUT letting that
       focus() call itself scroll anything (preventScroll), so the step
       heading never ends up hidden behind the fixed header. ───────── */
  useEffect(() => {
    if (!isOpen || showCloseConfirm) return;
    if (contentRef.current) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, x: isRTL ? -14 : 14 },
        { opacity: 1, x: 0, duration: 0.28, ease: 'power2.out' }
      );
    }
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    const timer = setTimeout(() => {
      const target = contentRef.current?.querySelector(FOCUSABLE_SELECTOR);
      target?.focus({ preventScroll: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [step, view, isOpen, isRTL, showCloseConfirm]);

  /* ── The close-confirm panel replaces step content in place, so its own
       focus needs to be handled separately — land on the safe default
       ("keep editing") rather than the destructive close action. ────── */
  const keepEditingBtnRef = useRef(null);
  useEffect(() => {
    if (showCloseConfirm) keepEditingBtnRef.current?.focus();
  }, [showCloseConfirm]);

  /* ── Form-step analytics ────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen || view !== 'form') return;
    beacon('form_step', { step });
    trackFormStep(step, TOTAL);
  }, [isOpen, view, step]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Char counter ───────────────────────────────────────────── */
  useEffect(() => { setCharCount(form.projectDescription.length); }, [form.projectDescription]);

  /* ── Scroll-edge affordance — a bottom fade shows only while there's
       more content below the fold, so it never lies about being "done" ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || view !== 'form') { setCanScrollMore(false); return; }
    const update = () => setCanScrollMore(el.scrollHeight - el.scrollTop - el.clientHeight > 24);
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (contentRef.current) ro.observe(contentRef.current);
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, [view, step, showCloseConfirm]);

  /* ── Helpers ────────────────────────────────────────────────── */
  const set = useCallback((field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: undefined }));
    if (field === 'phoneNumber') setPhoneBypass(false);
  }, []);

  const toggleTag = useCallback((key) => {
    setForm(p => ({
      ...p,
      tags: p.tags.includes(key) ? p.tags.filter(k => k !== key) : [...p.tags, key],
    }));
  }, []);

  const clearTags = useCallback(() => setForm(p => ({ ...p, tags: [] })), []);

  /* ── Choice handlers ─────────────────────────────────────────── */
  const chooseWhatsApp = () => {
    trackStartProjectChoice('whatsapp');
    beacon('whatsapp_click');
    setView('whatsapp');
  };

  const chooseForm = () => {
    trackStartProjectChoice('form');
    beacon('form_open');
    setView('form');
  };

  const backToDecision = () => {
    setView('decision');
    setWaErrors({});
  };

  const openDirectWhatsApp = () => {
    trackWhatsAppClick('modal_skip_direct');
    beacon('whatsapp_direct_skip');
    const waNumber = (settings.whatsappNumber || '+201090385390').replace(/[^0-9]/g, '');
    const msg = isRTL
      ? 'مرحباً YANSY 👋 أرغب في الاستفسار عن مشروع جديد.'
      : "Hello YANSY 👋 I'd like to inquire about a new project.";
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    performClose();
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
    trackContact({ content_name: 'start-project-whatsapp' });
    setWaRedirecting(true);
    window.open(`https://wa.me/${digits}?text=${text}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => performClose(), 1200);
  };

  /* ── Full-form validation ───────────────────────────────────── */
  const validate = (s) => {
    const e = {};
    if (s === 1 && !form.projectType)
      e.projectType = t('projectForm.steps.projectType.error');
    if (s === 2 && (!form.projectDescription || form.projectDescription.trim().length < 10))
      e.projectDescription = t('projectForm.steps.projectDescription.error');
    // s === 3 (capabilities) is fully optional — nothing to validate.
    if (s === 4) {
      if (!form.budgetRange) e.budgetRange = t('projectForm.steps.budget.error');
      if (!form.timeline)    e.timeline    = t('projectForm.steps.timeline.error');
      if (!form.clientType)  e.clientType  = t('projectForm.steps.clientType.error');
    }
    if (s === 5) {
      // Authenticated customers: name/email come from the verified session
      // and aren't collected in this step at all, so nothing to validate.
      if (!isAuthenticated && (!form.fullName || form.fullName.trim().length < 2))
        e.fullName = t('projectForm.steps.contact.fullNameError');
      if (!phoneBypass) {
        const phoneCheck = validatePhone(form.phoneNumber);
        if (!phoneCheck.valid) {
          const reason = PHONE_REASON_KEYS[phoneCheck.reason] ? phoneCheck.reason : 'empty';
          e.phoneNumber = t(PHONE_REASON_KEYS[reason], PHONE_REASON_FALLBACK[reason]);
        }
      }
      if (!isAuthenticated && form.email && !/^\S+@\S+\.\S+$/.test(form.email))
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

  // Bumped every failed validation attempt so the focus/scroll effect below
  // re-runs even when the *same* field is still invalid (errors object would
  // otherwise be referentially/shallowly identical and the effect wouldn't fire).
  const [focusErrorTick, setFocusErrorTick] = useState(0);

  const goToStep = (n) => {
    if (n < 1 || n > maxStepReached) return;
    setStep(n);
  };

  const next = () => {
    const e = validate(step);
    if (!Object.keys(e).length) {
      const n = Math.min(step + 1, TOTAL);
      setStep(n);
      setMaxStepReached(m => Math.max(m, n));
    } else {
      if (e.phoneNumber) setPhoneAttempts(a => a + 1);
      setFocusErrorTick(t => t + 1);
    }
  };

  const back = () => {
    if (step === 1) { backToDecision(); return; }
    setStep(p => Math.max(p - 1, 1));
  };

  /* ── Focus/scroll the first invalid field — deferred to *after* React has
       committed the error state to the DOM (setErrors is async), otherwise
       `[data-error]` isn't there yet to find. Also applies aria-invalid /
       focuses the actual control, not just scrolls to its wrapper. Centering
       within the scroll container (not the viewport) automatically clears
       the fixed header/footer since neither is part of that container. ─── */
  useEffect(() => {
    if (!focusErrorTick) return;
    const raf = requestAnimationFrame(() => {
      const first = scrollRef.current?.querySelector('[data-error]');
      if (!first) return;
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const focusable = first.matches(FOCUSABLE_SELECTOR) ? first : first.querySelector(FOCUSABLE_SELECTOR);
      focusable?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [focusErrorTick]);

  const submit = async (ev) => {
    ev.preventDefault();
    if (loading) return; // belt-and-braces against double submission
    const e = validate(5);
    if (Object.keys(e).length) {
      if (e.phoneNumber) setPhoneAttempts(a => a + 1);
      setFocusErrorTick(t => t + 1);
      return;
    }
    setLoading(true);
    try {
      if (isAuthenticated && user) {
        // Authenticated customers hit the account-attached endpoint — name/
        // email come from the verified session, never re-sent from the form.
        const rest = { ...form };
        delete rest.fullName;
        delete rest.email;
        await api.post('/project-requests/create', rest);
      } else {
        await api.post('/project-requests/submit', form);
      }
      setSubmitted(true);
      clearDraft();
      beacon('form_complete');
      trackContactForm('project-request');
      trackLead({ content_name: 'start-project-form', content_category: form.projectType });
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || t('projectForm.errors.submitFailed') });
      setFocusErrorTick(t => t + 1);
    } finally {
      setLoading(false);
    }
  };

  const selectedProjectType = useMemo(() => PROJECT_TYPES.find(o => o.value === form.projectType), [form.projectType]);
  const selectedBudget      = useMemo(() => BUDGET_OPTIONS.find(o => o.value === form.budgetRange), [form.budgetRange]);
  const selectedTimeline    = useMemo(() => TIMELINE_OPTIONS.find(o => o.value === form.timeline), [form.timeline]);

  if (!isOpen) return null;

  /* ── Shared styles ──────────────────────────────────────────── */
  const inputCls = [
    'w-full px-4 py-3.5 bg-surface-white border transition-all outline-none text-base',
  ].join(' ');

  const charPct = Math.min((charCount / 300) * 100, 100);
  const charOk  = charCount >= 10;

  const bothEnabled = settings.whatsappEnabled && settings.formEnabled;
  const cardOrder = settings.buttonOrder === 'form-first' ? ['form', 'whatsapp'] : ['whatsapp', 'form'];

  const headerTitle =
    view === 'decision' ? t('projectForm.decision.title') :
    view === 'whatsapp' ? t('projectForm.whatsappBrief.title') :
    t('projectForm.projectRequest.title');

  const showFooter = settingsLoaded && !showCloseConfirm && (
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

        .sp-scroll::-webkit-scrollbar      { width: 8px; }
        .sp-scroll::-webkit-scrollbar-track{ background: transparent; }
        .sp-scroll::-webkit-scrollbar-thumb{ background: ${T.borderStrong}; border-radius: 99px; border: 2px solid transparent; background-clip: padding-box; }
        .sp-scroll::-webkit-scrollbar-thumb:hover { background: ${T.textTertiary}; background-clip: padding-box; }
        .sp-scroll { scrollbar-width: thin; scrollbar-color: ${T.borderStrong} transparent; }

        /* ── Modal shell — bottom sheet on mobile, centered card on desktop,
             a wider guided workspace (with sidebar) at lg+ for the form ── */
        .sp-modal {
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -8px 40px rgba(13,17,23,.14);
          max-height: min(94dvh, calc(var(--sp-vvh, 100dvh) - 8px));
        }
        @media (min-width: 640px) {
          .sp-modal {
            border-radius: 24px;
            box-shadow: 0 32px 64px -12px rgba(13,17,23,.22), 0 12px 24px -8px rgba(13,17,23,.10), 0 0 0 1px rgba(13,17,23,.04);
            max-height: min(90vh, calc(var(--sp-vvh, 100vh) - 40px));
          }
        }
        @media (min-width: 1024px) {
          .sp-modal { max-height: min(84vh, calc(var(--sp-vvh, 100vh) - 64px)); }
        }

        .sp-header-safe { padding-top: max(18px, env(safe-area-inset-top)); }
        .sp-footer-safe { padding-bottom: max(16px, env(safe-area-inset-bottom)); }

        /* Sidebar (lg+, form view only) */
        .sp-sidebar { background: ${T.subtle}; }
        .sp-side-step { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 10px; border-radius: 10px; font-family: inherit; text-align: start; transition: background .15s ease; }
        .sp-side-step[data-state="upcoming"] { opacity: .5; }
        .sp-side-step:not([data-state="upcoming"]) { cursor: pointer; }
        .sp-side-step:not([data-state="upcoming"]):hover { background: rgba(13,17,23,.04); }
        .sp-side-step[data-state="current"] { background: ${T.accentLight}; }
        .sp-side-dot { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10.5px; font-weight: 700; flex-shrink: 0; transition: background .2s ease, color .2s ease; }
        .sp-side-dot[data-state="done"]     { background: ${T.accent}; color: #fff; }
        .sp-side-dot[data-state="current"]  { background: ${T.accent}; color: #fff; }
        .sp-side-dot[data-state="upcoming"] { background: ${T.bg}; border: 1.5px solid ${T.border}; color: ${T.textTertiary}; }
        .sp-side-label { font-size: 12.5px; font-weight: 500; color: ${T.text}; }
        .sp-side-step[data-state="upcoming"] .sp-side-label { color: ${T.textSecondary}; }
        .sp-side-rail { position: absolute; inset-inline-start: 21px; top: 32px; bottom: 32px; width: 1.5px; background: ${T.border}; z-index: -1; }

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

        .sp-btn-primary { transition: background .18s ease, box-shadow .18s ease, transform .1s ease; background: ${T.accent}; }
        .sp-btn-primary:hover:not(:disabled)  { background: ${T.accentHover}; box-shadow: 0 4px 16px rgba(37,99,235,.28); }
        .sp-btn-primary:active:not(:disabled) { transform: scale(.97); }

        .sp-btn-wa { transition: background .18s ease, box-shadow .18s ease, transform .1s ease; background: ${T.whatsapp}; }
        .sp-btn-wa:hover:not(:disabled)  { background: #1FB958; box-shadow: 0 4px 16px rgba(37,211,102,.3); }
        .sp-btn-wa:active:not(:disabled) { transform: scale(.97); }

        .sp-btn-back { transition: background .16s ease, border-color .16s ease; }
        .sp-btn-back:hover:not(:disabled) { background: ${T.subtle}; border-color: ${T.borderStrong}; }
        .sp-btn-back:active:not(:disabled) { transform: scale(.97); }

        .sp-close-btn, .sp-lang-btn { transition: background .15s ease, color .15s ease; color: ${T.textTertiary}; }
        .sp-close-btn:hover, .sp-lang-btn:hover  { background: ${T.subtle}; color: ${T.text}; }
        .sp-close-btn:active, .sp-lang-btn:active { transform: scale(.92); }
        .sp-close-btn:focus-visible, .sp-lang-btn:focus-visible { outline: 2px solid ${T.accent}; outline-offset: 2px; }

        .sp-input { transition: border-color .16s ease, background .16s ease; }
        .sp-input:focus { border-color: ${T.accent} !important; background: #fff !important; }

        .sp-review-edit { transition: background .15s ease, color .15s ease; }
        .sp-review-edit:hover { background: ${T.accentLight}; color: ${T.accent}; }

        /* ── Fine-grained responsive fluidity, 320px → ultra-wide ── */
        .sp-type-grid  { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(6px, 2vw, 10px); }
        .sp-type-card  { padding: clamp(8px, 3vw, 14px); }
        @media (max-width: 359px) {
          .sp-client-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 480px) {
          .sp-type-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 1024px) {
          .sp-type-grid { grid-template-columns: repeat(5, 1fr); }
        }

        /* ── Nav footer — wraps gracefully instead of overflowing on very narrow viewports ── */
        .sp-footer-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .sp-footer-row > * { flex: 0 0 auto; }

        /* ── Bottom scroll-edge fade — a hint that content continues below,
             never a substitute for real scrolling (it's purely visual). ── */
        .sp-scroll-fade { position: absolute; inset-inline: 0; bottom: 0; height: 28px; pointer-events: none; background: linear-gradient(to bottom, transparent, ${T.bg}); opacity: 0; transition: opacity .2s ease; }
        .sp-scroll-fade.show { opacity: 1; }

        .sp-draft-banner { background: ${T.accentLight}; border: 1px solid ${T.accentMuted}; }

        /* ═══ CapabilityPicker ═══ */
        .cp-search { position: relative; display: flex; align-items: center; margin-bottom: 14px; }
        .cp-search-icon { position: absolute; inset-inline-start: 13px; color: ${T.textTertiary}; pointer-events: none; }
        .cp-search-input { width: 100%; padding: 10px 38px; border-radius: 10px; border: 1px solid ${T.border}; background: ${T.subtle}; font-size: 13px; color: ${T.text}; outline: none; transition: border-color .15s ease, background .15s ease; font-family: inherit; }
        .cp-search-input:focus { border-color: ${T.accent}; background: #fff; }
        .cp-search-clear { position: absolute; inset-inline-end: 10px; display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 6px; color: ${T.textTertiary}; cursor: pointer; }
        .cp-search-clear:hover { background: ${T.border}; color: ${T.text}; }

        .cp-tabs { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 4px; scrollbar-width: none; }
        .cp-tabs::-webkit-scrollbar { display: none; }
        .cp-tab { display: flex; align-items: center; gap: 6px; flex-shrink: 0; padding: 8px 13px; border-radius: 999px; border: 1px solid ${T.border}; background: ${T.bg}; color: ${T.textSecondary}; font-size: 12px; font-weight: 500; cursor: pointer; transition: border-color .15s ease, background .15s ease, color .15s ease; font-family: inherit; min-height: 38px; }
        .cp-tab:hover { border-color: ${T.borderStrong}; }
        .cp-tab.active { border-color: ${T.accent}; background: ${T.accentLight}; color: ${T.accent}; }
        .cp-tab:focus-visible { outline: 2px solid ${T.accent}; outline-offset: 2px; }
        .cp-tab-count { display: inline-flex; align-items: center; justify-content: center; min-width: 17px; height: 17px; padding: 0 5px; border-radius: 999px; background: ${T.accent}; color: #fff; font-size: 10px; font-weight: 700; }
        .cp-tab.active .cp-tab-count { background: ${T.accent}; }
        .cp-tab:not(.active) .cp-tab-count { background: ${T.textTertiary}; }

        .cp-panel { outline: none; }
        .cp-panel:focus-visible { outline: none; }
        .cp-option-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 8px; }

        .cp-option { position: relative; display: flex; align-items: center; gap: 10px; padding: 11px 13px; min-height: 46px; border-radius: 11px; border: 1.5px solid ${T.border}; background: ${T.bg}; cursor: pointer; transition: border-color .15s ease, background .15s ease; }
        .cp-option:hover { border-color: ${T.borderStrong}; background: ${T.subtle}; }
        .cp-option.sel { border-color: ${T.accent}; background: ${T.accentLight}; }
        .cp-option:focus-within { outline: 2px solid ${T.accent}; outline-offset: 2px; }
        .cp-native-checkbox { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
        .cp-checkmark { display: flex; align-items: center; justify-content: center; width: 19px; height: 19px; border-radius: 6px; border: 1.5px solid ${T.borderStrong}; background: #fff; flex-shrink: 0; transition: background .15s ease, border-color .15s ease; }
        .cp-option.sel .cp-checkmark { background: ${T.accent}; border-color: ${T.accent}; }
        .cp-option-label { font-size: 12.5px; font-weight: 500; color: ${T.text}; line-height: 1.35; }

        .cp-search-group { margin-bottom: 16px; }
        .cp-search-group-label { font-size: 10.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: ${T.textTertiary}; margin: 0 0 8px; }

        .cp-summary { margin-top: 16px; padding-top: 14px; border-top: 1px dashed ${T.border}; }
        .cp-summary-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .cp-summary-count { font-size: 12px; font-weight: 600; color: ${T.text}; }
        .cp-clear-btn { font-size: 11.5px; font-weight: 500; color: ${T.textSecondary}; cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: background .15s ease, color .15s ease; }
        .cp-clear-btn:hover { background: ${T.dangerLight}; color: ${T.danger}; }
        .cp-chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .cp-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 6px 6px 11px; border-radius: 999px; border: 1px solid ${T.accentMuted}; background: ${T.accentLight}; color: ${T.accentHover}; font-size: 11.5px; font-weight: 500; cursor: pointer; transition: background .15s ease; }
        [dir="rtl"] .cp-chip { padding: 6px 11px 6px 6px; }
        .cp-chip:hover { background: ${T.accentMuted}; }
        .cp-chip svg { padding: 2px; box-sizing: content-box; border-radius: 999px; }
        .cp-chip:hover svg { background: rgba(255,255,255,.5); }
        .cp-empty-hint { font-size: 12px; color: ${T.textTertiary}; line-height: 1.6; margin: 0; }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        ref={backdropRef}
        dir={dir}
        className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ zIndex: MODAL_Z, background: 'rgba(13,17,23,.55)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => { if (e.target === backdropRef.current) requestClose(); }}
      >
        {/* ══ Modal ═════════════════════════════════════════════════ */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label={headerTitle}
          onKeyDown={handleTrapTab}
          className={`sp-modal relative w-full flex flex-col overflow-hidden ${view === 'form' ? 'sm:max-w-2xl lg:max-w-[960px] lg:flex-row' : 'sm:max-w-2xl'}`}
          style={{ background: T.bg, border: `1px solid ${T.border}` }}
        >
          {/* ── Sidebar — lg+ only, form view only: full step map with
               jump-back navigation to any already-visited step ─────── */}
          {view === 'form' && (
            <nav className="sp-sidebar hidden lg:flex lg:flex-col lg:w-64 lg:flex-shrink-0 lg:border-e lg:p-5"
              style={{ borderColor: T.border }} aria-label={t('projectForm.projectRequest.title')}>
              <div className="flex items-center gap-2.5 mb-6">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: T.accent }}>
                  <Target style={{ width: 15, height: 15, color: '#fff' }} />
                </div>
                <p className="font-semibold" style={{ fontSize: 14, color: T.text }}>{t('projectForm.projectRequest.title')}</p>
              </div>
              <div className="relative flex flex-col gap-1">
                <div className="sp-side-rail" aria-hidden="true" />
                {STEP_NAMES.map((name, i) => {
                  const n = i + 1;
                  const state = n < step ? 'done' : n === step ? 'current' : n <= maxStepReached ? 'done' : 'upcoming';
                  return (
                    <button key={name} type="button"
                      onClick={() => goToStep(n)}
                      disabled={n > maxStepReached}
                      aria-current={n === step ? 'step' : undefined}
                      className="sp-side-step" data-state={state}>
                      <span className="sp-side-dot" data-state={state}>{state === 'done' ? <Check style={{ width: 12, height: 12 }} strokeWidth={3} /> : n}</span>
                      <span className="sp-side-label">{name}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          )}

          {/* ── Main column: header (fixed) · scroll body · footer (fixed) ── */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0">

          {/* ── Top bar (always visible, never scrolls) ────────── */}
          <div className="sp-header-safe relative flex-shrink-0 flex items-center justify-between px-5 sm:px-6 pb-4"
            style={{ borderBottom: `1px solid ${T.border}` }}>

            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center lg:hidden" style={{ background: T.accent }}>
                <Target style={{ width: 16, height: 16, color: '#fff' }} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate" style={{ fontSize: 'clamp(.9rem,3vw,1.05rem)', color: T.text, lineHeight: 1.25 }}>
                  {headerTitle}
                </p>
                {view === 'form' && (
                  <div className="flex items-center gap-1.5 mt-1 lg:hidden">
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                      {Array.from({ length: TOTAL }).map((_, i) => (
                        <div key={i} className="rounded-full transition-all duration-300"
                          style={{ width: i < step ? 16 : 6, height: 4, background: i < step ? T.accent : (i === step ? T.accentMuted : T.border) }} />
                      ))}
                    </div>
                    <span className="ms-1" style={{ fontSize: 10, color: T.textTertiary }} aria-hidden="true">{step}/{TOTAL} · {STEP_NAMES[step - 1]}</span>
                    <span className="sp-sr-only">{t('projectForm.steps.step', { step, total: TOTAL })}</span>
                  </div>
                )}
                {view === 'decision' && (
                  <p style={{ fontSize: 11.5, color: T.textSecondary }}>{t('projectForm.decision.subtitle')}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {/* The modal covers the site header (where the global language
                  switcher lives) — keep switching discoverable without
                  losing any progress: language is app-level state, form
                  state is untouched by toggling it. */}
              <button type="button" onClick={toggleLanguage}
                className="sp-lang-btn flex items-center gap-1 h-8 px-2.5 rounded-lg"
                aria-label={t('common.toggleLanguage')}>
                <Languages style={{ width: 14, height: 14 }} />
                <span style={{ fontSize: 11, fontWeight: 600 }}>
                  {isRTL ? t('projectForm.languageSwitch.toEnglish') : t('projectForm.languageSwitch.toArabic')}
                </span>
              </button>
              <button onClick={requestClose} disabled={loading}
                className="sp-close-btn flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg"
                aria-label={t('projectForm.projectRequest.close')}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>

          {/* ── Progress bar — form view only, hidden once the sidebar takes over ── */}
          {view === 'form' && (
            <div className="relative flex-shrink-0 h-[3px] lg:hidden" style={{ background: T.border }}>
              <div className="absolute inset-y-0 left-0"
                style={{ background: T.accent, width: `${(step / TOTAL) * 100}%`, transition: 'width .4s cubic-bezier(.4,0,.2,1)' }} />
            </div>
          )}

          {/* ── Scrollable body — the ONLY region that scrolls; header and
               footer stay pinned outside it (flex-shrink:0 siblings within
               this flex-column, min-h-0 here) so they're always visible and
               never overlap the content. ─────────────────────────────── */}
          {/* `flex flex-col` here (not just a plain block wrapper) so the
              scroll region below is sized via flex-grow/min-h-0 at *every*
              level of this chain instead of switching to a percentage
              height partway through. A `height:100%` (h-full) child of a
              flex-grown-but-not-explicitly-sized ancestor stopped tracking
              that ancestor the moment the modal actually hit its max-height
              cap (content grew enough to need it, e.g. after selecting
              capabilities) — the child silently fell back to sizing itself
              off its own content instead, killing the scroll constraint and
              letting the last row sit underneath the fixed footer. Flex-grow
              all the way down has no such percentage-resolution ambiguity. */}
          <div className="relative flex-1 min-h-0 flex flex-col">
            <div ref={scrollRef} className="sp-scroll flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 lg:px-8 pt-5 pb-5" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
              <div ref={contentRef}>

              {showCloseConfirm ? (
                /* ══════════════════════════════════════════════
                    Close confirmation — replaces the step content
                    in place (nothing hidden-but-tabbable behind it)
                ══════════════════════════════════════════════ */
                <div className="sp-fadein py-6 text-center max-w-sm mx-auto">
                  <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-5" style={{ background: T.accentLight }}>
                    <Pencil style={{ width: 24, height: 24, color: T.accent }} />
                  </div>
                  <h3 className="font-semibold mb-2.5" style={{ fontSize: 17, color: T.text }}>{t('projectForm.closeConfirm.title')}</h3>
                  <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>{t('projectForm.closeConfirm.body')}</p>
                </div>
              ) : !settingsLoaded ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 style={{ width: 26, height: 26, color: T.accent, animation: 'sp-spin .8s linear infinite' }} />
                </div>
              ) : view === 'decision' ? (
              /* ══════════════════════════════════════════════════
                  SCREEN 0 — Decision
              ══════════════════════════════════════════════════ */
              <div className="sp-fadein">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cardOrder.map((kind) => {
                    const isWa = kind === 'whatsapp';
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
                    <label htmlFor="sp-wa-name" className="flex items-center gap-2 mb-2 font-medium" style={{ fontSize: 13, color: T.text }}>
                      {t('projectForm.whatsappBrief.nameLabel')}
                      <span style={{ color: T.danger, fontSize: 12 }}>*</span>
                    </label>
                    <input id="sp-wa-name" type="text" autoComplete="name"
                      value={waForm.name} onChange={(e) => setWa('name', e.target.value)}
                      className={`${inputCls} sp-input rounded-lg`}
                      style={{ borderColor: waErrors.name ? T.danger : T.border, color: T.text }}
                      placeholder={t('projectForm.whatsappBrief.namePlaceholder')}
                      aria-invalid={!!waErrors.name} aria-describedby={waErrors.name ? 'sp-wa-name-err' : undefined} />
                    {waErrors.name && <div id="sp-wa-name-err" data-error><FieldError msg={waErrors.name} /></div>}
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
                      <Wallet style={{ width: 13, height: 13, color: T.accent }} />
                      {t('projectForm.whatsappBrief.budgetLabel')}
                      <span style={{ fontSize: 11, color: T.textTertiary, fontWeight: 400 }}>({t('projectForm.whatsappBrief.optional')})</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {BUDGET_OPTIONS.map((opt) => {
                        const sel = waForm.budgetRange === opt.value;
                        return (
                          <button key={opt.value} type="button"
                            onClick={() => setWa('budgetRange', sel ? '' : opt.value)}
                            className={`sp-opt-card px-3 py-1.5 border rounded-full font-medium ${sel ? 'sel' : ''}`}
                            style={{ fontSize: 11.5, borderColor: sel ? T.accent : T.border, color: sel ? T.accent : T.textSecondary }}
                            aria-pressed={sel}>
                            {/* <bdi> isolates the "$500 – $1,000"-style range from the
                                surrounding RTL paragraph direction — without it, Arabic's
                                bidi algorithm can reorder the two numbers relative to each
                                other (rendering as "1,000$ – 500$"), even though the string
                                itself is correct. */}
                            {opt.icon} <bdi>{t(`projectForm.budgetOptions.${opt.key}`)}</bdi>
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
                            className={`sp-opt-card px-3 py-1.5 border rounded-full font-medium ${sel ? 'sel' : ''}`}
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

                {draftRestored && step === 1 && (
                  <div className="sp-draft-banner sp-fadein flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 mb-5">
                    <span style={{ fontSize: 12, color: T.accentHover, fontWeight: 500 }}>{t('projectForm.draftResume.banner')}</span>
                    <button type="button" onClick={startOver} style={{ fontSize: 11.5, color: T.accent, textDecoration: 'underline', flexShrink: 0 }}>
                      {t('projectForm.draftResume.startOver')}
                    </button>
                  </div>
                )}

                {/* ══ STEP 1 — Project Type ═══════════════════════ */}
                {step === 1 && (
                  <div>
                    <p className="font-semibold mb-5" style={{ fontSize: 'clamp(1.05rem,3vw,1.3rem)', color: T.text, letterSpacing: '-0.01em' }}>
                      {t('projectForm.steps.projectType.title')}
                    </p>
                    <div className="sp-type-grid">
                      {PROJECT_TYPES.map((opt) => {
                        const sel = form.projectType === opt.value;
                        return (
                          <button key={opt.value} type="button"
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

                {/* ══ STEP 2 — Brief ═══════════════════════════════ */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="sp-project-description" className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-2 font-semibold" style={{ fontSize: 'clamp(1.05rem,3vw,1.3rem)', color: T.text, letterSpacing: '-0.01em' }}>
                          {t('projectForm.steps.projectDescription.title')}
                        </span>
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-colors"
                          style={{ fontSize: 10, color: charOk ? 'rgb(var(--success))' : T.textTertiary, background: charOk ? 'rgb(var(--success-light))' : 'transparent', border: `1px solid ${charOk ? 'rgb(var(--success) / 0.35)' : 'transparent'}` }}>
                          {charOk && <Check style={{ width: 9, height: 9 }} />}
                          {charCount}
                        </span>
                      </label>
                      <p className="mb-3" style={{ fontSize: 12.5, color: T.textSecondary, lineHeight: 1.6 }}>
                        {t('projectForm.steps.projectDescription.hint')}
                      </p>
                      <div className="h-[3px] mb-2.5 overflow-hidden rounded-full" style={{ background: T.border }}>
                        <div className="h-full transition-all duration-300 rounded-full"
                          style={{ width: `${charPct}%`, background: charOk ? 'rgb(var(--success))' : T.accentMuted }} />
                      </div>
                      <textarea
                        id="sp-project-description"
                        value={form.projectDescription}
                        onChange={(e) => set('projectDescription', e.target.value)}
                        rows={6}
                        className={`${inputCls} sp-input resize-none rounded-lg`}
                        style={{ borderColor: errors.projectDescription ? T.danger : T.border, color: T.text, lineHeight: 1.65 }}
                        placeholder={t('projectForm.steps.projectDescription.placeholder')}
                        aria-invalid={!!errors.projectDescription} aria-describedby={errors.projectDescription ? 'sp-desc-err' : undefined} />
                      {errors.projectDescription && <div id="sp-desc-err" data-error><FieldError msg={errors.projectDescription} /></div>}
                    </div>

                    <div>
                      <label htmlFor="sp-reference-url" className="flex items-center gap-2 mb-2 font-medium" style={{ fontSize: 13, color: T.textSecondary }}>
                        <LinkIcon style={{ width: 13, height: 13, color: T.accent, flexShrink: 0 }} />
                        {t('projectForm.steps.reference.title')}
                        <span style={{ color: T.textTertiary, fontSize: 11 }}>({t('projectForm.steps.reference.optional')})</span>
                      </label>
                      <div className="relative">
                        <input id="sp-reference-url" type="url" value={form.referenceUrl}
                          onChange={(e) => set('referenceUrl', e.target.value)}
                          className={`${inputCls} sp-input rounded-lg`}
                          style={{ borderColor: T.border, color: T.text, paddingInlineEnd: form.referenceUrl ? 40 : undefined }}
                          placeholder={t('projectForm.steps.reference.placeholder')} />
                        {form.referenceUrl && isValidReferenceUrl(form.referenceUrl) && (
                          <Check className="absolute top-1/2 -translate-y-1/2" style={{ width: 16, height: 16, color: 'rgb(var(--success))', [isRTL ? 'left' : 'right']: 14 }} />
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: T.textTertiary, margin: '6px 0 0' }}>{t('projectForm.steps.reference.hint')}</p>
                    </div>
                  </div>
                )}

                {/* ══ STEP 3 — Capabilities ════════════════════════ */}
                {step === 3 && (
                  <div>
                    <p className="font-semibold mb-1.5" style={{ fontSize: 'clamp(1.05rem,3vw,1.3rem)', color: T.text, letterSpacing: '-0.01em' }}>
                      {t('projectForm.steps.tags.title')}
                    </p>
                    <p className="mb-4" style={{ fontSize: 12.5, color: T.textSecondary, lineHeight: 1.6 }}>
                      {t('projectForm.steps.tags.hint')}
                    </p>
                    <CapabilityPicker selected={form.tags} onToggle={toggleTag} onClear={clearTags} />
                  </div>
                )}

                {/* ══ STEP 4 — Scope (Budget + Timeline + Client) ══ */}
                {step === 4 && (
                  <div className="space-y-7">
                    <div>
                      <p className="flex items-center gap-2 font-semibold mb-3" style={{ fontSize: 'clamp(1.05rem,3vw,1.3rem)', color: T.text, letterSpacing: '-0.01em' }}>
                        <Wallet style={{ width: 17, height: 17, color: T.accent, flexShrink: 0 }} />
                        {t('projectForm.steps.budget.title')}
                      </p>
                      <div className="space-y-2">
                        {BUDGET_OPTIONS.map((opt) => {
                          const sel = form.budgetRange === opt.value;
                          return (
                            <button key={opt.value} type="button"
                              onClick={() => set('budgetRange', opt.value)}
                              className={`sp-opt-row w-full flex items-center justify-between px-4 py-3.5 border text-start rounded-lg ${sel ? 'sel' : ''}`}
                              style={{ borderColor: sel ? T.accent : T.border }}
                              aria-pressed={sel}>
                              <div className="flex items-center gap-3">
                                <span style={{ fontSize: 20 }}>{opt.icon}</span>
                                <span className="font-medium" style={{ fontSize: 13, color: sel ? T.text : T.textSecondary }}>
                                  <bdi>{t(`projectForm.budgetOptions.${opt.key}`)}</bdi>
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
                      <p className="flex items-center gap-2 font-semibold mb-3" style={{ fontSize: 'clamp(1.05rem,3vw,1.3rem)', color: T.text, letterSpacing: '-0.01em' }}>
                        <Clock style={{ width: 17, height: 17, color: T.accent, flexShrink: 0 }} />
                        {t('projectForm.steps.timeline.title')}
                      </p>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
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
                      <p className="flex items-center gap-2 font-semibold mb-3" style={{ fontSize: 'clamp(1.05rem,3vw,1.3rem)', color: T.text, letterSpacing: '-0.01em' }}>
                        <Users style={{ width: 17, height: 17, color: T.accent, flexShrink: 0 }} />
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

                {/* ══ STEP 5 — Review & Contact ═════════════════════ */}
                {step === 5 && (
                  <div className="space-y-6">
                    <div>
                      <p className="font-semibold mb-1" style={{ fontSize: 'clamp(1.05rem,3vw,1.3rem)', color: T.text, letterSpacing: '-0.01em' }}>
                        {t('projectForm.steps.review.title')}
                      </p>
                      <p className="mb-4" style={{ fontSize: 12.5, color: T.textSecondary }}>{t('projectForm.steps.review.hint')}</p>

                      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                        {[
                          {
                            label: t('projectForm.steps.review.projectType'),
                            value: selectedProjectType ? `${selectedProjectType.icon} ${t(`projectForm.steps.projectType.options.${selectedProjectType.key}`)}` : '—',
                            jump: 1,
                          },
                          {
                            label: t('projectForm.steps.review.brief'),
                            value: form.projectDescription ? `${form.projectDescription.slice(0, 110)}${form.projectDescription.length > 110 ? '…' : ''}` : '—',
                            jump: 2,
                          },
                          {
                            label: t('projectForm.steps.review.capabilities'),
                            value: form.tags.length
                              ? form.tags.slice(0, 4).map(k => t(`projectForm.steps.tags.options.${k}`)).join(' · ') + (form.tags.length > 4 ? ` +${form.tags.length - 4}` : '')
                              : t('projectForm.steps.review.capabilitiesNone'),
                            jump: 3,
                          },
                          {
                            label: t('projectForm.steps.review.buildingFor'),
                            value: [
                              selectedBudget && t(`projectForm.budgetOptions.${selectedBudget.key}`),
                              selectedTimeline && t(`projectForm.steps.timeline.options.${selectedTimeline.key}`),
                              form.clientType && t(`projectForm.steps.clientType.${form.clientType}`),
                            ].filter(Boolean).join(' · ') || '—',
                            jump: 4,
                          },
                        ].map((row) => (
                          <div key={row.label} className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
                            <div className="min-w-0">
                              <p style={{ fontSize: 10.5, color: T.textTertiary, textTransform: 'uppercase', letterSpacing: '.04em', margin: '0 0 3px' }}>{row.label}</p>
                              <p className="truncate" style={{ fontSize: 12.5, color: T.text, fontWeight: 500 }}>{row.value}</p>
                            </div>
                            <button type="button" onClick={() => goToStep(row.jump)}
                              className="sp-review-edit flex items-center gap-1 flex-shrink-0 px-2.5 py-1.5 rounded-md"
                              style={{ fontSize: 11.5, color: T.textSecondary, fontWeight: 500 }}>
                              <Pencil style={{ width: 11, height: 11 }} />
                              {t('projectForm.steps.review.edit')}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4" style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
                      <p className="font-semibold" style={{ fontSize: 'clamp(1.05rem,3vw,1.3rem)', color: T.text, letterSpacing: '-0.01em' }}>
                        {t('projectForm.steps.contact.title')}
                      </p>

                      {isAuthenticated && user ? (
                        /* Verified account info — shown, never re-requested */
                        <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: T.subtle, border: `1px solid ${T.border}` }}>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.accentLight }}>
                            <BadgeCheck style={{ width: 18, height: 18, color: T.accent }} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate" style={{ fontSize: 13, color: T.text }}>{user.fullName}</p>
                            <p className="truncate" style={{ fontSize: 11.5, color: T.textSecondary }}>{user.email}</p>
                          </div>
                          <span className="ms-auto flex-shrink-0" style={{ fontSize: 10, color: T.textTertiary }}>
                            {t('projectForm.steps.contact.accountInfo')}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <label htmlFor="sp-full-name" className="flex items-center gap-2 mb-2 font-medium" style={{ fontSize: 13, color: T.text }}>
                            {t('projectForm.steps.contact.fullName')}
                            <span style={{ color: T.danger, fontSize: 12 }}>*</span>
                          </label>
                          <div className="relative">
                            <input id="sp-full-name" type="text" autoComplete="name"
                              value={form.fullName} onChange={(e) => set('fullName', e.target.value)}
                              className={`${inputCls} sp-input rounded-lg`}
                              style={{ borderColor: errors.fullName ? T.danger : T.border, color: T.text, paddingInlineEnd: form.fullName ? 40 : undefined }}
                              placeholder={t('projectForm.steps.contact.fullNamePlaceholder')}
                              aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? 'sp-full-name-err' : undefined} />
                            {form.fullName && form.fullName.trim().length >= 2 && (
                              <Check className="absolute top-1/2 -translate-y-1/2" style={{ width: 16, height: 16, color: 'rgb(var(--success))', [isRTL ? 'left' : 'right']: 14 }} />
                            )}
                          </div>
                          {errors.fullName && <div id="sp-full-name-err" data-error><FieldError msg={errors.fullName} /></div>}
                        </div>
                      )}

                      <div>
                        <label htmlFor="sp-phone-number" className="flex items-center gap-2 mb-2 font-medium" style={{ fontSize: 13, color: T.text }}>
                          <Phone style={{ width: 13, height: 13, color: T.accent, flexShrink: 0 }} />
                          {t('projectForm.steps.contact.phoneNumber')}
                          <span style={{ color: T.danger, fontSize: 12 }}>*</span>
                        </label>
                        <div className="relative">
                          <input id="sp-phone-number" type="tel" autoComplete="tel"
                            value={form.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)}
                            className={`${inputCls} sp-input rounded-lg`}
                            style={{ borderColor: errors.phoneNumber ? T.danger : T.border, color: T.text, paddingInlineEnd: form.phoneNumber ? 40 : undefined }}
                            placeholder={t('projectForm.steps.contact.phoneNumberPlaceholder')}
                            aria-invalid={!!errors.phoneNumber} aria-describedby={errors.phoneNumber ? 'sp-phone-number-err' : undefined} />
                          {form.phoneNumber && validatePhone(form.phoneNumber).valid && (
                            <Check className="absolute top-1/2 -translate-y-1/2" style={{ width: 16, height: 16, color: 'rgb(var(--success))', [isRTL ? 'left' : 'right']: 14 }} />
                          )}
                        </div>
                        {errors.phoneNumber && <div id="sp-phone-number-err" data-error><FieldError msg={errors.phoneNumber} /></div>}
                        {isAuthenticated && user?.phoneNumber && form.phoneNumber === user.phoneNumber && !errors.phoneNumber && (
                          <p style={{ fontSize: 11, color: T.textTertiary, margin: '6px 0 0' }}>
                            {t('projectForm.steps.contact.phoneNumberEditable')}
                          </p>
                        )}
                        {phoneAttempts >= 2 && !phoneBypass && (
                          <div className="mt-2.5 p-3 rounded-lg" style={{ background: T.subtle, border: `1px solid ${T.border}` }}>
                            <p className="mb-2 font-medium" style={{ fontSize: 12, color: T.textSecondary }}>
                              {t('projectForm.steps.contact.phoneTrouble', "Still having trouble? Here's another way forward:")}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button type="button"
                                onClick={() => { setPhoneBypass(true); setErrors(p => ({ ...p, phoneNumber: undefined })); }}
                                className="px-3 py-1.5 rounded-md font-medium"
                                style={{ border: `1px solid ${T.borderStrong}`, background: '#fff', color: T.text, fontSize: 12, cursor: 'pointer' }}>
                                {t('projectForm.steps.contact.phoneContinueAnyway', 'Continue with this number')}
                              </button>
                              <button type="button" onClick={chooseWhatsApp}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium"
                                style={{ border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.06)', color: 'rgb(var(--success))', fontSize: 12, cursor: 'pointer' }}>
                                <MessageCircle style={{ width: 13, height: 13 }} />
                                {t('projectForm.steps.contact.phoneUseWhatsapp', 'Switch to WhatsApp instead')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {!isAuthenticated && (
                        <div>
                          <label htmlFor="sp-email" className="flex items-center gap-2 mb-2 font-medium" style={{ fontSize: 13, color: T.text }}>
                            <Mail style={{ width: 13, height: 13, color: T.accent, flexShrink: 0 }} />
                            {t('projectForm.steps.contact.email')}
                            <span style={{ fontSize: 11, color: T.textTertiary }}>({t('projectForm.steps.contact.emailOptional')})</span>
                          </label>
                          <div className="relative">
                            <input id="sp-email" type="email" autoComplete="email"
                              value={form.email} onChange={(e) => set('email', e.target.value)}
                              className={`${inputCls} sp-input rounded-lg`}
                              style={{ borderColor: errors.email ? T.danger : T.border, color: T.text }}
                              placeholder={t('projectForm.steps.contact.emailPlaceholder')}
                              aria-invalid={!!errors.email} aria-describedby={errors.email ? 'sp-email-err' : undefined} />
                            {form.email && /^\S+@\S+\.\S+$/.test(form.email) && (
                              <Check className="absolute top-1/2 -translate-y-1/2" style={{ width: 16, height: 16, color: 'rgb(var(--success))', [isRTL ? 'left' : 'right']: 14 }} />
                            )}
                          </div>
                          {errors.email && <div id="sp-email-err" data-error><FieldError msg={errors.email} /></div>}
                        </div>
                      )}

                      {form.clientType === 'company' && (
                        <>
                          <div>
                            <label htmlFor="sp-company-name" className="flex items-center gap-2 mb-2 font-medium" style={{ fontSize: 13, color: T.text }}>
                              <Building2 style={{ width: 13, height: 13, color: T.accent, flexShrink: 0 }} />
                              {t('projectForm.steps.contact.companyName')}
                              <span style={{ color: T.danger, fontSize: 12 }}>*</span>
                            </label>
                            <div className="relative">
                              <input id="sp-company-name" type="text" autoComplete="organization"
                                value={form.companyName} onChange={(e) => set('companyName', e.target.value)}
                                className={`${inputCls} sp-input rounded-lg`}
                                style={{ borderColor: errors.companyName ? T.danger : T.border, color: T.text }}
                                placeholder={t('projectForm.steps.contact.companyNamePlaceholder')}
                                aria-invalid={!!errors.companyName} aria-describedby={errors.companyName ? 'sp-company-name-err' : undefined} />
                              {form.companyName && form.companyName.length >= 2 && (
                                <Check className="absolute top-1/2 -translate-y-1/2" style={{ width: 16, height: 16, color: 'rgb(var(--success))', [isRTL ? 'left' : 'right']: 14 }} />
                              )}
                            </div>
                            {errors.companyName && <div id="sp-company-name-err" data-error><FieldError msg={errors.companyName} /></div>}
                          </div>

                          <div>
                            <label className="flex items-center gap-2 mb-2 font-medium" style={{ fontSize: 13, color: T.text }}>
                              <Users style={{ width: 13, height: 13, color: T.accent, flexShrink: 0 }} />
                              {t('projectForm.steps.contact.companySize')}
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
                        <div data-error className="flex items-center gap-3 px-4 py-3.5 rounded-lg" style={{ background: 'rgb(var(--danger-light))', border: '1px solid rgb(var(--danger) / 0.35)' }}>
                          <AlertCircle style={{ width: 16, height: 16, color: T.danger, flexShrink: 0 }} />
                          <p style={{ fontSize: 13, color: T.danger }}>{errors.submit}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
            )}
              </div>
            </div>
            <div className={`sp-scroll-fade ${canScrollMore ? 'show' : ''}`} aria-hidden="true" />
          </div>

          {/* ── Footer — pinned outside the scroll area, always visible
               above the mobile keyboard and above the safe-area home
               indicator. Submit buttons target their <form> by id since
               the form fields live inside the scrollable region. ─────── */}
          {showCloseConfirm ? (
            <div className="sp-footer-safe flex-shrink-0 px-5 sm:px-6 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
              <div className="sp-footer-row">
                <button type="button" ref={keepEditingBtnRef} onClick={() => setShowCloseConfirm(false)}
                  className="sp-btn-back px-5 py-3 border font-medium rounded-lg" style={{ fontSize: 12.5, color: T.textSecondary, borderColor: T.border, background: T.bg }}>
                  {t('projectForm.closeConfirm.keepEditing')}
                </button>
                <button type="button" onClick={performClose}
                  className="sp-btn-primary px-5 py-3 text-white font-semibold rounded-lg" style={{ fontSize: 12.5 }}>
                  {t('projectForm.closeConfirm.closeAndSave')}
                </button>
              </div>
            </div>
          ) : showFooter && (
            <div className="sp-footer-safe flex-shrink-0 px-5 sm:px-6 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
              {view === 'whatsapp' ? (
                <div className="sp-footer-row">
                  <button type="button" onClick={backToDecision} disabled={!bothEnabled}
                    className="sp-btn-back flex items-center gap-2 px-5 py-3 border font-medium rounded-lg disabled:opacity-0 disabled:pointer-events-none"
                    style={{ fontSize: 12, color: T.textSecondary, borderColor: T.border, background: T.bg }}>
                    <ChevronLeft style={{ width: 14, height: 14, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                    {t('projectForm.navigation.backToOptions')}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" onClick={openDirectWhatsApp}
                      className="sp-btn-back px-3.5 py-2.5 rounded-lg border font-medium"
                      style={{ fontSize: 11.5, color: T.textSecondary, borderColor: T.border, background: T.bg, cursor: 'pointer' }}>
                      {isRTL ? 'تخطي للواتساب مباشرة' : 'Direct WhatsApp (Skip)'}
                    </button>
                    <button type="submit" form="sp-form-whatsapp"
                      className="sp-btn-wa flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg"
                      style={{ fontSize: 12.5 }}>
                      <MessageCircle style={{ width: 15, height: 15 }} />
                      {t('projectForm.whatsappBrief.continueButton')}
                    </button>
                  </div>
                </div>
              ) : submitted ? (
                <div className="flex justify-center">
                  <button onClick={performClose} className="sp-btn-primary px-10 py-3.5 text-white font-semibold rounded-lg" style={{ fontSize: 12.5 }}>
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
                    // key differentiates this from the type="submit" button below — without
                    // it, React reconciles both branches as "the same <button>" at this tree
                    // position and patches its attributes in place. Since this handler's own
                    // setStep() re-render happens synchronously within the same click, the
                    // DOM node could flip from type="button" to type="submit" *before* the
                    // browser finishes processing that click's default action — causing the
                    // very same click that advances step 4→5 to also submit the form. A
                    // distinct key forces a real unmount/remount instead of an in-place patch.
                    <button key="next-btn" type="button" onClick={next}
                      className="sp-btn-primary flex items-center gap-2 px-7 py-3 text-white font-semibold rounded-lg" style={{ fontSize: 13 }}>
                      {t('projectForm.navigation.next')}
                      <ChevronRight style={{ width: 14, height: 14, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                    </button>
                  ) : (
                    <button key="submit-btn" type="submit" form="sp-form-main" disabled={loading}
                      className="sp-btn-primary flex items-center gap-2 px-7 py-3 text-white font-semibold rounded-lg disabled:opacity-60 disabled:cursor-not-allowed" style={{ fontSize: 13 }}>
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
      </div>
    </>,
    document.body
  );
};

export default ProjectRequestForm;
