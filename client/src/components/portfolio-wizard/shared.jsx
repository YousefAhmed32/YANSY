import { useState } from 'react';
import { X } from 'lucide-react';
import { TK, TextInput, TextArea } from '../../admin-ui';

export const Field = ({ label, required, hint, children, isRTL }) => (
  <div>
    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: TK.textMuted, letterSpacing: isRTL ? 0 : '0.03em', marginBottom: '7px', textAlign: isRTL ? 'right' : 'left' }}>
      {label}{required && <span style={{ color: TK.red, marginInlineStart: '3px' }}>*</span>}
    </label>
    {children}
    {hint && <p style={{ fontSize: '10.5px', color: TK.textLight, marginTop: '5px', textAlign: isRTL ? 'right' : 'left' }}>{hint}</p>}
  </div>
);

/**
 * Every bilingual field in the schema (title/titleAr, challenge/challengeAr,
 * ...) as one row instead of two hand-paired inputs — cuts the repetition
 * that made the v1 wizard's "Case Study" step ~120 lines of near-identical
 * TextArea pairs.
 *
 * Per the Admin Dashboard Localization Policy, Arabic is primary — when the
 * interface is in Arabic, the Arabic input is DOM-first (not just visually
 * reordered by the grid), so it's also first in tab order and what a screen
 * reader reaches first. The "EN"/"AR" tags themselves stay as literal
 * language codes rather than translated words — the same convention CMS
 * tools like this generally use to label a field's content language,
 * independent of the interface language.
 */
export const BilingualPair = ({ label, enValue, arValue, onEnChange, onArChange, required, multiline, rows = 3, placeholder, isRTL }) => {
  const Input = multiline ? TextArea : TextInput;
  const enField = (
    <Input key="en" value={enValue || ''} onChange={(e) => onEnChange(e.target.value)} placeholder={placeholder ? `${placeholder} (EN)` : undefined} rows={multiline ? rows : undefined} />
  );
  const arField = (
    <Input key="ar" value={arValue || ''} onChange={(e) => onArChange(e.target.value)} dir="rtl" placeholder={placeholder ? `${placeholder} (AR)` : undefined} rows={multiline ? rows : undefined} />
  );

  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: TK.textMuted, letterSpacing: '0.03em', marginBottom: '7px', textAlign: isRTL ? 'right' : 'left' }}>
        {label}{required && <span style={{ color: TK.red, marginInlineStart: '3px' }}>*</span>}
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isRTL ? <>{arField}{enField}</> : <>{enField}{arField}</>}
      </div>
    </div>
  );
};

/** Chip-based tag input — Enter/comma commits a tag, backspace on an empty
 * field removes the last one. Used for tags/tech-stack today; general enough
 * for any string[] field. */
export const TagInput = ({ value = [], onChange, placeholder, isRTL }) => {
  const [draft, setDraft] = useState('');

  const commit = (raw) => {
    const tag = raw.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft('');
  };

  return (
    <div className="au-input" style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px',
      background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: 10, padding: '8px 10px',
      flexDirection: isRTL ? 'row-reverse' : 'row',
    }}>
      {value.map((tag) => (
        <span key={tag} style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 500,
          padding: '3px 8px', borderRadius: 999, background: TK.accentBg, color: TK.accent,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        }}>
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={isRTL ? `إزالة ${tag}` : `Remove ${tag}`} style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>
            <X style={{ width: '10px', height: '10px' }} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(draft); }
          else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => draft && commit(draft)}
        placeholder={value.length ? '' : placeholder}
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{ flex: 1, minWidth: 80, fontSize: '13px', color: TK.text, border: 'none', outline: 'none', background: 'none', textAlign: isRTL ? 'right' : 'left' }}
      />
    </div>
  );
};
