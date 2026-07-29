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
        padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: isRTL ? 'right' : 'left',
        flexDirection: isRTL ? 'row-reverse' : 'row',
      }}
    >
      <span style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{q}</span>
      <Plus aria-hidden style={{ width: 16, height: 16, color: 'var(--text-tertiary)', flexShrink: 0, transition: 'transform 0.25s', transform: open ? 'rotate(45deg)' : 'none' }} />
    </button>
    <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s ease' }}>
      <div style={{ overflow: 'hidden' }}>
        <p style={{ fontFamily: font, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, margin: '0 0 20px', textAlign: isRTL ? 'right' : 'left' }}>{a}</p>
      </div>
    </div>
  </div>
);

/**
 * Per-project objection handling — placed late in the page, same narrative
 * slot the homepage gives its own FAQ (right before the closing CTA).
 */
const FAQSection = ({ project, isRTL }) => {
  const font = isRTL ? FONT_AR : FONT_EN;
  const [openIdx, setOpenIdx] = useState(0);
  const faqs = (project.faqs || []).filter((f) => f.question && f.answer);
  if (!faqs.length) return null;

  return (
    <section className="section-shell section-shell--plain" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-inner" style={{ maxWidth: 720 }}>
        <Reveal distance={16}>
          <span className="section-label" style={{ marginBottom: 20, display: 'inline-flex' }}>
            {isRTL ? 'أسئلة شائعة' : 'FAQs'}
          </span>
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
    </section>
  );
};

export default FAQSection;
