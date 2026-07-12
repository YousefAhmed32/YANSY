import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';
import { gsap } from 'gsap';
import { trackWhatsAppClick } from '../utils/ga4';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AIChatWidget from '../components/AIChatWidget';
import ProjectRequestForm from '../components/ProjectRequestForm';
import api from '../utils/api';
import { ArrowUpRight } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

gsap.registerPlugin(ScrollTrigger);

const API_URL_IMAGE = import.meta.env.VITE_API_URL_IMAGE || '';


// ── Helper: convert GridFS ObjectId → image URL ──────────────────────────────
const getImageUrl = (id) => {
  if (!id) return null;
  // already a full URL (http/https) or base64 → use as-is
  if (typeof id === 'string' && (id.startsWith('http') || id.startsWith('data:'))) return id;
  return `${API_URL_IMAGE}/api/portfolio/image/${id}`;
};

const CATEGORIES = [
  { en: 'All',                 ar: 'الكل' },
  { en: 'E-commerce',          ar: 'تجارة إلكترونية' },
  { en: 'Medical',             ar: 'طبي' },
  { en: 'Real Estate',         ar: 'عقارات' },
  { en: 'Restaurants & Food',  ar: 'مطاعم وطعام' },
  { en: 'SaaS / Platforms',    ar: 'منصات SaaS' },
  { en: 'Educational',         ar: 'تعليمي' },
  { en: 'Other',               ar: 'أخرى' },
];

// ── Skeleton card shown while loading ────────────────────────────────────────
const SkeletonCard = () => (
  <div className="group relative overflow-hidden block animate-pulse">
    <div className="relative aspect-[4/3] bg-[#F6F7F9]" />
    <div className="mt-3 space-y-2">
      <div className="h-3 w-3/4 bg-[#F6F7F9] rounded" />
      <div className="h-2 w-1/2 bg-[#F6F7F9] rounded" />
    </div>
  </div>
);

