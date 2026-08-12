import { Languages } from 'lucide-react';
import { useReveal } from '../../../hooks/useReveal';
import { reveal } from '../revealHelper';
import { t } from '../copy';

const formatDate = (date, lang) => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return ''; }
};

const formatMoney = (amount, currency) => {
  const n = Number(amount) || 0;
  return `${n.toLocaleString('en-US')} ${currency || ''}`.trim();
};

const Hero = ({ proposal, isRTL, lang, onToggleLang }) => {
  const { ref, revealed } = useReveal();
  const { project = {}, branding = {}, pricing = {}, timeline = {}, client } = proposal;

  const title = (isRTL ? project.titleAr : project.title) || project.title || project.titleAr;
  const description = (isRTL ? project.descriptionAr : project.description) || project.description || project.descriptionAr;
  const clientName = client ? (isRTL ? client.nameAr : client.name) || client.name : null;

  const investmentValue = pricing.hidePriceFromClient
    ? t('finalPriceDiscussed', lang)
    : formatMoney(pricing.finalPrice, pricing.currency);

  const timelineValue = timeline.totalDuration
    ? (isRTL ? (timeline.totalDurationAr || timeline.totalDuration) : timeline.totalDuration)
    : project.estimatedDuration;

  return (
    <header className="pt-section pt-section--lg" style={{ paddingBottom: 'clamp(2.5rem, 4vw, 4rem)', overflow: 'hidden', position: 'relative' }}>
      <div className="pt-glow" style={{ width: 620, height: 620, top: -280, insetInlineStart: -220, background: 'radial-gradient(circle, rgb(var(--accent-rgb) / .12), transparent 72%)' }} aria-hidden="true" />
      <div className="pt-glow" style={{ width: 420, height: 420, top: -60, insetInlineEnd: -160, background: 'radial-gradient(circle, rgb(var(--gold-rgb) / .10), transparent 72%)' }} aria-hidden="true" />

      <div className="pt-container" style={{ position: 'relative', zIndex: 1 }} ref={ref}>
        <div {...reveal(revealed, '', { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 'clamp(2.75rem, 6vw, 4.5rem)' })}>
          <img
            src={branding.logoUrl || '/assets/image/logo/logo-2.png'}
            alt="YANSY Tech"
            style={{ height: 27, width: 'auto', objectFit: 'contain' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {clientName && (
              <p className="pt-caption" style={{ margin: 0 }}>
                {t('preparedFor', lang)} <strong style={{ color: 'rgb(var(--ink-700))', fontWeight: 700 }}>{clientName}</strong>
                {proposal.publishedAt && (
                  <>
                    <span style={{ opacity: .45, margin: '0 6px' }}>·</span>
                    <span className="num">{formatDate(proposal.publishedAt, lang)}</span>
                  </>
                )}
              </p>
            )}
            <button
              type="button"
              onClick={onToggleLang}
              aria-label={isRTL ? 'Switch to English' : 'التحويل للعربية'}
              className="pt-no-print"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                color: 'rgb(var(--ink-500))', background: 'rgb(var(--paper-2))', border: '1px solid rgb(var(--ink-200))',
                borderRadius: 100, padding: '6px 12px', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <Languages size={13} aria-hidden="true" />
              <span className="en">{isRTL ? 'EN' : 'AR'}</span>
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 900 }} className="pt-stack-md">
          <span {...reveal(revealed, 'pt-eyebrow')}>
            <span className="en">{(project.type || 'CUSTOM PLATFORM DEVELOPMENT').toUpperCase()}</span>
          </span>

          <h1 className="pt-display" {...reveal(revealed)}>{title}</h1>

          {description && (
            <p className="pt-body-lg" {...reveal(revealed, '', { maxWidth: 620 })}>{description}</p>
          )}
        </div>

        <div
          {...reveal(revealed, 'pt-hairline', { marginTop: 'clamp(2.75rem, 6vw, 4.5rem)', paddingTop: 'clamp(1.75rem, 3vw, 2.5rem)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' })}
        >
          <div style={{ paddingInlineEnd: 'clamp(1rem, 2vw, 2rem)' }}>
            <p className="pt-label">{t('execution', lang)}</p>
            <p className="pt-h3" style={{ marginTop: 10 }}><span className="en">Custom</span> {t('customExecution', lang)}</p>
          </div>
          <div style={{ paddingInline: 'clamp(1rem, 2vw, 2rem)', borderInlineStart: '1px solid rgb(var(--ink-200))' }}>
            <p className="pt-label">{t('timeline', lang)}</p>
            <p className="pt-h3" style={{ marginTop: 10 }}>{timelineValue || '—'}</p>
          </div>
          <div style={{ paddingInlineStart: 'clamp(1rem, 2vw, 2rem)', borderInlineStart: '1px solid rgb(var(--ink-200))' }}>
            <p className="pt-label" style={{ color: 'rgb(var(--accent-ink-rgb))' }}>{t('investment', lang)}</p>
            <p className="pt-h3" style={{ marginTop: 10, color: 'rgb(var(--accent-ink-rgb))' }}>{investmentValue}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Hero;
