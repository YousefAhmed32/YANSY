import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Minus, ArrowUpRight } from 'lucide-react';

const FAQS = [
  {
    id: 'timeline',
    questionEN: 'How long does a project take?',
    questionAR: 'كم يستغرق المشروع؟',
    answerEN: 'It depends on scope. A standard website takes 2–3 weeks. E-commerce or SaaS platforms run 4–8 weeks. Enterprise systems (ERP, CRM) range from 8–16 weeks. We give you a precise timeline after the free consultation.',
    answerAR: 'يعتمد على النطاق. موقع عادي: 2–3 أسابيع. تجارة إلكترونية أو SaaS: 4–8 أسابيع. أنظمة مؤسسية (ERP، CRM): 8–16 أسبوعاً. نعطيك جدولاً دقيقاً بعد الاستشارة المجانية.',
  },
  {
    id: 'payment',
    questionEN: 'Do I pay the full amount upfront?',
    questionAR: 'هل أدفع المبلغ كاملاً مقدماً؟',
    answerEN: 'No. We split payments into milestones: 30% to start, 40% at mid-delivery, and 30% on final delivery. You only pay when you see real progress.',
    answerAR: 'لا. نقسّم الدفعات على مراحل: 30٪ للبدء، 40٪ عند منتصف التسليم، و30٪ عند التسليم النهائي. تدفع فقط عندما ترى تقدماً حقيقياً.',
  },
  {
    id: 'difference',
    questionEN: 'What makes you different from freelancers or other agencies?',
    questionAR: 'ما الفرق بينكم وبين فريلانسر أو وكالة أخرى؟',
    answerEN: 'Freelancers lack structure and disappear. Generic agencies are slow and overpriced. YANSY gives you a dedicated senior team, transparent process, fixed timelines, and full code ownership — at a competitive price.',
    answerAR: 'الفريلانسر يفتقر للمنهجية وقد يختفي. الوكالات العادية بطيئة ومكلفة. YANSY تمنحك فريقاً متخصصاً بعملية واضحة ومواعيد ثابتة وملكية كاملة للكود — بسعر تنافسي.',
  },
  {
    id: 'ownership',
    questionEN: 'Do I own the code after delivery?',
    questionAR: 'هل أملك الكود بعد التسليم؟',
    answerEN: '100% yes. After final payment, all source code, assets, and IP transfer to you. No recurring fees, no lock-in. You own everything.',
    answerAR: '100٪ نعم. بعد الدفعة النهائية، كل الكود والملفات وحقوق الملكية تنتقل إليك. لا رسوم متكررة، لا قيود. كل شيء لك.',
  },
  {
    id: 'support',
    questionEN: 'What happens after the project is delivered?',
    questionAR: 'ماذا يحدث بعد تسليم المشروع؟',
    answerEN: 'We provide 30 days of free technical support post-launch — bug fixes, performance monitoring, and minor tweaks. After that, we offer affordable monthly maintenance or on-demand support.',
    answerAR: 'نقدم 30 يوماً من الدعم التقني المجاني بعد الإطلاق — إصلاح أخطاء ومراقبة أداء وتعديلات صغيرة. بعدها نوفر باقات صيانة شهرية أو دعماً عند الطلب.',
  },
  {
    id: 'consultation',
    questionEN: 'Is the consultation really free?',
    questionAR: 'هل الاستشارة مجانية فعلاً؟',
    answerEN: 'Yes, completely. No credit card, no obligation. A 30-minute call where we understand your project, answer all your questions, and give you an honest scope and timeline estimate.',
    answerAR: 'نعم، مجانية تماماً. لا بطاقة ائتمان، لا التزام. مكالمة 30 دقيقة نفهم فيها مشروعك ونجيب على جميع أسئلتك ونعطيك تقديراً صادقاً.',
  },
  {
    id: 'revisions',
    questionEN: 'How many revisions do I get?',
    questionAR: 'كم مرة يمكنني طلب تعديلات؟',
    answerEN: 'We include 3 revision rounds per milestone, covering design, content, and functionality. Major scope changes are discussed separately before any extra charge.',
    answerAR: 'نشمل 3 جولات تعديل لكل مرحلة تسليم تغطي التصميم والمحتوى والوظائف. التغييرات الجذرية تُناقش بشكل منفصل قبل أي رسوم إضافية.',
  },
  {
    id: 'tech',
    questionEN: 'What technologies do you use?',
    questionAR: 'ما التقنيات التي تستخدمونها؟',
    answerEN: 'Primarily React, Next.js, Node.js, and PostgreSQL/MongoDB. For enterprise systems we use microservices architecture. We choose the right stack for your specific project — not just the trendy one.',
    answerAR: 'بشكل أساسي React وNext.js وNode.js وPostgreSQL/MongoDB. للأنظمة المؤسسية نستخدم بنية الخدمات الصغيرة. نختار التقنية المناسبة لمشروعك تحديداً.',
  },
];

