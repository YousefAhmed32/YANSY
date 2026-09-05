import { useCallback, useEffect, useState } from 'react';
import {
  MessageCircle,
  Mic,
  ArrowRight,
  CheckCircle2,
  Star,
  Clock,
  Code2,
  Shield,
  MessagesSquare,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../utils/api';
import SectionHeader from '../SectionHeader';
import Reveal from '../Reveal';
import VoiceNoteCard from './VoiceNoteCard';
import ChatProofCard from './ChatProofCard';
import ChatLightbox from './ChatLightbox';
import s from './ClientProof.module.css';

const CHAT_SCREENSHOTS = [
  '/assets/review/whatsapp-1.webp',
  '/assets/review/whatsapp-2.webp',
  '/assets/review/whatsapp-3.webp',
  '/assets/review/whatsapp-4.webp',
];

const VOICE_NOTES = [
  '/assets/review/recorde-1-r.mp3',
  '/assets/review/recorde-1.mp3',
  '/assets/review/recorde-2.mp3',
  '/assets/review/recorde-3.mp3',
];

/** Masonry height variation — alternating tall/short keeps the layout organic. */
const CARD_HEIGHTS = ['tall', 'short', 'short', 'tall'];

/**
 * Trust statistics shown above the proof content.
 * Each stat reinforces a different dimension of credibility.
 */
const TRUST_STATS = [
  { icon: CheckCircle2, iconStyle: 'trustIconAccent', valueAR: '50+', valueEN: '50+', labelAR: 'مشروع مُسلَّم', labelEN: 'Projects Delivered' },
  { icon: Star, iconStyle: 'trustIconGold', valueAR: '4.9 ★', valueEN: '4.9 ★', labelAR: 'متوسط التقييم', labelEN: 'Avg. Rating' },
  { icon: Code2, iconStyle: 'trustIconAccent', valueAR: '100%', valueEN: '100%', labelAR: 'ملكية الكود', labelEN: 'Code Ownership' },
  { icon: Clock, iconStyle: 'trustIconSuccess', valueAR: '<2 ساعة', valueEN: '<2h', labelAR: 'وقت الاستجابة', labelEN: 'Response Time' },
];

const STATIC_REVIEWS = [
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

const Stars = ({ count = 5 }) => (
  <div style={{ display: 'flex', gap: 2 }} aria-label={`${count} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} viewBox="0 0 20 20" width="12" height="12" fill={i < count ? '#F59E0B' : 'rgb(var(--border))'} aria-hidden>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const ReviewCard = ({ review, idx, isRTL }) => {
  const [bg, text] = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
  return (
    <figure className={s.reviewCard} style={{ textAlign: isRTL ? 'right' : 'left' }}>
      <div className={s.reviewHead} style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <Stars count={review.rating} />
        <span className={s.reviewTag}>{isRTL ? (review.projectTitleAR || review.projectTitle) : review.projectTitle}</span>
      </div>

      {/* Arabic takes «guillemets» — the straight ASCII pair reads as a Latin
          import mid-Arabic and confuses the bidi run at the boundary. */}
      <blockquote className={s.reviewQuote} style={{ fontStyle: isRTL ? 'normal' : 'italic' }}>
        {isRTL ? `«${review.reviewTextAR || review.reviewText}»` : `“${review.reviewText}”`}
      </blockquote>

      <figcaption className={s.reviewFooter} style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <div className={s.reviewAvatar} style={{ background: bg, color: text }} aria-hidden>{review.initials}</div>
        <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
          <div className={s.reviewName}>{review.name}</div>
          <div className={s.reviewRole}>{isRTL ? (review.roleAR || review.role) : review.role}</div>
        </div>
      </figcaption>
    </figure>
  );
};

/**
 * "Client Proof" — the site's full proof story, written and unscripted, in
 * one section instead of two. Previously two homepage sections in a row
 * ("Real clients. Proven results." then "Real clients. Raw reactions.") that
 * read as repetition rather than reinforcement — same claim, twice, back to
 * back. Now one header frames both: curated written reviews first, then the
 * actual WhatsApp screenshots and voice notes clients sent unprompted after
 * delivery — two forms of the same evidence, not two separate pitches.
 */
const ClientProof = ({ isRTL: isRTLProp, onStartProject }) => {
  const { isRTL: ctxRTL } = useLanguage();
  const isRTL = isRTLProp ?? ctxRTL;

  const [reviews, setReviews] = useState(STATIC_REVIEWS);
  const [playingId, setPlayingId] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    let alive = true;
    api.get('/testimonials').then((r) => {
      if (alive && r.data?.length > 0) setReviews(r.data);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const onPrev = useCallback(
    () => setLightboxIndex((i) => (i - 1 + CHAT_SCREENSHOTS.length) % CHAT_SCREENSHOTS.length),
    []
  );
  const onNext = useCallback(
    () => setLightboxIndex((i) => (i + 1) % CHAT_SCREENSHOTS.length),
    []
  );

  const clientLabel = isRTL ? 'عميل موثّق' : 'Verified Client';
  const chatTag = isRTL ? 'واتساب' : 'WhatsApp';
  const voiceTag = isRTL ? 'رسالة صوتية' : 'Voice Note';
  const shownReviews = reviews.slice(0, 6);

  return (
    <section
      id="client-proof"
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`section-shell section-shell--plain ${s.section}`}
      aria-label={isRTL ? 'إثبات ثقة العملاء' : 'Client Proof'}
    >
      <div className={s.sectionBg} aria-hidden />

      <div className={`section-inner ${s.inner}`}>

        {/* ── Header ── */}
        <SectionHeader
          align="center"
          icon={Shield}
          eyebrow={isRTL ? 'إثبات من العملاء' : 'Client Proof'}
          title={isRTL ? 'عملاء حقيقيون.\nبكلماتهم الخاصة.' : 'Real clients.\nIn their own words.'}
          lead={isRTL
            ? 'تقييمات مكتوبة، ثم الدليل غير المُجمَّل: رسائ..ل صوتية ومحادثات واتساب وصلتنا من عملائنا بعد إطلاق مشاريعهم فعلياً.'
            : "Written reviews, then the unscripted evidence — voice notes and WhatsApp messages clients sent us after their projects actually went live."}
          maxWidth={620}
        />

        {/* ── Trust Stats Bar ── */}
        <Reveal distance={14} className={s.trustBar} role="list" aria-label={isRTL ? 'إحصائيات الثقة' : 'Trust statistics'}>
          {TRUST_STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className={s.trustStat} role="listitem">
                <div className={s[stat.iconStyle]}>
                  <Icon style={{ width: 15, height: 15 }} aria-hidden />
                </div>
                <div>
                  <div className={s.trustValue}>{isRTL ? stat.valueAR : stat.valueEN}</div>
                  <div className={s.trustLabel}>{isRTL ? stat.labelAR : stat.labelEN}</div>
                </div>
              </div>
            );
          })}
        </Reveal>

        {/* ── Act 1: Written reviews ── */}
        <div className={s.reviewsBlock}>
          <div className={s.panelKicker}>
            <span className={s.kickerIconGreen}>
              <MessagesSquare style={{ width: 12, height: 12 }} aria-hidden />
            </span>
            {isRTL ? 'تقييمات مكتوبة' : 'Written Reviews'}
          </div>
          <Reveal stagger className={s.reviewsGrid} step={0.06} itemClassName={s.reviewSlot}>
            {shownReviews.map((review, i) => (
              <ReviewCard key={review._id} review={review} idx={i} isRTL={isRTL} />
            ))}
          </Reveal>
        </div>

        {/* ── Act 2: Unscripted evidence — voice notes + WhatsApp screenshots ── */}
        {/* <Reveal stagger className={s.showcaseGrid} step={0.14}>

          <div className={s.panel}>
            <div className={s.panelKicker}>
              <span className={s.kickerIconBlue}>
                <Mic style={{ width: 12, height: 12 }} aria-hidden />
              </span>
              {isRTL ? 'رسائل صوتية من عملائنا' : 'Voice Notes From Clients'}
            </div>
            <div className={s.voiceList}>
              {VOICE_NOTES.map((src, i) => (
                <VoiceNoteCard
                  key={src}
                  id={src}
                  src={src}
                  index={i}
                  label={clientLabel}
                  tag={voiceTag}
                  isRTL={isRTL}
                  playingId={playingId}
                  onPlayRequest={setPlayingId}
                />
              ))}
            </div>
          </div>

          <div className={s.panel}>
            <div className={s.panelKicker}>
              <span className={s.kickerIconGreen}>
                <MessageCircle style={{ width: 12, height: 12 }} aria-hidden />
              </span>
              {isRTL ? 'محادثات واتساب حقيقية' : 'Real WhatsApp Conversations'}
            </div>
            <div className={s.chatMasonry}>
              {CHAT_SCREENSHOTS.map((src, i) => (
                <div key={src} className={s.chatMasonryItem}>
                  <ChatProofCard
                    src={src}
                    index={i}
                    label={clientLabel}
                    tag={chatTag}
                    isRTL={isRTL}
                    onOpen={() => setLightboxIndex(i)}
                    variant={CARD_HEIGHTS[i]}
                  />
                </div>
              ))}
            </div>
          </div>

        </Reveal> */}

        {/* ── CTA ── */}
        <Reveal distance={14} className={s.ctaArea}>
          <div className={s.ctaInner}>
            <button
              className="btn-primary"
              onClick={onStartProject}
              aria-label={isRTL ? 'ابدأ مشروعك' : 'Start your project'}
              style={{ padding: '0.875rem 2rem', fontSize: '0.9375rem' }}
            >
              {isRTL ? 'ابدأ مشروعك' : 'Start Your Project'}
              <ArrowRight style={{ width: 16, height: 16, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
            </button>
            <span className={s.ctaSubtext}>
              <CheckCircle2 style={{ width: 13, height: 13, color: 'rgb(var(--success))' }} aria-hidden />
              {isRTL ? 'استشارة مجانية • رد خلال ساعتين' : 'Free consultation • Response within 2 hours'}
            </span>
          </div>
        </Reveal>

      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ChatLightbox
          images={CHAT_SCREENSHOTS}
          active={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={onPrev}
          onNext={onNext}
          isRTL={isRTL}
        />
      )}
    </section>
  );
};

export default ClientProof;
