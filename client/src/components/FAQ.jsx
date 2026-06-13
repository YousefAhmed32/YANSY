import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Clock, CreditCard, Zap, Edit3, Key, Shield, Phone, Wrench } from 'lucide-react';

/* ── Icon map for FAQ items ── */
const FAQ_ICONS = {
  timeline    : Clock,
  payment     : CreditCard,
  difference  : Zap,
  revisions   : Edit3,
  ownership   : Key,
  support     : Shield,
  consultation: Phone,
  tech        : Wrench,
};

const faqs = [
  {
    id: 'timeline', icon: '⏱️',
    questionEN: 'How long does a project take?',
    questionAR: 'كم يستغرق المشروع؟',
    answerEN: 'It depends on scope. A standard website or landing page takes 2–3 weeks. E-commerce or SaaS platforms typically run 4–8 weeks. Enterprise systems (ERP, CRM, medical) range from 8–16 weeks. We give you a precise timeline after the free consultation.',
    answerAR: 'يعتمد على حجم المشروع. موقع عادي أو صفحة هبوط: 2–3 أسابيع. منصة تجارة إلكترونية أو SaaS: 4–8 أسابيع. أنظمة مؤسسية (ERP، CRM، طبية): 8–16 أسبوعاً. نعطيك جدولاً زمنياً دقيقاً بعد الاستشارة المجانية.',
  },
  {
    id: 'payment', icon: '💳',
    questionEN: 'Do I pay the full amount upfront?',
    questionAR: 'هل أدفع المبلغ كاملاً مقدماً؟',
    answerEN: 'No. We split payments into milestones: 30% to start, 40% at mid-delivery, and 30% on final delivery. You only pay when you see progress.',
    answerAR: 'لا. نقسّم الدفعات على مراحل: 30٪ للبدء، 40٪ عند منتصف التسليم، و30٪ عند التسليم النهائي. تدفع فقط عندما ترى تقدماً فعلياً.',
  },
  {
    id: 'difference', icon: '⚡',
    questionEN: 'What makes you different from a freelancer or agency?',
    questionAR: 'ما الفرق بينكم وبين فريلانسر أو وكالة عادية؟',
    answerEN: 'Freelancers lack structure and disappear. Generic agencies are slow and expensive. YANSY gives you a dedicated senior team with a transparent process, fixed timelines, and full ownership of your product — at a competitive price.',
    answerAR: 'الفريلانسر يفتقر للمنهجية وقد يختفي. الوكالات العادية بطيئة ومكلفة. YANSY تمنحك فريقاً متخصصاً بعملية واضحة، مواعيد محددة، وملكية كاملة لمنتجك — بسعر تنافسي.',
  },
  {
    id: 'revisions', icon: '✏️',
    questionEN: 'How many revisions do I get?',
    questionAR: 'كم مرة يمكنني طلب تعديلات؟',
    answerEN: 'We include 3 revision rounds per milestone. This covers design, content, and functionality changes. Major scope changes are handled separately, but we always discuss and agree before any extra charge.',
    answerAR: 'نشمل 3 جولات تعديل لكل مرحلة تسليم. تغطي تعديلات التصميم والمحتوى والوظائف. التغييرات الجذرية في النطاق تُناقش بشكل منفصل، ونتفق دائماً قبل أي رسوم إضافية.',
  },
  {
    id: 'ownership', icon: '🔑',
    questionEN: 'Do I own the code after delivery?',
    questionAR: 'هل أملك الكود بعد التسليم؟',
    answerEN: '100% yes. After final payment, all source code, assets, and intellectual property transfer to you. No recurring fees, no lock-in. You own everything.',
    answerAR: '100٪ نعم. بعد الدفعة النهائية، كل الكود والملفات وحقوق الملكية الفكرية تنتقل إليك. لا رسوم متكررة، لا قيود. كل شيء لك.',
  },
  {
    id: 'support', icon: '🛡️',
    questionEN: 'What happens after the project is delivered?',
    questionAR: 'ماذا يحدث بعد تسليم المشروع؟',
    answerEN: 'We provide 30 days of free technical support post-launch — bug fixes, performance monitoring, and minor tweaks. After that, we offer affordable monthly maintenance packages or on-demand support.',
    answerAR: 'نقدم 30 يوماً من الدعم التقني المجاني بعد الإطلاق — إصلاح الأخطاء، مراقبة الأداء، والتعديلات الصغيرة. بعدها نوفر باقات صيانة شهرية بأسعار مناسبة أو دعم عند الطلب.',
  },
  {
    id: 'consultation', icon: '📞',
    questionEN: 'Is the consultation really free?',
    questionAR: 'هل الاستشارة مجانية فعلاً؟',
    answerEN: 'Yes, completely. No credit card, no obligation. A 30-minute call where we understand your project, answer all your questions, and give you an honest scope and timeline estimate.',
    answerAR: 'نعم، مجانية تماماً. لا بطاقة ائتمان، لا التزام. مكالمة 30 دقيقة نفهم فيها مشروعك، نجيب على جميع أسئلتك، ونعطيك تقديراً صادقاً للنطاق والجدول الزمني.',
  },
  {
    id: 'tech', icon: '🛠️',
    questionEN: 'What technologies do you use?',
    questionAR: 'ما التقنيات التي تستخدمونها؟',
    answerEN: 'We build primarily with React, Next.js, Node.js, and PostgreSQL/MongoDB. For enterprise systems we use microservices architecture. We choose the right stack for your specific project — not the trendy one.',
    answerAR: 'نبني بشكل أساسي بـ React و Next.js و Node.js و PostgreSQL/MongoDB. للأنظمة المؤسسية نستخدم بنية الخدمات الصغيرة. نختار التقنية المناسبة لمشروعك تحديداً — لا التقنية الرائجة.',
  },
];

