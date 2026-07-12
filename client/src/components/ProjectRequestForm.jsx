import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, ChevronLeft, ChevronRight, Check, Sparkles, Zap, Target,
  Mail, Phone, Building2, Tag, Link as LinkIcon, Clock, AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../utils/api';
import { gsap } from 'gsap';

/* ═══════════════════════════════════════════════════════════════
   YANSY — ProjectRequestForm v2 (Production UX/UI)
   
   التحسينات:
   ① Step indicator يوضح الخطوات القادمة بأسماء
   ② Step 2 مقسّم: Description أولاً، Tags اختيارية قابلة للطي
   ③ Validation errors واضحة بلون أحمر مع icon
   ④ Modal height محسوب صح على الموبايل (dvh)
   ⑤ Back button يبقى visible وقوي
   ⑥ Feature tags collapsible — مش wall of text
   ⑦ Character count progress bar بدل نص بس
   ⑧ Mobile: input font-size 16px (يمنع iOS zoom)
   ⑨ Success screen أنيق ومنظم
   ⑩ Keyboard navigation كامل (Enter يكمل)
   ═══════════════════════════════════════════════════════════════ */

/* ─── Constants ──────────────────────────────────────────────── */
const PROJECT_TYPES = [
  { value: 'restaurant', icon: '🍽️', key: 'restaurant' },
  { value: 'clinic',     icon: '🏥', key: 'clinic'     },
  { value: 'pharmacy',   icon: '💊', key: 'pharmacy'   },
  { value: 'ecommerce',  icon: '🛒', key: 'ecommerce'  },
  { value: 'saas',       icon: '⚡', key: 'saas'       },
  { value: 'realestate', icon: '🏢', key: 'realestate' },
  { value: 'education',  icon: '🎓', key: 'education'  },
  { value: 'delivery',   icon: '🚀', key: 'delivery'   },
  { value: 'other',      icon: '💡', key: 'other'      },
];

const FEATURE_TAGS = [
  { categoryKey: 'auth',         icon: '🔐', tags: ['authBasic','authGoogle','authSocial','authOTP','authRoles','authTwoFactor'] },
  { categoryKey: 'dashboard',    icon: '📊', tags: ['adminPanel','analytics','charts','reports','multiTenant','notifications'] },
  { categoryKey: 'ecommerce',    icon: '🛒', tags: ['productCatalog','cart','payments','invoices','inventory','discounts'] },
  { categoryKey: 'content',      icon: '📝', tags: ['blog','cms','seo','multiLang','fileUpload','mediaGallery'] },
  { categoryKey: 'communication',icon: '💬', tags: ['liveChat','emailNotif','smsNotif','pushNotif','whatsappInteg','videoCall'] },
  { categoryKey: 'advanced',     icon: '⚙️', tags: ['api','mobileApp','aiFeatures','maps','booking','subscription'] },
];

const BUDGET_OPTIONS = [
  { value: 'less-than-500', icon: '💡', key: 'lessThan500', color: '#3b82f6' },
  { value: '500-1000',      icon: '🚀', key: '500to1000',   color: '#8b5cf6' },
  { value: '1000-3000',     icon: '⭐', key: '1000to3000',  color: '#eab308' },
  { value: '3000-10000',    icon: '💎', key: '3000to10000', color: '#06b6d4' },
  { value: '10000-plus',    icon: '👑', key: '10000plus',   color: '#2563EB' },
];

const TIMELINE_OPTIONS = [
  { value: 'asap',      icon: '⚡', key: 'asap'        },
  { value: '1month',    icon: '📅', key: '1month'      },
  { value: '2-3months', icon: '🗓️', key: '2to3months'  },
  { value: 'flexible',  icon: '🌊', key: 'flexible'    },
];

const COMPANY_SIZE_OPTIONS = [
  { value: 'less-than-10', icon: '👥', key: 'lessThan10' },
  { value: '10-50',        icon: '🏬', key: '10to50'     },
  { value: '50-plus',      icon: '🏢', key: '50plus'     },
];

/* ─── Error message component ────────────────────────────────── */
const FieldError = ({ msg }) =>
  msg ? (
    <p className="flex items-center gap-2 mt-2 text-xs" style={{ color: '#f87171' }}>
      <AlertCircle style={{ width: 13, height: 13, flexShrink: 0 }} />
      {msg}
    </p>
  ) : null;

/* ─── Step names ─────────────────────────────────────────────── */
const STEP_NAMES = {
  en: ['Project Type', 'Your Idea',    'Details',  'Contact'],
  ar: ['نوع المشروع', 'فكرتك',         'التفاصيل', 'تواصل معنا'],
};

