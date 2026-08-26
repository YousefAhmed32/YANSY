import HighlightsList from './HighlightsList';

/**
 * Full Case Study placement for `highlights[]` — a compact strip right
 * after the Hero and before the Story beats, so a scanning visitor sees
 * "what's strongest" before committing to the full narrative, without it
 * competing with the Impact section's actual metrics/results (see
 * server/models/PortfolioProject.js's `highlights` doc comment: this field
 * is about the execution, not a business outcome). Renders nothing when
 * there are no highlights — never an empty section.
 */
const HighlightsStrip = ({ highlights, isRTL, dir }) => {
  const items = (highlights || []).filter((h) => h?.text || h?.textAr);
  if (!items.length) return null;

  return (
    <section style={{ borderTop: '1px solid rgb(var(--border))' }} dir={dir}>
      <div className="max-w-7xl mx-auto" style={{ padding: 'clamp(1.75rem, 3vw, 2.5rem) clamp(1.25rem, 5vw, 3rem)' }}>
        <div style={{ maxWidth: 640, marginInlineStart: isRTL ? 'auto' : 0 }}>
          <span className="section-label" style={{ marginBottom: 14, display: 'inline-flex' }}>
            {isRTL ? 'أبرز ما تم تنفيذه' : 'Highlights'}
          </span>
          <HighlightsList highlights={items} isRTL={isRTL} />
        </div>
      </div>
    </section>
  );
};

export default HighlightsStrip;
