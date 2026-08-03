import { useCallback, useState } from 'react';
import {
  MessageCircle,
  Mic,
  ArrowRight,
  CheckCircle2,
  Star,
  Clock,
  Code2,
  Shield,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import Reveal from '../Reveal';
import VoiceNoteCard from './VoiceNoteCard';
import ChatProofCard from './ChatProofCard';
import ChatLightbox from './ChatLightbox';
import s from './ClientVoices.module.css';

const CHAT_SCREENSHOTS = [
  '/assets/review/whatsapp-1.png',
  '/assets/review/whatsapp-2.png',
  '/assets/review/whatsapp-3.png',
  '/assets/review/whatsapp-4.png',
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

/**
 * "Client Voices" — the site's unscripted proof section. Sits directly after
 * the written Testimonials on the homepage. These are actual WhatsApp screenshots
 * and voice notes clients sent unprompted after project delivery.
 *
 * Redesigned with a narrative-flow layout: header → trust stats → premium
 * CGI illustration → two-column voice + chat showcase → strong CTA.
 */
const ClientVoices = ({ isRTL: isRTLProp, onStartProject }) => {
  const { isRTL: ctxRTL } = useLanguage();
  const isRTL = isRTLProp ?? ctxRTL;

  const [playingId, setPlayingId] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

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

  return (
    <section
      id="client-voices"
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`section-shell section-shell--plain ${s.section}`}
      aria-label={isRTL ? 'أصوات العملاء' : 'Client Voices'}
    >
      <div className={s.sectionBg} aria-hidden />

      <div className={`section-inner ${s.inner}`}>

        {/* ── ① Header ── */}
        <Reveal distance={18}>
          <div className={s.headerArea}>
            <span className={s.eyebrow}>
              <Shield style={{ width: 11, height: 11 }} aria-hidden />
              {isRTL ? 'مباشرة من واتساب' : 'Straight From WhatsApp'}
            </span>
            <h2 className={s.title}>
              {isRTL
                ? 'عملاء حقيقيون.\nردود فعل بدون تجميل.'
                : 'Real clients.\nRaw reactions.'}
            </h2>
            <p className={s.lead}>
              {isRTL
                ? 'بدون سيناريو ولا صياغة تسويقية — مجرد رسائل صوتية ومحادثات واتساب وصلتنا من عملائنا بعد إطلاق مشاريعهم.'
                : 'No scripts, no marketing polish — just voice notes and WhatsApp messages clients sent us after their projects went live.'}
            </p>
          </div>
        </Reveal>

        {/* ── ② Trust Stats Bar ── */}
        <Reveal distance={14}>
          <div className={s.trustBar} role="list" aria-label={isRTL ? 'إحصائيات الثقة' : 'Trust statistics'}>
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
          </div>
        </Reveal>

        {/* ── ③ Illustration ── */}
        {/* <Reveal distance={24}>
          <div className={s.illustrationWrap}>
            <img
              src="/assets/image/trust-hero-illustration.jpg"
              alt={isRTL ? 'تواصل واتساب مع العملاء' : 'WhatsApp client communication'}
              loading="lazy"
              decoding="async"
              className={s.illustration}
              width={480}
              height={640}
            />
          </div>
        </Reveal> */}

        {/* ── ④ Two-Column Showcase ── */}
        <Reveal stagger className={s.showcaseGrid} step={0.14}>

          {/* Voice Notes Column */}
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

          {/* WhatsApp Screenshots Column */}
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

        </Reveal>

        {/* ── ⑤ CTA ── */}
        <Reveal distance={14}>
          <div className={s.ctaArea}>
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

export default ClientVoices;
