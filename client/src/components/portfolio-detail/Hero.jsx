import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ExternalLink } from 'lucide-react';
import ProgressiveImage from '../ProgressiveImage';
import { categoryLabel, categoryIcon } from '../../utils/portfolioTaxonomy';

gsap.registerPlugin(ScrollTrigger);

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

/**
 * Editorial hero — title as real page content (not text stamped over a dark
 * photo), then a large contained visual panel with floating glass badges.
 * Mirrors the pattern already shipped in CaseStudyDetail.jsx rather than the
 * previous full-bleed dark-image treatment, which read as "agency reel" —
 * tonally off for a site whose whole design system is light/enterprise-SaaS.
 */
const Hero = ({ project, title, desc, isRTL }) => {
  const font = isRTL ? FONT_AR : FONT_EN;
  const heroRef  = useRef(null);
  const panelRef = useRef(null);
  const imgWrapRef = useRef(null);

  useEffect(() => {
    if (!heroRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      heroRef.current.querySelectorAll('[data-fade]').forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-fade]', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', delay: 0.1 });

      if (panelRef.current && imgWrapRef.current) {
        gsap.fromTo(imgWrapRef.current, { yPercent: -4 }, {
          yPercent: 4, ease: 'none',
          scrollTrigger: { trigger: panelRef.current, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      }
    }, heroRef);
    return () => ctx.revert();
  }, [project?._id]);

  const metrics = (project.metrics || []).slice(0, 4);
  const hasMetrics = metrics.length > 0;

  return (
    <div ref={heroRef} style={{ paddingTop: 'calc(68px + clamp(2rem, 5vw, 3.5rem))', paddingBottom: 0, position: 'relative' }}>
      <div className="max-w-7xl mx-auto" style={{ padding: '0 clamp(1.25rem, 5vw, 3rem)', textAlign: isRTL ? 'right' : 'left' }}>

        {/* Breadcrumb */}
        <nav data-fade aria-label={isRTL ? 'مسار التنقل' : 'Breadcrumb'} style={{ opacity: 0, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
          <Link to="/" style={{ fontSize: 11, letterSpacing: isRTL ? 0 : '0.16em', textTransform: isRTL ? 'none' : 'uppercase', color: 'var(--text-tertiary)', textDecoration: 'none' }}>{isRTL ? 'الرئيسية' : 'Home'}</Link>
          <span aria-hidden style={{ color: 'var(--border-strong)' }}>{isRTL ? '‹' : '›'}</span>
          <Link to="/portfolio" style={{ fontSize: 11, letterSpacing: isRTL ? 0 : '0.16em', textTransform: isRTL ? 'none' : 'uppercase', color: 'var(--text-tertiary)', textDecoration: 'none' }}>{isRTL ? 'المحفظة' : 'Portfolio'}</Link>
          <span aria-hidden style={{ color: 'var(--border-strong)' }}>{isRTL ? '‹' : '›'}</span>
          <span style={{ fontSize: 11, letterSpacing: isRTL ? 0 : '0.16em', textTransform: isRTL ? 'none' : 'uppercase', color: 'var(--accent)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        </nav>

        {/* Eyebrow badges */}
        <div data-fade style={{ opacity: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 22, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
          <span className="section-label">{categoryLabel(project.category, isRTL ? 'ar' : 'en')}</span>
          {project.industry && (
            <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontFamily: font }}>{project.industry}</span>
          )}
          {project.year && (
            <>
              <span aria-hidden style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border-strong)' }} />
              <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{project.year}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 data-fade style={{
          opacity: 0, fontFamily: font, fontSize: 'clamp(2.5rem, 6vw, 5.25rem)', fontWeight: 800,
          lineHeight: isRTL ? 1.18 : 1.02, letterSpacing: isRTL ? 0 : '-0.035em', color: 'var(--text-primary)',
          maxWidth: '18ch', marginBottom: 22, marginInlineStart: isRTL ? 'auto' : 0,
        }}>
          {title}
        </h1>

        {/* Lead — the project description, read here rather than repeated below */}
        {desc && (
          <p data-fade style={{
            opacity: 0, fontFamily: font, fontSize: 'clamp(1.0625rem, 2vw, 1.375rem)', fontWeight: 400,
            color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '56ch', marginBottom: 'clamp(2.5rem, 5vw, 3.5rem)',
            marginInlineStart: isRTL ? 'auto' : 0,
          }}>
            {desc}
          </p>
        )}

        {/* Visual panel */}
        <div
          ref={panelRef}
          data-fade
          className="hero-panel"
          style={{
            opacity: 0, position: 'relative', width: '100%', borderRadius: 'var(--radius-xl)',
            overflow: 'hidden', boxShadow: 'var(--shadow-hero)', border: '1px solid var(--border)',
          }}
        >
          <div ref={imgWrapRef} style={{ position: 'absolute', inset: '-5% 0', willChange: 'transform' }}>
            <ProgressiveImage
              asset={project.coverImage?.url ? project.coverImage : (project.gallery || []).find((g) => g?.url) || null}
              alt={title}
              priority
              fill
              fallbackIcon={categoryIcon(project.category)}
              fallbackLabel={categoryLabel(project.category, isRTL ? 'ar' : 'en')}
              isRTL={isRTL}
              fallbackVariant="hero"
            />
          </div>
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,17,23,0.65) 0%, transparent 46%)' }} />

          {project.industry && (
            <div style={{
              position: 'absolute', top: 18, [isRTL ? 'right' : 'left']: 18,
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '7px 15px', borderRadius: 999,
              background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.22)',
            }}>
              <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
              <span style={{ fontFamily: font, fontSize: 11, fontWeight: 500, color: '#fff', letterSpacing: isRTL ? 0 : '0.08em', textTransform: isRTL ? 'none' : 'uppercase' }}>
                {project.industry}
              </span>
            </div>
          )}

          {hasMetrics ? (
            <div className="hero-stats-row" style={{
              position: 'absolute', bottom: 18, insetInlineStart: 18, insetInlineEnd: 18,
              display: 'grid', gridTemplateColumns: `repeat(${metrics.length}, 1fr)`, gap: 10,
            }}>
              {metrics.map((m, i) => (
                <div key={i} style={{
                  padding: '13px 15px', borderRadius: 14,
                  background: 'rgba(13,17,23,0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.14)',
                }}>
                  <div style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.1rem,2vw,1.5rem)', fontWeight: 700, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }} dir="ltr">{m.value}</div>
                  <div style={{ fontFamily: font, fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.68)', marginTop: 5, letterSpacing: isRTL ? 0 : '0.04em' }}>{isRTL && m.labelAr ? m.labelAr : m.label}</div>
                </div>
              ))}
            </div>
          ) : project.liveUrl ? (
            <a
              href={project.liveUrl} target="_blank" rel="noopener noreferrer"
              style={{
                position: 'absolute', bottom: 18, [isRTL ? 'right' : 'left']: 18,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 20px', borderRadius: 999,
                background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.28)', color: '#fff', textDecoration: 'none',
                fontFamily: font, fontSize: 12, fontWeight: 500,
              }}
            >
              <ExternalLink style={{ width: 13, height: 13 }} aria-hidden />
              {isRTL ? 'زيارة الموقع المباشر' : 'Visit Live Site'}
            </a>
          ) : null}
        </div>
      </div>

      <MetaStrip project={project} isRTL={isRTL} font={font} />

      <style>{`
        .hero-panel { aspect-ratio: 16 / 9; }
        @media (max-width: 640px) {
          .hero-panel { aspect-ratio: 4 / 5; }
          .hero-stats-row { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
};

/* ── Meta strip ───────────────────────────────────────────────────────────── */
const MetaStrip = ({ project, isRTL, font }) => {
  const fields = [
    project.duration && { label: isRTL ? 'المدة' : 'Duration', value: project.duration },
    project.teamSize && { label: isRTL ? 'الفريق' : 'Team', value: project.teamSize },
    project.tags?.length > 0 && { label: isRTL ? 'التقنيات' : 'Technologies', value: String(project.tags.length) },
  ].filter(Boolean);

  if (!fields.length && !project.liveUrl) return null;

  return (
    <div style={{ borderBottom: '1px solid var(--border)', marginTop: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
      <div className="max-w-7xl mx-auto" style={{
        padding: 'clamp(20px, 3vw, 30px) clamp(1.25rem, 5vw, 3rem)',
        display: 'flex', flexWrap: 'wrap', gap: '20px 44px', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 44px', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          {fields.map((f, i) => (
            <div key={i} style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <p style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 600 }}>{f.label}</p>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, fontFamily: font }}>{f.value}</p>
            </div>
          ))}
        </div>

        {project.liveUrl && (
          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ textDecoration: 'none', fontSize: 12.5 }}>
            <ExternalLink style={{ width: 14, height: 14 }} aria-hidden />
            {isRTL ? 'عرض المشروع المباشر' : 'View Live Project'}
          </a>
        )}
      </div>
    </div>
  );
};

export default Hero;
