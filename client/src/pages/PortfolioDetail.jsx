/**
 * PortfolioDetail — Premium Case Study Page
 *
 * Structure:
 *  1. Full-bleed hero with parallax image + editorial overlay
 *  2. Project meta bar (category, tags, live link)
 *  3. Challenge / Solution / Outcome narrative
 *  4. Technology stack
 *  5. Image gallery with lightbox
 *  6. Conversion CTA
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
import api from '../utils/api';
import { useSEO } from '../hooks/useSEO';
import { ArrowLeft, ExternalLink, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const API_URL_IMAGE = import.meta.env.VITE_API_URL_IMAGE || '';
const imgUrl = (id) => {
  if (!id) return null;
  if (typeof id === 'string' && (id.startsWith('http') || id.startsWith('data:'))) return id;
  return `${API_URL_IMAGE}/api/portfolio/image/${id}`;
};

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
const Skeleton = () => (
  <div className="bg-black min-h-screen">
    <div className="h-[60vh] sm:h-[75vh] bg-white/5 animate-pulse" />
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-8">
      <div className="h-3 w-24 bg-white/8 animate-pulse rounded" />
      <div className="h-10 w-2/3 bg-white/10 animate-pulse rounded" />
      <div className="h-4 w-full bg-white/5 animate-pulse rounded" />
      <div className="h-4 w-5/6 bg-white/5 animate-pulse rounded" />
      <div className="h-4 w-4/5 bg-white/5 animate-pulse rounded" />
    </div>
  </div>
);

/* ── Lightbox ─────────────────────────────────────────────────────────────── */
const Lightbox = ({ images, active, onClose, onPrev, onNext }) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center border border-white/15 text-white/50 hover:text-white hover:border-white/35 transition-all z-10"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Counter */}
      <span className="absolute top-5 left-5 text-[10px] tracking-widest uppercase text-white/30 z-10">
        {active + 1} / {images.length}
      </span>

      {/* Image */}
      <img
        src={imgUrl(images[active])}
        alt=""
        className="max-w-[92vw] max-h-[88vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Nav arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center border border-white/15 text-white/50 hover:text-white hover:border-white/35 transition-all"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center border border-white/15 text-white/50 hover:text-white hover:border-white/35 transition-all"
            aria-label="Next image"
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

/* ── Narrative Section ─────────────────────────────────────────────────────── */
const NarrativeBlock = ({ label, content, delay = 0 }) => {
  const ref = useRef(null);
  useReveal(ref, delay);
  if (!content) return null;
  return (
    <div ref={ref} className="flex flex-col sm:flex-row gap-6 sm:gap-12">
      {/* Label column */}
      <div className="flex-shrink-0 sm:w-28">
        <span
          style={{
            display     : 'block',
            fontSize    : 9,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color       : 'rgba(212,175,55,0.55)',
            paddingTop  : 4,
            fontWeight  : 300,
          }}
        >
          {label}
        </span>
      </div>
      {/* Content column */}
      <div className="flex-1">
        <div
          style={{
            width     : 24,
            height    : 1,
            background: 'rgba(212,175,55,0.3)',
            marginBottom: 16,
          }}
        />
        <p
          style={{
            fontSize  : 'clamp(1rem, 1.8vw, 1.15rem)',
            fontWeight: 300,
            color     : 'rgba(255,255,255,0.7)',
            lineHeight: 1.8,
          }}
        >
          {content}
        </p>
      </div>
    </div>
  );
};