// ── Single project card ───────────────────────────────────────────────────────
const ProjectCard = ({ p, isRTL }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);
  const imgSrc = getImageUrl(p.coverImage);

  return (
    <Link
      to={`/portfolio/${p._id}`}
      data-card
      className="group relative overflow-hidden block"
    >
      {/* ── Image container ── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F6F7F9]">

        {/* Skeleton shimmer until image loads */}
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-[shimmer_1.5s_infinite]" />
        )}

        {/* Fallback when image fails */}
        {imgError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#9CA3AF]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] tracking-widest uppercase">No image</span>
          </div>
        )}

        {/* Actual image – lazy loaded */}
        {imgSrc && !imgError && (
          <img
            src={imgSrc}
            alt={p.title}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:opacity-90" />

        {/* Arrow badge */}
        <div className="absolute top-4 right-4 w-9 h-9 border border-[#E8EBF0] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-2 group-hover:translate-y-0 bg-[#F6F7F9] backdrop-blur-sm">
          <ArrowUpRight className="w-4 h-4 text-[#0D1117]" />
        </div>

        {/* Category badge */}
        <div className="absolute top-4 left-4">
          <span className="text-[10px] px-3 py-1 border border-[#2563EB]/40 text-[#2563EB] tracking-widest uppercase bg-[#F6F7F9] backdrop-blur-sm">
            {p.category}
          </span>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3
            className="text-[#0D1117] font-semibold text-lg sm:text-xl leading-tight mb-1 transition-transform duration-300 group-hover:-translate-y-1"
            style={{ letterSpacing: '-0.015em' }}
          >
            {isRTL && p.titleAr ? p.titleAr : p.title}
          </h3>
          <p className="text-[#6B7280] text-xs font-light line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {isRTL && p.descriptionAr ? p.descriptionAr : p.description}
          </p>
        </div>
      </div>

      {/* Tags */}
      {p.tags?.length > 0 && (
        <div className={`flex flex-wrap gap-1.5 mt-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {p.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 border border-[#E8EBF0] text-[#9CA3AF] tracking-wide"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const Portfolio = () => {
  const { isRTL, dir }          = useLanguage();
  const user                    = useSelector(s => s.auth?.user);
  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [active, setActive]     = useState('All');
  const [loading, setLoading]   = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const heroRef                 = useRef(null);
  const gridRef                 = useRef(null);

  useSEO({
    title      : isRTL ? 'معرض الأعمال | يانسي تك' : 'Portfolio | YANSY TECH',
    description: isRTL
      ? 'مشاريع رقمية حقيقية أطلقناها لعملاء في مجالات التجارة الإلكترونية والـ SaaS والأنظمة الطبية والتعليم.'
      : 'Real digital products shipped by YANSY TECH — e-commerce platforms, SaaS dashboards, booking systems, enterprise tools, and more. 50+ projects delivered.',
    keywords   : 'web development portfolio, digital products, SaaS projects, e-commerce portfolio, YANSY TECH work',
    canonical  : 'https://yansytech.com/portfolio',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': 'https://yansytech.com/portfolio#webpage',
      'url': 'https://yansytech.com/portfolio',
      'name': 'Portfolio | YANSY TECH',
      'description': 'Digital products built by YANSY TECH — e-commerce, SaaS, booking systems, enterprise software.',
      'isPartOf': { '@id': 'https://yansytech.com/#website' },
      'breadcrumb': {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://yansytech.com/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Portfolio', 'item': 'https://yansytech.com/portfolio' },
        ],
      },
    },
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/portfolio');
        setProjects(data.projects || []);
        setFiltered(data.projects || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Filter ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (active === 'All') { setFiltered(projects); return; }
    setFiltered(projects.filter((p) => p.category === active));
  }, [active, projects]);

  const activeLabel = (cat) => isRTL ? cat.ar : cat.en;

  // ── Animate grid on filter change ──────────────────────────────────────────
  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll('[data-card]');
    gsap.fromTo(
      cards,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out' }
    );
  }, [filtered]);

  // ── Hero entrance ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        heroRef.current.querySelectorAll('[data-hero]'),
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: 'power3.out', delay: 0.1 }
      );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="bg-white text-[#0D1117] min-h-screen overflow-x-hidden" dir={dir}>
      <Header onStartProject={() => setIsFormOpen(true)} />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative pt-40 pb-24 px-4 sm:px-8 overflow-hidden">
        {/* bg grid */}
        <div
          className="absolute inset-0 opacity-[0.018] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#2563EB 1px,transparent 1px),linear-gradient(90deg,#2563EB 1px,transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <p
            data-hero
            className="text-xs tracking-[0.4em] text-[#2563EB]/60 uppercase mb-6 opacity-0"
          >
            {isRTL ? 'معرض الأعمال' : 'Portfolio'}
          </p>
          <h1
            data-hero
            className="opacity-0 font-bold tracking-tight leading-[1.06] mb-8"
            style={{ fontSize: 'clamp(2.5rem, 6.5vw, 6.5rem)', letterSpacing: '-0.03em' }}
          >
            {isRTL ? 'أعمالنا الحقيقية' : 'Real work,'}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-white">
              {isRTL ? 'نتائج حقيقية' : 'real results.'}
            </span>
          </h1>
          <p data-hero className="opacity-0 text-[#6B7280] font-normal text-base sm:text-xl max-w-2xl">
            {isRTL
              ? 'مشاريع رقمية أطلقناها لعملاء حقيقيين في مجالات مختلفة.'
              : "Digital products we've shipped for real clients across different industries."}
          </p>
        </div>
      </section>

      {/* ── FILTER ────────────────────────────────────────────────────────── */}
      <div className="sticky top-[72px] z-30 bg-white/90 backdrop-blur-md border-b border-[#E8EBF0] px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-hide">
          <div className={`flex gap-2 min-w-max ${isRTL ? 'flex-row-reverse' : ''}`}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.en}
                onClick={() => setActive(cat.en)}
                className="px-4 py-1.5 text-[11px] font-light tracking-widest uppercase border transition-all duration-300 whitespace-nowrap"
                style={{
                  borderColor: active === cat.en ? '#2563EB' : 'rgba(0,0,0,0.1)',
                  color: active === cat.en ? '#2563EB' : 'rgba(0,0,0,0.4)',
                  background: active === cat.en ? 'rgba(37,99,235,0.08)' : 'transparent',
                }}
              >
                {activeLabel(cat)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── GRID ──────────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            /* Skeleton grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-32 text-[#9CA3AF] font-light text-xl">
              {isRTL ? 'لا توجد مشاريع في هذا التصنيف حتى الآن.' : 'No projects in this category yet.'}
            </div>
          ) : (
            <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filtered.map((p) => (
                <ProjectCard key={p._id} p={p} isRTL={isRTL} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-8 py-32 sm:py-40 overflow-hidden">
        {/* subtle gold glow behind */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.07) 0%, transparent 70%)' }}
        />
        {/* top border line */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* eyebrow */}
          <p className="text-[10px] tracking-[0.5em] text-[#2563EB]/50 uppercase mb-6">
            {isRTL ? 'الخطوة التالية' : "What's next"}
          </p>

          {/* headline */}
          <h2
            className="font-bold tracking-tight leading-[1.08] mb-6 text-[#0D1117]"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', letterSpacing: '-0.03em' }}
          >
            {isRTL ? (
              <>مشروعك القادم<br /><span className="text-[#2563EB]">يستحق الأفضل</span></>
            ) : (
              <>Your next project<br /><span className="text-[#2563EB]">deserves the best.</span></>
            )}
          </h2>

          {/* sub */}
          <p className="text-[#9CA3AF] font-light text-base sm:text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            {isRTL
              ? 'تواصل معنا مباشرة على واتساب وابدأ رحلتك الرقمية.'
              : "Reach out on WhatsApp and let's start building something great together."}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setIsFormOpen(true)}
              className="group inline-flex items-center gap-3 px-10 py-5 bg-[#2563EB] text-black text-xs font-light tracking-widest uppercase hover:bg-white transition-all duration-500"
            >
              {isRTL ? 'ابدأ مشروعك' : 'Start Your Project'}
              <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            <a
              href={`https://wa.me/201090385390?text=${encodeURIComponent(isRTL ? 'مرحباً! أريد التحدث عن مشروع.' : "Hi! I'd like to discuss a project with YANSY.")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsAppClick('portfolio')}
              className="group inline-flex items-center gap-3 px-10 py-5 border border-[#2563EB] text-[#2563EB] text-xs font-light tracking-widest uppercase hover:bg-[#2563EB] hover:text-black transition-all duration-500"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {isRTL ? 'واتساب' : 'WhatsApp'}
            </a>
          </div>

          <p className="mt-6 text-[#9CA3AF] text-[11px] tracking-widest">
            {isRTL ? 'رد خلال 24 ساعة' : 'We reply within 24 hours'}
          </p>
        </div>
      </section>

      <Footer />

      <AIChatWidget isRTL={isRTL} onStartProject={() => setIsFormOpen(true)} user={user} />
      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};

export default Portfolio;