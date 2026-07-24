import { useState } from 'react';
import { useSelector } from 'react-redux';
import { LifeBuoy, ChevronDown, ChevronUp, Send, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const TK = {
  bg:        '#F6F7F9',
  surface:   '#FFFFFF',
  border:    '#E8EBF0',
  accent:    '#2563EB',
  accentBg:  'rgba(37,99,235,0.06)',
  text:      '#0D1117',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
};

const FAQ_EN = [
  { q: 'How long does a project take?',          a: 'Project timelines vary based on complexity. Most projects take 4–12 weeks. Your account manager will provide a detailed timeline after the kickoff meeting.' },
  { q: 'How will I receive project updates?',    a: "You'll receive updates directly in your project workspace. You can also message the team anytime through the Messages section." },
  { q: 'Can I request changes during the project?', a: 'Yes. Feedback and revisions are part of our process. Your account manager will guide you through the review stages.' },
  { q: 'How do I pay for my project?',           a: 'Invoices are sent through the platform. You can view and pay them in the Payments section of your dashboard.' },
  { q: 'Who is my account manager?',             a: 'Your dedicated account manager is assigned after your project kicks off. You can see their contact info in your project workspace.' },
  { q: 'What if I need urgent help?',            a: 'WhatsApp us directly at +201090385390. We typically respond within 30 minutes during business hours.' },
];

const FAQ_AR = [
  { q: 'كم يستغرق تنفيذ المشروع؟',          a: 'تختلف المدة حسب تعقيد المشروع. معظم المشاريع تستغرق 4–12 أسبوعاً. مدير مشروعك سيوضح الجدول الزمني بعد اجتماع الانطلاق.' },
  { q: 'كيف سأستلم تحديثات المشروع؟',       a: 'ستصلك التحديثات مباشرة في مساحة مشروعك. يمكنك أيضاً مراسلة الفريق في أي وقت من قسم الرسائل.' },
  { q: 'هل يمكنني طلب تعديلات خلال المشروع؟', a: 'نعم. المراجعات والتعديلات جزء من عمليتنا. مدير مشروعك سيرشدك خلال مراحل المراجعة.' },
  { q: 'كيف أدفع مقابل مشروعي؟',           a: 'تُرسل الفواتير عبر المنصة. يمكنك عرضها والدفع من قسم المدفوعات في لوحتك.' },
  { q: 'من هو مدير مشروعي؟',               a: 'يُعيَّن مدير حسابك المخصص بعد انطلاق مشروعك. ستجد بيانات تواصله في مساحة مشروعك.' },
  { q: 'ماذا لو احتجت مساعدة عاجلة؟',      a: 'راسلنا مباشرة على واتساب: +201090385390. نرد عادةً خلال 30 دقيقة في أوقات العمل.' },
];

const WaIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const Support = () => {
  const { language, isRTL } = useLanguage();
  const { user } = useSelector(s => s.auth);

  const [openFaq, setOpenFaq]     = useState(null);
  const [subject, setSubject]     = useState('');
  const [message, setMessage]     = useState('');
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [error, setError]         = useState('');

  const faqs = language === 'ar' ? FAQ_AR : FAQ_EN;

  const handleTicket = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError('');
    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      await axios.post(`${apiBase}/support/ticket`, {
        subject: subject || (language === 'ar' ? 'طلب دعم' : 'Support Request'),
        message: message.trim(),
        name: user?.fullName,
        email: user?.email,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSent(true);
      setSubject('');
      setMessage('');
    } catch {
      setError(language === 'ar' ? 'فشل الإرسال. يرجى التواصل عبر واتساب.' : 'Failed to send. Please try WhatsApp instead.');
    } finally {
      setSending(false);
    }
  };

  const CHANNELS = [
    {
      icon: <WaIcon />,
      label: language === 'ar' ? 'واتساب' : 'WhatsApp',
      desc:  language === 'ar' ? 'تواصل مباشر — أسرع استجابة' : 'Chat directly — fastest response',
      time:  language === 'ar' ? 'عادةً خلال 30 دقيقة' : 'Usually within 30 minutes',
      href:  'https://wa.me/201090385390',
      bg:    '#25D366', color: '#fff',
    },
    {
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.15 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>,
      label: language === 'ar' ? 'اتصل بنا' : 'Call Us',
      desc:  language === 'ar' ? 'متاح 9ص–6م بتوقيت القاهرة' : 'Available 9am–6pm Cairo time',
      time:  language === 'ar' ? 'أوقات العمل' : 'Business hours',
      href:  'tel:+201090385390',
      bg:    TK.accent, color: '#fff',
    },
    {
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
      label: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
      desc:  language === 'ar' ? 'نرد خلال 24 ساعة' : 'We reply within 24 hours',
      time:  language === 'ar' ? 'خلال 24 ساعة' : 'Within 24 hours',
      href:  'mailto:support@yansy.tech',
      bg:    TK.surface, color: TK.accent, border: `1px solid rgba(37,99,235,0.2)`,
    },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: TK.bg,
      padding: 'clamp(16px,3vw,32px)',
      fontFamily: isRTL ? 'IBM Plex Sans Arabic,system-ui,sans-serif' : 'Inter,system-ui,sans-serif',
      direction: isRTL ? 'rtl' : 'ltr', maxWidth: '900px', margin: '0 auto',
    }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '9px', background: TK.accentBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <LifeBuoy style={{ width: '18px', height: '18px', color: TK.accent }} />
          </div>
          <h1 style={{ fontSize: 'clamp(18px,3vw,24px)', fontWeight: 700, color: TK.text, margin: 0 }}>
            {language === 'ar' ? 'مركز الدعم' : 'Support Center'}
          </h1>
        </div>
        <p style={{ fontSize: '13.5px', color: TK.textMuted, margin: '0 0 0 46px' }}>
          {language === 'ar' ? 'نرد خلال ساعتين في أوقات العمل' : 'We respond within 2 hours during business hours'}
        </p>
      </div>

      {/* ── Contact Channels ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,260px),1fr))', gap: '12px', marginBottom: '28px' }}>
        {CHANNELS.map(ch => (
          <a key={ch.label} href={ch.href} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', flexDirection: 'column', padding: '18px 20px', borderRadius: '14px',
              background: ch.bg, border: ch.border || 'none', textDecoration: 'none',
              color: ch.color, transition: 'all 0.18s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              {ch.icon}
              <span style={{ fontWeight: 600, fontSize: '14px' }}>{ch.label}</span>
            </div>
            <p style={{ fontSize: '12.5px', opacity: 0.85, margin: '0 0 8px', lineHeight: 1.45 }}>{ch.desc}</p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px',
              opacity: 0.7, fontWeight: 500,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {ch.time}
            </div>
          </a>
        ))}
      </div>

      {/* ── Open Ticket ── */}
      <div style={{ background: TK.surface, borderRadius: '16px', border: `1px solid ${TK.border}`, padding: '24px', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: TK.text, margin: '0 0 16px' }}>
          {language === 'ar' ? 'أرسل لنا رسالة' : 'Send Us a Message'}
        </h2>

        {sent ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '28px 16px', textAlign: 'center',
          }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'rgba(22,163,74,0.08)', border: '2px solid rgba(22,163,74,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px',
            }}>
              <CheckCircle2 style={{ width: '24px', height: '24px', color: '#16a34a' }} />
            </div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: TK.text, margin: '0 0 6px' }}>
              {language === 'ar' ? 'تم الإرسال!' : 'Message sent!'}
            </p>
            <p style={{ fontSize: '12.5px', color: TK.textMuted, margin: '0 0 16px' }}>
              {language === 'ar' ? 'سنرد خلال ساعتين.' : "We'll reply within 2 hours."}
            </p>
            <button onClick={() => setSent(false)}
              style={{
                padding: '7px 18px', borderRadius: '8px', border: `1px solid ${TK.border}`,
                background: TK.surface, color: TK.textMuted, cursor: 'pointer', fontSize: '12.5px',
              }}
            >
              {language === 'ar' ? 'إرسال رسالة أخرى' : 'Send another message'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: TK.textMuted, display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                {language === 'ar' ? 'الموضوع (اختياري)' : 'Subject (optional)'}
              </label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder={language === 'ar' ? 'وصف مختصر لمشكلتك...' : 'Briefly describe your issue...'}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  border: `1px solid ${TK.border}`, fontSize: '13px', color: TK.text,
                  background: TK.bg, outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = TK.accent; }}
                onBlur={e => { e.target.style.borderColor = TK.border; }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: TK.textMuted, display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                {language === 'ar' ? 'رسالتك *' : 'Your message *'}
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={language === 'ar' ? 'اشرح مشكلتك بالتفصيل...' : 'Describe your issue in detail...'}
                rows={4}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  border: `1px solid ${TK.border}`, fontSize: '13px', color: TK.text,
                  background: TK.bg, outline: 'none', fontFamily: 'inherit', resize: 'vertical',
                  boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = TK.accent; }}
                onBlur={e => { e.target.style.borderColor = TK.border; }}
              />
            </div>
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: '9px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', fontSize: '12.5px', color: '#dc2626' }}>
                {error}
              </div>
            )}
            <button onClick={handleTicket} disabled={!message.trim() || sending}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                padding: '11px 22px', borderRadius: '10px', alignSelf: 'flex-start',
                background: message.trim() && !sending ? TK.accent : TK.accentBg,
                border: 'none', cursor: message.trim() && !sending ? 'pointer' : 'default',
                color: message.trim() && !sending ? '#fff' : TK.textLight,
                fontSize: '13.5px', fontWeight: 500, fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              <Send style={{ width: '14px', height: '14px' }} />
              {sending
                ? (language === 'ar' ? 'جارٍ الإرسال...' : 'Sending...')
                : (language === 'ar' ? 'إرسال الرسالة' : 'Send Message')}
            </button>
          </div>
        )}
      </div>

      {/* ── Book a Meeting ── */}
      <div style={{
        borderRadius: '16px', border: `1px solid ${TK.border}`,
        padding: '24px', marginBottom: '28px',
        background: 'linear-gradient(135deg,rgba(37,99,235,0.03) 0%,rgba(255,255,255,1) 60%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: TK.accentBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TK.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: TK.text, margin: 0 }}>
                {language === 'ar' ? 'احجز اجتماعاً مع الفريق' : 'Book a Call with the Team'}
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: TK.textMuted, margin: '0 0 16px', lineHeight: 1.6, maxWidth: 420 }}>
              {language === 'ar'
                ? 'هل تريد مناقشة مشروعك بعمق؟ احجز جلسة مع مدير مشروعك مباشرة عبر واتساب وسنرتب الموعد معك.'
                : 'Want to discuss your project in depth? Book a session with your project manager directly via WhatsApp and we\'ll arrange a time.'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <a
                href="https://wa.me/201090385390?text=Hi%2C%20I%20would%20like%20to%20book%20a%20call%20to%20discuss%20my%20project."
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '10px 18px', borderRadius: 10,
                  background: '#25D366', color: 'white', textDecoration: 'none',
                  fontSize: '13px', fontWeight: 500, transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                {language === 'ar' ? 'احجز عبر واتساب' : 'Book via WhatsApp'}
              </a>
              <a
                href="mailto:support@yansy.tech?subject=Meeting%20Request"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '10px 18px', borderRadius: 10,
                  background: TK.accentBg, border: `1px solid rgba(37,99,235,0.2)`,
                  color: TK.accent, textDecoration: 'none', fontSize: '13px', fontWeight: 500,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                {language === 'ar' ? 'طلب عبر البريد' : 'Request via Email'}
              </a>
            </div>
          </div>

          {/* Meeting type cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200, flexShrink: 0 }}>
            {[
              { icon: '📞', title: language === 'ar' ? 'مكالمة سريعة' : 'Quick Call', desc: language === 'ar' ? '15 دقيقة' : '15 minutes' },
              { icon: '💻', title: language === 'ar' ? 'مراجعة مشروع' : 'Project Review', desc: language === 'ar' ? '30 دقيقة' : '30 minutes' },
              { icon: '🎯', title: language === 'ar' ? 'جلسة استراتيجية' : 'Strategy Session', desc: language === 'ar' ? '60 دقيقة' : '60 minutes' },
            ].map(m => (
              <div key={m.title} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10,
                background: TK.bg, border: `1px solid ${TK.border}`,
                fontSize: 12.5,
              }}>
                <span style={{ fontSize: 16 }}>{m.icon}</span>
                <div>
                  <div style={{ fontWeight: 500, color: TK.text, fontSize: 12.5 }}>{m.title}</div>
                  <div style={{ color: TK.textMuted, fontSize: 11 }}>{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: TK.text, margin: '0 0 14px' }}>
          {language === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {faqs.map((item, i) => (
            <div key={i} style={{
              background: TK.surface, borderRadius: '12px',
              border: `1px solid ${openFaq === i ? 'rgba(37,99,235,0.2)' : TK.border}`,
              overflow: 'hidden', transition: 'border-color 0.15s',
            }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                  width: '100%', padding: '14px 18px', background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: isRTL ? 'right' : 'left',
                }}
                aria-expanded={openFaq === i}
              >
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: TK.text, lineHeight: 1.4 }}>
                  {item.q}
                </span>
                {openFaq === i
                  ? <ChevronUp style={{ width: '15px', height: '15px', color: TK.accent, flexShrink: 0 }} />
                  : <ChevronDown style={{ width: '15px', height: '15px', color: TK.textLight, flexShrink: 0 }} />
                }
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 18px 16px' }}>
                  <p style={{ fontSize: '13px', color: TK.textMuted, margin: 0, lineHeight: 1.6 }}>
                    {item.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Support;
