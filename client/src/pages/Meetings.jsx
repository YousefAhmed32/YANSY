import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Calendar, Clock, Video, MessageCircle, Zap, ChevronRight, Check } from 'lucide-react';
import { trackSchedule } from '../utils/metaPixel';

const TK = {
  bg:        '#F6F7F9',
  surface:   '#FFFFFF',
  border:    '#E8EBF0',
  accent:    '#2563EB',
  text:      '#0D1117',
  textMuted: '#6B7280',
};

const MEETING_TYPES = [
  {
    id: 'discovery',
    icon: Video,
    duration: '30 min',
    color: '#2563EB',
    title_en: 'Discovery Call',
    title_ar: 'مكالمة تعريفية',
    desc_en: "Best for new projects. We'll discuss your goals, timeline, and how YANSY can help.",
    desc_ar: 'مثالية للمشاريع الجديدة. نناقش أهدافك والجدول الزمني وكيف يمكن لـ YANSY المساعدة.',
    items_en: ['Project scope & vision', 'Timeline & budget discussion', 'Platform walkthrough'],
    items_ar: ['نطاق المشروع والرؤية', 'مناقشة الجدول الزمني والميزانية', 'عرض المنصة'],
  },
  {
    id: 'review',
    icon: Zap,
    duration: '45 min',
    color: '#7c3aed',
    title_en: 'Project Review',
    title_ar: 'مراجعة المشروع',
    desc_en: 'For active clients. Review progress, address feedback, and plan the next sprint.',
    desc_ar: 'للعملاء الحاليين. مراجعة التقدم، ومعالجة الملاحظات، والتخطيط للمرحلة القادمة.',
    items_en: ['Progress milestone review', 'Design & dev feedback', 'Next phase planning'],
    items_ar: ['مراجعة مرحلة التقدم', 'ملاحظات التصميم والتطوير', 'تخطيط المرحلة القادمة'],
  },
  {
    id: 'technical',
    icon: MessageCircle,
    duration: '60 min',
    color: '#0891b2',
    title_en: 'Technical Deep Dive',
    title_ar: 'جلسة تقنية متعمقة',
    desc_en: 'For complex technical questions. Integrations, architecture, API design, and more.',
    desc_ar: 'للأسئلة التقنية المعقدة. التكاملات والهندسة المعمارية وتصميم API والمزيد.',
    items_en: ['System architecture', 'Integration planning', 'Technical requirements'],
    items_ar: ['هندسة النظام', 'تخطيط التكاملات', 'المتطلبات التقنية'],
  },
];

const WHATSAPP_NUMBER = '201090385390';

