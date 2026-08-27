import { TK, RADIUS } from './tokens';

/** Standard admin page header: eyebrow badge + title + subtitle + right-aligned actions. */
const PageHeader = ({ icon: Icon, eyebrow, title, subtitle, actions }) => (
  <div className="au-page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
    <div>
      {eyebrow && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '3px 10px', borderRadius: RADIUS.pill, marginBottom: '10px',
          border: `1px solid ${TK.accentBd}`, background: TK.accentBg,
        }}>
          {Icon && <Icon style={{ width: '10px', height: '10px', color: TK.accent }} />}
          <span style={{ fontSize: '10px', fontWeight: 600, color: TK.accent, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {eyebrow}
          </span>
        </div>
      )}
      <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700, letterSpacing: '-0.02em', color: TK.text, margin: 0 }}>
        {title}
      </h1>
      {subtitle && <p style={{ fontSize: '13px', color: TK.textMuted, marginTop: '6px', margin: '6px 0 0' }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{actions}</div>}
  </div>
);

export default PageHeader;
