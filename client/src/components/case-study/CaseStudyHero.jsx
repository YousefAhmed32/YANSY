import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useLanguage } from '../../contexts/LanguageContext';
import CaseStudyVisual from '../CaseStudyVisual';
import BrowserMockupFrame from './BrowserMockupFrame';

const CaseStudyHero = ({ cs }) => {
  const { isRTL } = useLanguage();
  const heroRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-hero-anim]', { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out', delay: 0.1 });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="cs-hero" dir={isRTL ? 'rtl' : 'ltr'}>
      <style>{`
        .cs-hero { padding: 100px 0 clamp(3rem, 6vw, 4.5rem); position: relative; overflow: hidden; }
        .cs-hero__inner { max-width: 1280px; margin: 0 auto; padding: 0 clamp(1.25rem, 5vw, 3rem); text-align: ${isRTL ? 'right' : 'left'}; }
        .cs-hero__crumb { display: flex; align-items: center; gap: 8px; margin-bottom: 2rem; flex-direction: ${isRTL ? 'row-reverse' : 'row'}; justify-content: ${isRTL ? 'flex-end' : 'flex-start'}; }
        .cs-hero__crumb a { font-size: 11px; letter-spacing: ${isRTL ? 0 : '0.18em'}; text-transform: ${isRTL ? 'none' : 'uppercase'}; color: rgb(var(--text-tertiary)); text-decoration: none; }
        .cs-hero__crumb a:hover { color: rgb(var(--accent)); }
        .cs-hero__crumb-sep { color: rgb(var(--border-strong)); }
        .cs-hero__crumb-current { font-size: 11px; letter-spacing: ${isRTL ? 0 : '0.18em'}; text-transform: ${isRTL ? 'none' : 'uppercase'}; color: rgb(var(--accent)); font-weight: 600; }
        .cs-hero__meta { display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; flex-direction: ${isRTL ? 'row-reverse' : 'row'}; justify-content: ${isRTL ? 'flex-end' : 'flex-start'}; }
        .cs-hero__badge {
          padding: 5px 14px; border-radius: 100px; font-size: 11px; font-weight: 700;
          letter-spacing: ${isRTL ? 0 : '0.14em'}; text-transform: ${isRTL ? 'none' : 'uppercase'};
        }
        .cs-hero__duration { font-size: 11px; color: rgb(var(--text-tertiary)); letter-spacing: ${isRTL ? 0 : '0.1em'}; text-transform: ${isRTL ? 'none' : 'uppercase'}; }
        .cs-hero__title { font-size: clamp(2.6rem, 6.5vw, 5.5rem); font-weight: 800; line-height: 1.02; letter-spacing: -0.03em; margin-bottom: 1rem; max-width: 20ch; }
        [dir="rtl"] .cs-hero__title { letter-spacing: 0; line-height: 1.25; }
        .cs-hero__tagline { font-size: clamp(1.05rem, 2.2vw, 1.4rem); color: rgb(var(--text-secondary)); line-height: 1.5; max-width: 52ch; margin-bottom: 3rem; }
        [dir="ltr"] .cs-hero__tagline { font-style: italic; }
        .cs-hero__stats { position: absolute; bottom: 18px; inset-inline-start: 18px; inset-inline-end: 18px; display: grid; grid-template-columns: repeat(${Math.min(cs.results.length, 4)}, 1fr); gap: 10px; z-index: 2; }
        .cs-hero__stat { padding: 12px 14px; border-radius: 14px; background: rgba(13,17,23,0.4); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.14); }
        .cs-hero__stat-num { font-size: clamp(1.1rem, 2vw, 1.5rem); font-weight: 800; color: #fff; line-height: 1; font-variant-numeric: tabular-nums; }
        .cs-hero__stat-label { font-size: 10px; color: rgba(255,255,255,0.68); margin-top: 4px; }
        .cs-hero__gradient { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 44%); pointer-events: none; }
        @media (max-width: 640px) {
          .cs-hero__stats { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <div className="cs-hero__inner">
        <nav data-hero-anim className="opacity-0 cs-hero__crumb" aria-label={isRTL ? 'مسار التنقل' : 'Breadcrumb'}>
          <Link to="/">{isRTL ? 'الرئيسية' : 'Home'}</Link>
          <span className="cs-hero__crumb-sep" aria-hidden>{isRTL ? '‹' : '›'}</span>
          <Link to="/case-studies">{isRTL ? 'أعمالنا' : 'Case Studies'}</Link>
          <span className="cs-hero__crumb-sep" aria-hidden>{isRTL ? '‹' : '›'}</span>
          <span className="cs-hero__crumb-current">{cs.title}</span>
        </nav>

        <div data-hero-anim className="opacity-0 cs-hero__meta">
          <span className="cs-hero__badge" style={{ background: `${cs.color}12`, color: cs.color, border: `1px solid ${cs.color}35` }}>
            {isRTL ? cs.industry.ar : cs.industry.en}
          </span>
          <span className="cs-hero__duration">{isRTL ? cs.duration.ar : cs.duration.en} · {cs.year}</span>
        </div>

        <h1 data-hero-anim className="opacity-0 cs-hero__title">{cs.title}</h1>
        <p data-hero-anim className="opacity-0 cs-hero__tagline">{isRTL ? cs.tagline.ar : cs.tagline.en}</p>

        <div data-hero-anim className="opacity-0" style={{ position: 'relative' }}>
          <BrowserMockupFrame url={`app.${cs.slug}.com`}>
            <CaseStudyVisual
              slug={cs.slug}
              industryKey={cs.industryKey}
              color={cs.color}
              variant="hero"
              isRTL={isRTL}
              alt={`${cs.title} — ${isRTL ? cs.tagline.ar : cs.tagline.en}`}
            />
            <div className="cs-hero__gradient" aria-hidden />
            <div className="cs-hero__stats">
              {cs.results.map((r, i) => (
                <div key={i} className="cs-hero__stat">
                  <div className="cs-hero__stat-num" dir="ltr">{r.metric}</div>
                  <div className="cs-hero__stat-label">{isRTL ? r.label.ar : r.label.en}</div>
                </div>
              ))}
            </div>
          </BrowserMockupFrame>
        </div>
      </div>
    </section>
  );
};

export default CaseStudyHero;
