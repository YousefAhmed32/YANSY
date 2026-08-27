import { useParams, Link } from 'react-router-dom';
import { useEffect, useRef, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { Clock, ArrowLeft, ArrowRight, ArrowUpRight, Check, MessageCircle, Twitter, Linkedin, Copy, Calendar, List, BookOpen, AlertCircle } from 'lucide-react';
import { BLOG_POSTS, CATEGORIES } from '../data/blogPosts';
import { getLocalizedPost } from '../utils/blogUtils';
import BlogContentRenderer from '../components/BlogContentRenderer';
import { useSEO } from '../hooks/useSEO';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';
import BlogVisual from '../components/BlogVisual';
import { trackViewContent } from '../utils/metaPixel';
import api from '../utils/api';

const BlogPost = () => {
  const { slug: rawSlug } = useParams();
  const { isRTL } = useLanguage();
  const lang = isRTL ? 'ar' : 'en';
  const heroRef = useRef(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [apiPost, setApiPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const targetSlug = useMemo(() => {
    try {
      return decodeURIComponent(rawSlug || '');
    } catch {
      return rawSlug || '';
    }
  }, [rawSlug]);

  // Find post in static data
  const staticRawPost = useMemo(() => {
    if (!targetSlug) return null;
    return BLOG_POSTS.find(p => {
      if (typeof p.slug === 'string') {
        return p.slug === targetSlug || p.slug === rawSlug;
      }
      if (typeof p.slug === 'object' && p.slug !== null) {
        return p.slug.en === targetSlug || p.slug.ar === targetSlug || p.slug.en === rawSlug || p.slug.ar === rawSlug;
      }
      return false;
    }) || null;
  }, [targetSlug, rawSlug]);

  // Fetch from API if static not found
  useEffect(() => {
    let alive = true;
    if (staticRawPost) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api.get(`/blog/${targetSlug}`)
      .then(({ data }) => {
        if (alive && data.success && data.post) {
          setApiPost(data.post);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, [staticRawPost, targetSlug]);

  const activeRawPost = staticRawPost || apiPost;

  // Localize post data cleanly
  const post = useMemo(() => {
    return activeRawPost ? getLocalizedPost(activeRawPost, lang) : null;
  }, [activeRawPost, lang]);

  // Next/Prev navigation index
  const currentIndex = useMemo(() => {
    return BLOG_POSTS.findIndex(p => p.slug === targetSlug || p.slug === rawSlug);
  }, [targetSlug, rawSlug]);

  const prevRaw = currentIndex > 0 ? BLOG_POSTS[currentIndex - 1] : null;
  const nextRaw = (currentIndex >= 0 && currentIndex < BLOG_POSTS.length - 1) ? BLOG_POSTS[currentIndex + 1] : null;

  const prevPost = prevRaw ? getLocalizedPost(prevRaw, lang) : null;
  const nextPost = nextRaw ? getLocalizedPost(nextRaw, lang) : null;

  // Related articles
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return BLOG_POSTS
      .filter(p => p.slug !== targetSlug && p.slug !== rawSlug && (p.category === post.category || (post.relatedPosts || []).includes(p.slug)))
      .slice(0, 3)
      .map(p => getLocalizedPost(p, lang));
  }, [post, targetSlug, rawSlug, lang]);

  // Dynamic Table of Contents items
  const tocItems = useMemo(() => {
    if (!post?.content) return [];
    return post.content
      .filter(b => b.heading || b.type === 'heading' || b.type === 'h2' || b.type === 'section')
      .map((b) => ({
        id: b.id,
        title: b.heading || b.text || 'Section',
      }))
      .filter(item => item.title && item.title.trim());
  }, [post]);

  // Scroll Reading Progress Bar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (post) trackViewContent({ content_name: post.title, content_type: 'blog_post', content_category: post.category });
  }, [post]);

  const category = post ? CATEGORIES.find(c => c.slug === post.category) : null;
  const categoryLabel = post ? (isRTL ? category?.labelAr : category?.label) || post.category : '';
  const categoryColor = category?.color || 'rgb(var(--accent))';

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://yansytech.com/blog/${rawSlug}`;

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  useSEO({
    title: post ? `${post.title} | YANSY TECH` : (isRTL ? 'مقال | يانسي تك' : 'Blog Post | YANSY TECH'),
    description: post?.excerpt || 'Expert technical article by YANSY TECH.',
    keywords: post ? `${(post.tags || []).join(', ')}, YANSY TECH` : 'web development, SaaS',
    canonical: `https://yansytech.com/blog/${targetSlug}`,
    ogLocale: isRTL ? 'ar_SA' : 'en_US',
    schema: post ? {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      datePublished: post.publishDate,
      author: {
        '@type': 'Person',
        name: post.author?.name || 'YANSY Tech Team',
      },
      publisher: {
        '@type': 'Organization',
        '@id': 'https://yansytech.com/#organization',
        name: 'YANSY TECH',
      },
      url: `https://yansytech.com/blog/${targetSlug}`,
    } : undefined,
  });

  useEffect(() => {
    if (!post) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-hero-anim]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' });
    }, heroRef);
    return () => ctx.revert();
  }, [post]);

  // Loading state
  if (loading) {
    return (
      <>
        <Header onStartProject={() => setIsFormOpen(true)} />
        <main className="min-h-[70vh] flex items-center justify-center pt-28 pb-20 bg-surface-white">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-3 border-[rgb(var(--accent))] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-[rgb(var(--text-secondary))]">
              {isRTL ? 'جاري تحميل المقال...' : 'Loading article...'}
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Not Found State (Graceful, no hard redirects)
  if (!post) {
    return (
      <>
        <Header onStartProject={() => setIsFormOpen(true)} />
        <main className="min-h-[70vh] flex items-center justify-center pt-28 pb-20 bg-surface-white px-4">
          <div className="text-center max-w-md p-8 rounded-3xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">
              {isRTL ? 'لم يتم العثور على المقال' : 'Article Not Found'}
            </h2>
            <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed">
              {isRTL
                ? 'المقال الذي تبحث عنه قد يكون تم نقله أو غير موجود حالياً.'
                : 'The article you are looking for might have been moved or is currently unavailable.'}
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[rgb(var(--accent))] text-white text-xs font-bold shadow-md hover:bg-blue-600 transition-colors"
            >
              <span>{isRTL ? 'العودة للمدونة' : 'Return to Blog'}</span>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 z-[100]">
        <div
          className="h-full bg-[rgb(var(--accent))] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <Header onStartProject={() => setIsFormOpen(true)} />

      <main className="bg-surface-white text-[rgb(var(--text-primary))] overflow-x-hidden pt-28 pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* ── HERO HEADER ──────────────────────────────────────────────── */}
        <section ref={heroRef} className="max-w-4xl mx-auto px-4 sm:px-6 mb-12">
          
          {/* Breadcrumb Navigation */}
          <nav data-hero-anim className="flex items-center gap-2 text-xs font-semibold text-[rgb(var(--text-tertiary))] mb-6">
            <Link to="/blog" className="hover:text-[rgb(var(--accent))] transition-colors">
              {isRTL ? 'المدونة' : 'Blog'}
            </Link>
            <span>/</span>
            <span style={{ color: categoryColor }}>{categoryLabel}</span>
          </nav>

          {/* Meta Tags */}
          <div data-hero-anim className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: `${categoryColor}15`, color: categoryColor, border: `1px solid ${categoryColor}40` }}
            >
              {categoryLabel}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-tertiary))] font-medium">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime} {isRTL ? 'دقائق قراءة' : 'min read'}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-tertiary))] font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {post.publishDate}
            </span>
          </div>

          {/* Title */}
          <h1 data-hero-anim className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[rgb(var(--text-primary))] leading-tight tracking-tight mb-6">
            {post.title}
          </h1>

          {/* Excerpt Subtitle */}
          <p data-hero-anim className="text-base sm:text-xl text-[rgb(var(--text-secondary))] leading-relaxed mb-8">
            {post.excerpt}
          </p>

          {/* Author Box & Social Share */}
          <div data-hero-anim className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))] shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                {post.author.name.charAt(0)}
              </div>
              <div>
                <span className="block text-sm font-bold text-[rgb(var(--text-primary))]">{post.author.name}</span>
                <span className="block text-xs text-[rgb(var(--text-tertiary))]">{post.author.role}</span>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${post.title} - ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                title={isRTL ? 'مشاركة عبر واتساب' : 'Share on WhatsApp'}
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 transition-colors"
                title={isRTL ? 'مشاركة عبر منصة X' : 'Share on X'}
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 transition-colors"
                title={isRTL ? 'مشاركة عبر لينكد إن' : 'Share on LinkedIn'}
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <button
                onClick={copyShareLink}
                type="button"
                className="p-2 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-300 hover:bg-slate-500/20 transition-colors cursor-pointer"
                title={isRTL ? 'نسخ الرابط' : 'Copy link'}
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

          </div>

        </section>

        {/* ── FEATURED BANNER IMAGE ──────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-12">
          <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl border border-[rgb(var(--border))] bg-slate-900">
            <BlogVisual icon={category?.icon} color={categoryColor} title={post.title} slug={post.slug} coverImage={post.coverImage} isRTL={isRTL} priority />
          </div>
        </div>

        {/* ── MAIN CONTENT LAYOUT WITH TOC SIDEBAR ────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Table of Contents Sticky Sidebar */}
          {tocItems.length > 0 && (
            <aside className="lg:col-span-4 hidden lg:block sticky top-32 p-6 rounded-3xl bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border))]">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[rgb(var(--border-light))] text-xs font-bold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                <List className="w-4 h-4 text-[rgb(var(--accent))]" />
                <span>{isRTL ? 'فهرس محتويات المقال' : 'Table of Contents'}</span>
              </div>
              <nav className="space-y-2 text-xs">
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block py-1.5 px-2.5 rounded-lg text-[rgb(var(--text-secondary))] hover:bg-surface-white hover:text-[rgb(var(--accent))] transition-colors line-clamp-1 font-medium"
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </aside>
          )}

          {/* Article Body */}
          <article className={`${tocItems.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12 max-w-3xl mx-auto'} w-full`}>
            <BlogContentRenderer content={post.content} isRTL={isRTL} />

            {/* Tags footer */}
            {post.tags && post.tags.length > 0 && (
              <div className="my-10 pt-6 border-t border-[rgb(var(--border-light))]">
                <span className="text-xs font-bold text-[rgb(var(--text-tertiary))] block mb-3 uppercase tracking-wider">
                  {isRTL ? 'الوسوم المتعلقة:' : 'Related Tags:'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-secondary))] text-xs font-semibold border border-[rgb(var(--border))]">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Next & Prev Article Navigation */}
            <div className="my-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevPost && (
                <Link
                  to={`/blog/${prevPost.slug}`}
                  className="p-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] hover:border-[rgb(var(--border-strong))] transition-all group"
                >
                  <span className="text-[11px] font-bold text-[rgb(var(--text-tertiary))] flex items-center gap-1 mb-1">
                    {isRTL ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                    <span>{isRTL ? 'المقال السابق' : 'Previous Article'}</span>
                  </span>
                  <span className="text-sm font-bold text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--accent))] transition-colors line-clamp-1">
                    {prevPost.title}
                  </span>
                </Link>
              )}

              {nextPost && (
                <Link
                  to={`/blog/${nextPost.slug}`}
                  className={`p-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] hover:border-[rgb(var(--border-strong))] transition-all group ${!prevPost ? 'sm:col-span-2' : ''}`}
                >
                  <span className="text-[11px] font-bold text-[rgb(var(--text-tertiary))] flex items-center justify-end gap-1 mb-1">
                    <span>{isRTL ? 'المقال التالي' : 'Next Article'}</span>
                    {isRTL ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </span>
                  <span className="text-sm font-bold text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--accent))] transition-colors line-clamp-1 text-end">
                    {nextPost.title}
                  </span>
                </Link>
              )}
            </div>

          </article>

        </div>

        {/* ── RELATED ARTICLES GRID ──────────────────────────────────── */}
        {relatedPosts.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-20 pt-12 border-t border-[rgb(var(--border-light))]">
            <h3 className="text-xl sm:text-2xl font-extrabold text-[rgb(var(--text-primary))] mb-8 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[rgb(var(--accent))]" />
              <span>{isRTL ? 'مقالات قد تهمك أيضاً' : 'Recommended Reading'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map(rel => (
                <Link
                  key={rel.slug}
                  to={`/blog/${rel.slug}`}
                  className="group rounded-2xl border border-[rgb(var(--border))] bg-surface-white p-4 hover:border-[rgb(var(--border-strong))] hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-900 mb-3">
                      <BlogVisual icon={category?.icon} color={categoryColor} title={rel.title} slug={rel.slug} coverImage={rel.coverImage} isRTL={isRTL} />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[rgb(var(--accent-light))] text-[rgb(var(--accent))] inline-block mb-2">
                      {categoryLabel}
                    </span>
                    <h4 className="text-sm font-bold text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--accent))] transition-colors line-clamp-2 mb-2">
                      {rel.title}
                    </h4>
                    <p className="text-xs text-[rgb(var(--text-secondary))] line-clamp-2">
                      {rel.excerpt}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[rgb(var(--border-light))] text-[11px] font-bold text-[rgb(var(--accent))] flex items-center justify-between">
                    <span>{isRTL ? 'اقرأ المزيد' : 'Read Article'}</span>
                    <ArrowUpRight className={`w-3.5 h-3.5 ${isRTL ? '-scale-x-100' : ''}`} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

      <Footer />
      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </>
  );
};

export default BlogPost;
