import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';
import { gsap } from 'gsap';
import { trackWhatsAppClick } from '../utils/ga4';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AIChatWidget from '../components/AIChatWidget';
import ProjectRequestForm from '../components/ProjectRequestForm';
import PortfolioCard from '../components/PortfolioCard';
import api from '../utils/api';
import { ArrowUpRight, Search, X } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

gsap.registerPlugin(ScrollTrigger);

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

const SORTS = [
  { value: 'latest', en: 'Latest',  ar: 'الأحدث' },
  { value: 'oldest', en: 'Oldest',  ar: 'الأقدم' },
];

const SkeletonCard = ({ featured }) => (
  <div className={`bg-white border border-[#E8EBF0] rounded-2xl overflow-hidden animate-pulse ${featured ? 'sm:col-span-2 sm:row-span-2' : ''}`}>
    <div className={`bg-[#F0F2F5] ${featured ? 'aspect-[16/10]' : 'aspect-[4/3]'}`} />
    <div className="p-5 space-y-2">
      <div className="h-4 w-3/4 bg-[#F0F2F5] rounded" />
      <div className="h-3 w-1/2 bg-[#F0F2F5] rounded" />
    </div>
  </div>
);

const Portfolio = () => {
  const { isRTL, dir }          = useLanguage();
  const user                    = useSelector(s => s.auth?.user);
  const [projects, setProjects] = useState([]);
  const [cursor, setCursor]     = useState(null);
  const [hasMore, setHasMore]   = useState(true);
  const [category, setCategory] = useState('All');
  const [industry, setIndustry] = useState('');
  const [industries, setIndustries] = useState([]);
  const [sort, setSort]         = useState('latest');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]       = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const heroRef                 = useRef(null);
  const gridRef                 = useRef(null);
  const sentinelRef             = useRef(null);
  const requestId                = useRef(0);

  useSEO({
    title      : isRTL ? 'معرض الأعمال | يانسي تك' : 'Portfolio | YANSY TECH',
    description: isRTL
      ? 'مشاريع رقمية حقيقية أطلقناها لعملاء في مجالات التجارة الإلكترونية والـ SaaS والأنظمة الطبية والتعليم.'
      : 'Real digital products shipped by YANSY TECH — e-commerce platforms, SaaS dashboards, booking systems, enterprise tools, and more.',
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

  // ── Fetch filter meta (categories/industries with real projects) ────────────
  useEffect(() => {
    api.get('/portfolio/meta').then(({ data }) => setIndustries(data.industries || [])).catch(() => {});
  }, []);

  // ── Debounce search input ────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Fetch first page whenever filters change ─────────────────────────────
  const loadFirstPage = useCallback(async () => {
    const myRequest = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const { data } = await api.get('/portfolio', {
        params: {
          limit: 12,
          ...(category !== 'All' && { category }),
          ...(industry && { industry }),
          ...(search && { search }),
          ...(!search && { sort }),
        },
      });
      if (myRequest !== requestId.current) return;
      setProjects(data.projects || []);
      setCursor(data.nextCursor || null);
      setHasMore(Boolean(data.nextCursor));
    } catch (e) {
      if (myRequest !== requestId.current) return;
      console.error(e);
      setError(true);
    } finally {
      if (myRequest === requestId.current) setLoading(false);
    }
  }, [category, industry, search, sort]);

  useEffect(() => { loadFirstPage(); }, [loadFirstPage]);

  // ── Load more (infinite scroll) ──────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore || search) return;
    setLoadingMore(true);
    try {
      const { data } = await api.get('/portfolio', {
        params: { limit: 12, cursor, ...(category !== 'All' && { category }), ...(industry && { industry }), sort },
      });
      setProjects((prev) => [...prev, ...(data.projects || [])]);
      setCursor(data.nextCursor || null);
      setHasMore(Boolean(data.nextCursor));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, search, category, industry, sort]);

  // ── IntersectionObserver sentinel for infinite scroll ────────────────────
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || search) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '400px' }
    );
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [loadMore, hasMore, search]);

  // ── Animate grid on data change ──────────────────────────────────────────
  useEffect(() => {
    if (!gridRef.current || loading) return;
    const cards = gridRef.current.querySelectorAll('[data-card]');
    gsap.fromTo(
      cards,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' }
    );
  }, [projects, loading]);

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

  const activeLabel = (cat) => isRTL ? cat.ar : cat.en;
  const showFeaturedSpotlight = category === 'All' && !industry && !search;

  return (
    <div className="bg-white text-[#0D1117] min-h-screen overflow-x-hidden" dir={dir}>
      <Header onStartProject={() => setIsFormOpen(true)} />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative pt-40 pb-24 px-4 sm:px-8 overflow-hidden">
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
          <p data-hero className="text-xs tracking-[0.4em] text-[#2563EB]/60 uppercase mb-6 opacity-0">
            {isRTL ? 'معرض الأعمال' : 'Portfolio'}
          </p>
          <h1
            data-hero
            className="opacity-0 font-bold tracking-tight leading-[1.06] mb-8"
            style={{ fontSize: 'clamp(2.5rem, 6.5vw, 6.5rem)', letterSpacing: '-0.03em' }}
          >
            {isRTL ? 'أعمالنا الحقيقية' : 'Real work,'}
            <br />
            <span className="text-[#2563EB]">{isRTL ? 'نتائج حقيقية' : 'real results.'}</span>
          </h1>
          <p data-hero className="opacity-0 text-[#5C6370] font-normal text-base sm:text-xl max-w-2xl">
            {isRTL
              ? 'مشاريع رقمية أطلقناها لعملاء حقيقيين في مجالات مختلفة.'
              : "Digital products we've shipped for real clients across different industries."}
          </p>
        </div>
      </section>

      {/* ── FILTER BAR ────────────────────────────────────────────────────── */}
      <div className="sticky top-[72px] z-30 bg-white/95 backdrop-blur-md border-b border-[#E8EBF0] px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            {/* Category chips */}
            <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
              <div className={`flex gap-2 min-w-max ${isRTL ? 'flex-row-reverse' : ''}`}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.en}
                    onClick={() => setCategory(cat.en)}
                    className="px-4 py-1.5 text-[11px] font-medium tracking-widest uppercase border rounded-full transition-all duration-300 whitespace-nowrap"
                    style={{
                      borderColor: category === cat.en ? '#2563EB' : '#E8EBF0',
                      color: category === cat.en ? '#2563EB' : '#5C6370',
                      background: category === cat.en ? 'rgba(37,99,235,0.08)' : 'transparent',
                    }}
                  >
                    {activeLabel(cat)}
                  </button>
                ))}
              </div>
            </div>

            {/* Search + sort */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" style={{ [isRTL ? 'right' : 'left']: 10 }} />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={isRTL ? 'ابحث في المشاريع...' : 'Search projects...'}
                  className="w-40 sm:w-56 text-xs font-light border border-[#E8EBF0] rounded-full py-2 focus:outline-none focus:border-[#2563EB]/50 transition-colors"
                  style={{ [isRTL ? 'paddingRight' : 'paddingLeft']: 30, [isRTL ? 'paddingLeft' : 'paddingRight']: 12 }}
                />
                {searchInput && (
                  <button onClick={() => setSearchInput('')} className="absolute top-1/2 -translate-y-1/2" style={{ [isRTL ? 'left' : 'right']: 10 }}>
                    <X className="w-3.5 h-3.5 text-[#9CA3AF] hover:text-[#0D1117]" />
                  </button>
                )}
              </div>

              {!search && (
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="text-[11px] font-medium tracking-widest uppercase border border-[#E8EBF0] rounded-full px-3 py-2 text-[#5C6370] focus:outline-none focus:border-[#2563EB]/50 bg-white"
                >
                  {SORTS.map((s) => <option key={s.value} value={s.value}>{isRTL ? s.ar : s.en}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Industry chips */}
          {industries.length > 0 && (
            <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
              <div className={`flex gap-1.5 min-w-max ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={() => setIndustry('')}
                  className="px-3 py-1 text-[10px] font-medium tracking-wide rounded-full border transition-colors whitespace-nowrap"
                  style={{ borderColor: !industry ? '#0D1117' : '#E8EBF0', color: !industry ? '#0D1117' : '#9CA3AF', background: !industry ? '#F6F7F9' : 'transparent' }}
                >
                  {isRTL ? 'كل الصناعات' : 'All industries'}
                </button>
                {industries.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => setIndustry(ind)}
                    className="px-3 py-1 text-[10px] font-medium tracking-wide rounded-full border transition-colors whitespace-nowrap"
                    style={{ borderColor: industry === ind ? '#0D1117' : '#E8EBF0', color: industry === ind ? '#0D1117' : '#9CA3AF', background: industry === ind ? '#F6F7F9' : 'transparent' }}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── GRID ──────────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <SkeletonCard featured />
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <div className="text-center py-32">
              <p className="text-[#9CA3AF] font-light text-lg mb-6">
                {isRTL ? 'تعذر تحميل المشاريع. حاول مرة أخرى.' : "Couldn't load projects. Please try again."}
              </p>
              <button onClick={loadFirstPage} className="text-[#2563EB] text-xs tracking-widest uppercase border border-[#2563EB]/30 rounded-full px-6 py-3 hover:bg-[#2563EB]/08 transition-all">
                {isRTL ? 'إعادة المحاولة' : 'Retry'}
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-32 text-[#9CA3AF] font-light text-xl">
              {isRTL ? 'لا توجد مشاريع مطابقة.' : 'No matching projects yet.'}
            </div>
          ) : (
            <>
              <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 auto-rows-fr">
                {projects.map((p, i) => (
                  <PortfolioCard
                    key={p._id}
                    project={p}
                    isRTL={isRTL}
                    priority={i === 0}
                    size={showFeaturedSpotlight && i === 0 ? 'featured' : 'default'}
                  />
                ))}
              </div>

              {/* Infinite scroll sentinel */}
              {!search && hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-12">
                  {loadingMore && (
                    <div className="w-6 h-6 border-2 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin" />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-8 py-32 sm:py-40 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.07) 0%, transparent 70%)' }}
        />
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-black/5 to-transparent" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p className="text-[10px] tracking-[0.5em] text-[#2563EB]/50 uppercase mb-6">
            {isRTL ? 'الخطوة التالية' : "What's next"}
          </p>

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

          <p className="text-[#5C6370] font-light text-base sm:text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            {isRTL
              ? 'تواصل معنا مباشرة على واتساب وابدأ رحلتك الرقمية.'
              : "Reach out on WhatsApp and let's start building something great together."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setIsFormOpen(true)}
              className="group inline-flex items-center gap-3 px-10 py-5 bg-[#2563EB] text-white text-xs font-light tracking-widest uppercase hover:bg-[#1D4ED8] transition-all duration-500 rounded-full"
            >
              {isRTL ? 'ابدأ مشروعك' : 'Start Your Project'}
              <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            <a
              href={`https://wa.me/201090385390?text=${encodeURIComponent(isRTL ? 'مرحباً! أريد التحدث عن مشروع.' : "Hi! I'd like to discuss a project with YANSY.")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsAppClick('portfolio')}
              className="group inline-flex items-center gap-3 px-10 py-5 border border-[#2563EB] text-[#2563EB] text-xs font-light tracking-widest uppercase hover:bg-[#2563EB] hover:text-white transition-all duration-500 rounded-full"
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
