import { useState } from 'react';
import { Plus } from 'lucide-react';
import Reveal from '../Reveal';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

const FAQItem = ({ q, a, isRTL, font, open, onToggle }) => (
  <div style={{ borderBottom: '1px solid var(--border)' }}>
    <button
      onClick={onToggle}
      aria-expanded={open}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        padding: '22px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: isRTL ? 'right' : 'left',
        flexDirection: isRTL ? 'row-reverse' : 'row',
      }}
    >
      <span style={{ fontFamily: font, fontSize: 15.5, fontWeight: 600, color: 'var(--text-primary)' }}>{q}</span>
      <span aria-hidden style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid var(--border)', transition: 'transform 0.25s, background 0.2s, border-color 0.2s',
        transform: open ? 'rotate(45deg)' : 'none', background: open ? 'var(--accent-light)' : 'transparent', borderColor: open ? 'var(--accent-muted)' : 'var(--border)',
      }}>
        <Plus style={{ width: 13, height: 13, color: open ? 'var(--accent)' : 'var(--text-tertiary)' }} />
      </span>
    </button>
    <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s ease' }}>
      <div style={{ overflow: 'hidden' }}>
        <p style={{ fontFamily: font, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, margin: '0 0 22px', maxWidth: '62ch', textAlign: isRTL ? 'right' : 'left' }}>{a}</p>
      </div>
    </div>
  </div>
);

/**
 * Objection handling as a two-column "sticky intro / scrolling answers"
 * layout instead of the single centered text column used by every other
 * text-heavy section on this page (Story, Process, Impact) — the one
 * genuinely list-shaped section on the page gets a genuinely list-shaped
 * layout, so it doesn't read as "another paragraph section" while scrolling.
 */
const FAQSection = ({ project, isRTL }) => {
  const font = isRTL ? FONT_AR : FONT_EN;
  const [openIdx, setOpenIdx] = useState(0);
  const faqs = (project.faqs || []).filter((f) => f.question && f.answer);
  if (!faqs.length) return null;

  return (
    <section className="section-shell section-shell--plain" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner faq-grid" style={{ maxWidth: 1100 }}>
        <Reveal distance={14} className="faq-aside">
          <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <span className="section-label" style={{ marginBottom: 18, display: 'inline-flex' }}>
              {isRTL ? 'أسئلة شائعة' : 'FAQs'}
            </span>
            <h2 style={{
              fontFamily: font, fontSize: 'clamp(1.5rem, 2.8vw, 2.125rem)', fontWeight: 800,
              color: 'var(--text-primary)', letterSpacing: isRTL ? 0 : '-0.02em', lineHeight: 1.2, margin: '0 0 12px',
            }}>
              {isRTL ? 'أسئلة قد تدور في ذهنك' : 'Questions worth asking'}
            </h2>
            <p style={{ fontFamily: font, fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.7, margin: 0, maxWidth: '38ch' }}>
              {isRTL ? 'إن لم تجد إجابتك هنا، تواصل معنا مباشرة — نرد خلال ساعتين.' : "Don't see yours? Ask us directly — we reply within 2 hours."}
            </p>
          </div>
        </Reveal>

        <Reveal distance={14} className="faq-list">
          <div>
            {faqs.map((f, i) => (
              <FAQItem
                key={i}
                q={isRTL ? (f.questionAr || f.question) : (f.question || f.questionAr)}
                a={isRTL ? (f.answerAr || f.answer) : (f.answer || f.answerAr)}
                isRTL={isRTL}
                font={font}
                open={openIdx === i}
                onToggle={() => setOpenIdx((cur) => (cur === i ? -1 : i))}
              />
            ))}
          </div>
        </Reveal>
      </div>

      <style>{`
        .faq-grid { display: grid; grid-template-columns: 1fr; gap: clamp(2rem, 4vw, 3rem); }
        @media (min-width: 860px) {
          .faq-grid { grid-template-columns: 0.85fr 1.15fr; align-items: start; }
          .faq-aside { position: sticky; top: calc(68px + 2rem); }
        }
      `}</style>
    </section>
  );
};

export default FAQSection;