/* ═══════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════ */
const ProjectRequestForm = ({ isOpen, onClose }) => {
  const { t }         = useTranslation();
  const { dir, isRTL } = useLanguage();

  const TOTAL = 4;

  const [step,        setStep]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [errors,      setErrors]      = useState({});
  const [tagsOpen,    setTagsOpen]    = useState(false);   // feature tags collapsed by default
  const [charCount,   setCharCount]   = useState(0);

  const [form, setForm] = useState({
    projectType: '', projectDescription: '', referenceUrl: '', tags: [],
    budgetRange: '', timeline: '', clientType: '',
    fullName: '', phoneNumber: '', email: '', companyName: '', companySize: '',
  });

  const backdropRef  = useRef(null);
  const modalRef     = useRef(null);
  const formRef      = useRef(null);
  const progressRef  = useRef(null);
  const scrollRef    = useRef(null);
  const firstInputRef = useRef(null);

  const stepNames = isRTL ? STEP_NAMES.ar : STEP_NAMES.en;

  /* ── Body lock ──────────────────────────────────────────────── */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* ── Escape close ───────────────────────────────────────────── */
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape' && !loading) doClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [loading]);

  /* ── Modal open animation ───────────────────────────────────── */
  useEffect(() => {
    if (isOpen && modalRef.current) {
      gsap.fromTo(modalRef.current,
        { opacity: 0, scale: 0.94, y: 28 },
        { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: 'back.out(1.5)' }
      );
    }
  }, [isOpen]);

  /* ── Step change animation + progress ──────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    if (formRef.current) {
      gsap.fromTo(formRef.current,
        { opacity: 0, x: isRTL ? -16 : 16 },
        { opacity: 1, x: 0, duration: 0.32, ease: 'power2.out' }
      );
    }
    if (progressRef.current) {
      gsap.to(progressRef.current, {
        width: `${(step / TOTAL) * 100}%`,
        duration: 0.5, ease: 'power2.inOut',
      });
    }
    // Reset scroll + focus first input
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => firstInputRef.current?.focus(), 80);
  }, [step, isOpen, isRTL]);

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

  /* ── Validation ─────────────────────────────────────────────── */
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
      // shake the first error
      const first = scrollRef.current?.querySelector('[data-error]');
      if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }
  };

  const back = () => setStep(p => Math.max(p - 1, 1));

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate(4);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await api.post('/project-requests/submit', form);
      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || t('projectForm.errors.submitFailed') });
    } finally {
      setLoading(false);
    }
  };

  const doClose = useCallback(() => {
    if (loading) return;
    gsap.to(modalRef.current, {
      opacity: 0, scale: 0.95, y: 20, duration: 0.25, ease: 'power2.in',
      onComplete: () => {
        setStep(1); setSubmitted(false); setErrors({}); setTagsOpen(false);
        setForm({ projectType:'',projectDescription:'',referenceUrl:'',tags:[],
          budgetRange:'',timeline:'',clientType:'',fullName:'',phoneNumber:'',
          email:'',companyName:'',companySize:'', });
        onClose();
      },
    });
  }, [loading, onClose]);

  if (!isOpen) return null;

  /* ── Shared styles ──────────────────────────────────────────── */
  const inputCls = [
    'w-full px-4 py-3.5 bg-white/5 border border-white/12',
    'text-white placeholder-white/30 transition-all outline-none',
    'focus:border-[#2563EB] focus:bg-white/8',
    /* iOS zoom prevention: font-size must be ≥16px */
    'text-base',
  ].join(' ');

  const charPct = Math.min((charCount / 300) * 100, 100);
  const charOk  = charCount >= 10;

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        /* ── Keyframes ── */
        @keyframes prf-float { 0%,100%{transform:translateY(0) translateX(0);opacity:.35}
          50%{transform:translateY(-22px) translateX(8px);opacity:.7} }
        @keyframes prf-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes prf-bounce  { 0%{transform:scale(0)} 55%{transform:scale(1.18)} 100%{transform:scale(1)} }
        @keyframes prf-spin-in { 0%{transform:scale(0) rotate(-160deg)} 100%{transform:scale(1) rotate(0deg)} }
        @keyframes prf-fadein  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes prf-shake   { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        @keyframes prf-ping    { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2);opacity:0} }

        .prf-float    { animation: prf-float  5s ease-in-out infinite; }
        .prf-shimmer  { animation: prf-shimmer 2s ease-in-out infinite; }
        .prf-bounce   { animation: prf-bounce  .55s ease-out; }
        .prf-spin-in  { animation: prf-spin-in .38s ease-out; }
        .prf-fadein   { animation: prf-fadein  .4s ease-out both; }
        .prf-fadein-d { animation: prf-fadein  .5s ease-out .2s both; }
        .prf-fadein-d2{ animation: prf-fadein  .6s ease-out .4s both; }
        .prf-shake    { animation: prf-shake   .3s ease-in-out; }
        .prf-ping     { animation: prf-ping    1.4s ease-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .prf-float,.prf-shimmer,.prf-bounce,.prf-spin-in,
          .prf-fadein,.prf-fadein-d,.prf-fadein-d2,.prf-shake,.prf-ping
            { animation: none !important; transition: none !important; }
        }

        /* ── Custom scrollbar ── */
        .prf-scroll::-webkit-scrollbar      { width: 5px; }
        .prf-scroll::-webkit-scrollbar-track{ background: rgba(255,255,255,.04); }
        .prf-scroll::-webkit-scrollbar-thumb{ background: rgba(37,99,235,.3); border-radius: 99px; }
        .prf-scroll::-webkit-scrollbar-thumb:hover { background: rgba(37,99,235,.55); }

        /* ── Type card ── */
        .prf-type-card { transition: border-color .2s, background .2s, transform .15s, box-shadow .2s; }
        .prf-type-card:hover { border-color: rgba(255,255,255,.28); background: rgba(255,255,255,.05); }
        .prf-type-card.sel  {
          border-color: #2563EB;
          background: linear-gradient(135deg,rgba(37,99,235,.18),rgba(37,99,235,.04));
          transform: scale(1.04);
          box-shadow: 0 4px 24px rgba(37,99,235,.18);
        }

        /* ── Option row (budget/timeline/size) ── */
        .prf-opt-row { transition: border-color .2s, background .2s, transform .15s, box-shadow .2s; }
        .prf-opt-row:hover  { border-color: rgba(255,255,255,.25); background: rgba(255,255,255,.05); }
        .prf-opt-row.sel    {
          border-color: #2563EB;
          background: linear-gradient(90deg,rgba(37,99,235,.14),rgba(37,99,235,.03));
          transform: scale(1.015);
          box-shadow: 0 2px 16px rgba(37,99,235,.14);
        }

        /* ── Client card ── */
        .prf-client-card { transition: border-color .2s, background .2s, transform .15s; }
        .prf-client-card:hover { border-color: rgba(255,255,255,.28); background: rgba(255,255,255,.05); }
        .prf-client-card.sel {
          border-color: #2563EB;
          background: linear-gradient(135deg,rgba(37,99,235,.16),rgba(37,99,235,.04));
          transform: scale(1.03);
        }

        /* ── Tag pill ── */
        .prf-tag { transition: border-color .18s, background .18s, color .18s, transform .12s; }
        .prf-tag:hover  { border-color: rgba(255,255,255,.3); background: rgba(255,255,255,.08); color: rgba(255,255,255,.9); }
        .prf-tag.sel    {
          border-color: #2563EB; background: rgba(37,99,235,.18);
          color: #2563EB; transform: scale(1.04);
        }

        /* ── Nav buttons ── */
        .prf-btn-next {
          transition: background .25s, box-shadow .25s, transform .12s;
          background: linear-gradient(135deg, #2563EB, #f4d03f);
        }
        .prf-btn-next:hover  { box-shadow: 0 4px 28px rgba(37,99,235,.45); transform: translateY(-1px); }
        .prf-btn-next:active { transform: scale(.97); }
        .prf-btn-back {
          transition: background .2s, border-color .2s;
        }
        .prf-btn-back:hover  { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.35); }
        .prf-btn-back:active { transform: scale(.97); }

        /* ── Input ── */
        .prf-input { transition: border-color .2s, background .2s; }

        /* ── Tags toggle ── */
        .prf-tags-body {
          overflow: hidden;
          transition: max-height .4s cubic-bezier(.4,0,.2,1), opacity .35s ease;
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        ref={backdropRef}
        dir={dir}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: 'rgba(0,0,0,.88)', backdropFilter: 'blur(12px)' }}
        onClick={(e) => { if (e.target === backdropRef.current) doClose(); }}
      >
        {/* ── Floating particles ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="absolute w-1 h-1 rounded-full prf-float"
              style={{
                background: 'rgba(37,99,235,.35)',
                left: `${12 + i * 15}%`,
                top : `${18 + (i % 3) * 26}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${4.5 + (i % 3)}s`,
              }}
            />
          ))}
        </div>

        {/* ══ Modal ═════════════════════════════════════════════════ */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('projectForm.projectRequest.title')}
          className="relative w-full sm:max-w-xl flex flex-col overflow-hidden"
          style={{
            background   : 'linear-gradient(160deg,#0a0a0a 0%,#000 60%,rgba(37,99,235,.04) 100%)',
            border       : '1px solid rgba(255,255,255,.1)',
            borderRadius : '16px 16px 0 0',
            maxHeight    : '96dvh',
            /* On desktop — normal rounded */
          }}
          /* override border-radius on sm+ */
          onMouseEnter={(e) => {
            if (window.innerWidth >= 640)
              e.currentTarget.style.borderRadius = '16px';
          }}
        >
          {/* Ambient glow top-right */}
          <div aria-hidden className="absolute top-0 right-0 w-56 h-56 pointer-events-none"
            style={{ background: 'radial-gradient(circle,rgba(37,99,235,.1) 0%,transparent 70%)', filter: 'blur(24px)' }} />

          {/* ── Top bar ───────────────────────────────────────── */}
          <div className="relative flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>

            {/* Step indicator */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Icon */}
              <div className="relative flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#2563EB,#f4d03f)' }}>
                <Target style={{ width: 16, height: 16, color: '#000' }} />
                <div className="absolute inset-0 rounded-full prf-ping"
                  style={{ border: '1px solid rgba(37,99,235,.5)' }} />
              </div>

              {/* Step name + number */}
              <div className="min-w-0">
                <p className="text-white font-light truncate"
                  style={{ fontSize: 'clamp(.85rem,3vw,1rem)', lineHeight: 1.2 }}>
                  {stepNames[step - 1]}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {Array.from({ length: TOTAL }).map((_, i) => (
                    <div key={i} className="rounded-full transition-all duration-300"
                      style={{
                        width      : i < step ? 16 : 6,
                        height     : 4,
                        background : i < step
                          ? 'linear-gradient(to right,#2563EB,#f4d03f)'
                          : i === step
                          ? 'rgba(37,99,235,.35)'
                          : 'rgba(255,255,255,.12)',
                      }}
                    />
                  ))}
                  <span className="text-white/35 ms-1" style={{ fontSize: 10 }}>
                    {step}/{TOTAL}
                  </span>
                </div>
              </div>
            </div>

            {/* Upcoming steps — desktop only */}
            <div className="hidden sm:flex items-center gap-1 mx-4">
              {stepNames.slice(step).map((name, i) => (
                <span key={i} className="flex items-center gap-1"
                  style={{ color: 'rgba(255,255,255,.2)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                  {i > 0 && <ChevronRight style={{ width: 8, height: 8 }} />}
                  {name}
                </span>
              ))}
            </div>

            {/* Close */}
            <button onClick={doClose} disabled={loading}
              className="flex-shrink-0 flex items-center justify-center w-8 h-8 transition-all"
              style={{ color: 'rgba(255,255,255,.45)', borderRadius: 6 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.45)'; }}
              aria-label="Close">
              <X style={{ width: 16, height: 16, transition: 'transform .25s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'rotate(90deg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'rotate(0deg)'; }} />
            </button>
          </div>

          {/* ── Progress bar ─────────────────────────────────── */}
          <div className="relative flex-shrink-0 h-[3px]" style={{ background: 'rgba(255,255,255,.06)' }}>
            <div ref={progressRef} className="absolute inset-y-0 left-0 prf-shimmer-bar"
              style={{
                background: 'linear-gradient(to right,#2563EB,#f4d03f)',
                width: `${(step / TOTAL) * 100}%`,
                transition: 'width .5s cubic-bezier(.4,0,.2,1)',
              }}>
              <div className="absolute inset-0 prf-shimmer"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent)' }} />
            </div>
            {/* Dot */}
            <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
              style={{
                background: '#2563EB',
                left: `calc(${(step / TOTAL) * 100}% - 5px)`,
                boxShadow: '0 0 8px rgba(37,99,235,.6)',
                transition: 'left .5s cubic-bezier(.4,0,.2,1)',
              }}
            />
          </div>

          {/* ── Scrollable body ───────────────────────────────── */}
          <div ref={scrollRef} className="prf-scroll flex-1 overflow-y-auto px-5 pt-5 pb-4"
            style={{ overscrollBehavior: 'contain' }}>

            {/* ══ SUCCESS ══════════════════════════════════════ */}
            {submitted ? (
              <div className="py-10 text-center prf-fadein">
                {/* Orbiting dots */}
                <div className="relative inline-block mb-8">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="absolute rounded-full prf-float"
                      style={{
                        width: 6, height: 6,
                        background: `rgba(37,99,235,${.3 + (i % 3) * .2})`,
                        left: `${50 + Math.cos((i * 45) * Math.PI / 180) * 52}%`,
                        top : `${50 + Math.sin((i * 45) * Math.PI / 180) * 52}%`,
                        animationDelay: `${i * .15}s`,
                      }}
                    />
                  ))}
                  <div className="relative w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#2563EB,#f4d03f)', boxShadow: '0 0 48px rgba(37,99,235,.4)' }}>
                    <Check style={{ width: 36, height: 36, color: '#000' }} className="prf-bounce" />
                  </div>
                </div>

                <h3 className="text-white font-semibold mb-3 prf-fadein-d"
                  style={{ fontSize: 'clamp(1.25rem,3.5vw,1.75rem)', letterSpacing: '-0.02em' }}>
                  {t('projectForm.projectRequest.requestSubmitted')}
                </h3>
                <p className="text-white/60 mb-8 max-w-xs mx-auto leading-relaxed prf-fadein-d2" style={{ fontSize: 14 }}>
                  {t('projectForm.projectRequest.requestSubmittedDesc')}
                </p>

                {/* Status badges */}
                <div className="flex items-center justify-center gap-4 mb-8 prf-fadein-d2">
                  {[
                    { icon: Sparkles, label: t('projectForm.projectRequest.receivedLabel') },
                    { icon: Zap,      label: t('projectForm.projectRequest.notifiedLabel') },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 px-3 py-1.5"
                      style={{ border: '1px solid rgba(37,99,235,.25)', background: 'rgba(37,99,235,.07)' }}>
                      <Icon style={{ width: 13, height: 13, color: '#2563EB', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', letterSpacing: '.08em' }}>{label}</span>
                    </div>
                  ))}
                </div>

                <button onClick={doClose}
                  className="prf-btn-next px-10 py-3.5 text-black font-medium"
                  style={{ fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase' }}>
                  {t('projectForm.projectRequest.close')}
                </button>
              </div>

            ) : (
              <form onSubmit={submit} ref={formRef} noValidate>

                {/* ══ STEP 1 — Project Type ═══════════════════════ */}
                {step === 1 && (
                  <div>
                    <p className="text-white/80 font-light mb-5" style={{ fontSize: 'clamp(.9rem,3vw,1.05rem)' }}>
                      {t('projectForm.steps.projectType.title')}
                    </p>

                    <div className="grid grid-cols-3 gap-2.5">
                      {PROJECT_TYPES.map((opt) => {
                        const sel = form.projectType === opt.value;
                        return (
                          <button key={opt.value} type="button" ref={opt.value === PROJECT_TYPES[0].value ? firstInputRef : null}
                            onClick={() => set('projectType', opt.value)}
                            className={`prf-type-card relative p-3.5 border text-center ${sel ? 'sel' : ''}`}
                            style={{ borderColor: sel ? '#2563EB' : 'rgba(255,255,255,.1)', borderRadius: 10 }}
                            aria-pressed={sel}>
                            {sel && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center prf-spin-in"
                                style={{ background: '#2563EB' }}>
                                <Check style={{ width: 10, height: 10, color: '#000' }} />
                              </div>
                            )}
                            <div className="text-2xl mb-1.5" style={{ lineHeight: 1 }}>{opt.icon}</div>
                            <div className="text-white/75 font-light leading-tight" style={{ fontSize: 10, letterSpacing: '.04em' }}>
                              {t(`projectForm.steps.projectType.options.${opt.key}`)}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {errors.projectType && (
                      <div data-error><FieldError msg={errors.projectType} /></div>
                    )}
                  </div>
                )}

                {/* ══ STEP 2 — Description + optional extras ═══════ */}
                {step === 2 && (
                  <div className="space-y-5">

                    {/* Description */}
                    <div>
                      <label className="flex items-center justify-between mb-2.5">
                        <span className="flex items-center gap-2 text-white/85 font-light"
                          style={{ fontSize: 'clamp(.9rem,3vw,1.05rem)' }}>
                          <Sparkles style={{ width: 15, height: 15, color: '#2563EB', flexShrink: 0 }} />
                          {t('projectForm.steps.projectDescription.title')}
                        </span>
                        {/* Char pill */}
                        <span className="flex items-center gap-1.5 px-2 py-0.5 transition-colors"
                          style={{
                            fontSize: 10,
                            color: charOk ? '#4ade80' : 'rgba(255,255,255,.3)',
                            background: charOk ? 'rgba(74,222,128,.1)' : 'transparent',
                            border: `1px solid ${charOk ? 'rgba(74,222,128,.3)' : 'transparent'}`,
                            borderRadius: 99,
                          }}>
                          {charOk && <Check style={{ width: 9, height: 9 }} />}
                          {charCount}
                        </span>
                      </label>

                      {/* Char progress bar */}
                      <div className="h-[2px] mb-2.5 overflow-hidden" style={{ background: 'rgba(255,255,255,.06)', borderRadius: 99 }}>
                        <div className="h-full transition-all duration-300"
                          style={{
                            width: `${charPct}%`,
                            background: charOk ? 'linear-gradient(to right,#4ade80,#22c55e)' : 'rgba(37,99,235,.5)',
                            borderRadius: 99,
                          }}
                        />
                      </div>

                      <div className="relative">
                        <textarea
                          ref={firstInputRef}
                          value={form.projectDescription}
                          onChange={(e) => set('projectDescription', e.target.value)}
                          rows={4}
                          className={`${inputCls} prf-input resize-none`}
                          style={{ borderRadius: 8, lineHeight: 1.65 }}
                          placeholder={t('projectForm.steps.projectDescription.placeholder')}
                        />
                      </div>
                      {errors.projectDescription && (
                        <div data-error><FieldError msg={errors.projectDescription} /></div>
                      )}
                    </div>

                    {/* Reference URL */}
                    <div>
                      <label className="flex items-center gap-2 mb-2 text-white/60 font-light" style={{ fontSize: 13 }}>
                        <LinkIcon style={{ width: 13, height: 13, color: '#2563EB', flexShrink: 0 }} />
                        {t('projectForm.steps.reference.title')}
                        <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 11 }}>
                          ({t('projectForm.steps.reference.optional')})
                        </span>
                      </label>
                      <div className="relative">
                        <input type="url" value={form.referenceUrl}
                          onChange={(e) => set('referenceUrl', e.target.value)}
                          className={`${inputCls} prf-input`}
                          style={{ borderRadius: 8, paddingRight: form.referenceUrl ? 40 : undefined }}
                          placeholder={t('projectForm.steps.reference.placeholder')}
                        />
                        {form.referenceUrl && (
                          <Check className="absolute top-1/2 -translate-y-1/2"
                            style={{ width: 16, height: 16, color: '#4ade80', [isRTL ? 'left' : 'right']: 14 }} />
                        )}
                      </div>
                    </div>

                    {/* Feature tags — collapsible */}
                    <div style={{ border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, overflow: 'hidden' }}>
                      {/* Toggle header */}
                      <button type="button"
                        onClick={() => setTagsOpen(p => !p)}
                        className="w-full flex items-center justify-between px-4 py-3 transition-colors"
                        style={{ background: tagsOpen ? 'rgba(37,99,235,.06)' : 'rgba(255,255,255,.03)' }}
                        aria-expanded={tagsOpen}>
                        <span className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,.65)', fontSize: 13 }}>
                          <Tag style={{ width: 13, height: 13, color: '#2563EB', flexShrink: 0 }} />
                          {t('projectForm.steps.tags.title')}
                          <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 11 }}>
                            ({t('projectForm.steps.tags.optional')})
                          </span>
                          {form.tags.length > 0 && (
                            <span className="px-2 py-0.5"
                              style={{ background: 'rgba(37,99,235,.2)', border: '1px solid rgba(37,99,235,.35)',
                                color: '#2563EB', fontSize: 10, borderRadius: 99 }}>
                              {form.tags.length} ✓
                            </span>
                          )}
                        </span>
                        <ChevronRight
                          style={{
                            width: 14, height: 14, color: 'rgba(255,255,255,.3)',
                            transform: tagsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform .3s ease',
                          }} />
                      </button>

                      {/* Body */}
                      <div className="prf-tags-body"
                        style={{ maxHeight: tagsOpen ? 600 : 0, opacity: tagsOpen ? 1 : 0 }}>
                        <div className="px-4 pb-4 pt-1 space-y-4">
                          {FEATURE_TAGS.map((group) => (
                            <div key={group.categoryKey}>
                              <p className="flex items-center gap-1.5 mb-2"
                                style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase',
                                  color: 'rgba(255,255,255,.35)' }}>
                                <span>{group.icon}</span>
                                {t(`projectForm.steps.tags.categories.${group.categoryKey}`)}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {group.tags.map((tagKey) => {
                                  const sel = form.tags.includes(tagKey);
                                  return (
                                    <button key={tagKey} type="button"
                                      onClick={() => toggleTag(tagKey)}
                                      className={`prf-tag px-3 py-1.5 border font-light ${sel ? 'sel' : ''}`}
                                      style={{
                                        fontSize: 11, borderRadius: 99,
                                        borderColor: sel ? '#2563EB' : 'rgba(255,255,255,.12)',
                                        background: sel ? 'rgba(37,99,235,.16)' : 'rgba(255,255,255,.04)',
                                        color: sel ? '#2563EB' : 'rgba(255,255,255,.55)',
                                      }}
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

                    {/* Budget */}
                    <div>
                      <p className="text-white/80 font-light mb-3" style={{ fontSize: 'clamp(.9rem,3vw,1.05rem)' }}>
                        💰 {t('projectForm.steps.budget.title')}
                      </p>
                      <div className="space-y-2">
                        {BUDGET_OPTIONS.map((opt) => {
                          const sel = form.budgetRange === opt.value;
                          return (
                            <button key={opt.value} type="button"
                              ref={opt.value === BUDGET_OPTIONS[0].value ? firstInputRef : null}
                              onClick={() => set('budgetRange', opt.value)}
                              className={`prf-opt-row w-full flex items-center justify-between px-4 py-3.5 border text-left ${sel ? 'sel' : ''}`}
                              style={{ borderColor: sel ? '#2563EB' : 'rgba(255,255,255,.1)', borderRadius: 8 }}
                              aria-pressed={sel}>
                              <div className="flex items-center gap-3">
                                <span style={{ fontSize: 20 }}>{opt.icon}</span>
                                <span className="font-light" style={{ fontSize: 13, color: sel ? '#fff' : 'rgba(255,255,255,.75)' }}>
                                  {t(`projectForm.budgetOptions.${opt.key}`)}
                                </span>
                              </div>
                              {sel ? (
                                <div className="w-5 h-5 rounded-full flex items-center justify-center prf-spin-in"
                                  style={{ background: '#2563EB', flexShrink: 0 }}>
                                  <Check style={{ width: 10, height: 10, color: '#000' }} />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border" style={{ borderColor: 'rgba(255,255,255,.15)', flexShrink: 0 }} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {errors.budgetRange && <div data-error><FieldError msg={errors.budgetRange} /></div>}
                    </div>

                    {/* Timeline */}
                    <div>
                      <p className="flex items-center gap-2 text-white/80 font-light mb-3"
                        style={{ fontSize: 'clamp(.9rem,3vw,1.05rem)' }}>
                        <Clock style={{ width: 15, height: 15, color: '#2563EB', flexShrink: 0 }} />
                        {t('projectForm.steps.timeline.title')}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {TIMELINE_OPTIONS.map((opt) => {
                          const sel = form.timeline === opt.value;
                          return (
                            <button key={opt.value} type="button"
                              onClick={() => set('timeline', opt.value)}
                              className={`prf-type-card relative p-3.5 border text-center ${sel ? 'sel' : ''}`}
                              style={{ borderColor: sel ? '#2563EB' : 'rgba(255,255,255,.1)', borderRadius: 8 }}
                              aria-pressed={sel}>
                              {sel && (
                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center prf-spin-in"
                                  style={{ background: '#2563EB' }}>
                                  <Check style={{ width: 10, height: 10, color: '#000' }} />
                                </div>
                              )}
                              <div style={{ fontSize: 22, marginBottom: 6 }}>{opt.icon}</div>
                              <div className="font-light" style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', lineHeight: 1.3 }}>
                                {t(`projectForm.steps.timeline.options.${opt.key}`)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {errors.timeline && <div data-error><FieldError msg={errors.timeline} /></div>}
                    </div>

                    {/* Client type */}
                    <div>
                      <p className="text-white/80 font-light mb-3" style={{ fontSize: 'clamp(.9rem,3vw,1.05rem)' }}>
                        {t('projectForm.steps.clientType.title')}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { type: 'individual', icon: '👤', titleKey: 'individual', descKey: 'individualDesc' },
                          { type: 'company',    icon: '🏢', titleKey: 'company',    descKey: 'companyDesc'    },
                        ].map((opt) => {
                          const sel = form.clientType === opt.type;
                          return (
                            <button key={opt.type} type="button"
                              onClick={() => set('clientType', opt.type)}
                              className={`prf-client-card relative p-4 border text-left ${sel ? 'sel' : ''}`}
                              style={{ borderColor: sel ? '#2563EB' : 'rgba(255,255,255,.1)', borderRadius: 10 }}
                              aria-pressed={sel}>
                              {sel && (
                                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center prf-spin-in"
                                  style={{ background: '#2563EB' }}>
                                  <Check style={{ width: 10, height: 10, color: '#000' }} />
                                </div>
                              )}
                              <div style={{ fontSize: 26, marginBottom: 8 }}>{opt.icon}</div>
                              <div className="font-light mb-0.5" style={{ fontSize: 13, color: '#fff' }}>
                                {t(`projectForm.steps.clientType.${opt.titleKey}`)}
                              </div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', lineHeight: 1.4 }}>
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

                    {/* Full name */}
                    <div>
                      <label className="flex items-center gap-2 mb-2 font-light"
                        style={{ fontSize: 13, color: 'rgba(255,255,255,.8)' }}>
                        👤 {t('projectForm.steps.contact.fullName')}
                        <span style={{ color: '#f87171', fontSize: 12 }}>*</span>
                      </label>
                      <div className="relative">
                        <input ref={firstInputRef} type="text" autoComplete="name"
                          value={form.fullName} onChange={(e) => set('fullName', e.target.value)}
                          className={`${inputCls} prf-input`}
                          style={{ borderRadius: 8, paddingRight: form.fullName ? 40 : undefined,
                            borderColor: errors.fullName ? 'rgba(248,113,113,.5)' : undefined }}
                          placeholder={t('projectForm.steps.contact.fullNamePlaceholder')}
                        />
                        {form.fullName && form.fullName.length >= 2 && (
                          <Check className="absolute top-1/2 -translate-y-1/2"
                            style={{ width: 16, height: 16, color: '#4ade80', [isRTL ? 'left' : 'right']: 14 }} />
                        )}
                      </div>
                      {errors.fullName && <div data-error><FieldError msg={errors.fullName} /></div>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="flex items-center gap-2 mb-2 font-light"
                        style={{ fontSize: 13, color: 'rgba(255,255,255,.8)' }}>
                        <Phone style={{ width: 13, height: 13, color: '#2563EB', flexShrink: 0 }} />
                        {t('projectForm.steps.contact.phoneNumber')}
                        <span style={{ color: '#f87171', fontSize: 12 }}>*</span>
                      </label>
                      <div className="relative">
                        <input type="tel" autoComplete="tel"
                          value={form.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)}
                          className={`${inputCls} prf-input`}
                          style={{ borderRadius: 8, paddingRight: form.phoneNumber ? 40 : undefined,
                            borderColor: errors.phoneNumber ? 'rgba(248,113,113,.5)' : undefined }}
                          placeholder={t('projectForm.steps.contact.phoneNumberPlaceholder')}
                        />
                        {form.phoneNumber && form.phoneNumber.length >= 5 && (
                          <Check className="absolute top-1/2 -translate-y-1/2"
                            style={{ width: 16, height: 16, color: '#4ade80', [isRTL ? 'left' : 'right']: 14 }} />
                        )}
                      </div>
                      {errors.phoneNumber && <div data-error><FieldError msg={errors.phoneNumber} /></div>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="flex items-center gap-2 mb-2 font-light"
                        style={{ fontSize: 13, color: 'rgba(255,255,255,.8)' }}>
                        <Mail style={{ width: 13, height: 13, color: '#2563EB', flexShrink: 0 }} />
                        {t('projectForm.steps.contact.email')}
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>
                          ({t('projectForm.steps.contact.emailOptional')})
                        </span>
                      </label>
                      <div className="relative">
                        <input type="email" autoComplete="email"
                          value={form.email} onChange={(e) => set('email', e.target.value)}
                          className={`${inputCls} prf-input`}
                          style={{ borderRadius: 8,
                            borderColor: errors.email ? 'rgba(248,113,113,.5)' : undefined }}
                          placeholder={t('projectForm.steps.contact.emailPlaceholder')}
                        />
                        {form.email && /^\S+@\S+\.\S+$/.test(form.email) && (
                          <Check className="absolute top-1/2 -translate-y-1/2"
                            style={{ width: 16, height: 16, color: '#4ade80', [isRTL ? 'left' : 'right']: 14 }} />
                        )}
                      </div>
                      {errors.email && <div data-error><FieldError msg={errors.email} /></div>}
                    </div>

                    {/* Company fields — conditional */}
                    {form.clientType === 'company' && (
                      <>
                        <div>
                          <label className="flex items-center gap-2 mb-2 font-light"
                            style={{ fontSize: 13, color: 'rgba(255,255,255,.8)' }}>
                            <Building2 style={{ width: 13, height: 13, color: '#2563EB', flexShrink: 0 }} />
                            {t('projectForm.steps.contact.companyName')}
                            <span style={{ color: '#f87171', fontSize: 12 }}>*</span>
                          </label>
                          <div className="relative">
                            <input type="text" autoComplete="organization"
                              value={form.companyName} onChange={(e) => set('companyName', e.target.value)}
                              className={`${inputCls} prf-input`}
                              style={{ borderRadius: 8,
                                borderColor: errors.companyName ? 'rgba(248,113,113,.5)' : undefined }}
                              placeholder={t('projectForm.steps.contact.companyNamePlaceholder')}
                            />
                            {form.companyName && form.companyName.length >= 2 && (
                              <Check className="absolute top-1/2 -translate-y-1/2"
                                style={{ width: 16, height: 16, color: '#4ade80', [isRTL ? 'left' : 'right']: 14 }} />
                            )}
                          </div>
                          {errors.companyName && <div data-error><FieldError msg={errors.companyName} /></div>}
                        </div>

                        <div>
                          <label className="flex items-center gap-2 mb-2 font-light"
                            style={{ fontSize: 13, color: 'rgba(255,255,255,.8)' }}>
                            👥 {t('projectForm.steps.contact.companySize')}
                            <span style={{ color: '#f87171', fontSize: 12 }}>*</span>
                          </label>
                          <div className="space-y-2">
                            {COMPANY_SIZE_OPTIONS.map((opt) => {
                              const sel = form.companySize === opt.value;
                              return (
                                <button key={opt.value} type="button"
                                  onClick={() => set('companySize', opt.value)}
                                  className={`prf-opt-row w-full flex items-center justify-between px-4 py-3 border text-left ${sel ? 'sel' : ''}`}
                                  style={{ borderColor: sel ? '#2563EB' : 'rgba(255,255,255,.1)', borderRadius: 8 }}
                                  aria-pressed={sel}>
                                  <div className="flex items-center gap-3">
                                    <span style={{ fontSize: 18 }}>{opt.icon}</span>
                                    <span style={{ fontSize: 13, fontWeight: 300, color: sel ? '#fff' : 'rgba(255,255,255,.7)' }}>
                                      {t(`projectForm.companySizeOptions.${opt.key}`)}
                                    </span>
                                  </div>
                                  {sel ? (
                                    <div className="w-4 h-4 rounded-full flex items-center justify-center prf-spin-in"
                                      style={{ background: '#2563EB', flexShrink: 0 }}>
                                      <Check style={{ width: 9, height: 9, color: '#000' }} />
                                    </div>
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border" style={{ borderColor: 'rgba(255,255,255,.15)', flexShrink: 0 }} />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {errors.companySize && <div data-error><FieldError msg={errors.companySize} /></div>}
                        </div>
                      </>
                    )}

                    {/* Submit error */}
                    {errors.submit && (
                      <div className="flex items-center gap-3 px-4 py-3.5 prf-shake"
                        style={{ background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.3)', borderRadius: 8 }}>
                        <AlertCircle style={{ width: 16, height: 16, color: '#f87171', flexShrink: 0 }} />
                        <p style={{ fontSize: 13, color: '#f87171' }}>{errors.submit}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Navigation ────────────────────────────────── */}
                <div className="flex items-center justify-between mt-6 pt-5"
                  style={{ borderTop: '1px solid rgba(255,255,255,.07)' }}>

                  {/* Back */}
                  <button type="button" onClick={back}
                    disabled={step === 1 || loading}
                    className="prf-btn-back flex items-center gap-2 px-5 py-3 border font-light transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                    style={{
                      fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase',
                      color: 'rgba(255,255,255,.7)', borderColor: 'rgba(255,255,255,.18)',
                      borderRadius: 8, background: 'transparent',
                    }}>
                    <ChevronLeft style={{ width: 14, height: 14, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                    {t('projectForm.navigation.back')}
                  </button>

                  {/* Next / Submit */}
                  {step < TOTAL ? (
                    <button type="button" onClick={next}
                      className="prf-btn-next flex items-center gap-2 px-6 py-3 text-black font-medium"
                      style={{ fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', borderRadius: 8 }}>
                      {t('projectForm.navigation.next')}
                      <ChevronRight style={{ width: 14, height: 14, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                    </button>
                  ) : (
                    <button type="submit" disabled={loading}
                      className="prf-btn-next flex items-center gap-2 px-6 py-3 text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', borderRadius: 8 }}>
                      {loading ? (
                        <div className="w-4 h-4 rounded-full border-2 border-black/25 border-t-black animate-spin" />
                      ) : (
                        <Sparkles style={{ width: 14, height: 14 }} />
                      )}
                      {loading ? t('projectForm.startProject.submitting') : t('projectForm.navigation.submit')}
                    </button>
                  )}
                </div>

              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectRequestForm;