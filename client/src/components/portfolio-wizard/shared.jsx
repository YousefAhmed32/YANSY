import { forwardRef, isValidElement, cloneElement } from 'react';
import { TK, TextInput, TextArea, FieldError } from '../../admin-ui';

const labelStyle = (isRTL) => ({
  display: 'block', fontSize: '11.5px', fontWeight: 600, color: TK.textMuted,
  letterSpacing: isRTL ? 0 : '0.03em', marginBottom: '7px', lineHeight: 1.5,
  textAlign: isRTL ? 'right' : 'left', fontFamily: 'inherit',
});

// `*` is `aria-hidden` — the actual "required" signal for assistive tech is
// `aria-required`/`aria-invalid` on the control itself, not a visual glyph;
// screen readers announcing a bare "asterisk" per field is noise, not signal.
const RequiredMark = () => <span style={{ color: TK.red, marginInlineStart: '3px' }} aria-hidden>*</span>;

/**
 * `id` (when passed) makes this a fully wired accessible field: the label
 * gets `htmlFor`, and — when `children` is a single element — `id`,
 * `aria-invalid`, `aria-describedby`, and `error` are cloned onto it
 * automatically so most call sites never hand-wire aria plumbing themselves.
 * `error` (a message string) switches the field into its invalid state and
 * renders a `FieldError` line underneath; `hint` renders as quiet help text
 * instead, never both at once. `ref` is forwarded to the OUTER wrapper (not
 * the control) — used by publish-validation focus-management to
 * `scrollIntoView` a field that failed validation.
 */
export const Field = forwardRef(({ label, required, hint, error, children, isRTL, id }, ref) => {
  const errorId = id ? `${id}-error` : undefined;
  const hintId  = id ? `${id}-hint` : undefined;
  const describedBy = error ? errorId : (hint ? hintId : undefined);

  const child = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? id,
        error: children.props.error ?? Boolean(error),
        'aria-describedby': [children.props['aria-describedby'], describedBy].filter(Boolean).join(' ') || undefined,
      })
    : children;

  return (
    <div ref={ref} tabIndex={-1} style={{ outline: 'none' }}>
      <label htmlFor={id} style={labelStyle(isRTL)}>
        {label}{required && <RequiredMark />}
      </label>
      {child}
      {error
        ? <FieldError id={errorId}>{error}</FieldError>
        : hint && <p id={hintId} style={{ fontSize: '11px', color: TK.textLight, marginTop: '6px', lineHeight: 1.5, textAlign: isRTL ? 'right' : 'left' }}>{hint}</p>}
    </div>
  );
});
Field.displayName = 'Field';

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
 *
 * `error` applies to the PRIMARY (English) value specifically — that's the
 * field the schema/backend actually validates (titleAr/descriptionAr are
 * optional translations, never required) — but is shown on BOTH inputs so
 * the signal is visible regardless of which side an Arabic-first admin is
 * scanning. `id` (when passed) anchors the EN input for focus-management —
 * the field the validation contract cares about.
 */
export const BilingualPair = forwardRef(({ label, enValue, arValue, onEnChange, onArChange, required, multiline, rows = 3, placeholder, isRTL, error, id }, ref) => {
  const Input = multiline ? TextArea : TextInput;
  const errorId = id ? `${id}-error` : undefined;
  const enField = (
    <Input
      key="en" id={id} value={enValue || ''} onChange={(e) => onEnChange(e.target.value)}
      placeholder={placeholder ? `${placeholder} (EN)` : undefined} rows={multiline ? rows : undefined}
      error={Boolean(error)} aria-describedby={errorId}
    />
  );
  const arField = (
    <Input
      key="ar" value={arValue || ''} onChange={(e) => onArChange(e.target.value)} dir="rtl"
      placeholder={placeholder ? `${placeholder} (AR)` : undefined} rows={multiline ? rows : undefined}
      error={Boolean(error)}
    />
  );

  return (
    <div ref={ref} tabIndex={-1} style={{ outline: 'none' }}>
      <label style={labelStyle(isRTL)}>
        {label}{required && <RequiredMark />}
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isRTL ? <>{arField}{enField}</> : <>{enField}{arField}</>}
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
});
BilingualPair.displayName = 'BilingualPair';

export { TechTagInput, TechTagInput as TagInput } from './TechTagInput';
