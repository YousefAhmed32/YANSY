import { Check } from 'lucide-react';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

/**
 * Up to 3 short "what's strongest about this execution" bullets — shared by
 * both public renderers (PortfolioDetailView's full case study and
 * PortfolioShowcaseView's quick showcase) so the same compact, premium
 * treatment renders identically everywhere it appears, per
 * server/models/PortfolioProject.js's `highlights` doc comment. Renders
 * nothing when there's no usable content — an item with neither language
 * filled in must never render (see the schema's own sanitize-on-write, this
 * is the belt-and-braces public-side guard).
 *
 * Deliberately NOT an icon-per-highlight illustration — a single consistent
 * check-mark bullet (the site's existing "confirmed/complete" glyph, see
 * PublishReadiness in the admin) keeps the block reading as a tight list,
 * not a feature-grid.
 */
const HighlightsList = ({ highlights, isRTL, variant = 'inline' }) => {
  const font = isRTL ? FONT_AR : FONT_EN;
  const items = (highlights || []).filter((h) => h?.text || h?.textAr).slice(0, 3);
  if (!items.length) return null;

  const compact = variant === 'compact';

  return (
    <ul
      style={{
        listStyle: 'none', margin: 0, padding: 0,
        display: 'flex', flexDirection: 'column', gap: compact ? 8 : 10,
      }}
    >
      {items.map((h, i) => {
        const text = isRTL ? (h.textAr || h.text) : (h.text || h.textAr);
        if (!text) return null;
        return (
          <li
            key={i}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 9,
              flexDirection: isRTL ? 'row-reverse' : 'row', textAlign: isRTL ? 'right' : 'left',
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                width: 18, height: 18, borderRadius: '50%',
                background: 'rgb(var(--accent-light))', border: '1px solid rgb(var(--accent-muted))',
              }}
            >
              <Check style={{ width: 10, height: 10, color: 'rgb(var(--accent))', strokeWidth: 3 }} />
            </span>
            <span style={{
              fontFamily: font, fontSize: compact ? 13 : 14.5, fontWeight: isRTL ? 500 : 400,
              color: 'rgb(var(--text-secondary))', lineHeight: 1.55,
            }}>
              {text}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export default HighlightsList;
