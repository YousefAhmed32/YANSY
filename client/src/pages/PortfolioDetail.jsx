/**
 * PortfolioDetail — Premium Case Study Page
 *
 * Structure:
 *  1. Editorial hero — title as real content, large image panel with
 *     floating glass metric chips (the project's headline numbers, not
 *     buried in a separate strip further down the page)
 *  2. Meta strip — duration / team / tech count / live-site link
 *  3. Narrative — Challenge/Solution paired side by side, Process, Stack
 *  4. Results + Testimonial — one continuous payoff beat
 *  5. Gallery — browser-chrome-framed screenshots + lightbox
 *  6. Next Case Study — one large cinematic transition, then more work
 *  7. Conversion CTA
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { trackViewContent } from '../utils/metaPixel';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';
import api from '../utils/api';
import { useSEO } from '../hooks/useSEO';
import { mediaSrc } from '../utils/media';
import ScrollProgress from '../components/portfolio-detail/ScrollProgress';
import Hero from '../components/portfolio-detail/Hero';
import Narrative from '../components/portfolio-detail/Narrative';
import ResultsAndTestimonial from '../components/portfolio-detail/ResultsAndTestimonial';
import Gallery from '../components/portfolio-detail/Gallery';
import Lightbox from '../components/portfolio-detail/Lightbox';
import NextProject from '../components/portfolio-detail/NextProject';
import CTASection from '../components/portfolio-detail/CTASection';

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
const Skeleton = () => (
  <div className="bg-white min-h-screen">
    <div style={{ paddingTop: 'calc(68px + 3rem)' }} className="max-w-7xl mx-auto px-6">
      <div className="h-3 w-40 bg-[#F0F2F5] animate-pulse rounded mb-8" />
      <div className="h-3 w-24 bg-[#F0F2F5] animate-pulse rounded mb-6" />
      <div className="h-14 w-3/4 bg-[#F0F2F5] animate-pulse rounded mb-6" />
      <div className="h-5 w-2/3 bg-[#F6F7F9] animate-pulse rounded mb-12" />
      <div className="aspect-[16/9] w-full bg-[#F6F7F9] animate-pulse rounded-2xl" />
    </div>
  </div>
);

/* ── Main ─────────────────────────────────────────────────────────────────── */
const PortfolioDetail = () => {
  const { id }           = useParams();
  const { isRTL, dir }   = useLanguage();
  const [project, setProject]       = useState(null);
  const [related, setRelated]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [lightbox, setLightbox]     = useState(false);
  const [activeImg, setActiveImg]   = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useSEO({
    title       : project ? `${project.title} — ${isRTL ? 'دراسة حالة' : 'Case Study'} | YANSY TECH` : (isRTL ? 'المحفظة | يانسي تك' : 'Portfolio | YANSY TECH'),
    description : project?.description?.slice(0, 155) || (isRTL ? 'استعرض دراسات حالة أعمالنا.' : 'View our portfolio case studies.'),
    canonical   : `https://yansytech.com/portfolio/${project?.slug || id}`,
    ogImage     : mediaSrc(project?.coverImage),
    schema: project ? {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      'name': project.title,
      'description': project.description?.slice(0, 300),
      'image': mediaSrc(project.coverImage),
      'author': { '@id': 'https://yansytech.com/#organization' },
      'creator': { '@id': 'https://yansytech.com/#organization' },
      'url': `https://yansytech.com/portfolio/${project.slug || id}`,
      'isPartOf': { '@id': 'https://yansytech.com/#website' },
      'breadcrumb': {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://yansytech.com/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Portfolio', 'item': 'https://yansytech.com/portfolio' },
          { '@type': 'ListItem', 'position': 3, 'name': project.title, 'item': `https://yansytech.com/portfolio/${project.slug || id}` },
        ],
      },
    } : undefined,
  });

  /* Fetch */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setProject(null);
      setRelated([]);
      setActiveImg(0);
      try {
        const { data } = await api.get(`/portfolio/${id}`);
        if (cancelled) return;
        setProject(data.project);
        trackViewContent({ content_name: data.project?.title, content_type: 'portfolio_project', content_category: data.project?.industry });
        api.get(`/portfolio/${data.project._id}/related`)
          .then(({ data: rd }) => { if (!cancelled) setRelated(rd.projects || []); })
          .catch(() => {});
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [id]);

  /* Gallery navigation — every image, not just the first 6 */
  const allImages = project ? [project.coverImage, ...(project.gallery || [])].filter(Boolean) : [];
  const prev = useCallback(() => setActiveImg((i) => (i - 1 + allImages.length) % allImages.length), [allImages.length]);
  const next = useCallback(() => setActiveImg((i) => (i + 1) % allImages.length), [allImages.length]);

  if (loading) return <Skeleton />;
  if (!project) return (
    <div className="bg-white text-[#0D1117] min-h-screen flex items-center justify-center" dir={dir}>
      <div className="text-center">
        <p className="text-[#6B7280] font-light mb-6">{isRTL ? 'المشروع غير موجود' : 'Project not found'}</p>
        <Link to="/portfolio" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
          {isRTL ? '← العودة للمحفظة' : '← Back to Portfolio'}
        </Link>
      </div>
    </div>
  );

  const title = isRTL && project.titleAr ? project.titleAr : project.title;
  const desc  = isRTL && project.descriptionAr ? project.descriptionAr : project.description;
  const [nextProject, ...moreProjects] = related;

  return (
    <div className="bg-white text-[#0D1117] min-h-screen overflow-x-hidden" dir={dir}>
      <Header onStartProject={() => setIsFormOpen(true)} />
      <ScrollProgress isRTL={isRTL} />

      <Hero project={project} title={title} desc={desc} isRTL={isRTL} />

      <Narrative project={project} isRTL={isRTL} />

      <ResultsAndTestimonial project={project} isRTL={isRTL} />

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

export default PortfolioDetail;
