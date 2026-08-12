const ProposalFooter = ({ branding = {} }) => (
  <footer style={{ padding: 'clamp(2.5rem, 5vw, 3.5rem) 0', borderTop: '1px solid rgb(var(--ink-200))' }}>
    <div className="pt-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <img src={branding.logoUrl || '/assets/image/logo/logo-2.png'} alt="YANSY Tech" style={{ height: 24, width: 'auto', objectFit: 'contain' }} />
        <div>
          <p className="pt-body-sm" style={{ fontWeight: 700, color: 'rgb(var(--ink-700))', margin: 0 }}>
            <span className="en">{branding.footerText || 'YANSY Tech'}</span>
          </p>
          <p className="pt-caption" style={{ margin: 0 }}><span className="en">Digital Product Studio</span></p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'clamp(14px, 3vw, 24px)', flexWrap: 'wrap' }}>
        {branding.contactEmail && <span className="pt-caption"><span className="en">{branding.contactEmail}</span></span>}
        {branding.contactPhone && <span className="pt-caption"><span className="en">{branding.contactPhone}</span></span>}
        {branding.contactWebsite && <span className="pt-caption"><span className="en">{branding.contactWebsite}</span></span>}
      </div>
    </div>
  </footer>
);

export default ProposalFooter;
