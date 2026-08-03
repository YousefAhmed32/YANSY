import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import SectionHeader from './SectionHeader';
import Reveal from './Reveal';
import ImagePlaceholder from './ImagePlaceholder';

const STATIC = [
  {
    _id: 'st1', initials: 'AR',
    name: 'Ahmed Al-Rashidi', role: 'Founder, NexusCommerce', roleAR: 'المؤسس، NexusCommerce',
    projectTitle: 'E-commerce Platform', projectTitleAR: 'منصة تجارة إلكترونية',
    reviewText: 'YANSY built our entire online store from scratch in 3 weeks. Sales increased 40% in the first 90 days. Their attention to performance and UX was remarkable — no other vendor came close.',
    reviewTextAR: 'YANSY بنوا متجرنا الإلكتروني بالكامل من الصفر في 3 أسابيع. المبيعات زادت 40٪ في أول 90 يوماً. اهتمامهم بالأداء وتجربة المستخدم كان استثنائياً — لا أحد اقترب من مستواهم.',
    rating: 5,
  },
  {
    _id: 'st2', initials: 'SM',
    name: 'Sarah Mohamed', role: 'Director, MedCare Clinics', roleAR: 'مديرة، عيادات MedCare',
    projectTitle: 'Medical Booking System', projectTitleAR: 'نظام حجز طبي',
    reviewText: 'Outstanding delivery. A complete clinic management system, on time and within budget. No-shows dropped by 80% after launch. Communication throughout was proactive, never reactive.',
    reviewTextAR: 'تسليم استثنائي. نظام كامل لإدارة العيادة، في الموعد وضمن الميزانية. الغيابات انخفضت 80٪ بعد الإطلاق. التواصل طوال المشروع كان استباقياً، لا رد فعل فقط.',
    rating: 5,
  },
  {
    _id: 'st3', initials: 'KA',
    name: 'Khalid Al-Thani', role: 'CTO, Vault Analytics', roleAR: 'المدير التقني، Vault Analytics',
    projectTitle: 'SaaS Dashboard', projectTitleAR: 'لوحة تحكم SaaS',
    reviewText: 'They transformed our complex data pipeline into a beautiful, usable dashboard. Our non-technical leadership team actually uses it now — which was the entire goal. Exceptional work.',
    reviewTextAR: 'حوّلوا بيانات معقدة إلى لوحة تحكم جميلة وسهلة الاستخدام. فريق الإدارة غير التقني يستخدمها فعلياً الآن — وهذا كان الهدف بالضبط. عمل استثنائي.',
    rating: 5,
  },
  {
    _id: 'st4', initials: 'LI',
    name: 'Layla Ibrahim', role: 'CEO, AcademyEdge', roleAR: 'الرئيس التنفيذي، AcademyEdge',
    projectTitle: 'Educational Platform', projectTitleAR: 'منصة تعليمية',
    reviewText: 'We launched our online academy with YANSY and student enrollment doubled within the first month. The platform saved us thousands in recurring SaaS fees. Worth every dirham.',
    reviewTextAR: 'أطلقنا أكاديميتنا الإلكترونية مع YANSY وتضاعف عدد الطلاب المسجلين خلال أول شهر. المنصة وفّرت علينا آلاف الجنيهات من رسوم الاشتراك الشهرية. تستحق كل جنيه.',
    rating: 5,
  },
  {
    _id: 'st5', initials: 'OF',
    name: 'Omar Faris', role: 'VP Sales, GrowthCRM', roleAR: 'نائب المبيعات، GrowthCRM',
    projectTitle: 'CRM System', projectTitleAR: 'نظام CRM',
    reviewText: 'The CRM YANSY built completely changed how we manage clients. Follow-ups are automated, response times improved dramatically. ROI was visible within 60 days of launch.',
    reviewTextAR: 'نظام CRM الذي بنته YANSY غيّر بالكامل طريقة إدارتنا للعملاء. المتابعات أصبحت آلية، وأوقات الاستجابة تحسّنت بشكل كبير. العائد على الاستثمار ظهر خلال 60 يوماً من الإطلاق.',
    rating: 5,
  },
  {
    _id: 'st6', initials: 'NS',
    name: 'Nora Al-Sayed', role: 'Brand Director', roleAR: 'مديرة العلامة التجارية',
    projectTitle: 'Corporate Website', projectTitleAR: 'موقع شركة',
    reviewText: 'From concept to launch in three weeks. The design is stunning, performance is exceptional. Multiple clients mentioned the website before even asking about our services.',
    reviewTextAR: 'من الفكرة إلى الإطلاق في ثلاثة أسابيع. التصميم مذهل والأداء استثنائي. عملاء كثيرون ذكروا الموقع قبل حتى أن يسألوا عن خدماتنا.',
    rating: 5,
  },
];

const AVATAR_PALETTE = [
  ['rgb(var(--accent-muted))', 'rgb(var(--accent-hover))'],
  ['#D1FAE5', '#059669'],
  ['#EDE9FE', '#6D28D9'],
  ['#FEF3C7', '#B45309'],
  ['#FCE7F3', '#BE185D'],
  ['#F0FDF4', '#16a34a'],
];

const Avatar = ({ initials = '?', idx = 0 }) => {
  const [bg, text] = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
  return (
    <div
      style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: bg, color: text,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700,
      }}
      aria-hidden
    >
      {initials}
    </div>
  );
};

