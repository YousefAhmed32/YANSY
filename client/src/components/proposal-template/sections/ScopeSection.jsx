import { useReveal } from '../../../hooks/useReveal';
import { reveal } from '../revealHelper';
import ProposalIcon from '../ProposalIcon';

const pick = (isRTL, ar, en) => (isRTL ? ar : en) || en || ar;

// ── vision ──────────────────────────────────────────────────────────────
const VisionBlock = ({ section, isRTL }) => {
  const { ref, revealed } = useReveal();
  const title = pick(isRTL, section.titleAr, section.title);
  const description = pick(isRTL, section.descriptionAr, section.description);
  const statement = section.emphasis && section.bullets?.[0];

  return (
    <section className="pt-section" ref={ref}>
      <div className="pt-container">
        <div style={{ display: 'grid', gridTemplateColumns: statement ? '.9fr 1.1fr' : '1fr', gap: 'clamp(2.5rem, 5vw, 5rem)', alignItems: 'center' }}>
          <div className="pt-stack-md" {...reveal(revealed)}>
            {section.eyebrow && (
              <span className="pt-eyebrow">{pick(isRTL, section.eyebrowAr, section.eyebrow)}</span>
            )}
            {title && <h2 className="pt-h1">{title}</h2>}
            {description && <p className="pt-body-lg" style={{ whiteSpace: 'pre-line' }}>{description}</p>}
          </div>

          {statement && (
            <div
              className="pt-band-dark"
              {...reveal(revealed, '', { borderRadius: 'var(--r-lg)', padding: 'clamp(2.5rem, 5vw, 4rem)', minHeight: 240, display: 'flex', flexDirection: 'column', justifyContent: 'center' })}
            >
              <div className="pt-glow" style={{ width: 340, height: 340, top: -120, insetInlineEnd: -100, background: 'radial-gradient(circle, rgb(var(--accent-rgb) / .4), transparent 70%)' }} aria-hidden="true" />
              <p className="pt-h1" style={{ position: 'relative', zIndex: 1, color: '#fff' }}>{pick(isRTL, statement.textAr, statement.text)}</p>
              {section.bullets?.[1] && (
                <p className="pt-body" style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,.55)', marginTop: 10 }}>
                  {pick(isRTL, section.bullets[1].textAr, section.bullets[1].text)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// ── features-grid ───────────────────────────────────────────────────────
const FeaturesGridBlock = ({ section, isRTL, tint }) => {
  const { ref, revealed } = useReveal();
  const title = pick(isRTL, section.titleAr, section.title);
  const description = pick(isRTL, section.descriptionAr, section.description);
  const items = [...(section.items || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <section className={`pt-section${tint ? ' pt-tint' : ''}`} ref={ref}>
      <div className="pt-container">
        {(section.eyebrow || title || description) && (
          <div className="pt-stack-md" {...reveal(revealed, '', { maxWidth: 680, marginBottom: 'clamp(2.5rem, 5vw, 3.75rem)' })}>
            {section.eyebrow && <span className="pt-eyebrow">{pick(isRTL, section.eyebrowAr, section.eyebrow)}</span>}
            {title && <h2 className="pt-h1">{title}</h2>}
            {description && <p className="pt-body-lg">{description}</p>}
          </div>
        )}

        <div className="pt-bgrid pt-bgrid--4">
          {items.map((item, i) => (
            <div key={item._id || i} className="pt-tile pt-stack-sm" style={{ gridColumn: `span ${Math.min(item.span || 1, 4)}` }}>
              {item.icon && (
                <div className="pt-icon-mark" aria-hidden="true"><ProposalIcon name={item.icon} /></div>
              )}
              {item.title && <h3 className="pt-h3">{pick(isRTL, item.titleAr, item.title)}</h3>}
              {item.description && <p className="pt-body-sm">{pick(isRTL, item.descriptionAr, item.description)}</p>}
              {item.bullets?.length > 0 && (
                <ul className="pt-feat-cols pt-feat-cols--2" style={{ marginTop: 4 }}>
                  {item.bullets.map((b, bi) => (
                    <li key={bi} className="pt-feat"><span className="pt-feat-dot" aria-hidden="true" />{pick(isRTL, b.textAr, b.text)}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── spotlight ───────────────────────────────────────────────────────────
const SpotlightBlock = ({ section, isRTL }) => {
  const { ref, revealed } = useReveal();
  const title = pick(isRTL, section.titleAr, section.title);
  const description = pick(isRTL, section.descriptionAr, section.description);
  const centered = !section.bullets?.length;

  return (
    <section className="pt-section pt-section--lg pt-band-dark" ref={ref}>
      <div className="pt-glow" style={{ width: 520, height: 520, top: -180, insetInlineStart: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgb(var(--accent-rgb) / .22), transparent 72%)' }} aria-hidden="true" />
      <div className="pt-container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="pt-stack-md" {...reveal(revealed, '', { maxWidth: 640, margin: centered ? '0 auto' : undefined, textAlign: centered ? 'center' : undefined })}>
          {section.eyebrow && <span className="pt-eyebrow pt-eyebrow--on-dark" style={centered ? { justifyContent: 'center' } : undefined}>{pick(isRTL, section.eyebrowAr, section.eyebrow)}</span>}
          {title && <h2 className="pt-h1" style={{ color: '#fff' }}>{title}</h2>}
          {description && <p className="pt-body-lg" style={{ color: 'rgba(255,255,255,.62)' }}>{description}</p>}

          {section.bullets?.length > 0 && (
            <div className="pt-bgrid pt-bgrid--2" style={{ marginTop: 8 }}>
              {section.bullets.map((b, i) => (
                <span key={i} className="pt-feat" style={{ color: 'rgba(255,255,255,.78)' }}>
                  <span className="pt-feat-dot" style={{ background: '#6FE39A' }} aria-hidden="true" />
                  {pick(isRTL, b.textAr, b.text)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// ── process ─────────────────────────────────────────────────────────────
const ProcessBlock = ({ section, isRTL }) => {
  const { ref, revealed } = useReveal();
  const title = pick(isRTL, section.titleAr, section.title);
  const items = [...(section.items || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <section className="pt-section" ref={ref}>
      <div className="pt-container">
        {(section.eyebrow || title) && (
          <div className="pt-stack-md" {...reveal(revealed, '', { maxWidth: 620, marginBottom: 'clamp(2.5rem, 5vw, 3.75rem)' })}>
            {section.eyebrow && <span className="pt-eyebrow">{pick(isRTL, section.eyebrowAr, section.eyebrow)}</span>}
            {title && <h2 className="pt-h1">{title}</h2>}
            {section.description && <p className="pt-body-lg">{pick(isRTL, section.descriptionAr, section.description)}</p>}
          </div>
        )}
        <div className="pt-process-rail" {...reveal(revealed)}>
          {items.map((item, i) => (
            <div key={item._id || i} className="pt-process-step">
              <span className="pt-process-ghost">{String(i + 1).padStart(2, '0')}</span>
              <span className="pt-body-sm" style={{ color: 'rgb(var(--ink-700))', fontWeight: 600 }}>{pick(isRTL, item.titleAr, item.title)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── terms (inline narrative variant) ───────────────────────────────────
const TermsBulletBlock = ({ section, isRTL }) => {
  const { ref, revealed } = useReveal();
  const title = pick(isRTL, section.titleAr, section.title);

  return (
    <section className="pt-section pt-tint" ref={ref}>
      <div className="pt-container">
        <div className="pt-stack-md" {...reveal(revealed, '', { maxWidth: 680 })}>
          {section.eyebrow && <span className="pt-eyebrow">{pick(isRTL, section.eyebrowAr, section.eyebrow)}</span>}
          {title && <h2 className="pt-h2">{title}</h2>}
          {section.description && <p className="pt-body">{pick(isRTL, section.descriptionAr, section.description)}</p>}
          {section.bullets?.length > 0 && (
            <ul className="pt-stack-sm">
              {section.bullets.map((b, i) => (
                <li key={i} className="pt-feat"><span className="pt-feat-dot" aria-hidden="true" />{pick(isRTL, b.textAr, b.text)}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

// ── custom (freeform) ───────────────────────────────────────────────────
const CustomBlock = ({ section, isRTL }) => {
  const { ref, revealed } = useReveal();
  const title = pick(isRTL, section.titleAr, section.title);
  const description = pick(isRTL, section.descriptionAr, section.description);

  return (
    <section className="pt-section" ref={ref}>
      <div className="pt-container">
        <div className="pt-stack-md" {...reveal(revealed, '', { maxWidth: 720 })}>
          {section.eyebrow && <span className="pt-eyebrow">{pick(isRTL, section.eyebrowAr, section.eyebrow)}</span>}
          {title && <h2 className="pt-h1">{title}</h2>}
          {description && description.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="pt-body-lg" style={{ whiteSpace: 'pre-line' }}>{para}</p>
          ))}
        </div>
      </div>
    </section>
  );
};

/**
 * Dispatches a single `proposal.sections[]` entry to its type-specific
 * renderer. Every branch treats its underlying data as fully optional and
 * renders nothing extra for a missing field — ProposalRenderer already
 * filters out sections with no content at all before this ever runs.
 */
const ScopeSection = ({ section, isRTL, index }) => {
  switch (section.type) {
    case 'vision':         return <VisionBlock section={section} isRTL={isRTL} />;
    case 'features-grid':  return <FeaturesGridBlock section={section} isRTL={isRTL} tint={index % 2 === 1} />;
    case 'spotlight':      return <SpotlightBlock section={section} isRTL={isRTL} />;
    case 'process':        return <ProcessBlock section={section} isRTL={isRTL} />;
    case 'terms':          return <TermsBulletBlock section={section} isRTL={isRTL} />;
    case 'custom':
    default:                return <CustomBlock section={section} isRTL={isRTL} />;
  }
};

export default ScopeSection;
