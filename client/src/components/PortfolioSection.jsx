import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import api from '../utils/api';

gsap.registerPlugin(ScrollTrigger);

// ── Helper ───────────────────────────────────────────────────────────────────
const API_URL_IMAGE = import.meta.env.VITE_API_URL_IMAGE || '';
const getImageUrl = (id) => {
  if (!id) return '';
  if (typeof id === 'string' && (id.startsWith('http') || id.startsWith('data:'))) return id;
  return `${API_URL_IMAGE}/api/portfolio/image/${id}`;
};

// ── Skeleton Card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02]">
    <div className="aspect-[4/3] bg-white/[0.04] animate-pulse" />
    <div className="p-5 space-y-3">
      <div className="h-3 w-1/3 bg-white/[0.06] rounded animate-pulse" />
      <div className="h-5 w-2/3 bg-white/[0.08] rounded animate-pulse" />
      <div className="flex gap-2 mt-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-5 w-14 bg-white/[0.05] rounded animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

// ── Project Card ──────────────────────────────────────────────────────────────
const ProjectCard = ({ project, index, isRTL, cardRef }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);

  // 🌍 language handling (احترافي)
  const title =
    isRTL
      ? project.titleAr || project.title
      : project.title || project.titleAr;

  const description =
    isRTL
      ? project.descriptionAr || project.description
      : project.description || project.descriptionAr;

  // ✂️ قص الوصف بشكل آمن
  const shortDescription = description?.slice(0, 100);

  const isFeatured = index === 0;

  return (
    <Link
      to={`/portfolio/${project._id}`}
      ref={cardRef}
      className={`group relative block rounded-2xl overflow-hidden border border-white/[0.07] bg-black
        transition-all duration-700 ease-out
        hover:border-[#d4af37]/40 hover:shadow-[0_0_60px_-10px_rgba(212,175,55,0.25)]
        ${isFeatured ? 'sm:col-span-2 lg:col-span-2' : ''}
      `}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className={`relative overflow-hidden bg-white/[0.03] ${isFeatured ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>

        {!imgLoaded && (
          <div className="absolute inset-0 bg-white/[0.04] animate-pulse" />
        )}

        <img
          src={getImageUrl(project.coverImage)}
          alt={title}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className="w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.08]"
          style={{ opacity: imgLoaded ? 1 : 0 }}
        />

        {/* Overlay */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
            opacity: hovered ? 1 : 0.6,
          }}
        />

        {/* Category */}
        <div className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'}`}>
          <span className="text-[9px] tracking-[0.35em] uppercase px-3 py-1.5 border border-[#d4af37]/40 text-[#d4af37] bg-black/60">
            {project.category}
          </span>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">

          <h3
            className="text-white font-semibold leading-tight mb-2 transition-all duration-500 group-hover:-translate-y-1"
            style={{
              fontSize: isFeatured
                ? 'clamp(1.375rem, 2.25vw, 2rem)'
                : 'clamp(1.125rem, 1.75vw, 1.375rem)',
              letterSpacing: '-0.015em',
            }}
          >
            {title}
          </h3>

          <p
            className="
              text-[11px] text-white/50
              leading-relaxed
              line-clamp-3
              max-w-[320px]
              break-words
              transition-all duration-300
              group-hover:text-white/80
            "
          >
            {shortDescription}
          </p>
        </div>

        {/* Gold line — grows from inline-start edge */}
        <div
          className={`absolute bottom-0 h-[2px] w-0 group-hover:w-full transition-all duration-700 ${isRTL ? 'right-0' : 'left-0'}`}
          style={{ background: `linear-gradient(to ${isRTL ? 'left' : 'right'}, #d4af37, transparent)` }}
        />
      </div>

      {/* Tags */}
      {project.tags?.length > 0 && (
        <div className={`flex items-center justify-between px-5 py-4 border-t border-white/[0.05] ${isRTL ? 'flex-row-reverse' : ''}`}>

          <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-2 py-1 border border-white/10 text-white/40 group-hover:text-[#d4af37]"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Arrow */}
          <svg
            className={`w-4 h-4 text-white/40 group-hover:text-[#d4af37] transition ${
              isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </Link>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const PortfolioSection = () => {
  const { isRTL, dir }  = useLanguage();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');
  const sectionRef = useRef(null);
  const headerRef  = useRef(null);
  const cardsRef   = useRef([]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/portfolio?featured=true&limit=6');
        setProjects(data.projects || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Derive categories ──────────────────────────────────────────────────────
  const categories = ['All', ...new Set(projects.map(p => p.category).filter(Boolean))];
  const displayed  = filter === 'All' ? projects : projects.filter(p => p.category === filter);

  // ── GSAP entrance ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Header
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.querySelectorAll('[data-anim]'),
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
            immediateRender: false, clearProps: 'all',
            scrollTrigger: { trigger: headerRef.current, start: 'top 88%', once: true },
          }
        );
      }

      // Cards
      const validCards = cardsRef.current.filter(Boolean);
      if (validCards.length > 0) {
        gsap.fromTo(
          validCards,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0,
            duration: 0.7, stagger: 0.08, ease: 'power3.out',
            immediateRender: false, clearProps: 'all',
            scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', once: true },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [projects, filter]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section
      ref={sectionRef}
      className="relative px-4 sm:px-8 py-24 sm:py-40 bg-black overflow-hidden"
      dir={dir}
    >
      {/* Ambient glow — capped at 100% width so it never bleeds past section edges */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-[900px] h-[500px] opacity-[0.04] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #d4af37 0%, transparent 65%)', filter: 'blur(120px)' }}
      />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* ── Header ── */}
        <div ref={headerRef} className={`mb-12 sm:mb-20 ${isRTL ? 'text-right' : 'text-left'}`}>

          {/* Eyebrow */}
          <div data-anim className={`flex items-center gap-4 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className={`block w-10 h-px ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#d4af37] to-transparent`} />
            <p className="text-[10px] tracking-[0.45em] text-[#d4af37]/60 uppercase">
              {isRTL ? 'أعمال مختارة' : 'Featured Work'}
            </p>
          </div>

          {/* Title row */}
          <div
  className={`
    flex items-end
    gap-6
    ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}
    justify-between
  `}
>
  {/* Title */}
  <h2
  data-anim
  dir={isRTL ? "rtl" : "ltr"}
  className={`
    font-bold tracking-tight leading-[1.06]
    ${isRTL ? 'text-right ml-auto' : 'text-left mr-auto'}
  `}
  style={{
    fontSize: 'clamp(2rem, 4.5vw, 4.5rem)',
    letterSpacing: '-0.03em',
  }}
>
  {isRTL ? 'مشاريع' : 'Projects'}
  <br />
  <span
    className={`
      text-transparent bg-clip-text bg-gradient-to-r
      ${isRTL ? 'from-white to-[#d4af37]' : 'from-[#d4af37] to-white'}
    `}
  >
    {isRTL ? 'أنجزناها فعلاً' : "we've shipped"}
  </span>
</h2>

  {/* View All */}
  <Link
    to="/portfolio"
    className={`
      group
      hidden sm:inline-flex items-center gap-2
      self-end mb-2

      text-[11px] tracking-[0.25em] uppercase font-light

      text-white/40 hover:text-[#d4af37]

      border-b border-transparent hover:border-[#d4af37]/40

      transition-all duration-300 pb-1

      ${isRTL ? 'flex-row-reverse' : ''}
    `}
  >
    {isRTL ? 'عرض الكل' : 'View All'}

    <svg
      className={`
        w-3 h-3
        transition-all duration-300
        ${isRTL
          ? 'group-hover:-translate-x-1 rotate-180'
          : 'group-hover:translate-x-1'
        }
      `}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  </Link>
</div>

          {/* ── Category Filter Pills ── */}
          {!loading && categories.length > 2 && (
            <div data-anim className={`flex flex-wrap gap-2 mt-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`
                    text-[9px] tracking-[0.3em] uppercase px-4 py-2
                    border transition-all duration-300
                    ${filter === cat
                      ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10'
                      : 'border-white/10 text-white/30 hover:border-white/25 hover:text-white/60'
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayed.map((project, i) => (
              <ProjectCard
                key={project._id}
                project={project}
                index={i}
                isRTL={isRTL}
                cardRef={(el) => (cardsRef.current[i] = el)}
              />
            ))}
          </div>
        )}

        {/* ── Bottom CTA ── */}
        <div className="mt-20 sm:mt-28 flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link
            to="/portfolio"
            className="
              group relative inline-flex items-center gap-3
              px-10 py-4
              text-[10px] tracking-[0.4em] uppercase font-light
              text-[#d4af37] border border-[#d4af37]/35
              bg-transparent backdrop-blur-sm
              overflow-hidden
              transition-all duration-500
              hover:text-black hover:border-[#d4af37] hover:shadow-[0_0_40px_-5px_rgba(212,175,55,0.5)]
              active:scale-[0.98]
            "
          >
            {/* fill sweep */}
            <span className="absolute inset-0 origin-left scale-x-0 group-hover:scale-x-100 bg-[#d4af37] transition-transform duration-500 ease-out z-0" />
            {/* shimmer — sweeps in reading direction */}
            <span className={`absolute inset-0 transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent z-10 ${isRTL ? 'translate-x-full group-hover:-translate-x-full' : '-translate-x-full group-hover:translate-x-full'}`} />
            <span className="relative z-20">{isRTL ? 'شاهد جميع المشاريع' : 'View All Projects'}</span>
            <svg
              className={`relative z-20 w-3.5 h-3.5 transition-transform duration-300 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <p className="text-[10px] text-white/25 tracking-widest uppercase">
            {isRTL ? `${projects.length} مشروع منجز` : `${projects.length} projects delivered`}
          </p>
        </div>

        {/* Mobile View All */}
        <div className="sm:hidden mt-6 text-center">
          <Link
            to="/portfolio"
            className={`
              inline-flex items-center gap-2
              text-[10px] tracking-widest uppercase text-white/30
              hover:text-[#d4af37] transition-colors duration-300
              ${isRTL ? 'flex-row-reverse' : ''}
            `}
          >
            {isRTL ? 'كل الأعمال' : 'View All Work'}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={isRTL ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;