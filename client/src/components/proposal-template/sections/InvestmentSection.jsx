import { useReveal } from '../../../hooks/useReveal';
import { reveal } from '../revealHelper';
import { t, pickLang } from '../copy';

const formatMoney = (n) => (Number(n) || 0).toLocaleString('en-US');

const InvestmentSection = ({ pricing, isRTL, lang }) => {
  const { ref, revealed } = useReveal();
  const milestones = [...(pricing?.milestones || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  const showMilestones = !pricing.hidePriceFromClient && milestones.length > 0 && pricing.paymentScheduleType !== 'full';

  return (
    <section className="pt-section pt-section--lg pt-band-dark" ref={ref}>
      <div className="pt-glow" style={{ width: 560, height: 560, top: -220, insetInlineStart: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgb(var(--accent-rgb) / .22), transparent 72%)' }} aria-hidden="true" />
      <div className="pt-container" style={{ position: 'relative', zIndex: 1 }}>
        <div {...reveal(revealed, '', { maxWidth: 720, margin: '0 auto', textAlign: 'center' })}>
          <span className="pt-eyebrow pt-eyebrow--on-dark" style={{ justifyContent: 'center' }}>
            <span className="en">PROJECT INVESTMENT</span>
          </span>
          <h2 className="pt-h1" style={{ color: '#fff', marginTop: 16 }}>{pickLang(isRTL, 'الاستثمار في المشروع', 'Project Investment')}</h2>

          {pricing.hidePriceFromClient ? (
            <p className="pt-body-lg" style={{ color: 'rgba(255,255,255,.6)', marginTop: 20 }}>{t('finalPriceDiscussed', lang)}</p>
          ) : (
            <>
              <p className="pt-num-lg" style={{ color: '#fff', marginTop: 26 }}><span className="num">{formatMoney(pricing.finalPrice)}</span></p>
              <p className="pt-h3" style={{ color: 'rgba(255,255,255,.55)', fontWeight: 600, marginTop: 2 }}>{pricing.currency}</p>
            </>
          )}
        </div>

        {showMilestones && (
          <div {...reveal(revealed, '', { maxWidth: 780, margin: 'clamp(2.5rem, 5vw, 3.5rem) auto 0', borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: 'clamp(1.75rem, 3vw, 2.5rem)' })}>
            <p className="pt-label" style={{ display: 'block', textAlign: 'center', marginBottom: 18, color: 'rgba(255,255,255,.4)' }}>
              {pickLang(isRTL, 'جدول الدفعات', 'PAYMENT SCHEDULE')}
            </p>
            <div className="pt-bgrid" style={{ gridTemplateColumns: `repeat(${Math.min(milestones.length, 4)}, 1fr)`, gap: 10 }}>
              {milestones.map((m, i) => (
                <div key={m._id || i} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 'var(--r-sm)', padding: '14px 16px', textAlign: 'center' }}>
                  <p className="pt-h3" style={{ color: '#fff', fontSize: '1.1rem' }}>
                    {m.percentage != null ? <span className="num">{m.percentage}%</span> : <span className="num">{formatMoney(m.amount)}</span>}
                  </p>
                  <p className="pt-caption" style={{ color: 'rgba(255,255,255,.6)', marginTop: 4 }}>{pickLang(isRTL, m.nameAr, m.name)}</p>
                  {(m.dueCondition || m.dueConditionAr) && (
                    <p className="pt-caption" style={{ color: 'rgba(255,255,255,.35)', marginTop: 2 }}>{pickLang(isRTL, m.dueConditionAr, m.dueCondition)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default InvestmentSection;