const FAQItem = ({ faq, isOpen, onToggle, isRTL, idx }) => (
  <div style={{ borderBottom: '1px solid #E8EBF0' }}>
    <button
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={`faq-${faq.id}`}
      id={`faq-btn-${faq.id}`}
      style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        gap: 'clamp(12px, 2vw, 20px)',
        padding: 'clamp(18px, 2.5vw, 24px) 0',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        direction: isRTL ? 'rtl' : 'ltr',
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
    >
      <span style={{
        fontSize: 10,
        fontWeight: 800,
        color: isOpen ? '#2563EB' : '#C9CDD6',
        letterSpacing: '0.06em',
        fontVariantNumeric: 'tabular-nums',
        transition: 'color 0.2s',
        minWidth: 24,
        textAlign: isRTL ? 'right' : 'left',
      }}>
        {String(idx + 1).padStart(2, '0')}
      </span>

      <h3 style={{
        margin: 0,
        fontSize: 'clamp(0.9375rem, 1.1vw, 1.0625rem)',
        fontWeight: 600,
        color: isOpen ? '#0D1117' : '#374151',
        letterSpacing: isRTL ? 0 : '-0.015em',
        fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
        lineHeight: 1.4,
        transition: 'color 0.2s',
        textAlign: isRTL ? 'right' : 'left',
      }}>
        {isRTL ? faq.questionAR : faq.questionEN}
      </h3>

      <span style={{
        flexShrink: 0,
        width: 28, height: 28,
        borderRadius: '50%',
        border: `1.5px solid ${isOpen ? '#0D1117' : '#E8EBF0'}`,
        background: isOpen ? '#0D1117' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.22s ease',
        color: isOpen ? '#FFFFFF' : '#9BA3AE',
      }} aria-hidden>
        {isOpen
          ? <Minus style={{ width: 12, height: 12 }} />
          : <Plus  style={{ width: 12, height: 12 }} />
        }
      </span>
    </button>

    <div
      id={`faq-${faq.id}`}
      role="region"
      aria-labelledby={`faq-btn-${faq.id}`}
      style={{
        overflow: 'hidden',
        maxHeight: isOpen ? '400px' : '0px',
        transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <p style={{
        margin: '0 0 clamp(18px, 2.5vw, 26px)',
        fontSize: 'clamp(0.875rem, 1vw, 1rem)',
        color: '#5C6370',
        lineHeight: 1.8,
        fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
        paddingInlineStart: 'clamp(36px, 5vw, 44px)',
        textAlign: isRTL ? 'right' : 'left',
      }}>
        {isRTL ? faq.answerAR : faq.answerEN}
      </p>
    </div>
  </div>
);

const FAQ = ({ onStartProject }) => {
  const { isRTL } = useLanguage();
  const [open, setOpen] = useState(null);

  return (
    <section
      id="faq"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        background: '#FAFAFA',
        paddingTop:    'clamp(5rem, 10vw, 8rem)',
        paddingBottom: 'clamp(5rem, 10vw, 8rem)',
        paddingLeft:   'clamp(1.25rem, 5vw, 3rem)',
        paddingRight:  'clamp(1.25rem, 5vw, 3rem)',
        borderTop: '1px solid #E8EBF0',
      }}
    >
      <style>{`
        .faq-layout {
          display: grid;
          grid-template-columns: 5fr 7fr;
          gap: clamp(3rem, 7vw, 8rem);
          align-items: start;
        }
        @media (max-width: 900px) {
          .faq-layout { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div className="faq-layout">

          {/* Left: header — sticky on desktop */}
          <div style={{ textAlign: isRTL ? 'right' : 'left', position: 'sticky', top: 80 }}>
            <span className="section-label" style={{ marginBottom: 20, display: 'inline-block' }}>
              {isRTL ? 'الأسئلة الشائعة' : 'FAQ'}
            </span>
            <h2 style={{
              fontSize: 'var(--text-5xl)',
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: isRTL ? 0 : '-0.035em',
              color: '#0D1117',
              margin: '0 0 clamp(1rem, 2vw, 1.5rem)',
              fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
            }}>
              {isRTL ? 'كل ما تريد\nمعرفته.' : 'Everything\nyou need\nto know.'}
            </h2>
            <p style={{
              fontSize: 'clamp(0.9375rem, 1.1vw, 1.0625rem)',
              color: '#5C6370',
              lineHeight: 1.75,
              margin: '0 0 clamp(1.75rem, 3.5vw, 2.5rem)',
              fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
            }}>
              {isRTL
                ? 'إذا لم تجد إجابتك هنا، استشارتنا المجانية متاحة دائماً.'
                : "Can't find your answer here? Our free consultation is always available."}
            </p>
            <button
              onClick={onStartProject}
              className="btn-primary"
              style={{ fontSize: '13.5px', padding: '13px 26px' }}
            >
              {isRTL ? 'احجز استشارة مجانية' : 'Book Free Consultation'}
              <ArrowUpRight style={{ width: 15, height: 15, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
            </button>

            {/* Trust note */}
            <div style={{
              marginTop: 'clamp(2rem, 4vw, 3rem)',
              padding: 'clamp(16px, 2vw, 22px)',
              background: '#FAFAFA',
              border: '1px solid #E8EBF0',
              borderRadius: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse-dot 2s ease-in-out infinite' }} aria-hidden />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {isRTL ? 'نقبل مشاريع جديدة' : 'Accepting new projects'}
                </span>
              </div>
              <p style={{ fontSize: 12.5, color: '#5C6370', margin: 0, lineHeight: 1.6, textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL
                  ? 'استشارة مجانية · رد خلال ساعتين · لا التزام'
                  : 'Free consultation · Reply within 2h · No commitment'}
              </p>
            </div>
          </div>

          {/* Right: FAQ items */}
          <div>
            {FAQS.map((faq, i) => (
              <FAQItem
                key={faq.id}
                faq={faq}
                idx={i}
                isOpen={open === faq.id}
                onToggle={() => setOpen(open === faq.id ? null : faq.id)}
                isRTL={isRTL}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default FAQ;