const Stars = ({ count = 5 }) => (
  <div style={{ display: 'flex', gap: 2 }} aria-label={`${count} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} viewBox="0 0 20 20" width="12" height="12" fill={i < count ? '#F59E0B' : 'rgb(var(--border))'} aria-hidden>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const TestimonialCard = ({ t, idx }) => {
  const { isRTL } = useLanguage();

  return (
    <figure
      className="testimonial-card"
      style={{ textAlign: isRTL ? 'right' : 'left' }}
    >
      {/* Stars + project tag */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexDirection: isRTL ? 'row-reverse' : 'row',
      }}>
        <Stars count={t.rating} />
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'rgb(var(--accent))',
          background: 'rgb(var(--accent-light))', border: '1px solid rgb(var(--accent-muted))',
          padding: '3px 9px', borderRadius: '100px',
          whiteSpace: 'nowrap',
        }}>
          {isRTL ? (t.projectTitleAR || t.projectTitle) : t.projectTitle}
        </span>
      </div>

      {/* Quote. Arabic takes «guillemets» — the straight ASCII pair reads as a
          Latin import mid-Arabic and confuses the bidi run at the boundary. */}
      <blockquote style={{
        fontSize: 'clamp(0.875rem, 1vw, 0.9375rem)',
        lineHeight: isRTL ? 1.9 : 1.75,
        color: 'rgb(var(--text-secondary))',
        margin: 0,
        flex: 1,
        fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter', system-ui, sans-serif",
        fontStyle: isRTL ? 'normal' : 'italic',
      }}>
        {isRTL
          ? `«${t.reviewTextAR || t.reviewText}»`
          : `“${t.reviewText}”`}
      </blockquote>

      {/* Author */}
      <figcaption style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        paddingTop: 16,
        borderTop: '1px solid rgb(var(--border-light))',
        flexDirection: isRTL ? 'row-reverse' : 'row',
      }}>
        <Avatar initials={t.initials} idx={idx} />
        <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'rgb(var(--text-primary))', marginBottom: 2 }}>
            {t.name}
          </div>
          <div style={{ fontSize: 12, color: 'rgb(var(--text-tertiary))', lineHeight: 1.3 }}>
            {isRTL ? (t.roleAR || t.role) : t.role}
          </div>
        </div>
      </figcaption>
    </figure>
  );
};

const Testimonials = ({ isRTL: isRTLProp }) => {
  const { isRTL: ctxRTL } = useLanguage();
  const rtl = isRTLProp ?? ctxRTL;
  const [list, setList] = useState(STATIC);

  useEffect(() => {
    let alive = true;
    api.get('/testimonials').then(r => {
      if (alive && r.data?.length > 0) setList(r.data);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const shown = list.slice(0, 6);

  return (
    <section id="testimonials" dir={rtl ? 'rtl' : 'ltr'} className="section-shell section-shell--tint">
      <style>{`
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(12px, 1.5vw, 18px);
        }
        @media (max-width: 1024px) { .testimonials-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px)  { .testimonials-grid { grid-template-columns: 1fr; } }
        /* The reveal wrapper is the grid item, so it — not the card — is what
           the row stretches; without this the cards stop being equal-height. */
        .testimonial-slot { height: 100%; }

        /* Hover lives in CSS, on the card itself. It used to be inline
           mouseenter/mouseleave handlers on the same node that carried the
           reveal transition — so a card with a 0.32s reveal delay sat still for
           320ms before lifting, and any re-render (a language switch, say)
           wiped the hover styles the handlers had written. */
        .testimonial-card {
          background: rgb(var(--bg-elevated));
          border: 1px solid rgb(var(--border));
          border-radius: 16px;
          padding: clamp(22px, 2.5vw, 32px);
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
          box-sizing: border-box;
          margin: 0;
          transition: box-shadow 0.28s cubic-bezier(0.16,1,0.3,1),
                      border-color 0.22s ease,
                      transform 0.28s cubic-bezier(0.16,1,0.3,1);
        }
        .testimonial-card:hover {
          box-shadow: 0 12px 36px rgba(0,0,0,0.08);
          border-color: rgb(var(--border-strong));
          transform: translateY(-3px);
        }
      `}</style>

      <div className="section-inner">
        <SectionHeader
          eyebrow={rtl ? 'قصص العملاء' : 'Client Stories'}
          title={rtl ? 'عملاء حقيقيون.\nنتائج مثبتة.' : 'Real clients.\nProven results.'}
          lead={rtl
            ? 'شهادات من عملاء عملنا معهم فعليًا على مشاريعهم.'
            : "Testimonials from clients we've actually delivered projects for."}
          maxLeadWidth={380}
          action={
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              flexDirection: rtl ? 'row-reverse' : 'row',
            }}>
              <Stars count={5} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgb(var(--text-secondary))' }}>
                {rtl ? '4.9/5 متوسط التقييم' : '4.9/5 average rating'}
              </span>
            </div>
          }
        />

        <div className="relative w-full aspect-[21/6] max-h-[220px] rounded-2xl overflow-hidden border border-[rgb(var(--border))] mb-8 shadow-md group">
          <img
            src="/placeholders/testimonials-3d.jpg"
            alt={rtl ? 'عملاء حقيقيون ونتائج مثبتة - يانسي تك' : 'Real clients and proven results - YANSY TECH'}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 pointer-events-none" />
        </div>

        <Reveal stagger className="testimonials-grid" step={0.06} itemClassName="testimonial-slot">
          {shown.map((t, i) => (
            <TestimonialCard key={t._id} t={t} idx={i} />
          ))}
        </Reveal>
      </div>
    </section>
  );
};

export default Testimonials;
