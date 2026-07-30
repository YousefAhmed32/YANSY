import { useCallback, useState } from 'react';
import Header from '../Header';
import Footer from '../Footer';
import ProjectRequestForm from '../ProjectRequestForm';
import ScrollProgress from './ScrollProgress';
import Hero from './Hero';
import StoryBeats from './StoryBeats';
import ProcessBand from './ProcessBand';
import BlockRenderer from './BlockRenderer';
import ImpactSection from './ImpactSection';
import ProofSection from './ProofSection';
import Gallery from './Gallery';
import Lightbox from './Lightbox';
import FAQSection from './FAQSection';
import NextProject from './NextProject';
import CTASection from './CTASection';

/**
 * The full case-study render, given a resolved project. Pulled out of
 * PortfolioDetail.jsx so the admin wizard's preview can render the EXACT
 * same markup a visitor will see (fetched via the admin API, which returns
 * drafts too) instead of a second, hand-maintained approximation that could
 * silently drift from what actually ships.
 *
 * Section rhythm (light → light → tint → light → DARK → light → tint →
 * light → light-with-dark-panel → DARK) is deliberate: two tonal breaks
 * only — Impact (the results payoff) and the closing CTA — so a dark
 * section reads as a climax, not a recurring pattern. Every section between
 * Hero and CTA now has its own distinct composition (alternating-margin
 * editorial beats, a quiet pull-statement interstitial, a full stat wall,
 * a sticky two-column FAQ, ...) instead of the previous repeating
 * label-heading-paragraph block used site-wide.
 */
const PortfolioDetailView = ({ project, related, isRTL, dir }) => {
  const [lightbox, setLightbox]     = useState(false);
  const [activeImg, setActiveImg]   = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const allImages = [project.coverImage, ...(project.gallery || [])].filter(Boolean);
  const prev = useCallback(() => setActiveImg((i) => (i - 1 + allImages.length) % allImages.length), [allImages.length]);
  const next = useCallback(() => setActiveImg((i) => (i + 1) % allImages.length), [allImages.length]);

  const title = isRTL && project.titleAr ? project.titleAr : project.title;
  const desc  = isRTL && project.descriptionAr ? project.descriptionAr : project.description;
  const [nextProject, ...moreProjects] = related;

  return (
    <div className="bg-surface-white text-content-primary min-h-screen overflow-x-hidden" dir={dir}>
      <Header onStartProject={() => setIsFormOpen(true)} />
      <ScrollProgress isRTL={isRTL} />

      <Hero project={project} title={title} desc={desc} isRTL={isRTL} />

      <StoryBeats project={project} isRTL={isRTL} />

      <ProcessBand project={project} isRTL={isRTL} />

      {project.blocks?.length > 0 && (
        <section className="section-shell section-shell--plain" dir={dir}>
          <div className="section-inner" style={{ maxWidth: 860 }}>
            <span className="section-label" style={{ marginBottom: 'clamp(2rem, 4vw, 3rem)', display: 'inline-flex' }}>
              {isRTL ? 'داخل المشروع' : 'The Build'}
            </span>
            <BlockRenderer blocks={project.blocks} isRTL={isRTL} />
          </div>
        </section>
      )}

      <ImpactSection project={project} isRTL={isRTL} />

      <ProofSection project={project} isRTL={isRTL} />

      {allImages.length > 0 && (
        <Gallery
          images={allImages}
          activeImg={activeImg}
          setActiveImg={setActiveImg}
          onOpenLightbox={() => setLightbox(true)}
          onPrev={prev}
          onNext={next}
          isRTL={isRTL}
          liveUrl={project.liveUrl}
          title={title}
        />
      )}

      <FAQSection project={project} isRTL={isRTL} />

      <NextProject nextProject={nextProject} moreProjects={moreProjects} isRTL={isRTL} />

      <CTASection project={project} title={title} isRTL={isRTL} onStartProject={() => setIsFormOpen(true)} />

      <Footer />

      {lightbox && (
        <Lightbox images={allImages} active={activeImg} onClose={() => setLightbox(false)} onPrev={prev} onNext={next} isRTL={isRTL} title={title} />
      )}
      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};

export default PortfolioDetailView;
