import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Figma, Github, Info } from 'lucide-react';
import Header from '../Header';
import Footer from '../Footer';
import ProjectRequestForm from '../ProjectRequestForm';
import ProgressiveImage from '../ProgressiveImage';
import BlockRenderer from './BlockRenderer';
import Gallery from './Gallery';
import Lightbox from './Lightbox';
import NextProject from './NextProject';
import CTASection from './CTASection';
import HighlightsList from './HighlightsList';
import { mediaSrc } from '../../utils/media';
import { categoryIcon } from '../../utils/portfolioTaxonomy';
import { sanitizeLiveUrl, getLiveActionLabel } from '../../utils/liveUrl';
import { projectOriginLabel } from '../../utils/portfolioOrigin';
import { CoverActionCta, COVER_LINK_CSS } from './CoverLink';

const FONT_EN = "'Inter',system-ui,sans-serif";
const FONT_AR = "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif";

/**
 * Quick Showcase renderer — deliberately short and visual-first, NOT a
 * trimmed-down copy of the full case-study page (see PortfolioDetailView.jsx
 * for that). No Story/Process/Impact/Proof/FAQ sections exist here at all
 * (not "hidden when empty" — genuinely absent), because a showcase project
 * was never asked to fill those fields in (see PortfolioQuickShowcase.jsx).
 *
 * Media renders straight from `blocks[]` via the shared BlockRenderer — the
 * exact same component the full case study's "The Build" section uses — so
 * an image/video block looks and behaves identically everywhere it appears
 * on the site, and the admin's ordered image/video editor in
 * PortfolioQuickShowcase IS this page's content, not a separate model.
 *
 * `PortfolioDetail.jsx`/`PortfolioPreview.jsx` choose this component over
 * `PortfolioDetailView` purely by `project.presentationMode` — same fetch,
 * same data shape, no second route or duplicated loading logic.
 */