export default function Meetings() {
  const { language, isRTL } = useLanguage();
  const ar = language === 'ar';
  const [selected, setSelected] = useState(null);
  const [booked, setBooked] = useState(false);

  const bookViaWhatsApp = (type) => {
    const msg = ar
      ? `مرحباً، أود حجز ${type.title_ar} (${type.duration}).`
      : `Hi, I'd like to book a ${type.title_en} (${type.duration}).`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    trackSchedule({ content_name: type.id, content_category: type.duration });
    setBooked(true);
    setSelected(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px', direction: isRTL ? 'rtl' : 'ltr', fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ maxWidth: '720px', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(37,99,235,0.25)', background: 'rgba(37,99,235,0.06)', marginBottom: '14px' }}>
          <Calendar style={{ width: '10px', height: '10px', color: TK.accent }} />
          <span style={{ fontSize: '10px', fontWeight: 500, color: TK.accent, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {ar ? 'اجتماعات' : 'Meetings'}
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 600, color: TK.text, margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {ar ? 'احجز اجتماعاً' : 'Book a Meeting'}
        </h1>
        <p style={{ fontSize: '14px', color: TK.textMuted, fontWeight: 300, maxWidth: '480px', lineHeight: 1.6 }}>
          {ar
            ? 'اختر نوع الاجتماع المناسب لك وسيتواصل معك فريقنا عبر واتساب لتأكيد الموعد.'
            : 'Choose the meeting type that fits your needs. Our team will confirm via WhatsApp.'}
        </p>
      </div>

      {booked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '10px', marginBottom: '28px', maxWidth: '480px' }}>
          <Check style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: '#34d399', margin: 0, fontWeight: 300 }}>
            {ar ? 'تم فتح واتساب. سيتواصل معك فريقنا قريباً.' : 'WhatsApp opened. Our team will get back to you shortly.'}
          </p>
        </div>
      )}

      {/* Meeting Type Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: '960px' }}>
        {MEETING_TYPES.map(type => {
          const Icon = type.icon;
          const isSelected = selected === type.id;
          return (
            <div
              key={type.id}
              onClick={() => setSelected(isSelected ? null : type.id)}
              style={{
                padding: '24px', background: TK.surface,
                border: `1px solid ${isSelected ? type.color : TK.border}`,
                borderRadius: '14px', cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isSelected ? `0 0 0 3px ${type.color}18` : 'none',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = `${type.color}50`; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = TK.border; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${type.color}12`, border: `1px solid ${type.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: '18px', height: '18px', color: type.color }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(0,0,0,0.04)', border: `1px solid ${TK.border}` }}>
                  <Clock style={{ width: '10px', height: '10px', color: TK.textMuted }} />
                  <span style={{ fontSize: '11px', color: TK.textMuted, fontWeight: 300 }}>{type.duration}</span>
                </div>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 500, color: TK.text, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                {ar ? type.title_ar : type.title_en}
              </h3>
              <p style={{ fontSize: '12px', color: TK.textMuted, margin: '0 0 16px', lineHeight: 1.6, fontWeight: 300 }}>
                {ar ? type.desc_ar : type.desc_en}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                {(ar ? type.items_ar : type.items_en).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: type.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: TK.textMuted, fontWeight: 300 }}>{item}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); bookViaWhatsApp(type); }}
                style={{
                  width: '100%', padding: '10px 16px',
                  background: isSelected ? type.color : 'transparent',
                  border: `1px solid ${type.color}`,
                  borderRadius: '8px', cursor: 'pointer',
                  color: isSelected ? '#fff' : type.color,
                  fontSize: '12px', fontWeight: 400,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = type.color; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isSelected ? type.color : 'transparent'; e.currentTarget.style.color = isSelected ? '#fff' : type.color; }}
              >
                <MessageCircle style={{ width: '13px', height: '13px' }} />
                {ar ? 'احجز عبر واتساب' : 'Book via WhatsApp'}
                <ChevronRight style={{ width: '13px', height: '13px' }} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Info section */}
      <div style={{ marginTop: '40px', padding: '22px 24px', background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: '12px', maxWidth: '520px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 400, color: TK.text, margin: '0 0 12px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {ar ? 'كيف يعمل' : 'How it works'}
        </h3>
        {[
          { step: '01', en: 'Click "Book via WhatsApp" for your preferred meeting type.', ar: 'انقر على "احجز عبر واتساب" لنوع الاجتماع المفضل لديك.' },
          { step: '02', en: 'Our team confirms availability and sends a calendar invite.', ar: 'يؤكد فريقنا التوفر ويرسل دعوة التقويم.' },
          { step: '03', en: 'Join via Google Meet, Zoom, or WhatsApp video — your choice.', ar: 'انضم عبر Google Meet أو Zoom أو واتساب فيديو — اختيارك.' },
        ].map(s => (
          <div key={s.step} style={{ display: 'flex', gap: '14px', marginBottom: '12px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: TK.accent, letterSpacing: '0.06em', minWidth: '20px', paddingTop: '1px' }}>{s.step}</span>
            <span style={{ fontSize: '12px', color: TK.textMuted, lineHeight: 1.6, fontWeight: 300 }}>{ar ? s.ar : s.en}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
