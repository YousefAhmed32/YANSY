import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Briefcase, Clock, ExternalLink, Figma, Github, Layers, MapPin, ShieldCheck, Users } from 'lucide-react';
import ProgressiveImage from '../ProgressiveImage';
import { mediaSrc } from '../../utils/media';
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
  const videoRef = useRef(null);

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

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, [project?.coverVideo?.url]);

  const metrics = (project.metrics || []).slice(0, 4);
  const hasMetrics = metrics.length > 0;
  const tagline = isRTL ? (project.taglineAr || project.tagline) : (project.tagline || project.taglineAr);
  const clientName = isRTL ? (project.clientNameAr || project.clientName) : (project.clientName || project.clientNameAr);
  const location = isRTL ? (project.locationAr || project.location) : (project.location || project.locationAr);

  return (
    <div ref={heroRef} style={{ paddingTop: 'calc(68px + clamp(2rem, 5vw, 3.5rem))', paddingBottom: 0, position: 'relative' }}>
      <div className="max-w-7xl mx-auto" style={{ padding: '0 clamp(1.25rem, 5vw, 3rem)', textAlign: isRTL ? 'right' : 'left' }}>

        {/* Breadcrumb */}
        <nav data-fade aria-label={isRTL ? 'مسار التنقل' : 'Breadcrumb'} style={{ opacity: 0, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
          <Link to="/" style={{ fontSize: 11, letterSpacing: isRTL ? 0 : '0.16em', textTransform: isRTL ? 'none' : 'uppercase', color: 'rgb(var(--text-tertiary))', textDecoration: 'none' }}>{isRTL ? 'الرئيسية' : 'Home'}</Link>
          <span aria-hidden style={{ color: 'rgb(var(--border-strong))' }}>{isRTL ? '‹' : '›'}</span>
          <Link to="/portfolio" style={{ fontSize: 11, letterSpacing: isRTL ? 0 : '0.16em', textTransform: isRTL ? 'none' : 'uppercase', color: 'rgb(var(--text-tertiary))', textDecoration: 'none' }}>{isRTL ? 'المحفظة' : 'Portfolio'}</Link>
          <span aria-hidden style={{ color: 'rgb(var(--border-strong))' }}>{isRTL ? '‹' : '›'}</span>
          <span style={{ fontSize: 11, letterSpacing: isRTL ? 0 : '0.16em', textTransform: isRTL ? 'none' : 'uppercase', color: 'rgb(var(--accent))', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        </nav>

        {/* Eyebrow badges */}
        <div data-fade style={{ opacity: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 16, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
          <span className="section-label">{categoryLabel(project.category, isRTL ? 'ar' : 'en')}</span>
          {project.industry && (
            <span style={{ fontSize: 11.5, color: 'rgb(var(--text-tertiary))', fontFamily: font }}>{project.industry}</span>
          )}
          {project.year && (
            <>
              <span aria-hidden style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgb(var(--border-strong))' }} />
              <span style={{ fontSize: 11.5, color: 'rgb(var(--text-tertiary))' }}>{project.year}</span>
            </>
          )}
        </div>

        {/* Client line — real name+logo when public, a neutral "confidential" note when redacted */}
        {(clientName || project.confidential) && (
          <div data-fade style={{ opacity: 0, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
            {clientName ? (
              <>
                {project.clientLogo?.url && (
                  <img src={mediaSrc(project.clientLogo)} alt="" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'contain', border: '1px solid rgb(var(--border))', background: '#fff' }} />
                )}
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgb(var(--text-primary))', fontFamily: font }}>{clientName}</span>
              </>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgb(var(--text-tertiary))', fontFamily: font }}>
                <ShieldCheck style={{ width: 13, height: 13 }} aria-hidden />
                {isRTL ? 'تفاصيل العميل سرية' : 'Client details confidential'}
              </span>
            )}
            {location && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgb(var(--text-tertiary))' }}>
                <MapPin style={{ width: 12, height: 12 }} aria-hidden /> {location}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h1 data-fade style={{
          opacity: 0, fontFamily: font, fontSize: 'clamp(2.5rem, 6vw, 5.25rem)', fontWeight: 800,
          lineHeight: isRTL ? 1.18 : 1.02, letterSpacing: isRTL ? 0 : '-0.035em', color: 'rgb(var(--text-primary))',
          maxWidth: '18ch', marginBottom: tagline ? 14 : 22, marginInlineStart: isRTL ? 'auto' : 0,
        }}>
          {title}
        </h1>

        {/* Tagline — the project's one-line elevator pitch, distinct from the
            fuller description below it */}
        {tagline && (
          <p data-fade style={{
            opacity: 0, fontFamily: font, fontSize: 'clamp(1.125rem, 2.2vw, 1.5rem)', fontWeight: 500,
            color: 'rgb(var(--accent))', lineHeight: 1.4, maxWidth: '48ch', marginBottom: 14,
            marginInlineStart: isRTL ? 'auto' : 0,
          }}>
            {tagline}
          </p>
        )}

        {desc && (
          <p data-fade style={{
            opacity: 0, fontFamily: font, fontSize: 'clamp(1rem, 1.6vw, 1.1875rem)', fontWeight: 400,
            color: 'rgb(var(--text-secondary))', lineHeight: 1.6, maxWidth: '56ch', marginBottom: 'clamp(2.5rem, 5vw, 3.5rem)',
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
            overflow: 'hidden', boxShadow: 'var(--shadow-hero)', border: '1px solid rgb(var(--border))',
          }}
        >
          <div ref={imgWrapRef} style={{ position: 'absolute', inset: '-5% 0', willChange: 'transform' }}>
            {project.coverVideo?.url ? (
              <video
                ref={videoRef}
                src={mediaSrc(project.coverVideo)}
                poster={mediaSrc(project.coverImage)}
                muted loop playsInline autoPlay
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
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
            )}
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
              <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgb(var(--accent))' }} />
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

/* ── Spec strip ───────────────────────────────────────────────────────────── */
const LINK_PILL = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'rgb(var(--text-secondary))', textDecoration: 'none', padding: '8px 14px', borderRadius: 999, border: '1px solid rgb(var(--border))', transition: 'border-color 0.2s, color 0.2s' };

const SpecItem = ({ Icon, label, children, isRTL }) => (
  <div className="spec-item" style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row', textAlign: isRTL ? 'right' : 'left' }}>
    <div aria-hidden style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'rgb(var(--accent-light))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon style={{ width: 15, height: 15, color: 'rgb(var(--accent))' }} />
    </div>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgb(var(--text-tertiary))', marginBottom: 3, fontWeight: 600 }}>{label}</p>
      {children}
    </div>
  </div>
);

/**
 * Fact strip beneath the hero panel, restyled as icon-forward "spec cards"
 * (Apple product-page convention) instead of the plain label/value text
 * pairs this replaces — those read as leftover metadata; this reads as a
 * deliberate at-a-glance summary before the reader commits to the full
 * story below.
 */
const MetaStrip = ({ project, isRTL, font }) => {
  const myRole = isRTL ? (project.myRoleAr || project.myRole) : (project.myRole || project.myRoleAr);
  const fields = [
    myRole && { Icon: Briefcase, label: isRTL ? 'دورنا' : 'Our Role', value: myRole },
    project.duration && { Icon: Clock, label: isRTL ? 'المدة' : 'Duration', value: project.duration },
    project.teamSize && !project.team?.length && { Icon: Users, label: isRTL ? 'الفريق' : 'Team', value: project.teamSize },
    project.tags?.length > 0 && { Icon: Layers, label: isRTL ? 'التقنيات' : 'Tech Stack', value: isRTL ? `${project.tags.length} تقنية` : `${project.tags.length} technologies` },
  ].filter(Boolean);

  const links = [
    project.liveUrl  && { href: project.liveUrl,  label: isRTL ? 'الموقع المباشر' : 'Live Site', Icon: ExternalLink },
    project.figmaUrl  && { href: project.figmaUrl,  label: 'Figma', Icon: Figma },
    project.githubUrl && { href: project.githubUrl, label: 'GitHub', Icon: Github },
  ].filter(Boolean);

  if (!fields.length && !links.length && !project.team?.length) return null;

  return (
    <div style={{ borderBottom: '1px solid rgb(var(--border))', marginTop: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
      <div className="max-w-7xl mx-auto spec-strip" style={{
        padding: 'clamp(22px, 3vw, 32px) clamp(1.25rem, 5vw, 3rem)',
        display: 'flex', flexWrap: 'wrap', gap: '22px clamp(28px, 4vw, 48px)', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '22px clamp(28px, 4vw, 48px)', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          {fields.map((f, i) => (
            <SpecItem key={i} Icon={f.Icon} label={f.label} isRTL={isRTL}>
              <p style={{ fontSize: 14, color: 'rgb(var(--text-primary))', fontWeight: 600, fontFamily: font }}>{f.value}</p>
            </SpecItem>
          ))}

          {project.team?.length > 0 && (
            <SpecItem Icon={Users} label={isRTL ? 'فريق العمل' : 'Team'} isRTL={isRTL}>
              <div style={{ display: 'flex', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                {project.team.slice(0, 6).map((m, i) => (
                  <div
                    key={i}
                    title={`${m.name}${m.role ? ` — ${isRTL ? (m.roleAr || m.role) : m.role}` : ''}`}
                    style={{
                      width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                      border: '2px solid #fff', boxShadow: '0 0 0 1px rgb(var(--border))',
                      marginInlineStart: i > 0 ? -8 : 0,
                      background: 'rgb(var(--accent-light))', color: 'rgb(var(--accent))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700,
                    }}
                  >
                    {m.avatar?.url ? <img src={mediaSrc(m.avatar)} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.name?.[0]?.toUpperCase()}
                  </div>
                ))}
              </div>
            </SpecItem>
          )}
        </div>

        {links.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {links.map((link) => {
              const LinkIcon = link.Icon;
              return (
                <a
                  key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" style={LINK_PILL}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgb(var(--border-strong))'; e.currentTarget.style.color = 'rgb(var(--text-primary))'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgb(var(--border))'; e.currentTarget.style.color = 'rgb(var(--text-secondary))'; }}
                >
                  <LinkIcon style={{ width: 14, height: 14 }} aria-hidden />
                  {link.label}
                </a>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .spec-strip .spec-item:not(:last-child) { position: relative; }
        @media (min-width: 640px) {
          .spec-strip > div:first-child { position: relative; }
          .spec-strip .spec-item:not(:last-child)::after {
            content: ''; position: absolute; top: 50%; transform: translateY(-50%);
            inset-inline-end: calc(-1 * clamp(14px, 2vw, 24px)); width: 1px; height: 28px; background: rgb(var(--border));
          }
        }
      `}</style>
    </div>
  );
};

export default Hero;