const PortfolioShowcaseView = ({ project, related, isRTL, dir }) => {
  const font = isRTL ? FONT_AR : FONT_EN;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [nextProject, ...moreProjects] = related;

  // Project Screenshots — a gallery SEPARATE from Cover Image (never
  // prepends it, unlike the full case study's filmstrip) so the cover never
  // renders twice. See PortfolioQuickShowcase.jsx's "Project Screenshots"
  // section — this is exactly what that writes to `project.gallery`.
  const screenshots = (project.gallery || []).filter((g) => g?.url);
  const [activeShot, setActiveShot] = useState(0);
  const [shotLightbox, setShotLightbox] = useState(false);
  const prevShot = useCallback(() => setActiveShot((i) => (i - 1 + screenshots.length) % screenshots.length), [screenshots.length]);
  const nextShot = useCallback(() => setActiveShot((i) => (i + 1) % screenshots.length), [screenshots.length]);

  const title = isRTL && project.titleAr ? project.titleAr : project.title;
  const desc  = isRTL && project.descriptionAr ? project.descriptionAr : project.description;
  const categoryName = project.category?.name || '';
  const categoryDisplay = isRTL ? (project.category?.nameAr || categoryName) : categoryName;
  const projectTypeName = project.projectType?.name || '';
  const projectTypeDisplay = isRTL ? (project.projectType?.nameAr || projectTypeName) : projectTypeName;
  const clientName = isRTL ? (project.client?.nameAr || project.client?.name) : (project.client?.name || project.client?.nameAr);

  const isConceptWork = project.deliveryStatus === 'concept';
  const isArchived = project.deliveryStatus === 'archived';
  const originLabel = projectOriginLabel(project.projectOrigin, isRTL);
  const highlights = (project.highlights || []).filter((h) => h?.text || h?.textAr);
  const liveUrl = sanitizeLiveUrl(project.liveUrl);
  const liveLinkLabel = getLiveActionLabel(isRTL, isConceptWork);
  const coverAriaLabel = isRTL ? `زيارة موقع مشروع ${title}` : `Visit the ${title} website`;
  const showBrandDisclosure = isConceptWork && Boolean(clientName);

  const links = [
    liveUrl           && { href: liveUrl,          label: liveLinkLabel, Icon: ExternalLink },
    project.figmaUrl  && { href: project.figmaUrl,  label: 'Figma', Icon: Figma },
    project.githubUrl && { href: project.githubUrl, label: 'GitHub', Icon: Github },
  ].filter(Boolean);

  const coverAsset = project.coverImage?.url ? project.coverImage : null;
  const isVideoCover = Boolean(project.coverVideo?.url);
  // Static covers become the click target themselves; a <video controls>
  // cover never gets wrapped (would swallow clicks meant for its native
  // play/seek/volume/fullscreen bar) — it gets a separate standalone CTA
  // pinned to a top corner instead, clear of the control bar at the bottom.
  const coverClickable = Boolean(liveUrl) && !isVideoCover && Boolean(coverAsset);
  const coverStyle = { position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid rgb(var(--border))', boxShadow: 'var(--shadow-lg)', background: '#000' };

  return (
    <div className="bg-surface-white text-content-primary min-h-screen overflow-x-hidden" dir={dir}>
      <Header onStartProject={() => setIsFormOpen(true)} />

      {/* ── Compact hero ─────────────────────────────────────────────────── */}
      <div style={{ paddingTop: 'calc(68px + clamp(2rem, 5vw, 3rem))' }}>
        <div className="max-w-4xl mx-auto" style={{ padding: '0 clamp(1.25rem, 5vw, 3rem)', textAlign: isRTL ? 'right' : 'left' }}>
          <nav aria-label={isRTL ? 'مسار التنقل' : 'Breadcrumb'} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
            <Link to="/portfolio" style={{ fontSize: 11, letterSpacing: isRTL ? 0 : '0.16em', textTransform: isRTL ? 'none' : 'uppercase', color: 'rgb(var(--text-tertiary))', textDecoration: 'none' }}>{isRTL ? 'المحفظة' : 'Portfolio'}</Link>
            <span aria-hidden style={{ color: 'rgb(var(--border-strong))' }}>{isRTL ? '‹' : '›'}</span>
            <span style={{ fontSize: 11, letterSpacing: isRTL ? 0 : '0.16em', textTransform: isRTL ? 'none' : 'uppercase', color: 'rgb(var(--accent))', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          </nav>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 16, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
            <span className="section-label">{isRTL ? 'عرض سريع' : 'Quick Showcase'}</span>
            {projectTypeDisplay && <span style={{ fontSize: 11.5, color: 'rgb(var(--text-tertiary))', fontFamily: font }}>{projectTypeDisplay}</span>}
            {project.year && (
              <>
                <span aria-hidden style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgb(var(--border-strong))' }} />
                <span style={{ fontSize: 11.5, color: 'rgb(var(--text-tertiary))' }}>{project.year}</span>
              </>
            )}
            {isConceptWork && (
              <span style={{ fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: 'rgb(var(--accent-light))', color: 'rgb(var(--accent))' }}>
                {isRTL ? 'مشروع تصوّري' : 'Concept'}
              </span>
            )}
            {isArchived && (
              <span style={{ fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: 'rgb(var(--bg-surface))', color: 'rgb(var(--text-tertiary))' }}>
                {isRTL ? 'مؤرشف' : 'Archived'}
              </span>
            )}
            {originLabel && (
              <span style={{ fontSize: 10.5, fontWeight: 600, padding: '4px 10px', borderRadius: 999, border: '1px solid rgb(var(--border))', color: 'rgb(var(--text-tertiary))' }}>
                {originLabel}
              </span>
            )}
          </div>

          <h1 style={{
            fontFamily: font, fontSize: 'clamp(2rem, 4.6vw, 3.5rem)', fontWeight: 800,
            lineHeight: isRTL ? 1.22 : 1.06, letterSpacing: isRTL ? 0 : '-0.03em', color: 'rgb(var(--text-primary))',
            marginBottom: 14, marginInlineStart: isRTL ? 'auto' : 0,
          }}>
            {title}
          </h1>

          {desc && (
            <p style={{
              fontFamily: font, fontSize: 'clamp(1rem, 1.6vw, 1.1875rem)', color: 'rgb(var(--text-secondary))',
              lineHeight: 1.6, maxWidth: '58ch', marginBottom: 22, marginInlineStart: isRTL ? 'auto' : 0,
            }}>
              {desc}
            </p>
          )}

          {(clientName || links.length > 0) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 8, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
              {clientName && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'rgb(var(--text-secondary))' }}>
                  {project.client?.logo?.url && <img src={mediaSrc(project.client.logo)} alt="" style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'contain', border: '1px solid rgb(var(--border))', background: '#fff' }} />}
                  {clientName}
                </span>
              )}
              {links.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500, color: 'rgb(var(--accent))', textDecoration: 'none' }}>
                  <l.Icon style={{ width: 13, height: 13 }} aria-hidden /> {l.label}
                </a>
              ))}
            </div>
          )}

          {showBrandDisclosure && (
            <p style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 10, fontFamily: font, fontSize: 12, color: 'rgb(var(--text-tertiary))', lineHeight: 1.6, maxWidth: '58ch', marginInlineStart: isRTL ? 'auto' : 0, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <Info style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} aria-hidden />
              {isRTL ? 'تصميم تصوّري مستقل، غير تابع أو معتمد من العلامة التجارية.' : 'An independent concept design, not affiliated with or endorsed by the brand.'}
            </p>
          )}

          {highlights.length > 0 && (
            <div style={{ marginTop: 24, maxWidth: '52ch', marginInlineStart: isRTL ? 'auto' : 0 }}>
              <HighlightsList highlights={highlights} isRTL={isRTL} variant="compact" />
            </div>
          )}
        </div>
      </div>

      {/* ── Media — cover, then every image/video block in order ───────────── */}
      <section style={{ padding: 'clamp(2.5rem, 5vw, 3.5rem) 0' }}>
        <div className="max-w-5xl mx-auto" style={{ padding: '0 clamp(1.25rem, 5vw, 3rem)', display: 'flex', flexDirection: 'column', gap: 'clamp(2rem, 4vw, 3rem)' }}>
          {(coverAsset || isVideoCover) && (
            isVideoCover ? (
              <div style={coverStyle}>
                <video src={mediaSrc(project.coverVideo)} poster={mediaSrc(project.coverImage)} controls playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                {liveUrl && (
                  <CoverActionCta as="a" href={liveUrl} label={liveLinkLabel} isRTL={isRTL} position="top-end" ariaLabel={coverAriaLabel} />
                )}
              </div>
            ) : coverClickable ? (
              <a href={liveUrl} target="_blank" rel="noopener noreferrer" aria-label={coverAriaLabel} className="cover-link" style={coverStyle}>
                <ProgressiveImage asset={coverAsset} alt={title} priority fill imgClassName="cover-link-img" fallbackIcon={categoryIcon(categoryName)} fallbackLabel={categoryDisplay} isRTL={isRTL} fallbackVariant="hero" />
                <span aria-hidden className="cover-link-scrim" />
                <CoverActionCta label={liveLinkLabel} isRTL={isRTL} position="bottom-start" />
              </a>
            ) : (
              <div style={coverStyle}>
                <ProgressiveImage asset={coverAsset} alt={title} priority fill fallbackIcon={categoryIcon(categoryName)} fallbackLabel={categoryDisplay} isRTL={isRTL} fallbackVariant="hero" />
              </div>
            )
          )}
          <BlockRenderer blocks={project.blocks} isRTL={isRTL} />
        </div>
      </section>

      {/* ── Project Screenshots — separate gallery, never re-shows the cover ── */}
      {screenshots.length > 0 && (
        <Gallery
          images={screenshots}
          activeImg={activeShot}
          setActiveImg={setActiveShot}
          onOpenLightbox={() => setShotLightbox(true)}
          onPrev={prevShot}
          onNext={nextShot}
          isRTL={isRTL}
          liveUrl={liveUrl}
          title={title}
        />
      )}
      {shotLightbox && (
        <Lightbox images={screenshots} active={activeShot} onClose={() => setShotLightbox(false)} onPrev={prevShot} onNext={nextShot} isRTL={isRTL} title={title} />
      )}

      {/* ── Credits & tools ──────────────────────────────────────────────── */}
      {(project.team?.length > 0 || project.technologies?.length > 0 || project.services?.length > 0) && (
        <section className="section-shell section-shell--tint" dir={dir}>
          <div className="section-inner" style={{ maxWidth: 860 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(2rem, 5vw, 4rem)', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              {project.services?.length > 0 && (
                <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  <p className="section-label" style={{ marginBottom: 14 }}>{isRTL ? 'الخدمات المقدمة' : 'Services Delivered'}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    {project.services.map((s) => (
                      <span key={s._id} style={{ fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 999, background: 'rgb(var(--accent-light))', border: '1px solid rgb(var(--accent-muted))', color: '#1E40AF' }}>
                        {isRTL ? (s.nameAr || s.name) : s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {project.team?.length > 0 && (
                <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  <p className="section-label" style={{ marginBottom: 14 }}>{isRTL ? 'فريق العمل' : 'Credits'}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {project.team.map((credit, i) => {
                      const m = credit.member;
                      if (!m) return null;
                      const role = credit.roleOverride || m.position;
                      const roleAr = credit.roleArOverride || m.positionAr;
                      return (
                        <div key={m._id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgb(var(--accent-light))', color: 'rgb(var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                            {m.avatar?.url ? <img src={mediaSrc(m.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'rgb(var(--text-primary))', margin: 0, fontFamily: font }}>{m.name}</p>
                            {(role || roleAr) && <p style={{ fontSize: 11.5, color: 'rgb(var(--text-tertiary))', margin: 0 }}>{isRTL ? (roleAr || role) : role}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {project.technologies?.length > 0 && (
                <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  <p className="section-label" style={{ marginBottom: 14 }}>{isRTL ? 'الأدوات' : 'Tools'}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    {project.technologies.map((t) => (
                      <span key={t._id} style={{ fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 999, background: '#fff', border: '1px solid rgb(var(--border))', color: 'rgb(var(--text-secondary))' }}>{t.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <NextProject nextProject={nextProject} moreProjects={moreProjects} isRTL={isRTL} />

      <CTASection project={project} title={title} isRTL={isRTL} onStartProject={() => setIsFormOpen(true)} />

      <Footer />
      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
      {liveUrl && <style>{COVER_LINK_CSS}</style>}
    </div>
  );
};

export default PortfolioShowcaseView;
