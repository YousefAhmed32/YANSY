import { Plus, Trash2, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { TK, RADIUS, TextInput, IconButton } from '../../admin-ui';

// Kept in lockstep with server/models/PortfolioProject.js's
// HIGHLIGHT_TEXT_MAXLEN / HIGHLIGHT_TEXT_AR_MAXLEN / HIGHLIGHTS_MAX — the
// server re-enforces these on every write regardless of what the client
// sends (see sanitizeHighlights in server/routes/portfolio.routes.js), so a
// mismatch here would only ever under-restrict the UI, never let bad data
// through.
const TEXT_MAX = 140;
const TEXT_AR_MAX = 160;
const MAX_ITEMS = 3;

const emptyItem = () => ({ text: '', textAr: '' });

/**
 * Up to 3 short bilingual "what's strongest about this execution" bullets —
 * shared by both editors (see server/models/PortfolioProject.js's v3.4 doc
 * comment for why this is a bounded, structured list rather than a single
 * free-text field the admin would have to manually bullet-format).
 *
 * Reorder is explicit up/down buttons rather than drag-and-drop — with a
 * hard cap of 3 items, buttons are just as fast as a drag and are fully
 * keyboard-operable without a second, mouse-only interaction path (see
 * MediaSection.jsx's gallery reorder for the same reasoning at a larger
 * scale, where BOTH drag and buttons are offered).
 */
const HighlightsEditor = ({ value, onChange, isRTL }) => {
  const items = value || [];

  const L = {
    label: isRTL ? 'أبرز ما تم تنفيذه' : 'Project Highlights',
    hint: isRTL
      ? 'أضف حتى 3 نقاط قصيرة توضّح أهم ما يميز التنفيذ دون تحويل العرض إلى دراسة حالة طويلة.'
      : 'Add up to 3 concise highlights that communicate the strongest parts of the execution without turning the showcase into a full case study.',
    add: isRTL ? 'إضافة نقطة' : 'Add highlight',
    remove: isRTL ? 'إزالة النقطة' : 'Remove highlight',
    moveUp: isRTL ? 'نقل للأعلى' : 'Move up',
    moveDown: isRTL ? 'نقل للأسفل' : 'Move down',
    enPh: isRTL ? 'مثال: أعدنا بناء نظام التصميم بالكامل' : 'e.g. Rebuilt the design system from scratch',
    arPh: 'مثال: أعدنا بناء نظام التصميم بالكامل',
    limitReached: isRTL ? `الحد الأقصى ${MAX_ITEMS} نقاط` : `Maximum ${MAX_ITEMS} highlights`,
  };

  const update = (i, patch) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const move = (from, to) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };
  const add = () => { if (items.length < MAX_ITEMS) onChange([...items, emptyItem()]); };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <Sparkles style={{ width: 13, height: 13, color: TK.accent, flexShrink: 0 }} aria-hidden />
        <p style={{ fontSize: 12, fontWeight: 700, color: TK.textMuted, letterSpacing: isRTL ? 0 : '0.04em', margin: 0, textAlign: isRTL ? 'right' : 'left' }}>{L.label}</p>
      </div>
      <p style={{ fontSize: 11, color: TK.textLight, margin: '0 0 12px', lineHeight: 1.55, textAlign: isRTL ? 'right' : 'left' }}>{L.hint}</p>

      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
          {items.map((item, i) => (
            <div
              key={i}
              role="group"
              aria-label={isRTL ? `النقطة ${i + 1} من ${items.length}` : `Highlight ${i + 1} of ${items.length}`}
              style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: 10, borderRadius: RADIUS.md, border: `1px solid ${TK.border}`, background: TK.surface, flexDirection: isRTL ? 'row-reverse' : 'row' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 2 }}>
                <IconButton icon={ArrowUp} size={22} variant="outline" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={L.moveUp} style={{ opacity: i === 0 ? 0.35 : 1 }} />
                <IconButton icon={ArrowDown} size={22} variant="outline" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label={L.moveDown} style={{ opacity: i === items.length - 1 ? 0.35 : 1 }} />
              </div>

              <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: '1fr', gap: 6 }} className="sm:grid-cols-2">
                <div>
                  <TextInput
                    value={item.text || ''}
                    onChange={(e) => update(i, { text: e.target.value.slice(0, TEXT_MAX) })}
                    placeholder={L.enPh}
                    maxLength={TEXT_MAX}
                    dir="ltr"
                  />
                  <p style={{ fontSize: 10, color: TK.textLight, margin: '4px 2px 0', textAlign: 'end' }}>{(item.text || '').length}/{TEXT_MAX}</p>
                </div>
                <div>
                  <TextInput
                    value={item.textAr || ''}
                    onChange={(e) => update(i, { textAr: e.target.value.slice(0, TEXT_AR_MAX) })}
                    placeholder={L.arPh}
                    maxLength={TEXT_AR_MAX}
                    dir="rtl"
                  />
                  <p style={{ fontSize: 10, color: TK.textLight, margin: '4px 2px 0', textAlign: 'end' }}>{(item.textAr || '').length}/{TEXT_AR_MAX}</p>
                </div>
              </div>

              <IconButton icon={Trash2} variant="outline" onClick={() => remove(i)} aria-label={L.remove} />
            </div>
          ))}
        </div>
      )}

      {items.length < MAX_ITEMS ? (
        <button
          type="button"
          onClick={add}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 500, color: TK.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', flexDirection: isRTL ? 'row-reverse' : 'row' }}
        >
          <Plus style={{ width: 12, height: 12 }} /> {L.add}
        </button>
      ) : (
        <p style={{ fontSize: 11, color: TK.textLight, margin: 0 }}>{L.limitReached}</p>
      )}
    </div>
  );
};

export default HighlightsEditor;