const FAQItem = ({ faq, isOpen, onToggle, isRTL, onStartProject }) => (
  <div
    className="border-t border-white/[0.06] last:border-b transition-colors duration-500"
    style={{ borderColor: isOpen ? 'rgba(212,175,55,0.15)' : undefined }}
  >
    <button
      className={`w-full flex items-center gap-5 py-6 sm:py-8 transition-all duration-300 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
      onClick={onToggle}
    >
      {(() => {
        const Icon = FAQ_ICONS[faq.id];
        return Icon ? (
          <span
            className="flex-shrink-0 transition-all duration-500 w-5 h-5"
            style={{
              color    : isOpen ? '#d4af37' : 'rgba(255,255,255,0.28)',
              transform: isOpen ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
          </span>
        ) : (
          <span
            className="text-xl flex-shrink-0 transition-all duration-500"
            style={{
              filter   : isOpen ? 'none' : 'grayscale(100%) opacity(0.35)',
              transform: isOpen ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            {faq.icon}
          </span>
        );
      })()}

      <h3
        className={`flex-1 font-semibold transition-all duration-300 text-base sm:text-xl lg:text-2xl ${isRTL ? '' : 'tracking-tight'}`}
        style={{
          letterSpacing: isRTL ? '0' : '-0.015em',
          lineHeight   : isRTL ? 1.45 : 1.25,
          color: isOpen ? '#d4af37' : 'rgba(255,255,255,0.88)',
        }}
      >
        {isRTL ? faq.questionAR : faq.questionEN}
      </h3>

      <div
        className="flex-shrink-0 w-7 h-7 border flex items-center justify-center transition-all duration-500"
        style={{
          borderColor: isOpen ? '#d4af37' : 'rgba(255,255,255,0.1)',
          backgroundColor: isOpen ? 'rgba(212,175,55,0.08)' : 'transparent',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
      >
        <svg className="w-3 h-3" fill="none" stroke={isOpen ? '#d4af37' : 'rgba(255,255,255,0.35)'} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      </div>
    </button>

    <div
      className="overflow-hidden transition-all duration-700 ease-in-out"
      style={{ maxHeight: isOpen ? '400px' : '0px' }}
    >
      <div className={`pb-8 sm:pb-10 ${isRTL ? 'pr-10 sm:pr-12' : 'pl-10 sm:pl-12'}`}>
        <p
          className="text-base sm:text-lg font-normal text-white/65 leading-relaxed mb-6"
          style={{
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s 0.15s, transform 0.4s 0.15s',
          }}
        >
          {isRTL ? faq.answerAR : faq.answerEN}
        </p>

        {faq.id === 'consultation' && (
          <button
            onClick={onStartProject}
            className="group/btn relative inline-flex items-center gap-3 px-6 py-3 border text-xs font-light tracking-widest uppercase"
            style={{
              borderColor: 'rgba(212,175,55,0.35)',
              color: '#d4af37',
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.4s 0.25s, transform 0.4s 0.25s, background-color 0.3s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(212,175,55,0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {isRTL ? 'احجز استشارتك المجانية' : 'Book Your Free Consultation'}
            <svg
              className={`w-3 h-3 transition-transform duration-300 ${isRTL ? 'rotate-180 group-hover/btn:-translate-x-1' : 'group-hover/btn:translate-x-1'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  </div>
);

const FAQ = ({ onStartProject }) => {
  const { isRTL } = useLanguage();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <section id="faq" className="relative py-24 sm:py-40 px-4 sm:px-6 md:px-8 bg-black overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, #d4af37 0%, transparent 65%)', opacity: 0.018, filter: 'blur(60px)' }}
      />

<div className={`max-w-7xl mx-auto relative z-10 ${isRTL ? 'text-right' : 'text-left'}`}>


        <div className={`flex items-center gap-4 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className={`block w-12 h-px ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#d4af37] to-transparent`} aria-hidden />
          <p className="text-xs tracking-[0.35em] text-[#d4af37]/60 uppercase">
            {isRTL ? 'أسئلة شائعة' : 'FAQ'}
          </p>
        </div>

        <h2
          className={`text-3xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] mb-6 ${isRTL ? '' : 'tracking-tight'}`}
          style={{ letterSpacing: isRTL ? '0' : '-0.025em' }}
        >
          {isRTL ? 'الأسئلة التي' : 'The questions every'}
          <br />
          <span className={`text-transparent bg-clip-text ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#d4af37] to-white/80`}>
            {isRTL ? 'يسألها كل عميل ذكي.' : 'smart client asks.'}
          </span>
        </h2>

        <p className="text-base sm:text-lg text-white/65 max-w-xl mb-16 sm:mb-24 leading-relaxed">
          {isRTL
            ? 'الأسئلة الأكثر شيوعاً من عملائنا — إجابات صريحة بدون تعقيد.'
            : 'The most common questions from our clients — straightforward answers, no fluff.'}
        </p>

        <div>
          {faqs.map((faq) => (
            <FAQItem
              key={faq.id}
              faq={faq}
              isOpen={openFaq === faq.id}
              onToggle={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
              isRTL={isRTL}
              onStartProject={onStartProject}
            />
          ))}
        </div>

        <div className="mt-16 sm:mt-24 pt-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-white/30 text-sm font-light max-w-sm text-center sm:text-start leading-relaxed">
            {isRTL ? 'سؤالك مش موجود هنا؟ تواصل معنا مباشرة.' : "Still have a question? Reach out directly."}
          </p>
          <button
            onClick={onStartProject}
            className="group relative inline-flex items-center gap-3 px-10 py-4 border-2 border-[#d4af37] text-[#d4af37] text-xs font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500 active:scale-95 overflow-hidden flex-shrink-0"
          >
            <span className={`absolute inset-0 transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent ${isRTL ? 'translate-x-full group-hover:-translate-x-full' : '-translate-x-full group-hover:translate-x-full'}`} />
            <span className="relative">{isRTL ? 'تحدث معنا' : 'Talk to Us'}</span>
            <svg
              className={`relative w-3 h-3 transition-transform duration-300 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

      </div>
    </section>
  );
};

export default FAQ;