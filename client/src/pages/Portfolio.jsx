import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { trackWhatsAppClick } from '../utils/ga4';
import PortfolioFilters from '../components/PortfolioFilters';
import WhatsAppGlyph from '../components/WhatsAppGlyph';
import '../styles/portfolio-editorial.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AIChatWidget from '../components/AIChatWidget';
import FloatingActionMenu from '../components/FloatingActionMenu';
import ProjectRequestForm from '../components/ProjectRequestForm';
import PortfolioCard from '../components/PortfolioCard';
import api from '../utils/api';
import { ArrowUpRight } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

const SkeletonCard = () => (
  <div className="portfolio-editorial-skeleton" aria-hidden="true">
    <div className="portfolio-editorial-card__media skeleton" />
    <div className="skeleton" style={{ height: 20, width: '60%' }} />
    <div className="skeleton" style={{ height: 12, width: '85%' }} />
  </div>
);
const Portfolio = () => {
  const { isRTL, dir, language } = useLanguage();
  const { t: translate } = useTranslation(undefined, { lng: language });
  const t = (key, options) => translate(`portfolioEditorial.${key}`, options);
  const user                    = useSelector(s => s.auth?.user);
  const authToken                = useSelector(s => s.auth?.token);
  const [projects, setProjects] = useState([]);
  const [cursor, setCursor]     = useState(null);
  const [hasMore, setHasMore]   = useState(true);
  const [category, setCategory]     = useState(''); // holds a Category slug, '' = All
  const [categories, setCategories] = useState([]);
  const [industry, setIndustry] = useState(''); // holds an Industry slug
  const [industries, setIndustries] = useState([]);
  const [tag, setTag]           = useState(''); // holds a Technology slug
  const [technologies, setTechnologies] = useState([]);
  const [mode, setMode]         = useState(''); // '' | 'caseStudy' | 'showcase' — presentationMode
  const [work, setWork]         = useState(''); // '' | 'live' | 'concept' — deliveryStatus
  const [presentationModes, setPresentationModes] = useState({ caseStudy: 0, showcase: 0 });
  const [deliveryStatuses, setDeliveryStatuses] = useState({ live: 0, concept: 0, archived: 0 });
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sort, setSort]         = useState('latest');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [error, setError]       = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const aiWidgetRef              = useRef(null);


  const sentinelRef             = useRef(null);
  const requestId                = useRef(0);
  const moreRequestRef = useRef(null);

  useSEO({
    title      : isRTL ? 'معرض الأعمال | يانسي تك' : 'Portfolio | YANSY TECH',
    // Kept honest now that Concepts/Quick Showcases live alongside shipped
    // client work in this same listing (see PortfolioCard's Concept badge
    // and the Live Work / Concepts filter) — "real client work" as a
    // blanket claim would misdescribe a UI/UX concept or internal demo.
    description: isRTL
      ? 'مشاريع رقمية أطلقناها لعملاء حقيقيين، إلى جانب مفاهيم تصميم وعروض تجريبية — في مجالات التجارة الإلكترونية والـ SaaS والأنظمة الطبية والتعليم.'
      : 'Digital products by YANSY TECH — shipped client work alongside design concepts and demos — across e-commerce, SaaS, healthcare systems, and education.',
    keywords   : 'web development portfolio, digital products, SaaS projects, e-commerce portfolio, YANSY TECH work',
    canonical  : 'https://yansytech.com/portfolio',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': 'https://yansytech.com/portfolio#webpage',
      'url': 'https://yansytech.com/portfolio',
      'name': 'Portfolio | YANSY TECH',
      'description': 'Digital products by YANSY TECH — shipped client work alongside design concepts and demos.',
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

  // ── Fetch filter meta (categories/industries/technologies with real projects) ─
  useEffect(() => {
    api.get('/portfolio/meta').then(({ data }) => {
      setCategories(data.categories || []);
      setIndustries(data.industries || []);
      setTechnologies(data.technologies || []);
      if (data.presentationModes) setPresentationModes(data.presentationModes);
      if (data.deliveryStatuses) setDeliveryStatuses(data.deliveryStatuses);
    }).catch(() => {});
  }, []);

  // ── Debounce search input ────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Fetch first page whenever filters change ─────────────────────────────
  const loadFirstPage = useCallback(async () => {
    const myRequest = ++requestId.current;
    moreRequestRef.current = null;
    setLoadingMore(false);
    setLoadMoreError(false);
    setLoading(true);
    setError(false);
    try {
      const { data } = await api.get('/portfolio', {
        params: {
          limit: 12,
          ...(category && { category }),
          ...(industry && { industry }),
          ...(tag && { tag }),
          ...(mode && { mode }),
          ...(work && { work }),
          ...(featuredOnly && { featured: 'true' }),
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
  }, [category, industry, tag, mode, work, featuredOnly, search, sort]);

  useEffect(() => { loadFirstPage(); }, [loadFirstPage]);

  // ── Load more (infinite scroll) ──────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loading || !cursor || loadingMore || search || moreRequestRef.current) return;
    const token = { generation: requestId.current };
    moreRequestRef.current = token;
    setLoadingMore(true);
    setLoadMoreError(false);
    try {
      const { data } = await api.get('/portfolio', {
        params: { limit: 12, cursor, ...(category && { category }), ...(industry && { industry }), ...(tag && { tag }), ...(mode && { mode }), ...(work && { work }), ...(featuredOnly && { featured: 'true' }), sort },
      });
      if (token.generation !== requestId.current) return;
      setProjects(prev => {
        const existing = new Set(prev.map(project => project._id));
        return [...prev, ...(data.projects || []).filter(project => !existing.has(project._id))];
      });
      setCursor(data.nextCursor || null);
      setHasMore(Boolean(data.nextCursor));
    } catch (e) {
      console.error(e);
      if (token.generation === requestId.current) setLoadMoreError(true);
    } finally {
      if (moreRequestRef.current === token) {
        moreRequestRef.current = null;
        setLoadingMore(false);
      }
    }
  }, [loading, cursor, loadingMore, search, category, industry, tag, mode, work, featuredOnly, sort]);

  // ── IntersectionObserver sentinel for infinite scroll ────────────────────
  useEffect(() => {
    if (loading || loadMoreError || !sentinelRef.current || !hasMore || search) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '400px' }
    );
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [loadMore, hasMore, search, loading, loadMoreError]);

  const filters = { category, industry, tag, mode, work, featuredOnly, sort, searchInput };
  const filterSetters = { category: setCategory, industry: setIndustry, tag: setTag, mode: setMode, work: setWork, featuredOnly: setFeaturedOnly, sort: setSort, searchInput: setSearchInput };
  const changeFilter = (name, value) => filterSetters[name]?.(value);
  const resetFilters = () => {
    setCategory(''); setIndustry(''); setTag(''); setMode(''); setWork('');
    setFeaturedOnly(false); setSort('latest'); setSearchInput(''); setSearch('');
  };
  return (
    <div className="portfolio-page" dir={dir}>
      <Header onStartProject={() => setIsFormOpen(true)} onMenuOpenChange={setMobileMenuOpen} />

      <main>
        <section className="portfolio-masthead" aria-labelledby="portfolio-title">
          <div className="portfolio-editorial-inner portfolio-masthead__layout">
            <div>
              <p className="portfolio-masthead__eyebrow">{t('eyebrow')}</p>
              <h1 id="portfolio-title">{t('headline')}<span>.</span></h1>
              <p className="portfolio-masthead__lead">{t('lead')}</p>
            </div>
            <aside className="portfolio-masthead__note">
              <div className="portfolio-masthead__index">{t('selected')}</div>
              <p>{t('note')}</p>
            </aside>
          </div>
        </section>

        <div className="portfolio-editorial-inner">
          <PortfolioFilters filters={filters} onChange={changeFilter} onReset={resetFilters} categories={categories} industries={industries} technologies={technologies} presentationModes={presentationModes} deliveryStatuses={deliveryStatuses} isRTL={isRTL} t={t} />
        </div>

        <section className="portfolio-work" aria-label={t('results')} aria-busy={loading}>
          <div className="portfolio-editorial-inner">
            <p className="sr-only" role="status">{loading ? t('loading') : error ? t('loadError') : t('loaded', { count: projects.length })}</p>
            {loading ? (
              <div className="portfolio-editorial-grid">{Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}</div>
            ) : error ? (
              <div className="portfolio-empty">
                <h2>{t('loadError')}</h2><p>{t('loadErrorDescription')}</p>
                <button type="button" onClick={loadFirstPage} className="portfolio-text-button">{t('retry')}</button>
              </div>
            ) : projects.length === 0 ? (
              <div className="portfolio-empty">
                <h2>{t('empty')}</h2><p>{t('emptyDescription')}</p>
                <button type="button" onClick={resetFilters} className="portfolio-text-button">{t('reset')}</button>
              </div>
            ) : (
              <>
                <div className="portfolio-editorial-grid">
                  {projects.map((project, index) => <PortfolioCard key={project._id} project={project} isRTL={isRTL} priority={index < 2} variant="editorial" />)}
                </div>
                {!search && hasMore && (
                  <div ref={sentinelRef} className="portfolio-load-more">
                    <button type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? t('loading') : loadMoreError ? t('retry') : t('loadMore')}</button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="portfolio-closing">
          <div className="portfolio-editorial-inner portfolio-closing__inner">
            <div><h2>{t('nextTitle')}</h2><p>{t('nextDescription')}</p></div>
            <div className="portfolio-closing__actions">
              <button type="button" onClick={() => setIsFormOpen(true)}>{t('start')}<ArrowUpRight className="icon-directional" size={17} aria-hidden="true" /></button>
              <a href={`https://wa.me/201090385390?text=${encodeURIComponent(isRTL ? 'مرحباً! أريد التحدث عن مشروع.' : "Hi! I'd like to discuss a project with YANSY.")}`} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick('portfolio')}><WhatsAppGlyph size={19} />{t('whatsapp')}</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <AIChatWidget ref={aiWidgetRef} isRTL={isRTL} onStartProject={() => setIsFormOpen(true)} user={user} token={authToken} onOpenChange={setAiChatOpen} />
      <FloatingActionMenu isRTL={isRTL} hidden={aiChatOpen || isFormOpen || mobileMenuOpen} />
      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};

export default Portfolio;
