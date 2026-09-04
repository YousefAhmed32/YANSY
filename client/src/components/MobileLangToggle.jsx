import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

/* ═══════════════════════════════════════════════════════════════
   Compact, always-visible mobile language switch — globe icon +
   the TARGET language's label (not the current one), so the
   control reads as an action ("tap to get this") rather than a
   status readout. Shared by the public Header and the authenticated
   Layout mobile header; both are light-themed so one style works
   for both without a variant prop.

   Deliberately a single tap-to-toggle button, not a dropdown/sheet
   — there are exactly two languages, and LanguageSelector already
   covers the full picker experience where one is wanted (desktop
   header, mobile drawer).
   ═══════════════════════════════════════════════════════════════ */
const MobileLangToggle = ({ style, size = 'md' }) => {
  const { toggleLanguage, isRTL } = useLanguage();
  const targetLabel = isRTL ? 'EN' : 'عربي';
  const compact = size === 'sm';

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={isRTL ? 'التبديل إلى الإنجليزية' : 'التبديل إلى العربية · Switch to Arabic'}
      dir="ltr"
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        height: compact ? 34 : 36, padding: compact ? '0 9px' : '0 11px',
        borderRadius: 9, border: '1px solid rgba(0,0,0,0.12)',
        background: 'rgba(0,0,0,0.03)', color: '#374151',
        cursor: 'pointer', flexShrink: 0,
        fontSize: 12, fontWeight: 600, letterSpacing: '0.01em',
        transition: 'background 0.15s, border-color 0.15s, transform 0.1s',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
      onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <Globe style={{ width: 15, height: 15, flexShrink: 0 }} aria-hidden />
      <span>{targetLabel}</span>
    </button>
  );
};

export default MobileLangToggle;
