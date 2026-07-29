import { Check } from 'lucide-react';
import { TK, RADIUS } from '../../admin-ui';

/**
 * Left-rail section nav — jump to any section directly instead of a forced
 * linear step-by-step wizard. Each item shows a filled/empty dot rather than
 * a hard "done" checkmark, since every section past Overview is optional;
 * the dot is a completeness signal, not a gate.
 */
const SectionNav = ({ sections, active, onSelect, percent, isRTL }) => (
  <div style={{ position: 'sticky', top: 84 }}>
    <div style={{ marginBottom: 18, padding: '0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: TK.textMuted, letterSpacing: isRTL ? 0 : '0.06em' }}>
          {isRTL ? 'نسبة الاكتمال' : 'COMPLETION'}
        </span>
        <span dir="ltr" style={{ fontSize: 12, fontWeight: 700, color: TK.accent }}>{percent}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 999, background: TK.border, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: TK.accent, borderRadius: 999, transition: 'width 0.3s ease' }} />
      </div>
    </div>

    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {sections.map((s) => {
        const isActive = active === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onSelect(s.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: RADIUS.md,
              background: isActive ? TK.accentBg : 'transparent', border: 'none', cursor: 'pointer', textAlign: isRTL ? 'right' : 'left',
              fontFamily: 'inherit', flexDirection: isRTL ? 'row-reverse' : 'row',
            }}
          >
            <span style={{
              width: 16, height: 16, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: s.complete ? TK.accent : 'transparent', border: `1.5px solid ${s.complete ? TK.accent : TK.border}`,
            }}>
              {s.complete && <Check style={{ width: 10, height: 10, color: '#fff' }} strokeWidth={3} />}
            </span>
            <span style={{ fontSize: 12.5, fontWeight: isActive ? 700 : 500, color: isActive ? TK.text : TK.textMuted }}>{s.label}</span>
          </button>
        );
      })}
    </nav>
  </div>
);

export default SectionNav;
