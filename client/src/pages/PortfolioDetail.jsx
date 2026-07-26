/**
 * PortfolioDetail — Premium Case Study Page
 *
 * Structure:
 *  1. Full-bleed hero with parallax image + editorial overlay
 *  2. Project meta bar (category, industry, duration, team, live link)
 *  3. Narrative — Overview / Challenge / Solution / Process / Results
 *  4. Metrics strip
 *  5. Technology stack
 *  6. Image gallery with lightbox
 *  7. Testimonial
 *  8. Related projects + next case study
 *  9. Conversion CTA
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { trackWhatsAppClick } from '../utils/ga4';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';
import PortfolioCard from '../components/PortfolioCard';
import ProgressiveImage from '../components/ProgressiveImage';
import api from '../utils/api';
import { useSEO } from '../hooks/useSEO';
import { mediaSrc } from '../utils/media';
import { categoryLabel, categoryIcon } from '../utils/portfolioTaxonomy';
import { ArrowLeft, ArrowUpRight, ExternalLink, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
const Skeleton = () => (
  <div className="bg-white min-h-screen">
    <div className="h-[60vh] sm:h-[75vh] bg-[#F6F7F9] animate-pulse" />
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-8">
      <div className="h-3 w-24 bg-[#F0F2F5] animate-pulse rounded" />
      <div className="h-10 w-2/3 bg-[#F0F2F5] animate-pulse rounded" />
      <div className="h-4 w-full bg-[#F6F7F9] animate-pulse rounded" />
      <div className="h-4 w-5/6 bg-[#F6F7F9] animate-pulse rounded" />
      <div className="h-4 w-4/5 bg-[#F6F7F9] animate-pulse rounded" />
    </div>
  </div>
);

/* ── Lightbox ─────────────────────────────────────────────────────────────── */
const Lightbox = ({ images, active, onClose, onPrev, onNext, isRTL, title }) => {
  const closeBtnRef = useRef(null);
  const triggerElRef = useRef(null);

  // Focus the close button on open, restore focus to whatever triggered
  // the lightbox on close — matches the same pattern used by ProjectRequestForm.
  useEffect(() => {
    triggerElRef.current = document.activeElement;
    closeBtnRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      triggerElRef.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  onPrev();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'Tab') {
        // Single focusable set (close/prev/next) — keep Tab cycling inside the dialog.
        const nodes = Array.from(document.querySelectorAll('[data-lightbox] button'));
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext, isRTL]);

  // Preload neighboring images so prev/next feel instant
  useEffect(() => {
    [active - 1, active + 1].forEach((i) => {
      const asset = images[(i + images.length) % images.length];
      const src = mediaSrc(asset);
      if (src) { const img = new Image(); img.src = src; }
    });
  }, [active, images]);

  return (
    <div
      data-lightbox
      className="fixed inset-0 z-[200] flex items-center justify-center bg-white/95"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isRTL ? 'معرض الصور بملء الشاشة' : 'Image lightbox'}
    >
      <button
        ref={closeBtnRef}
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center border border-[#E8EBF0] text-[#6B7280] hover:text-[#0D1117] hover:border-[#C9CDD6] transition-all z-10"
        aria-label={isRTL ? 'إغلاق' : 'Close'}
      >
        <X className="w-4 h-4" />
      </button>

      <span className="absolute top-5 left-5 text-[10px] tracking-widest uppercase text-[#6B7280] z-10">
        {active + 1} / {images.length}
      </span>

      <img
        src={mediaSrc(images[active])}
        alt={title ? `${title} — ${active + 1}/${images.length}` : ''}
        className="max-w-[92vw] max-h-[88vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center border border-[#E8EBF0] text-[#6B7280] hover:text-[#0D1117] hover:border-[#C9CDD6] transition-all"
            aria-label={isRTL ? 'الصورة السابقة' : 'Previous image'}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center border border-[#E8EBF0] text-[#6B7280] hover:text-[#0D1117] hover:border-[#C9CDD6] transition-all"
            aria-label={isRTL ? 'الصورة التالية' : 'Next image'}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
};

/* ── Scroll reveal helper ─────────────────────────────────────────────────── */
const useReveal = (ref, delay = 0) => {
  useEffect(() => {
    if (!ref.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { ref.current.style.opacity = '1'; return; }

    const el = ref.current;
    el.style.opacity = '0';
    el.style.transform = 'translateY(32px)';
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.style.transition = 'opacity 0.75s ease, transform 0.75s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, delay);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
};

const LABEL_STYLE = {
  display: 'block', fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase',
  color: 'rgba(37,99,235,0.55)', paddingTop: 4, fontWeight: 300,
};

/* ── Narrative Section ─────────────────────────────────────────────────────── */
const NarrativeBlock = ({ label, content, delay = 0 }) => {
  const ref = useRef(null);
  useReveal(ref, delay);
  if (!content) return null;
  return (
    <div ref={ref} className="flex flex-col sm:flex-row gap-6 sm:gap-12">
      <div className="flex-shrink-0 sm:w-28">
        <span style={LABEL_STYLE}>{label}</span>
      </div>
      <div className="flex-1">
        <div style={{ width: 24, height: 1, background: 'rgba(37,99,235,0.3)', marginBottom: 16 }} />
        <p style={{ fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', fontWeight: 300, color: 'rgba(0,0,0,0.65)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
          {content}
        </p>
      </div>
    </div>
  );
};

/* ── Metrics Strip ────────────────────────────────────────────────────────── */
const MetricsStrip = ({ metrics, isRTL }) => {
  const ref = useRef(null);
  useReveal(ref, 60);
  if (!metrics?.length) return null;
  return (
    <div ref={ref} className="border-y border-[#E8EBF0] bg-[#FAFAFA]">
      <div className="max-w-5xl mx-auto grid" style={{ gridTemplateColumns: `repeat(${Math.min(metrics.length, 4)}, 1fr)` }}>
        {metrics.map((m, i) => (
          <div key={i} className={`text-center py-10 px-4 ${i > 0 ? 'border-l border-[#E8EBF0]' : ''}`} style={isRTL && i > 0 ? { borderLeft: 'none', borderRight: '1px solid #E8EBF0' } : undefined}>
            <p className="font-bold text-[#2563EB]" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', letterSpacing: '-0.02em' }}>{m.value}</p>
            <p className="text-[11px] text-[#9CA3AF] tracking-widest uppercase mt-2 font-light">{isRTL && m.labelAr ? m.labelAr : m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Testimonial ──────────────────────────────────────────────────────────── */
const TestimonialSection = ({ testimonial, isRTL }) => {
  const ref = useRef(null);
  useReveal(ref, 0);
  const quote = isRTL ? (testimonial?.quoteAr || testimonial?.quote) : (testimonial?.quote || testimonial?.quoteAr);
  if (!quote) return null;
  const role = isRTL ? (testimonial?.roleAr || testimonial?.role) : testimonial?.role;

  return (
    <div ref={ref} className="px-4 sm:px-8 py-20 sm:py-28">
      <div className="max-w-3xl mx-auto text-center">
        <div className="w-10 h-10 mx-auto mb-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.08)' }}>
          <span className="text-[#2563EB] text-2xl leading-none" style={{ fontFamily: 'Georgia, serif' }}>&ldquo;</span>
        </div>
        <p className="font-light text-[#0D1117]" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', lineHeight: 1.5, letterSpacing: '-0.01em' }}>
          {quote}
        </p>
        {(testimonial.author || role) && (
          <div className="flex items-center justify-center gap-3 mt-8">
            {testimonial.avatar?.url && (
              <ProgressiveImage asset={testimonial.avatar} alt={testimonial.author} className="w-10 h-10 rounded-full flex-shrink-0" />
            )}
            <div className={isRTL ? 'text-right' : 'text-left'}>
              {testimonial.author && <p className="text-sm font-semibold text-[#0D1117]">{testimonial.author}</p>}
              {role && <p className="text-xs text-[#6B7280]">{role}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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

  const heroRef      = useRef(null);
  const heroImgRef   = useRef(null);

  useSEO({
    title       : project ? `${project.title} — ${isRTL ? 'دراسة حالة' : 'Case Study'} | YANSY TECH` : (isRTL ? 'المحفظة | يانسي تك' : 'Portfolio | YANSY TECH'),
    description : project?.description?.slice(0, 155) || (isRTL ? 'استعرض دراسات حالة أعمالنا.' : 'View our portfolio case studies.'),
    canonical   : `https://yansytech.com/portfolio/${project?.slug || id}`,
    ogImage     : mediaSrc(project?.coverImage),
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

  /* Hero parallax on scroll */
  useEffect(() => {
    if (!heroImgRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const el = heroImgRef.current;
    const onScroll = () => { el.style.transform = `translateY(${window.scrollY * 0.28}px) scale(1.08)`; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [project]);

  /* Hero text entrance */
  useEffect(() => {
    if (!project || !heroRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      heroRef.current.querySelectorAll('[data-fade]').forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-fade]', { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.85, stagger: 0.14, ease: 'power3.out', delay: 0.1 });
    }, heroRef);
    return () => ctx.revert();
  }, [project]);

  /* Gallery navigation */
  const allImages = project ? [project.coverImage, ...(project.gallery || [])].filter(Boolean) : [];
  const prev = useCallback(() => setActiveImg((i) => (i - 1 + allImages.length) % allImages.length), [allImages.length]);
  const next = useCallback(() => setActiveImg((i) => (i + 1) % allImages.length), [allImages.length]);

  if (loading) return <Skeleton />;
  if (!project) return (
    <div className="bg-white text-[#0D1117] min-h-screen flex items-center justify-center" dir={dir}>
      <div className="text-center">
        <p className="text-[#6B7280] font-light mb-6">{isRTL ? 'المشروع غير موجود' : 'Project not found'}</p>
        <Link to="/portfolio" className="text-[#2563EB] text-xs tracking-widest uppercase border border-[#2563EB]/30 rounded-full px-6 py-3 hover:bg-[#2563EB]/08 transition-all">
          {isRTL ? '← العودة للمحفظة' : '← Back to Portfolio'}
        </Link>
      </div>
    </div>
  );

  const title = isRTL && project.titleAr ? project.titleAr : project.title;
  const desc  = isRTL && project.descriptionAr ? project.descriptionAr : project.description;

  const narrative = [
    { label: isRTL ? 'نظرة عامة' : 'Overview',   content: desc },
    { label: isRTL ? 'التحدي'    : 'The Challenge', content: isRTL ? (project.challengeAr || project.challenge) : (project.challenge || project.challengeAr) },
    { label: isRTL ? 'الحل'      : 'The Solution',  content: isRTL ? (project.solutionAr  || project.solution)  : (project.solution  || project.solutionAr) },
    { label: isRTL ? 'العملية'   : 'Our Process',   content: isRTL ? (project.processAr   || project.process)   : (project.process   || project.processAr) },
    { label: isRTL ? 'النتائج'   : 'The Results',   content: isRTL ? (project.resultsAr   || project.results)   : (project.results   || project.resultsAr) },
  ].filter((n) => n.content);

  const [nextProject, ...moreProjects] = related;

  return (
    <div className="bg-white text-[#0D1117] min-h-screen overflow-x-hidden" dir={dir}>
      <Header onStartProject={() => setIsFormOpen(true)} />

      {/* 01 HERO */}
      <div ref={heroRef} className="relative h-[65vh] sm:h-[78vh] overflow-hidden">
        <div ref={heroImgRef} className="absolute inset-0 scale-[1.08]" style={{ transformOrigin: 'center top', willChange: 'transform' }}>
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

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
        <div aria-hidden className="absolute top-0 left-0 right-0 h-[1.5px]" style={{ background: 'linear-gradient(to right, transparent, rgba(37,99,235,0.45), transparent)' }} />

        <div className="absolute bottom-0 left-0 right-0 pb-10 sm:pb-14 px-6 sm:px-10 lg:px-16" style={{ maxWidth: 900 }}>
          <Link data-fade to="/portfolio" className="inline-flex items-center gap-2 mb-8 text-[10px] tracking-[0.25em] uppercase text-[#9CA3AF] hover:text-[#2563EB] transition-colors duration-250" style={{ opacity: 0 }}>
            <ArrowLeft className="w-3 h-3" aria-hidden />
            {isRTL ? 'المحفظة' : 'Portfolio'}
          </Link>

          <p data-fade style={{ opacity: 0, fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(37,99,235,0.65)', marginBottom: 12, fontWeight: 300 }}>
            {categoryLabel(project.category, isRTL ? 'ar' : 'en')}{project.industry ? ` · ${project.industry}` : ''}
          </p>

          <h1 data-fade style={{ opacity: 0, fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 700, lineHeight: 1.06, letterSpacing: '-0.03em', color: '#FFFFFF', maxWidth: 720 }}>
            {title}
          </h1>

          {project.tags?.length > 0 && (
            <div data-fade style={{ opacity: 0, display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
              {project.tags.slice(0, 6).map((tag) => (
                <span key={tag} style={{ fontSize: 10, padding: '3px 10px', border: '1px solid rgba(37,99,235,0.2)', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 300, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 02 META BAR */}
      <div style={{ borderTop: '1px solid #E8EBF0', borderBottom: '1px solid #E8EBF0', background: 'rgba(0,0,0,0.015)', padding: '18px clamp(16px,5vw,64px)' }}>
        <div className="max-w-5xl mx-auto" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px 40px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px 40px' }}>
            <MetaField label={isRTL ? 'التصنيف' : 'Category'} value={categoryLabel(project.category, isRTL ? 'ar' : 'en')} />
            {project.duration && <MetaField label={isRTL ? 'المدة' : 'Duration'} value={project.duration} />}
            {project.teamSize && <MetaField label={isRTL ? 'الفريق' : 'Team'} value={project.teamSize} />}
            {project.year && <MetaField label={isRTL ? 'السنة' : 'Year'} value={String(project.year)} />}
            {project.tags?.length > 0 && <MetaField label={isRTL ? 'التقنيات' : 'Technologies'} value={project.tags.slice(0, 3).join(' · ')} />}
          </div>

          {project.liveUrl && (
            <a
              href={project.liveUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#2563EB', border: '1px solid rgba(37,99,235,0.25)', padding: '8px 18px', fontWeight: 300, transition: 'all 0.25s', textDecoration: 'none', borderRadius: 999 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(37,99,235,0.06)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.5)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.25)'; }}
            >
              <ExternalLink className="w-3 h-3" aria-hidden />
              {isRTL ? 'عرض المشروع' : 'View Live'}
            </a>
          )}
        </div>
      </div>

      {/* 03 NARRATIVE */}
      {narrative.length > 0 && (
        <div className="max-w-5xl mx-auto" style={{ padding: 'clamp(48px,8vw,96px) clamp(16px,5vw,48px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {narrative.map((n, i) => <NarrativeBlock key={n.label} label={n.label} content={n.content} delay={i * 40} />)}
            {project.tags?.length > 0 && <TechStack tags={project.tags} isRTL={isRTL} />}
          </div>
        </div>
      )}

      {/* 04 METRICS */}
      <MetricsStrip metrics={project.metrics} isRTL={isRTL} />

      {/* 05 GALLERY */}
      {allImages.length > 0 && (
        <GallerySection images={allImages} activeImg={activeImg} setActiveImg={setActiveImg} onOpenLightbox={() => setLightbox(true)} onPrev={prev} onNext={next} isRTL={isRTL} />
      )}

      {/* 06 TESTIMONIAL */}
      <TestimonialSection testimonial={project.testimonial} isRTL={isRTL} />

      {/* 07 RELATED + NEXT PROJECT */}
      {related.length > 0 && (
        <div className="px-4 sm:px-8 py-20 sm:py-28" style={{ borderTop: '1px solid #E8EBF0', background: '#FAFAFA' }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <p style={{ fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(37,99,235,0.55)', fontWeight: 300 }}>
                {isRTL ? 'أعمال أخرى' : 'More work'}
              </p>
              <Link to="/portfolio" className="inline-flex items-center gap-2 text-xs text-[#5C6370] hover:text-[#2563EB] transition-colors">
                {isRTL ? 'عرض الكل' : 'View all'} <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[nextProject, ...moreProjects].filter(Boolean).map((p) => (
                <PortfolioCard key={p._id} project={p} isRTL={isRTL} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 08 CTA */}
      <CTASection project={project} title={title} isRTL={isRTL} onStartProject={() => setIsFormOpen(true)} />

      <Footer />

      {lightbox && (
        <Lightbox images={allImages} active={activeImg} onClose={() => setLightbox(false)} onPrev={prev} onNext={next} isRTL={isRTL} title={title} />
      )}
      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};

/* ── Meta field ───────────────────────────────────────────────────────────── */
const MetaField = ({ label, value }) => (
  <div>
    <p style={{ fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)', marginBottom: 3, fontWeight: 500 }}>{label}</p>
    <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.7)', fontWeight: 300 }}>{value}</p>
  </div>
);

/* ── Tech Stack ───────────────────────────────────────────────────────────── */
const TechStack = ({ tags, isRTL }) => {
  const ref = useRef(null);
  useReveal(ref, 80);
  return (
    <div ref={ref} className="flex flex-col sm:flex-row gap-6 sm:gap-12">
      <div className="flex-shrink-0 sm:w-28">
        <span style={LABEL_STYLE}>{isRTL ? 'التقنيات' : 'Stack Used'}</span>
      </div>
      <div className="flex-1">
        <div style={{ width: 24, height: 1, background: 'rgba(37,99,235,0.3)', marginBottom: 16 }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tags.map((tag) => (
            <span key={tag} style={{ fontSize: 11, padding: '5px 14px', border: '1px solid #E8EBF0', color: 'rgba(0,0,0,0.52)', letterSpacing: '0.08em', fontWeight: 300, borderRadius: 999 }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Gallery Section ──────────────────────────────────────────────────────── */
const GallerySection = ({ images, activeImg, setActiveImg, onOpenLightbox, onPrev, onNext, isRTL }) => {
  const ref = useRef(null);
  useReveal(ref, 0);
  return (
    <div ref={ref} style={{ background: '#FAFAFA', padding: 'clamp(40px,6vw,80px) clamp(16px,5vw,48px)', borderTop: '1px solid #E8EBF0', borderBottom: '1px solid #E8EBF0' }}>
      <div className="max-w-5xl mx-auto">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <span style={{ display: 'block', width: 24, height: 1, background: 'linear-gradient(to right,#2563EB,transparent)' }} aria-hidden />
          <p style={{ fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(37,99,235,0.55)', fontWeight: 300, margin: 0 }}>
            {isRTL ? 'معرض الصور' : 'Project Gallery'}
          </p>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(0,0,0,0.45)', fontWeight: 500 }}>{activeImg + 1} / {images.length}</span>
        </div>

        <div
          className="relative overflow-hidden cursor-zoom-in group rounded-xl"
          style={{ aspectRatio: '16/9', border: '1px solid #E8EBF0', marginBottom: 12 }}
          onClick={onOpenLightbox}
          role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenLightbox(); }}
          aria-label={isRTL ? 'فتح الصورة بملء الشاشة' : 'Open fullscreen image'}
        >
          <ProgressiveImage
            asset={images[activeImg]}
            alt=""
            fill
            imgClassName="transition-transform duration-700 group-hover:scale-[1.02]"
            priority={activeImg === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center border border-[#E8EBF0] bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full">
            <ZoomIn className="w-4 h-4 text-[#0D1117]" />
          </div>

          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border border-[#E8EBF0] bg-white/85 text-[#6B7280] hover:text-[#0D1117] hover:border-[#C9CDD6] transition-all opacity-0 group-hover:opacity-100 rounded-full" aria-label={isRTL ? 'الصورة السابقة' : 'Previous'}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border border-[#E8EBF0] bg-white/85 text-[#6B7280] hover:text-[#0D1117] hover:border-[#C9CDD6] transition-all opacity-0 group-hover:opacity-100 rounded-full" aria-label={isRTL ? 'الصورة التالية' : 'Next'}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(images.length, 6)}, 1fr)`, gap: 6 }}>
            {images.slice(0, 6).map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                style={{ aspectRatio: '16/9', overflow: 'hidden', border: `1px solid ${i === activeImg ? '#2563EB' : 'rgba(0,0,0,0.04)'}`, opacity: i === activeImg ? 1 : 0.5, transition: 'all 0.25s', cursor: 'pointer', background: 'none', padding: 0, borderRadius: 8 }}
                aria-label={isRTL ? `عرض الصورة ${i + 1}` : `View image ${i + 1}`}
                aria-pressed={i === activeImg}
                onMouseEnter={(e) => { if (i !== activeImg) e.currentTarget.style.opacity = '0.8'; }}
                onMouseLeave={(e) => { if (i !== activeImg) e.currentTarget.style.opacity = '0.5'; }}
              >
                <ProgressiveImage asset={img} alt="" className="w-full h-full" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── CTA Section ─────────────────────────────────────────────────────────── */
const CTASection = ({ title, isRTL, onStartProject }) => {
  const ref = useRef(null);
  useReveal(ref, 0);
  const waMsg = encodeURIComponent(
    isRTL ? `مرحباً! شفت مشروع "${title}" وأريد شيء مشابه.` : `Hi! I saw the "${title}" project and I'd love to build something similar.`
  );

  return (
    <section ref={ref} style={{ padding: 'clamp(64px,10vw,120px) clamp(16px,5vw,48px)', borderTop: '1px solid rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 200, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(37,99,235,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <p style={{ fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(37,99,235,0.5)', marginBottom: 20, fontWeight: 300 }}>
          {isRTL ? 'الخطوة التالية' : "What's next"}
        </p>

        <h2 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.75rem, 4.5vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.06, color: '#0D1117', marginBottom: 16 }}>
          {isRTL ? <><span style={{ color: '#2563EB' }}>أريد مشروعاً</span><br />مشابهاً لهذا</> : <>Want something<br /><span style={{ color: '#2563EB' }}>like this?</span></>}
        </h2>

        <p style={{ fontSize: '1rem', fontWeight: 300, color: 'rgba(0,0,0,0.35)', maxWidth: 380, margin: '0 auto 40px', lineHeight: 1.65 }}>
          {isRTL ? 'استشارة مجانية بدون التزام. نرد خلال 24 ساعة.' : 'Free consultation, no obligation. We reply within 24 hours.'}
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onStartProject}
            style={{ padding: '14px 36px', background: '#2563EB', color: '#FFFFFF', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 400, border: 'none', cursor: 'pointer', transition: 'background 0.3s', borderRadius: 999 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#0D1117'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#2563EB'; }}
          >
            {isRTL ? 'ابدأ مشروعك' : 'Start Your Project'}
          </button>

          <a
            href={`https://wa.me/201090385390?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick('portfolio-detail')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', border: '1px solid rgba(37,211,102,0.3)', color: 'rgba(37,150,80,0.9)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 300, textDecoration: 'none', transition: 'all 0.3s', borderRadius: 999 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(37,211,102,0.08)'; e.currentTarget.style.borderColor = 'rgba(37,211,102,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(37,211,102,0.3)'; }}
          >
            <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {isRTL ? 'واتساب' : 'WhatsApp'}
          </a>
        </div>

        <div style={{ marginTop: 40 }}>
          <Link
            to="/portfolio"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.3)', textDecoration: 'none', transition: 'color 0.25s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(37,99,235,0.6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(0,0,0,0.3)'; }}
          >
            <ArrowLeft className="w-3 h-3" aria-hidden />
            {isRTL ? 'عودة للمحفظة' : 'Back to Portfolio'}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PortfolioDetail;
