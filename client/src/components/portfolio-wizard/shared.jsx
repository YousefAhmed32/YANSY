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

export { TechTagInput, TechTagInput as TagInput } from './TechTagInput';

