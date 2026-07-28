import { useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, MessageCircle } from 'lucide-react';
import api from '../utils/api';
import { trackContactForm } from '../utils/ga4';
import { trackLead, trackContact } from '../utils/metaPixel';

/**
 * One labelled form control.
 *
 * The fields previously carried a placeholder and nothing else — no `<label>`,
 * no programmatic name. That fails WCAG 3.3.2, and the moment a visitor starts
 * typing the only description of the field disappears. The label is visually
 * hidden (the placeholder still carries the visible affordance) but is a real
 * label element, so assistive tech and autofill both resolve the field.
 */
const Field = ({ id, label, error, required, rtl, children }) => (
  <div style={{ marginBottom: 12 }}>
    <label htmlFor={id} className="sr-only">
      {label}{required ? (rtl ? ' (مطلوب)' : ' (required)') : ''}
    </label>
    {children}
    {error && (
      <p
        id={`${id}-err`}
        style={{
          fontSize: 12, color: '#B91C1C', margin: '6px 2px 0',
          textAlign: rtl ? 'right' : 'left',
          display: 'flex', alignItems: 'center', gap: 5,
          flexDirection: rtl ? 'row-reverse' : 'row',
        }}
      >
        <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden style={{ flexShrink: 0 }}>
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3.5a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 4.5zM8 11.75a.9.9 0 110-1.8.9.9 0 010 1.8z" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

const WA_URL = 'https://wa.me/201090385390?text=Hello%2C%20I%27d%20like%20to%20discuss%20a%20project%20with%20YANSY.';

const GUARANTEES_EN = [
  'Free 30-min consultation — no commitment',
  'Response within 2 hours',
  'Milestone-based payments — you pay as we deliver',
  '100% code ownership after final delivery',
];
const GUARANTEES_AR = [
  'استشارة 30 دقيقة مجانية — لا التزام',
  'رد خلال ساعتين',
  'دفع على مراحل — تدفع مع التسليم',
  'ملكية 100٪ للكود بعد التسليم النهائي',
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

const ContactSection = ({ isRTL: isRTLProp }) => {
  const { isRTL: ctxRTL } = useLanguage();
  const rtl = isRTLProp ?? ctxRTL;
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', projectType: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const formRef = useRef(null);

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
    // Clear a field's error as soon as the visitor starts fixing it — keeping
    // it on screen while they type reads as the form arguing with them.
    setFieldErrors(prev => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate(form);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      // Move focus to the first invalid field so screen-reader and keyboard
      // users land on the problem instead of having to hunt for it.
      formRef.current?.querySelector(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }
    setLoading(true);
    setError(false);
    try {
      // Was previously `fetch('/api/contact', ...)` — that endpoint has never
      // existed on the backend (no /api/contact route anywhere in server/routes),
      // so every homepage contact-form submission silently failed. Routed
      // through the existing lightweight lead-capture endpoint instead, via the
      // shared `api` client so it respects VITE_API_URL in every environment.
      await api.post('/project-requests/ai-lead', {
        name: form.name,
        contact: form.email,
        service: form.projectType || undefined,
        message: form.message,
        source: 'Homepage Contact Form',
      });
      setSubmitted(true);
      trackContactForm('homepage-contact-form');
      trackLead({ content_name: 'homepage-contact-form', content_category: form.projectType || undefined });
      trackContact({ content_name: 'homepage-contact-form' });
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  const guarantees = rtl ? GUARANTEES_AR : GUARANTEES_EN;
  const projectTypes = rtl ? PROJECT_TYPES_AR : PROJECT_TYPES_EN;

  return (
    <section
      id="contact"
      dir={rtl ? 'rtl' : 'ltr'}
      className="section-shell"
      style={{
        background: '#0D1117',
        borderTop: 'none',   /* the dark block is its own boundary */
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        pointerEvents: 'none',
      }} aria-hidden />

      <style>{`
        .contact-grid {
          display: grid;
          grid-template-columns: 5fr 7fr;
          gap: clamp(3rem, 7vw, 7rem);
          align-items: start;
        }
        @media (max-width: 860px) {
          .contact-grid { grid-template-columns: 1fr; }
        }
        .contact-field {
          width: 100%;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1.5px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          font-size: 14px;
          color: #FFFFFF;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
          transition: border-color 0.2s, background 0.2s;
          line-height: 1.6;
          -webkit-appearance: none;
        }
        .contact-field::placeholder { color: rgba(255,255,255,0.3); }
        .contact-field:focus {
          border-color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.08);
        }
        .contact-field option { background: #1F2937; color: #FFFFFF; }
        .contact-field-light {
          width: 100%;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1.5px solid #E8EBF0;
          background: #FAFAFA;
          font-size: 14px;
          color: #0D1117;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
          transition: border-color 0.2s, background 0.2s;
          line-height: 1.6;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
        }
        .contact-field-light::placeholder { color: #9BA3AE; }
        .contact-field-light:focus {
          border-color: #0D1117;
          background: #FFFFFF;
        }
        .contact-guarantee {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13.5px;
          color: rgba(255,255,255,0.7);
          line-height: 1.5;
        }
        .contact-wa-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          border-radius: 10px;
          background: rgba(37,211,102,0.08);
          border: 1.5px solid rgba(37,211,102,0.22);
          color: #4ADE80;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.2s, border-color 0.2s;
          white-space: nowrap;
        }
        .contact-wa-btn:hover {
          background: rgba(37,211,102,0.15);
          border-color: rgba(37,211,102,0.35);
        }
      `}</style>

      <div className="section-inner" style={{ position: 'relative', zIndex: 1 }}>
        <div className="contact-grid">

          {/* Left: Pitch */}
          <div style={{ textAlign: rtl ? 'right' : 'left' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              fontSize: 10.5, fontWeight: 700,
              color: '#93C5FD', letterSpacing: rtl ? 0 : '0.07em',
              textTransform: rtl ? 'none' : 'uppercase',
              background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.22)',
              padding: '5px 14px', borderRadius: '100px', marginBottom: 32,
              flexDirection: rtl ? 'row-reverse' : 'row',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#93C5FD', flexShrink: 0 }} aria-hidden />
              {rtl ? 'ابدأ اليوم' : 'Start today'}
            </span>

            <h2 style={{
              fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: rtl ? 0 : '-0.04em',
              color: '#FFFFFF',
              margin: '0 0 clamp(16px, 2.5vw, 24px)',
              fontFamily: rtl ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
            }}>
              {rtl ? (
                <>
                  <span>أخبرنا ما تريد</span><br />
                  <span>بناءه. سنخبرك</span><br />
                  <span style={{ color: '#60A5FA', lineHeight: 'inherit' }}>كيف نوصلك إليه.</span>
                </>
              ) : (
                <>
                  <span>Tell us what you</span><br />
                  <span>want to build. We'll</span><br />
                  <span style={{ color: '#60A5FA', lineHeight: 'inherit' }}>tell you how to get there.</span>
                </>
              )}
            </h2>

            <p style={{
              fontSize: 'clamp(0.9375rem, 1.1vw, 1.0625rem)',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.75,
              margin: '0 0 clamp(2rem, 4vw, 3rem)',
              maxWidth: 400,
              fontFamily: rtl ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
            }}>
              {rtl
                ? 'اترك لنا الأمر. نحن نتولى التصميم والبناء والإطلاق — بينما تركز على عملك.'
                : "Leave it to us. We handle the design, build, and launch — while you focus on your business."}
            </p>

            {/* Guarantees */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
              {guarantees.map((g, i) => (
                <div
                  key={i}
                  className="contact-guarantee"
                  style={{ flexDirection: rtl ? 'row-reverse' : 'row', textAlign: rtl ? 'right' : 'left' }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" width="10" height="10" aria-hidden>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span style={{ fontFamily: rtl ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif" }}>
                    {g}
                  </span>
                </div>
              ))}
            </div>

            {/* WhatsApp */}
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-wa-btn"
              style={{ flexDirection: rtl ? 'row-reverse' : 'row' }}
            >
              <MessageCircle style={{ width: 16, height: 16, flexShrink: 0 }} aria-hidden />
              {rtl ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
            </a>
          </div>

          {/* Right: Form */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: 'clamp(24px, 3.5vw, 44px)',
          }}>
            {submitted ? (
              <div role="status" style={{ textAlign: 'center', padding: 'clamp(40px, 6vw, 60px) 0' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: '#DCFCE7', margin: '0 auto 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" width="26" height="26" aria-hidden>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: '#0D1117', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  {rtl ? 'تم الإرسال!' : 'Message sent!'}
                </h3>
                <p style={{ fontSize: 14, color: '#5C6370', margin: 0 }}>
                  {rtl ? 'سنرد عليك خلال ساعتين.' : "We'll get back to you within 2 hours."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate ref={formRef}>
                <div style={{ textAlign: rtl ? 'right' : 'left', marginBottom: 24 }}>
                  <h3 style={{
                    fontSize: 'clamp(1.125rem, 1.5vw, 1.375rem)',
                    fontWeight: 700, color: '#0D1117',
                    margin: '0 0 6px',
                    letterSpacing: rtl ? 0 : '-0.02em',
                    fontFamily: rtl ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
                  }}>
                    {rtl ? 'أخبرنا عن مشروعك' : 'Tell us about your project'}
                  </h3>
                  <p style={{ fontSize: 13, color: '#5C6370', margin: 0 }}>
                    {rtl ? 'مجاني · بدون التزام · رد خلال ساعتين' : 'Free · No commitment · Reply within 2 hours'}
                  </p>
                </div>

                <Field
                  id="contact-name" name="name" rtl={rtl} error={fieldErrors.name} required
                  label={rtl ? 'الاسم' : 'Name'}
                >
                  <input
                    type="text" id="contact-name" name="name"
                    value={form.name} onChange={handleChange}
                    autoComplete="name"
                    placeholder={rtl ? 'اسمك' : 'Your name'}
                    dir={rtl ? 'rtl' : 'ltr'}
                    className="contact-field-light"
                    aria-required="true"
                    aria-invalid={fieldErrors.name ? 'true' : undefined}
                    aria-describedby={fieldErrors.name ? 'contact-name-err' : undefined}
                  />
                </Field>

                <Field
                  id="contact-email" name="email" rtl={rtl} error={fieldErrors.email} required
                  label={rtl ? 'البريد الإلكتروني' : 'Email address'}
                >
                  <input
                    type="email" id="contact-email" name="email"
                    value={form.email} onChange={handleChange}
                    autoComplete="email" inputMode="email"
                    placeholder={rtl ? 'البريد الإلكتروني' : 'Email address'}
                    dir="ltr"
                    style={{ textAlign: rtl ? 'right' : 'left' }}
                    className="contact-field-light"
                    aria-required="true"
                    aria-invalid={fieldErrors.email ? 'true' : undefined}
                    aria-describedby={fieldErrors.email ? 'contact-email-err' : undefined}
                  />
                </Field>

                <Field
                  id="contact-type" name="projectType" rtl={rtl}
                  label={rtl ? 'نوع المشروع (اختياري)' : 'Project type (optional)'}
                >
                  <div style={{ position: 'relative' }}>
                    <select
                      id="contact-type" name="projectType"
                      value={form.projectType} onChange={handleChange}
                      dir={rtl ? 'rtl' : 'ltr'}
                      className="contact-field-light"
                      style={{
                        cursor: 'pointer',
                        color: form.projectType ? '#0D1117' : '#9BA3AE',
                        paddingInlineEnd: 36,
                      }}
                    >
                      <option value="">
                        {rtl ? 'نوع المشروع (اختياري)' : 'Project type (optional)'}
                      </option>
                      {projectTypes.map((t, i) => (
                        <option key={i} value={t}>{t}</option>
                      ))}
                    </select>
                    <svg
                      viewBox="0 0 24 24" fill="none" stroke="#9BA3AE" strokeWidth="2"
                      width="14" height="14" aria-hidden
                      style={{
                        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                        [rtl ? 'left' : 'right']: 14, pointerEvents: 'none',
                      }}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </Field>

                <Field
                  id="contact-message" name="message" rtl={rtl} error={fieldErrors.message} required
                  label={rtl ? 'وصف المشروع' : 'Project description'}
                >
                  <textarea
                    id="contact-message" name="message"
                    value={form.message} onChange={handleChange}
                    rows={4}
                    placeholder={rtl ? 'صف مشروعك باختصار — ما الذي تريد بناءه؟' : 'Describe your project briefly — what do you want to build?'}
                    dir={rtl ? 'rtl' : 'ltr'}
                    className="contact-field-light"
                    style={{ resize: 'vertical' }}
                    aria-required="true"
                    aria-invalid={fieldErrors.message ? 'true' : undefined}
                    aria-describedby={fieldErrors.message ? 'contact-message-err' : undefined}
                  />
                </Field>

                {/* Submit-level failure. role="alert" so it is announced the
                    moment it appears, unlike the silent <p> this replaced. */}
                {error && (
                  <p
                    role="alert"
                    style={{
                      fontSize: 12.5, color: '#B91C1C', margin: '0 0 12px',
                      textAlign: rtl ? 'right' : 'left',
                      background: '#FEF2F2', border: '1px solid #FECACA',
                      borderRadius: 8, padding: '10px 12px',
                    }}
                  >
                    {rtl ? 'تعذر إرسال طلبك. حاول مرة أخرى أو راسلنا عبر واتساب.' : "Couldn't send your request. Please try again or reach us on WhatsApp."}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    fontSize: '14px',
                    padding: '14px 24px',
                    opacity: loading ? 0.65 : 1,
                    cursor: loading ? 'wait' : 'pointer',
                  }}
                >
                  {loading
                    ? (rtl ? 'جارٍ الإرسال...' : 'Sending...')
                    : (rtl ? 'أرسل طلبك' : 'Send Your Request')}
                  {!loading && (
                    <ArrowRight style={{ width: 15, height: 15, transform: rtl ? 'scaleX(-1)' : 'none' }} aria-hidden />
                  )}
                </button>

                <p style={{
                  fontSize: 11.5, color: '#6B7280', textAlign: 'center',
                  margin: '14px 0 0',
                }}>
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
