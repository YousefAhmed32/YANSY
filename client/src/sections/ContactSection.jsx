import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, MessageCircle } from 'lucide-react';

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
  'نظام ERP / CRM',
  'نظام حجز وجدولة',
  'أتمتة عمليات',
  'غير متأكد بعد',
];

const ContactSection = ({ isRTL: isRTLProp, onStartProject }) => {
  const { isRTL: ctxRTL } = useLanguage();
  const rtl = isRTLProp ?? ctxRTL;
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', projectType: '', message: '' });

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) setSubmitted(true);
    } catch {}
    setLoading(false);
  };

  const guarantees = rtl ? GUARANTEES_AR : GUARANTEES_EN;
  const projectTypes = rtl ? PROJECT_TYPES_AR : PROJECT_TYPES_EN;

  return (
    <section
      id="contact"
      dir={rtl ? 'rtl' : 'ltr'}
      style={{
        background: '#0D1117',
        paddingTop:    'clamp(5rem, 10vw, 8rem)',
        paddingBottom: 'clamp(5rem, 10vw, 8rem)',
        paddingLeft:   'clamp(1.25rem, 5vw, 3rem)',
        paddingRight:  'clamp(1.25rem, 5vw, 3rem)',
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
          -webkit-appearance: none;
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

      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
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
                  <span style={{ color: '#60A5FA' }}>كيف نوصلك إليه.</span>
                </>
              ) : (
                <>
                  <span>Tell us what you</span><br />
                  <span>want to build. We'll</span><br />
                  <span style={{ color: '#60A5FA' }}>tell you how to get there.</span>
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
              <div style={{ textAlign: 'center', padding: 'clamp(40px, 6vw, 60px) 0' }}>
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
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ textAlign: rtl ? 'right' : 'left', marginBottom: 28 }}>
                  <h3 style={{
                    fontSize: 'clamp(1.125rem, 1.5vw, 1.375rem)',
                    fontWeight: 700, color: '#0D1117',
                    margin: '0 0 6px',
                    letterSpacing: rtl ? 0 : '-0.02em',
                    fontFamily: rtl ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
                  }}>
                    {rtl ? 'أخبرنا عن مشروعك' : 'Tell us about your project'}
                  </h3>
                  <p style={{ fontSize: 13, color: '#9BA3AE', margin: 0 }}>
                    {rtl ? 'مجاني · بدون التزام · رد خلال ساعتين' : 'Free · No commitment · Reply within 2 hours'}
                  </p>
                </div>

                {/* Name */}
                <div style={{ marginBottom: 12 }}>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder={rtl ? 'اسمك' : 'Your name'}
                    dir={rtl ? 'rtl' : 'ltr'}
                    className="contact-field-light"
                  />
                </div>

                {/* Email */}
                <div style={{ marginBottom: 12 }}>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder={rtl ? 'البريد الإلكتروني' : 'Email address'}
                    dir={rtl ? 'rtl' : 'ltr'}
                    className="contact-field-light"
                  />
                </div>

                {/* Project type */}
                <div style={{ marginBottom: 12, position: 'relative' }}>
                  <select
                    name="projectType"
                    value={form.projectType}
                    onChange={handleChange}
                    dir={rtl ? 'rtl' : 'ltr'}
                    className="contact-field-light"
                    style={{
                      cursor: 'pointer',
                      color: form.projectType ? '#0D1117' : '#9BA3AE',
                      paddingInlineEnd: 36,
                    }}
                  >
                    <option value="" disabled>
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

                {/* Message */}
                <div style={{ marginBottom: 22 }}>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder={rtl ? 'صف مشروعك باختصار — ما الذي تريد بناءه؟' : 'Describe your project briefly — what do you want to build?'}
                    dir={rtl ? 'rtl' : 'ltr'}
                    className="contact-field-light"
                    style={{ resize: 'vertical' }}
                  />
                </div>

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
                  fontSize: 11.5, color: '#C9CDD6', textAlign: 'center',
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
