import { useCallback, useState } from 'react';
import { MessageCircle, Mic } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import SectionHeader from '../SectionHeader';
import Reveal from '../Reveal';
import VoiceNoteCard from './VoiceNoteCard';
import ChatProofCard from './ChatProofCard';
import ChatLightbox from './ChatLightbox';

const CHAT_SCREENSHOTS = [
  '/assets/review/whatsapp-1.png',
  '/assets/review/whatsapp-2.png',
  '/assets/review/whatsapp-3.png',
  '/assets/review/whatsapp-4.png',
];

const VOICE_NOTES = [
  '/assets/review/recorde-1.mp3',
  '/assets/review/recorde-2.wav',
  '/assets/review/recorde-3.mp3',
];

/**
 * "Client Voices" — the site's unscripted proof section. Sits directly after
 * the written Testimonials on the homepage: those are curated quotes, this is
 * the raw material behind them — actual WhatsApp screenshots and voice notes
 * clients sent unprompted. No names are attached (real recordings/screenshots,
 * not the placeholder testimonial set), so every card carries the same
 * generic "Verified Client" attribution rather than an invented identity.
 */
const ClientVoices = ({ isRTL: isRTLProp }) => {
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
    <section id="client-voices" dir={isRTL ? 'rtl' : 'ltr'} className="section-shell section-shell--plain">
      <style>{`
        .rp-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: clamp(18px, 2.5vw, 28px);
          align-items: stretch;
        }
        @media (max-width: 900px) {
          .rp-grid { grid-template-columns: 1fr; }
        }
        .rp-panel {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: clamp(18px, 2.5vw, 28px);
          display: flex;
          flex-direction: column;
        }
        .rp-kicker {
          display: flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--text-tertiary);
          margin-bottom: 16px;
        }
        [dir="rtl"] .rp-kicker { letter-spacing: 0; text-transform: none; }
        .rp-chat-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .rp-voice-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 12px;
        }
        @media (max-width: 900px) {
          .rp-voice-list { justify-content: flex-start; }
        }
      `}</style>

      <div className="section-inner">
        <SectionHeader
          eyebrow={isRTL ? 'مباشرة من واتساب' : 'Straight From WhatsApp'}
          title={isRTL ? 'عملاء حقيقيون.\nردود فعل بدون تجميل.' : 'Real clients.\nRaw reactions.'}
          lead={isRTL
            ? 'بدون سيناريو ولا صياغة تسويقية — مجرد رسائل صوتية ومحادثات واتساب وصلتنا من عملائنا بعد إطلاق مشاريعهم.'
            : 'No scripts, no marketing polish — just voice notes and WhatsApp messages clients sent us after their projects went live.'}
          maxLeadWidth={400}
        />

        <Reveal stagger className="rp-grid" step={0.12}>
          {/* Real conversations */}
          <div className="rp-panel">
            <span className="rp-kicker">
              <MessageCircle style={{ width: 13, height: 13 }} aria-hidden />
              {isRTL ? 'محادثات حقيقية' : 'Real Conversations'}
            </span>
            <div className="rp-chat-grid">
              {CHAT_SCREENSHOTS.map((src, i) => (
                <ChatProofCard
                  key={src}
                  src={src}
                  index={i}
                  label={clientLabel}
                  tag={chatTag}
                  isRTL={isRTL}
                  onOpen={() => setLightboxIndex(i)}
                />
              ))}
            </div>
          </div>

          {/* Voice notes */}
          <div className="rp-panel">
            <span className="rp-kicker">
              <Mic style={{ width: 13, height: 13 }} aria-hidden />
              {isRTL ? 'رسائل صوتية' : 'Voice Notes'}
            </span>
            <div className="rp-voice-list">
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
        </Reveal>
      </div>

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
