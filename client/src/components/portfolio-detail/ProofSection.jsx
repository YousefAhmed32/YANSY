import { useCallback, useState } from 'react';
import { Award } from 'lucide-react';
import Reveal from '../Reveal';
import VoiceNoteCard from '../reviews/VoiceNoteCard';
import ChatProofCard from '../reviews/ChatProofCard';
import ChatLightbox from '../reviews/ChatLightbox';
import { mediaSrc } from '../../utils/media';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

/**
 * Raw evidence, one step harder than the written testimonial above it: a
 * voice-note testimonial (if the client sent one) and WhatsApp/chat proof
 * screenshots, using the exact same player/lightbox components built for the
 * homepage's "Client Voices" section — same interaction, same accessibility
 * work, no reimplementation. Awards ride along in the same section since
 * they're the same kind of thing: third-party proof, not agency copy.
 */
const ProofSection = ({ project, isRTL }) => {
  const font = isRTL ? FONT_AR : FONT_EN;
  const [playingId, setPlayingId] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const audioSrc = mediaSrc(project.testimonial?.audio);
  const screenshots = (project.proofScreenshots || []).filter((a) => a?.url);
  const awards = project.awards || [];

  const onPrev = useCallback(() => setLightboxIndex((i) => (i - 1 + screenshots.length) % screenshots.length), [screenshots.length]);
  const onNext = useCallback(() => setLightboxIndex((i) => (i + 1) % screenshots.length), [screenshots.length]);

  if (!audioSrc && !screenshots.length && !awards.length) return null;

  const clientLabel = isRTL ? 'العميل' : 'Client';

  return (
    <section className="section-shell section-shell--plain" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner" style={{ maxWidth: 1040 }}>
        {(audioSrc || screenshots.length > 0) && (
          <Reveal distance={16}>
            <span className="section-label" style={{ marginBottom: 22, display: 'inline-flex' }}>
              {isRTL ? 'دليل حقيقي' : 'Real Proof'}
            </span>

            <div className="proof-grid">
              {audioSrc && (
                <div className="proof-panel">
                  <p style={{ fontFamily: font, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 14 }}>
                    {isRTL ? 'رسالة صوتية' : 'Voice Note'}
                  </p>
                  <VoiceNoteCard
                    id="project-testimonial-audio"
                    src={audioSrc}
                    index={0}
                    label={clientLabel}
                    tag={isRTL ? 'رسالة صوتية' : 'Voice Note'}
                    isRTL={isRTL}
                    playingId={playingId}
                    onPlayRequest={setPlayingId}
                  />
                </div>
              )}

              {screenshots.length > 0 && (
                <div className="proof-panel">
                  <p style={{ fontFamily: font, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 14 }}>
                    {isRTL ? 'محادثة واتساب' : 'WhatsApp Conversation'}
                  </p>
                  <div className="proof-shots-grid">
                    {screenshots.slice(0, 4).map((shot, i) => (
                      <ChatProofCard
                        key={i}
                        src={mediaSrc(shot)}
                        index={i}
                        label={clientLabel}
                        tag={isRTL ? 'واتساب' : 'WhatsApp'}
                        isRTL={isRTL}
                        onOpen={() => setLightboxIndex(i)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        )}

        {awards.length > 0 && (
          <Reveal distance={16} style={{ marginTop: (audioSrc || screenshots.length) ? 'clamp(3rem, 6vw, 4.5rem)' : 0 }}>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 12,
              paddingTop: (audioSrc || screenshots.length) ? 'clamp(1.75rem, 3vw, 2.5rem)' : 0,
              borderTop: (audioSrc || screenshots.length) ? '1px solid var(--border)' : 'none',
            }}>
              {awards.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  <Award style={{ width: 16, height: 16, color: 'var(--accent)', flexShrink: 0 }} aria-hidden />
                  <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0, fontFamily: font }}>{isRTL && a.titleAr ? a.titleAr : a.title}</p>
                    {(a.org || a.year) && <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>{[a.org, a.year].filter(Boolean).join(' · ')}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        )}
      </div>

      {lightboxIndex !== null && screenshots.length > 0 && (
        <ChatLightbox
          images={screenshots.map(mediaSrc)}
          active={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={onPrev}
          onNext={onNext}
          isRTL={isRTL}
        />
      )}

      <style>{`
        .proof-grid { display: grid; grid-template-columns: 1fr; gap: clamp(2rem, 4vw, 3rem); }
        @media (min-width: 800px) {
          .proof-grid { grid-template-columns: 1fr 1.3fr; }
          /* Only a voice note OR only screenshots (not both) — take the full
             row instead of leaving an empty second column beside it. */
          .proof-grid:has(> .proof-panel:only-child) { grid-template-columns: 1fr; }
        }
        .proof-shots-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
      `}</style>
    </section>
  );
};

export default ProofSection;
