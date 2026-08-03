import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { Search, Clock, ArrowUpRight, Sparkles, Filter, Mail, CheckCircle2, TrendingUp, BookOpen } from 'lucide-react';
import { BLOG_POSTS, CATEGORIES } from '../data/blogPosts';
import { getLocalizedPost } from '../utils/blogUtils';
import { useSEO } from '../hooks/useSEO';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';
import BlogVisual from '../components/BlogVisual';

const Blog = () => {
  const { isRTL, language } = useLanguage();
  const lang = isRTL ? 'ar' : 'en';
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  
  const heroRef = useRef(null);
  const gridRef = useRef(null);

  // Normalize all posts with localized fields
  const localizedPosts = useMemo(() => {
    return BLOG_POSTS.map(post => getLocalizedPost(post, lang));
  }, [lang]);

  // Filter posts based on active category and search query
  const filteredPosts = useMemo(() => {
    return localizedPosts.filter(post => {
      const matchCategory = activeCategory === 'all' || post.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || (
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some(t => t.toLowerCase().includes(q))
      );
      return matchCategory && matchSearch;
    });
  }, [localizedPosts, activeCategory, searchQuery]);

  const featuredPost = localizedPosts[0];
  const trendingPosts = localizedPosts.slice(1, 4);

  const categoryLabel = (catSlug) => {
    const c = CATEGORIES.find(c => c.slug === catSlug);
    if (!c) return catSlug;
    return isRTL ? c.labelAr : c.label;
  };

  useSEO({
    title: isRTL ? 'المدونة والهندسة البرمجية | يانسي تك' : 'Blog & Engineering Insights | YANSY TECH',
    description: isRTL
      ? 'أدلة عملية ومقالات هندسية متخصصة في تطوير الويب، تطبيقات SaaS، التجارة الإلكترونية، وأتمتة الأعمال من خبراء يانسي تك.'
      : 'Expert articles on React, Next.js, SaaS architecture, web performance, product design, and e-commerce strategy from YANSY TECH.',
    keywords: isRTL
      ? 'مدونة تطوير الويب, هندسة البرمجيات, تطوير SaaS, تجربة المستخدم, أداء الويب'
      : 'web development blog, SaaS architecture, React performance, Next.js guide, UI/UX design',
    canonical: 'https://yansytech.com/blog',
    ogLocale: isRTL ? 'ar_SA' : 'en_US',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      url: 'https://yansytech.com/blog',
      name: isRTL ? 'مدونة يانسي تك' : 'YANSY TECH Blog',
      description: isRTL ? 'مقالات وأدلة هندسية متخصصة' : 'Engineering insights & technology guides',
    },
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-hero-anim]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setEmailSubscribed(true);
      setEmailInput('');
    }
  };

  return (
    <>
      <Header onStartProject={() => setIsFormOpen(true)} />

      <main className="bg-surface-white text-[rgb(var(--text-primary))] overflow-x-hidden pt-28 pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* ── HERO HEADER ──────────────────────────────────────────────── */}
        <section ref={heroRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="text-center max-w-3xl mx-auto">
            <div data-hero-anim className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgb(var(--accent-light))] border border-[rgba(37,99,235,0.2)] text-[rgb(var(--accent))] text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRTL ? 'المعرفة والرؤى الهندسية' : 'Engineering Insights & Knowledge'}</span>
            </div>
            
            <h1 data-hero-anim className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[rgb(var(--text-primary))] tracking-tight mb-4 leading-tight">
              {isRTL ? (
                <>مقالات وأدلة <span className="text-[rgb(var(--accent))]">بناء المنتجات الرقمية</span></>
              ) : (
                <>Insights for <span className="text-[rgb(var(--accent))]">Digital Product</span> Builders</>
              )}
            </h1>

            <p data-hero-anim className="text-sm sm:text-lg text-[rgb(var(--text-secondary))] leading-relaxed mb-8">
              {isRTL
                ? 'خبرات عملية وأكواد برمجية مجربة في تطوير الويب، منصات SaaS، الأداء الفائق، وتجارب المستخدم الاستثنائية.'
                : 'Deep dives, architectural playbooks, and practical insights on building high-performance web applications and scaling SaaS.'}
            </p>

            {/* Search & Filter Bar */}
            <div data-hero-anim className="relative max-w-xl mx-auto mb-8">
              <Search className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-5 h-5 text-[rgb(var(--text-tertiary))]`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'ابحث في المقالات، التقنيات، المواضيع...' : 'Search articles, tags, topics...'}
                className={`w-full py-3.5 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} rounded-2xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] text-sm font-medium focus:outline-none focus:border-[rgb(var(--accent))] transition-all shadow-xs`}
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeCategory === 'all'
                  ? 'bg-[rgb(var(--text-primary))] text-[rgb(var(--bg-elevated))] shadow-sm'
                  : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] border border-[rgb(var(--border))] hover:border-[rgb(var(--border-strong))]'
              }`}
            >
              {isRTL ? 'جميع المقالات' : 'All Articles'} ({localizedPosts.length})
            </button>

            {CATEGORIES.map(cat => {
              const active = activeCategory === cat.slug;
              const count = localizedPosts.filter(p => p.category === cat.slug).length;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[rgb(var(--accent))] text-white shadow-sm'
                      : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] border border-[rgb(var(--border))] hover:border-[rgb(var(--border-strong))]'
                  }`}
                >
                  {isRTL ? cat.labelAr : cat.label} ({count})
                </button>
              );
            })}
          </div>
        </section>

        {/* ── FEATURED HERO ARTICLE ──────────────────────────────────── */}
        {featuredPost && activeCategory === 'all' && !searchQuery && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
            <div className="rounded-3xl border border-[rgb(var(--border))] bg-gradient-to-br from-[rgb(var(--bg-elevated))] to-surface-white overflow-hidden shadow-xl hover:border-[rgb(var(--border-strong))] transition-all duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                
                {/* Visual */}
                <div className="lg:col-span-6 relative aspect-[16/10] lg:aspect-auto lg:h-full min-h-[300px] overflow-hidden bg-slate-900">
                  <BlogVisual icon={CATEGORIES.find(c => c.slug === featuredPost.category)?.icon} color={CATEGORIES.find(c => c.slug === featuredPost.category)?.color} title={featuredPost.title} slug={featuredPost.slug} coverImage={featuredPost.coverImage} />
                  <span className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'} px-3 py-1 rounded-full text-xs font-bold bg-black/60 text-white backdrop-blur-md border border-white/20`}>
                    🌟 {isRTL ? 'مقالة مميزة' : 'Featured Article'}
                  </span>
                </div>

                {/* Content */}
                <div className="lg:col-span-6 p-6 sm:p-10 space-y-4">
                  <div className="flex items-center gap-3 text-xs text-[rgb(var(--text-tertiary))] font-semibold">
                    <span className="px-3 py-1 rounded-full bg-[rgb(var(--accent-light))] text-[rgb(var(--accent))] font-bold">
                      {categoryLabel(featuredPost.category)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {featuredPost.readTime} {isRTL ? 'دقائق قراءة' : 'min read'}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-3xl font-extrabold text-[rgb(var(--text-primary))] leading-tight hover:text-[rgb(var(--accent))] transition-colors">
                    <Link to={`/blog/${featuredPost.slug}`}>
                      {featuredPost.title}
                    </Link>
                  </h2>

                  <p className="text-sm sm:text-base text-[rgb(var(--text-secondary))] leading-relaxed line-clamp-3">
                    {featuredPost.excerpt}
                  </p>

                  <div className="pt-4 flex items-center justify-between border-t border-[rgb(var(--border-light))]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase">
                        {featuredPost.author.name.charAt(0)}
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-[rgb(var(--text-primary))]">{featuredPost.author.name}</span>
                        <span className="block text-[11px] text-[rgb(var(--text-tertiary))]">{featuredPost.author.role}</span>
                      </div>
                    </div>

                    <Link
                      to={`/blog/${featuredPost.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[rgb(var(--text-primary))] text-[rgb(var(--bg-elevated))] text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      <span>{isRTL ? 'قراءة المقال' : 'Read Article'}</span>
                      <ArrowUpRight className={`w-4 h-4 ${isRTL ? '-scale-x-100' : ''}`} />
                    </Link>
                  </div>

                </div>

              </div>
            </div>
          </section>
        )}

        {/* ── ARTICLES GRID ────────────────────────────────────────────── */}
        <section ref={gridRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[rgb(var(--border-light))]">
            <h3 className="text-lg sm:text-xl font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[rgb(var(--accent))]" />
              <span>
                {searchQuery 
                  ? (isRTL ? `نتائج البحث عن "${searchQuery}"` : `Search Results for "${searchQuery}"`)
                  : (isRTL ? 'أحدث المقالات الهندسية' : 'Latest Engineering Articles')}
              </span>
            </h3>
            <span className="text-xs font-semibold text-[rgb(var(--text-tertiary))]">
              {filteredPosts.length} {isRTL ? 'مقال متاح' : 'articles'}
            </span>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 px-4 border border-dashed border-[rgb(var(--border))] rounded-3xl bg-[rgb(var(--bg-elevated))]">
              <p className="text-base font-bold text-[rgb(var(--text-primary))] mb-2">
                {isRTL ? 'لم نجد أي مقالات تطابق بحثك' : 'No articles match your search'}
              </p>
              <p className="text-xs text-[rgb(var(--text-secondary))] mb-6">
                {isRTL ? 'جرب البحث بكلمات أخرى أو اختر فئة مختلفة.' : 'Try adjusting your search query or clear filters.'}
              </p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="px-4 py-2 rounded-xl bg-[rgb(var(--accent))] text-white text-xs font-bold cursor-pointer"
              >
                {isRTL ? 'عرض جميع المقالات' : 'Reset All Filters'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredPosts.map(post => (
                <article
                  key={post.slug}
                  data-card
                  className="group flex flex-col bg-surface-white rounded-3xl border border-[rgb(var(--border))] overflow-hidden hover:border-[rgb(var(--border-strong))] hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                    <BlogVisual icon={CATEGORIES.find(c => c.slug === post.category)?.icon} color={CATEGORIES.find(c => c.slug === post.category)?.color} title={post.title} slug={post.slug} coverImage={post.coverImage} />
                    <div className="absolute top-3 right-3 left-3 flex justify-between items-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-surface-white/95 backdrop-blur-md border border-[rgb(var(--border))] text-[rgb(var(--text-primary))]">
                        {categoryLabel(post.category)}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/50 text-white backdrop-blur-md flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime} {isRTL ? 'د' : 'min'}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--accent))] transition-colors line-clamp-2 mb-2 leading-snug">
                        <Link to={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h4>
                      <p className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] leading-relaxed line-clamp-3 mb-4">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* Tags & Footer */}
                    <div>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {post.tags.slice(0, 3).map((tag, tIdx) => (
                            <span key={tIdx} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-tertiary))] border border-[rgb(var(--border-light))]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="pt-3 border-t border-[rgb(var(--border-light))] flex items-center justify-between text-xs text-[rgb(var(--text-tertiary))]">
                        <span className="font-medium">{post.author.name}</span>
                        <Link
                          to={`/blog/${post.slug}`}
                          className="font-bold text-[rgb(var(--accent))] flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                        >
                          <span>{isRTL ? 'اقرأ المزيد' : 'Read'}</span>
                          <ArrowUpRight className={`w-3.5 h-3.5 ${isRTL ? '-scale-x-100' : ''}`} />
                        </Link>
                      </div>
                    </div>

                  </div>
                </article>
              ))}
            </div>
          )}

        </section>

        {/* ── NEWSLETTER SUBSCRIPTION ──────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-16">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden shadow-2xl border border-slate-700/50">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 text-center max-w-xl mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>

              <h3 className="text-xl sm:text-3xl font-extrabold text-white">
                {isRTL ? 'اشترك في النشرة البرمجية الأسبوعية' : 'Subscribe to Engineering Weekly'}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isRTL
                  ? 'أحدث التطورات الهندسية، تقنيات React & Next.js، وإشعارات المقالات الجديدة مباشرة إلى بريدك الإلكتروني.'
                  : 'Get our latest architectural guides, React benchmarks, and SaaS strategies delivered to your inbox every week.'}
              </p>

              {emailSubscribed ? (
                <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>{isRTL ? 'تم اشتراكك بنجاح! شكراً لانضمامك.' : 'Subscribed successfully! Thank you.'}</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder={isRTL ? 'أدخل بريدك الإلكتروني...' : 'Enter your email address...'}
                    className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-2xl bg-[rgb(var(--accent))] hover:bg-blue-600 text-white text-xs sm:text-sm font-extrabold transition-colors cursor-pointer"
                  >
                    {isRTL ? 'اشترك الآن' : 'Subscribe'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

      </main>

      <Footer />
      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </>
  );
};

export default Blog;
