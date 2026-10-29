import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Check, Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { trackCTAClick } from '../utils/ga4';
import { trackWhatsAppHover, trackWhatsAppClick } from '../utils/analytics';
import WhatsAppGlyph from './WhatsAppGlyph';
import './MobileHeroSection.css';

const COVER = '/assets/hero/mobile/01-digital-city-v1.webp';
const STATS = [
  { value: '50+', key: 'projects' },
  { value: '4.9/5', key: 'rating', rating: true },
  { value: '48h', key: 'proposal' },
  { value: '5+', key: 'experience' },
];

const MobileHeroSection = forwardRef(function MobileHeroSection({ onStartProject }, ref) {
  const { isRTL, language } = useLanguage();
  const { t } = useTranslation(undefined, { lng: language });
  const [coverFailed, setCoverFailed] = useState(false);
  const text = key => t(`landing.mobileHero.${key}`);

  return (
    <section
      ref={ref}
      id="hero"
      className="hero-section mobile-hero"
      dir={isRTL ? 'rtl' : 'ltr'}
      lang={language}
      aria-labelledby="mobile-hero-title"
    >
      <div className="hero-inner">
        <div className={`hero-grid${coverFailed ? ' hero-grid--text-only' : ''}`}>
          <div className="hero-copy">
            <div className="hero-studio-line">
              <span className="hero-studio-label">{text('studio')}</span>
              <span className="hero-availability"><span aria-hidden="true" />{text('availability')}</span>
            </div>
            <h1 id="mobile-hero-title" className="hero-h1">
              <span className="hero-h1-lead">{text('headline')}</span>{' '}
              <span className="hero-h1-accent">{text('accent')}</span>
            </h1>
            <p className="hero-description">{text('description')}</p>
            <div className="hero-cta-group">
              <a
                href={`https://wa.me/201090385390?text=${encodeURIComponent(text('whatsappMessage'))}`}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => trackWhatsAppHover('hero')}
                onClick={() => { trackWhatsAppClick('hero'); trackCTAClick('hero-whatsapp-direct'); }}
                className="hero-cta-whatsapp"
              >
                <WhatsAppGlyph size={21} />
                <span>{text('whatsapp')}</span>
              </a>
              <button
                type="button"
                onClick={() => { trackCTAClick('hero-primary'); onStartProject?.(); }}
                className="hero-cta-wa"
              >
                <span>{text('project')}</span>
                <ArrowUpRight size={17} className="icon-directional" aria-hidden="true" />
              </button>
            </div>
            <p className="hero-assurance"><Check size={14} aria-hidden="true" /><span>{text('assurance')}</span></p>
          </div>
          {/* Copy-free artwork is shared across languages; keep the original
              lighting and composition rather than mirroring a raster scene. */}
          {!coverFailed && (
            <figure className="hero-cover" aria-hidden="true">
              <img src={COVER} alt="" width={1024} height={1536} loading="eager" fetchPriority="high" decoding="async" onError={() => setCoverFailed(true)} />
            </figure>
          )}
        </div>
        <ul className="hero-stats" aria-label={text('proofLabel')}>
          {STATS.map(stat => (
            <li key={stat.key} className="hero-stat">
              <div className="hero-stat-num">
                <bdi dir="ltr">{stat.value}</bdi>
                {stat.rating && <Star className="hero-rating-star" size={20} aria-hidden="true" />}
              </div>
              <div className="hero-stat-label">{text(`stats.${stat.key}`)}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
});

export default MobileHeroSection;
