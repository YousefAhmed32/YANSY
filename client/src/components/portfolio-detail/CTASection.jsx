import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Reveal from '../Reveal';
import { trackWhatsAppClick } from '../../utils/ga4';

const WHATSAPP_ICON_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';

/**
 * Closing CTA. Copy references the project's headline metric when one
 * exists ("Want results like +40% sales?") instead of the generic line
 * every case-study CTA on the site otherwise shares.
 */
const CTASection = ({ project, title, isRTL, onStartProject }) => {
  const topMetric = project.metrics?.[0];
  const waMsg = encodeURIComponent(
    isRTL ? `مرحباً! شفت مشروع "${title}" وأريد شيء مشابه.` : `Hi! I saw the "${title}" project and I'd love to build something similar.`
  );

  return (
    <section className="section-shell section-shell--plain" style={{ position: 'relative', overflow: 'hidden' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 640, height: 220, borderRadius: '50%', background: 'radial-gradient(ellipse, var(--accent-light) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <Reveal className="section-inner" style={{ maxWidth: 640, textAlign: 'center', position: 'relative', zIndex: 1 }} distance={16}>
        <span className="section-label" style={{ marginBottom: 22 }}>{isRTL ? 'الخطوة التالية' : "What's Next"}</span>

        <h2 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, letterSpacing: isRTL ? 0 : '-0.03em',
          lineHeight: 1.06, color: 'var(--text-primary)', marginBottom: 18,
        }}>
          {isRTL ? <><span style={{ color: 'var(--accent)' }}>أريد مشروعاً</span><br />مشابهاً لهذا</> : <>Want something<br /><span style={{ color: 'var(--accent)' }}>like this?</span></>}
        </h2>

        <p style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 40px', lineHeight: 1.7 }}>
          {topMetric
            ? (isRTL
                ? `هذا المشروع حقق ${topMetric.value} ${topMetric.labelAr || topMetric.label}. استشارة مجانية بدون التزام — نرد خلال 24 ساعة.`
                : `This project delivered ${topMetric.value} ${topMetric.label}. Free consultation, no obligation — we reply within 24 hours.`)
            : (isRTL ? 'استشارة مجانية بدون التزام. نرد خلال 24 ساعة.' : 'Free consultation, no obligation. We reply within 24 hours.')}
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onStartProject} className="btn-accent" style={{ fontSize: 13.5, padding: '14px 32px' }}>
            {isRTL ? 'ابدأ مشروعك' : 'Start Your Project'}
          </button>

          <a
            href={`https://wa.me/201090385390?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick('portfolio-detail')}
            className="btn-secondary"
            style={{ fontSize: 13.5, padding: '14px 32px', textDecoration: 'none', borderColor: 'rgba(37,211,102,0.35)', color: '#1a9c4a' }}
          >
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d={WHATSAPP_ICON_PATH} /></svg>
            {isRTL ? 'واتساب' : 'WhatsApp'}
          </a>
        </div>

        <div style={{ marginTop: 36 }}>
          <Link to="/portfolio" className="btn-ghost" style={{ display: 'inline-flex', fontSize: 12.5, textDecoration: 'none' }}>
            <ArrowLeft style={{ width: 13, height: 13, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
            {isRTL ? 'عودة للمحفظة' : 'Back to Portfolio'}
          </Link>
        </div>
      </Reveal>
    </section>
  );
};

export default CTASection;
