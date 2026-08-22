import { useEffect, useRef } from 'react';
import { AlertCircle, Check, ChevronDown, ChevronRight, ChevronLeft, CircleDashed } from 'lucide-react';
import { TK, RADIUS } from '../../admin-ui';
import { REQUIRED_FIELDS, computeMissingFields, fieldLabel, fieldMessage } from './publishValidation';

/* ── Error Summary — shown after a failed publish attempt ──────────────────
 * WCAG "error-summary" pattern: one alert region at the top, each problem a
 * clickable item that jumps to + focuses its field. Focus moves here
 * exactly ONCE per failed attempt (via the `focusToken` prop changing), not
 * on every re-render, so it doesn't fight the user's own navigation. */
export const ErrorSummary = ({ missing, isRTL, onJump, focusToken }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (focusToken) ref.current?.focus();
  }, [focusToken]);

  if (!missing?.length) return null;
  const count = missing.length;

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      style={{
        display: 'flex', gap: 10, padding: '14px 16px', borderRadius: RADIUS.md,
        background: TK.redBg, border: `1px solid ${TK.redBd}`, marginBottom: 28,
        flexDirection: isRTL ? 'row-reverse' : 'row', outline: 'none',
      }}
    >
      <AlertCircle style={{ width: 17, height: 17, color: TK.red, flexShrink: 0, marginTop: 1 }} aria-hidden />
      <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: TK.red, margin: '0 0 8px' }}>
          {isRTL
            ? `تعذّر النشر — أكمل ${count} ${count === 1 ? 'حقلاً مطلوبًا' : 'حقول مطلوبة'}.`
            : `Unable to publish — complete ${count} required ${count === 1 ? 'field' : 'fields'}.`}
        </p>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {missing.map((field) => (
            <li key={field}>
              <button
                type="button"
                onClick={() => onJump(field)}
                style={{
                  background: 'none', border: 'none', padding: '2px 0', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: TK.red,
                  textDecoration: 'underline', textUnderlineOffset: 2, display: 'inline-flex',
                  alignItems: 'center', gap: 5, flexDirection: isRTL ? 'row-reverse' : 'row',
                }}
              >
                {isRTL ? <ChevronLeft style={{ width: 12, height: 12 }} /> : <ChevronRight style={{ width: 12, height: 12 }} />}
                {fieldLabel(field, isRTL)} — {fieldMessage(field, isRTL)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/* ── Publish Readiness — calm, optional, pre-attempt widget ─────────────────
 * Replaces a permanent "here's what publishing needs" banner with a live
 * checklist that never reads as an error until the user has actually tried
 * to publish (see `attempted` in the parent — once true, the parent renders
 * <ErrorSummary> instead of this component, they're mutually exclusive). */
export const PublishReadiness = ({ form, isRTL, onJump, collapsed, onToggleCollapsed }) => {
  const required = REQUIRED_FIELDS[form.presentationMode === 'showcase' ? 'showcase' : 'caseStudy'];
  const missing = new Set(computeMissingFields(form));
  const total = required.length;
  const done = total - missing.size;
  const allDone = missing.size === 0;

  return (
    <div style={{ borderRadius: RADIUS.md, border: `1px solid ${TK.border}`, background: TK.surface, marginBottom: 28, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          flexDirection: isRTL ? 'row-reverse' : 'row', textAlign: isRTL ? 'right' : 'left',
        }}
      >
        {allDone
          ? <Check style={{ width: 15, height: 15, color: TK.green, flexShrink: 0 }} />
          : <CircleDashed style={{ width: 15, height: 15, color: TK.accent, flexShrink: 0 }} />}
        <span style={{ fontSize: 12.5, fontWeight: 600, color: TK.text, flex: 1 }}>
          {isRTL ? `جاهزية النشر — ${done}/${total}` : `Publishing readiness — ${done}/${total}`}
        </span>
        <ChevronDown style={{ width: 14, height: 14, color: TK.textLight, transform: collapsed ? 'none' : 'rotate(180deg)', transition: 'transform 0.15s', flexShrink: 0 }} />
      </button>
      {!collapsed && (
        <div style={{ padding: '2px 14px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {required.map((field) => {
            const isMissing = missing.has(field);
            const Row = isMissing ? 'button' : 'div';
            return (
              <Row
                key={field}
                type={isMissing ? 'button' : undefined}
                onClick={isMissing ? () => onJump(field) : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
                  background: 'none', border: 'none', width: '100%', cursor: isMissing ? 'pointer' : 'default',
                  fontFamily: 'inherit', textAlign: isRTL ? 'right' : 'left', flexDirection: isRTL ? 'row-reverse' : 'row',
                }}
              >
                {isMissing
                  ? <CircleDashed style={{ width: 12, height: 12, color: TK.textLight, flexShrink: 0 }} />
                  : <Check style={{ width: 12, height: 12, color: TK.green, flexShrink: 0 }} />}
                <span style={{ fontSize: 12, color: isMissing ? TK.textMuted : TK.text, textDecoration: isMissing ? 'underline' : 'none', textUnderlineOffset: 2 }}>
                  {fieldLabel(field, isRTL)}
                </span>
                <span style={{ fontSize: 11, color: isMissing ? TK.textLight : TK.green, marginInlineStart: 'auto' }}>
                  {isMissing ? (isRTL ? 'مفقود' : 'missing') : (isRTL ? 'مكتمل' : 'complete')}
                </span>
              </Row>
            );
          })}
        </div>
      )}
    </div>
  );
};