/* ── Main ─────────────────────────────────────────────────────────────────── */
const PortfolioDetail = () => {
  const { id }           = useParams();
  const { isRTL, dir }   = useLanguage();
  const [project, setProject]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [lightbox, setLightbox]     = useState(false);
  const [activeImg, setActiveImg]   = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const heroRef      = useRef(null);
  const heroImgRef   = useRef(null);
  const metaRef      = useRef(null);
  const titleRef     = useRef(null);

  // SEO
  useSEO({
    title       : project ? `${project.title} — Case Study` : 'Portfolio',
    description : project?.description?.slice(0, 155) || 'View our portfolio case studies.',
    canonical   : `https://yansytech.com/portfolio/${id}`,
  });

  /* Fetch */
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/portfolio/${id}`);
        setProject(data.project);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [id]);

  /* Hero parallax on scroll */
  useEffect(() => {
    if (!heroImgRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const el = heroImgRef.current;
    const onScroll = () => {
      const y = window.scrollY;
      el.style.transform = `translateY(${y * 0.28}px) scale(1.08)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [project]);

  /* Hero text entrance */
  useEffect(() => {
    if (!project || !heroRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      heroRef.current.querySelectorAll('[data-fade]').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-fade]',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.85, stagger: 0.14, ease: 'power3.out', delay: 0.1 }
      );
    }, heroRef);
    return () => ctx.revert();
  }, [project]);

  /* Gallery navigation */
  const allImages = project
    ? [project.coverImage, ...(project.images || [])].filter(Boolean)
    : [];
  const prev = useCallback(() => {
    setActiveImg((i) => (i - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);
  const next = useCallback(() => {
    setActiveImg((i) => (i + 1) % allImages.length);
  }, [allImages.length]);

  if (loading) return <Skeleton />;
  if (!project) return (
    <div className="bg-black text-white min-h-screen flex items-center justify-center" dir={dir}>
      <div className="text-center">
        <p className="text-white/30 font-light mb-6">{isRTL ? 'المشروع غير موجود' : 'Project not found'}</p>
        <Link to="/portfolio" className="text-[#d4af37] text-xs tracking-widest uppercase border border-[#d4af37]/30 px-6 py-3 hover:bg-[#d4af37]/08 transition-all">
          {isRTL ? '← العودة للمحفظة' : '← Back to Portfolio'}
        </Link>
      </div>
    </div>
  );

  const title = isRTL && project.titleAr ? project.titleAr : project.title;
  const desc  = isRTL && project.descriptionAr ? project.descriptionAr : project.description;

  return (
    <div className="bg-black text-white min-h-screen overflow-x-hidden" dir={dir}>
      <Header onStartProject={() => setIsFormOpen(true)} />

      {/* ══════════════════════════════════════════════════════════════════
          01 HERO — Full-bleed cinematic header
      ══════════════════════════════════════════════════════════════════ */}
      <div ref={heroRef} className="relative h-[65vh] sm:h-[78vh] overflow-hidden">
        {/* Parallax image */}
        <div
          ref={heroImgRef}
          className="absolute inset-0 scale-[1.08]"
          style={{ transformOrigin: 'center top', willChange: 'transform' }}
        >
          {project.coverImage && (
            <img
              src={imgUrl(project.coverImage)}
              alt={title}
              fetchpriority="high"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Gradient overlays — bottom-heavy editorial feel */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

        {/* Decorative gold line — top accent */}
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-[1.5px]"
          style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.45), transparent)' }}
        />

        {/* Content */}
        <div
          className="absolute bottom-0 left-0 right-0 pb-10 sm:pb-14 px-6 sm:px-10 lg:px-16"
          style={{ maxWidth: 900 }}
        >
          {/* Back link */}
          <Link
            data-fade
            to="/portfolio"
            className="inline-flex items-center gap-2 mb-8 text-[10px] tracking-[0.25em] uppercase text-white/35 hover:text-[#d4af37] transition-colors duration-250"
            style={{ opacity: 0 }}
          >
            <ArrowLeft className="w-3 h-3" aria-hidden />
            {isRTL ? 'المحفظة' : 'Portfolio'}
          </Link>

          {/* Category */}
          <p
            data-fade
            style={{
              opacity      : 0,
              fontSize     : 10,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color        : 'rgba(212,175,55,0.65)',
              marginBottom : 12,
              fontWeight   : 300,
            }}
          >
            {project.category}
          </p>

          {/* Title */}
          <h1
            data-fade
            style={{
              opacity      : 0,
              fontFamily   : "'Inter',system-ui,sans-serif",
              fontSize     : 'clamp(2rem, 5vw, 4rem)',
              fontWeight   : 700,
              lineHeight   : 1.06,
              letterSpacing: '-0.03em',
              color        : '#fff',
              maxWidth     : 720,
            }}
          >
            {title}
          </h1>

          {/* Tags */}
          {project.tags?.length > 0 && (
            <div
              data-fade
              style={{ opacity: 0, display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}
            >
              {project.tags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize      : 10,
                    padding       : '3px 10px',
                    border        : '1px solid rgba(212,175,55,0.2)',
                    color         : 'rgba(212,175,55,0.6)',
                    letterSpacing : '0.1em',
                    textTransform : 'uppercase',
                    fontWeight    : 300,
                    background    : 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          02 META BAR — Quick facts
      ══════════════════════════════════════════════════════════════════ */}
      <div
        ref={metaRef}
        style={{
          borderTop   : '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background  : 'rgba(255,255,255,0.015)',
          padding     : '18px clamp(16px,5vw,64px)',
        }}
      >
        <div
          className="max-w-5xl mx-auto"
          style={{
            display       : 'flex',
            flexWrap      : 'wrap',
            gap           : '24px 40px',
            alignItems    : 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Category */}
          <div>
            <p style={{ fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 3, fontWeight: 300 }}>
              {isRTL ? 'التصنيف' : 'Category'}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 300 }}>
              {project.category}
            </p>
          </div>

          {/* Tags count */}
          {project.tags?.length > 0 && (
            <div>
              <p style={{ fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 3, fontWeight: 300 }}>
                {isRTL ? 'التقنيات' : 'Technologies'}
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 300 }}>
                {project.tags.slice(0, 3).join(' · ')}
              </p>
            </div>
          )}

          {/* Live link */}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display       : 'inline-flex',
                alignItems    : 'center',
                gap           : 6,
                fontSize      : 10,
                letterSpacing : '0.22em',
                textTransform : 'uppercase',
                color         : '#d4af37',
                border        : '1px solid rgba(212,175,55,0.25)',
                padding       : '8px 18px',
                fontWeight    : 300,
                transition    : 'all 0.25s',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212,175,55,0.06)';
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.25)';
              }}
            >
              <ExternalLink className="w-3 h-3" aria-hidden />
              {isRTL ? 'عرض المشروع' : 'View Live'}
            </a>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          03 NARRATIVE — Problem · Solution · Outcome
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className="max-w-5xl mx-auto"
        style={{ padding: 'clamp(48px,8vw,96px) clamp(16px,5vw,48px)' }}
      >
        {/* Description split into narrative sections */}
        {desc && (
          <div
            style={{
              display      : 'flex',
              flexDirection: 'column',
              gap          : 48,
            }}
          >
            {/* Full overview */}
            <NarrativeBlock
              label={isRTL ? 'نظرة عامة' : 'Overview'}
              content={desc}
              delay={0}
            />

            {/* Tech stack */}
            {project.tags?.length > 0 && (
              <TechStack tags={project.tags} isRTL={isRTL} />
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          04 GALLERY — Primary image + thumbnails + lightbox
      ══════════════════════════════════════════════════════════════════ */}
      {allImages.length > 0 && (
        <GallerySection
          images={allImages}
          activeImg={activeImg}
          setActiveImg={setActiveImg}
          onOpenLightbox={() => setLightbox(true)}
          onPrev={prev}
          onNext={next}
          isRTL={isRTL}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          05 CTA — Convert visitors into clients
      ══════════════════════════════════════════════════════════════════ */}
      <CTASection project={project} title={title} isRTL={isRTL} onStartProject={() => setIsFormOpen(true)} />

      <Footer />

      {/* Modals */}
      {lightbox && (
        <Lightbox
          images={allImages}
          active={activeImg}
          onClose={() => setLightbox(false)}
          onPrev={prev}
          onNext={next}
        />
      )}
      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};

/* ── Tech Stack ───────────────────────────────────────────────────────────── */
const TechStack = ({ tags, isRTL }) => {
  const ref = useRef(null);
  useReveal(ref, 80);
  return (
    <div ref={ref} className="flex flex-col sm:flex-row gap-6 sm:gap-12">
      <div className="flex-shrink-0 sm:w-28">
        <span style={{ display:'block', fontSize:9, letterSpacing:'0.35em', textTransform:'uppercase', color:'rgba(212,175,55,0.55)', paddingTop:4, fontWeight:300 }}>
          {isRTL ? 'التقنيات' : 'Stack Used'}
        </span>
      </div>
      <div className="flex-1">
        <div style={{ width:24, height:1, background:'rgba(212,175,55,0.3)', marginBottom:16 }} />
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize    : 11,
                padding     : '5px 14px',
                border      : '1px solid rgba(255,255,255,0.1)',
                color       : 'rgba(255,255,255,0.55)',
                letterSpacing: '0.08em',
                fontWeight  : 300,
                transition  : 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)';
                e.currentTarget.style.color = 'rgba(212,175,55,0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
              }}
            >
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
    <div
      ref={ref}
      style={{
        background : 'linear-gradient(180deg, #000 0%, #030201 50%, #000 100%)',
        padding    : 'clamp(40px,6vw,80px) clamp(16px,5vw,48px)',
        borderTop  : '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Section label */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
          <span style={{ display:'block', width:24, height:1, background:'linear-gradient(to right,#d4af37,transparent)' }} aria-hidden />
          <p style={{ fontSize:9, letterSpacing:'0.35em', textTransform:'uppercase', color:'rgba(212,175,55,0.55)', fontWeight:300, margin:0 }}>
            {isRTL ? 'معرض الصور' : 'Project Gallery'}
          </p>
          <span style={{ marginLeft:'auto', fontSize:10, color:'rgba(255,255,255,0.2)', fontWeight:300 }}>
            {activeImg + 1} / {images.length}
          </span>
        </div>

        {/* Main image */}
        <div
          className="relative overflow-hidden cursor-zoom-in group"
          style={{
            aspectRatio : '16/9',
            background  : 'rgba(255,255,255,0.03)',
            border      : '1px solid rgba(255,255,255,0.06)',
            marginBottom: 12,
          }}
          onClick={onOpenLightbox}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenLightbox(); }}
          aria-label="Open fullscreen image"
        >
          <img
            src={imgUrl(images[activeImg])}
            alt=""
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          {/* Zoom icon */}
          <div
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center border border-white/20 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-hidden
          >
            <ZoomIn className="w-4 h-4 text-white/70" />
          </div>

          {/* Prev/Next on main image */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border border-white/15 bg-black/50 text-white/50 hover:text-white hover:border-white/35 transition-all opacity-0 group-hover:opacity-100"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border border-white/15 bg-black/50 text-white/50 hover:text-white hover:border-white/35 transition-all opacity-0 group-hover:opacity-100"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div
            style={{
              display             : 'grid',
              gridTemplateColumns : `repeat(${Math.min(images.length, 6)}, 1fr)`,
              gap                 : 6,
            }}
          >
            {images.slice(0, 6).map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                style={{
                  aspectRatio : '16/9',
                  overflow    : 'hidden',
                  border      : `1px solid ${i === activeImg ? '#d4af37' : 'rgba(255,255,255,0.06)'}`,
                  opacity     : i === activeImg ? 1 : 0.5,
                  transition  : 'all 0.25s',
                  cursor      : 'pointer',
                  background  : 'none',
                  padding     : 0,
                }}
                aria-label={`View image ${i + 1}`}
                aria-pressed={i === activeImg}
                onMouseEnter={(e) => { if (i !== activeImg) e.currentTarget.style.opacity = '0.8'; }}
                onMouseLeave={(e) => { if (i !== activeImg) e.currentTarget.style.opacity = '0.5'; }}
              >
                <img
                  src={imgUrl(img)}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── CTA Section ─────────────────────────────────────────────────────────── */
const CTASection = ({ project, title, isRTL, onStartProject }) => {
  const ref = useRef(null);
  useReveal(ref, 0);
  const waMsg = encodeURIComponent(
    isRTL
      ? `مرحباً! شفت مشروع "${title}" وأريد شيء مشابه.`
      : `Hi! I saw the "${title}" project and I'd love to build something similar.`
  );

  return (
    <section
      ref={ref}
      style={{
        padding   : 'clamp(64px,10vw,120px) clamp(16px,5vw,48px)',
        borderTop : '1px solid rgba(255,255,255,0.04)',
        position  : 'relative',
        overflow  : 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position    : 'absolute',
          top: '50%', left: '50%',
          transform   : 'translate(-50%,-50%)',
          width: 600, height: 200,
          borderRadius: '50%',
          background  : 'radial-gradient(ellipse, rgba(212,175,55,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <p
          style={{
            fontSize     : 9,
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            color        : 'rgba(212,175,55,0.5)',
            marginBottom : 20,
            fontWeight   : 300,
          }}
        >
          {isRTL ? 'الخطوة التالية' : "What's next"}
        </p>

        <h2
          style={{
            fontFamily   : "'Inter',system-ui,sans-serif",
            fontSize     : 'clamp(1.75rem, 4.5vw, 3.5rem)',
            fontWeight   : 700,
            letterSpacing: '-0.03em',
            lineHeight   : 1.06,
            color        : '#fff',
            marginBottom : 16,
          }}
        >
          {isRTL
            ? <><span style={{ color:'#d4af37' }}>أريد مشروعاً</span><br />مشابهاً لهذا</>
            : <>Want something<br /><span style={{ color:'#d4af37' }}>like this?</span></>
          }
        </h2>

        <p
          style={{
            fontSize  : '1rem',
            fontWeight: 300,
            color     : 'rgba(255,255,255,0.35)',
            maxWidth  : 380,
            margin    : '0 auto 40px',
            lineHeight: 1.65,
          }}
        >
          {isRTL
            ? 'استشارة مجانية بدون التزام. نرد خلال 24 ساعة.'
            : 'Free consultation, no obligation. We reply within 24 hours.'}
        </p>

        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button
            onClick={onStartProject}
            style={{
              padding     : '14px 36px',
              background  : '#d4af37',
              color       : '#000',
              fontSize    : 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight  : 400,
              border      : 'none',
              cursor      : 'pointer',
              transition  : 'background 0.3s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#d4af37'; }}
          >
            {isRTL ? 'ابدأ مشروعك' : 'Start Your Project'}
          </button>

          <a
            href={`https://wa.me/201090385390?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick('portfolio-detail')}
            style={{
              display       : 'inline-flex',
              alignItems    : 'center',
              gap           : 8,
              padding       : '14px 32px',
              border        : '1px solid rgba(37,211,102,0.3)',
              color         : 'rgba(37,211,102,0.85)',
              fontSize      : 10,
              letterSpacing : '0.2em',
              textTransform : 'uppercase',
              fontWeight    : 300,
              textDecoration: 'none',
              transition    : 'all 0.3s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(37,211,102,0.08)'; e.currentTarget.style.borderColor = 'rgba(37,211,102,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(37,211,102,0.3)'; }}
          >
            <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {isRTL ? 'واتساب' : 'WhatsApp'}
          </a>
        </div>

        {/* Back link */}
        <div style={{ marginTop: 40 }}>
          <Link
            to="/portfolio"
            style={{
              display     : 'inline-flex',
              alignItems  : 'center',
              gap         : 6,
              fontSize    : 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color       : 'rgba(255,255,255,0.2)',
              textDecoration: 'none',
              transition  : 'color 0.25s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(212,175,55,0.6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; }}
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
