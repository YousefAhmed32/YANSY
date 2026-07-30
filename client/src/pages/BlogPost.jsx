import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowUpRight, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { getBlogPostBySlug, getRelatedBlogPosts, CATEGORIES } from '../data/blogPosts';
import { useSEO } from '../hooks/useSEO';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProjectRequestForm from '../components/ProjectRequestForm';
import BlogVisual from '../components/BlogVisual';
import { trackViewContent } from '../utils/metaPixel';

const BlogPost = () => {
  const { slug }  = useParams();
  const navigate  = useNavigate();
  const { isRTL } = useLanguage();
  const post      = getBlogPostBySlug(slug);
  const related   = getRelatedBlogPosts(slug, 3);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const heroRef   = useRef(null);

  useEffect(() => {
    if (!post) navigate('/blog', { replace: true });
  }, [post, navigate]);

  useEffect(() => {
    if (post) trackViewContent({ content_name: post.title, content_type: 'blog_post', content_category: post.category });
  }, [post]);

  const category = post ? CATEGORIES.find(c => c.slug === post.category) : null;
  const categoryLabel = post ? (isRTL ? category?.labelAr : category?.label) || post.category : '';
  const categoryColor = category?.color || 'rgb(var(--accent))';

  useSEO({
    title      : post ? `${post.title} | YANSY TECH` : (isRTL ? 'مقال | يانسي تك' : 'Blog Post | YANSY TECH'),
    description: post?.excerpt,
    keywords   : post ? `${post.tags.join(', ')}, YANSY TECH` : '',
    canonical  : `https://yansytech.com/blog/${slug}`,
    schema: post ? {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': post.title,
      'description': post.excerpt,
      'datePublished': post.publishDate,
      'author': {
        '@type': 'Organization',
        '@id': 'https://yansytech.com/#organization',
        'name': 'YANSY TECH',
      },
      'publisher': { '@id': 'https://yansytech.com/#organization' },
      'url': `https://yansytech.com/blog/${slug}`,
      'keywords': post.tags.join(', '),
      'articleSection': categoryLabel,
      'isPartOf': { '@id': 'https://yansytech.com/#website' },
      'breadcrumb': {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://yansytech.com/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': 'https://yansytech.com/blog' },
          { '@type': 'ListItem', 'position': 3, 'name': post.title, 'item': `https://yansytech.com/blog/${slug}` },
        ],
      },
    } : undefined,
  });

  useEffect(() => {
    if (!post) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-hero-anim]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.1, ease: 'power3.out', delay: 0.1 });
    }, heroRef);
    return () => ctx.revert();
  }, [post]);

  if (!post) return null;

  return (
    <>
      <Header onStartProject={() => setIsFormOpen(true)} />

      <main className="bg-surface-white text-[rgb(var(--text-primary))] overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section ref={heroRef} style={{ paddingTop: '100px', paddingBottom: '3rem', position: 'relative', overflow: 'hidden', background: 'rgb(var(--bg-elevated))' }}>
          <div className="max-w-3xl mx-auto px-5 sm:px-8" style={{ position: 'relative', zIndex: 2 }}>
            {/* Back + breadcrumb */}
            <nav data-hero-anim className="opacity-0 flex items-center gap-2 mb-8">
              <Link to="/blog" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgb(var(--text-secondary))', fontFamily: "'Inter', sans-serif", textDecoration: 'none' }}>
                {isRTL ? <ArrowRight size={12} aria-hidden /> : <ArrowLeft size={12} aria-hidden />} {isRTL ? 'المدونة' : 'Blog'}
              </Link>
              <span style={{ color: 'rgb(var(--text-tertiary))' }}>›</span>
              <span style={{ fontSize: 11, letterSpacing: '0.12em', color: categoryColor, fontFamily: "'Inter', sans-serif" }}>{categoryLabel}</span>
            </nav>

            {/* Meta */}
            <div data-hero-anim className="opacity-0 flex flex-wrap items-center gap-3 mb-6">
              <span style={{
                padding: '4px 14px', border: `1px solid ${categoryColor}35`,
                background: `${categoryColor}0d`, color: categoryColor,
                fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase',
              }}>
                {categoryLabel}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Inter', sans-serif", fontSize: 10, color: 'rgb(var(--text-secondary))', letterSpacing: '0.08em' }}>
                <Clock size={11} aria-hidden /> {post.readTime} {isRTL ? 'د قراءة' : 'min read'}
              </span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: 'rgb(var(--text-secondary))' }}>
                {new Date(post.publishDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {/* Title — article content is English-only (see data/blogPosts.js note); rendered LTR/left even inside an RTL shell */}
            <h1 data-hero-anim dir="ltr" className="opacity-0" style={{
              fontFamily: "'Inter',system-ui,sans-serif",
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: 'rgb(var(--text-primary))',
              marginBottom: '1.5rem',
              textAlign: 'left',
            }}>
              {post.title}
            </h1>

            {/* Excerpt */}
            <p data-hero-anim dir="ltr" className="opacity-0" style={{
              fontFamily: "'Inter',system-ui,sans-serif",
              fontSize: 'clamp(1.05rem, 2vw, 1.35rem)',
              fontWeight: 400,
              color: 'rgb(var(--text-secondary))',
              lineHeight: 1.6,
              fontStyle: 'italic',
              marginBottom: '2.5rem',
              textAlign: 'left',
            }}>
              {post.excerpt}
            </p>

            {/* Tags */}
            <div data-hero-anim className="opacity-0 flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span key={tag} style={{
                  padding: '4px 12px', border: '1px solid rgb(var(--border))',
                  color: 'rgb(var(--text-secondary))',
                  fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 400, letterSpacing: '0.1em',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── HERO VISUAL — generated on-brand placeholder, no stock photography ── */}
        <div className="max-w-3xl mx-auto px-5 sm:px-8" style={{ marginBottom: '3rem' }}>
          <div style={{ position: 'relative', paddingTop: '52%', overflow: 'hidden', background: 'rgb(var(--bg-surface))', borderRadius: 12 }}>
            <BlogVisual icon={category?.icon} label={categoryLabel} color={categoryColor} variant="hero" isRTL={isRTL} />
          </div>
        </div>

        {/* ── ARTICLE BODY ──────────────────────────────────────── */}
        <article className="max-w-3xl mx-auto px-5 sm:px-8" style={{ paddingBottom: 'clamp(4rem,8vw,7rem)' }}>
          <div style={{ borderTop: '1px solid rgb(var(--border))', paddingTop: '3rem' }}>
            {post.content.map((section, i) => (
              <section key={i} style={{ marginBottom: '3rem' }}>
                <h2 data-speakable dir="ltr" style={{
                  fontFamily: "'Inter',system-ui,sans-serif",
                  fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  color: 'rgb(var(--text-primary))',
                  marginBottom: '1.25rem',
                  textAlign: 'left',
                }}>
                  {section.heading}
                </h2>
                <p dir="ltr" style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 'clamp(0.9rem, 1.8vw, 1rem)',
                  fontWeight: 400,
                  color: 'rgb(var(--text-secondary))',
                  lineHeight: 1.9,
                  letterSpacing: '0.01em',
                  textAlign: 'left',
                }}>
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          {/* Author / attribution */}
          <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgb(var(--border))', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 20, fontWeight: 400, color: 'rgb(var(--accent))' }}>Y</span>
            </div>
            <div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 500, color: 'rgb(var(--text-primary))', marginBottom: 2 }}>
                {isRTL ? 'فريق يانسي تك' : 'YANSY TECH Team'}
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', fontWeight: 400, color: 'rgb(var(--text-secondary))' }}>
                {isRTL ? 'استوديو منتجات رقمية متكامل' : 'Premium Digital Product Studio'} · <Link to="/portfolio" style={{ color: 'rgb(var(--accent))', textDecoration: 'none' }}>{isRTL ? 'شاهد أعمالنا' : 'View Our Work'}</Link>
              </div>
            </div>
          </div>
        </article>

        {/* ── RELATED POSTS ─────────────────────────────────────── */}
        {related.length > 0 && (
          <section style={{ padding: 'clamp(4rem,8vw,6rem) 0', borderTop: '1px solid rgb(var(--border))' }}>
            <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
              <div className="mb-10">
                <span className="eyebrow" style={{ display: 'block', marginBottom: '0.75rem' }}>{isRTL ? 'تابع القراءة' : 'Continue Reading'}</span>
                <h2 style={{ fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.25rem,2.5vw,1.75rem)', fontWeight: 600, color: 'rgb(var(--text-primary))', letterSpacing: isRTL ? 0 : '-0.02em' }}>
                  {isRTL ? 'مقالات ذات صلة' : 'Related Articles'}
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'rgb(var(--hover-overlay) / 0.03)' }}>
                {related.map(p => {
                  const rc = CATEGORIES.find(c => c.slug === p.category);
                  const color = rc?.color || 'rgb(var(--accent))';
                  return (
                    <Link key={p.slug} to={`/blog/${p.slug}`}
                      style={{ background: 'rgb(var(--bg-surface))', textDecoration: 'none', display: 'flex', flexDirection: 'column', transition: 'background 0.3s', padding: 'clamp(1.25rem,3vw,2rem)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgb(var(--border-light))'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgb(var(--bg-surface))'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <span style={{ padding: '3px 10px', border: `1px solid ${color}25`, background: `${color}08`, color, fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                          {isRTL ? rc?.labelAr : rc?.label}
                        </span>
                        <ArrowUpRight size={14} style={{ color: 'rgb(var(--text-tertiary))', flexShrink: 0, transform: isRTL ? 'scaleX(-1)' : 'none' }} aria-hidden />
                      </div>
                      <h3 dir="ltr" style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: '1.1rem', fontWeight: 500, color: 'rgb(var(--text-primary))', lineHeight: 1.3, textAlign: 'left' }}>{p.title}</h3>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(5rem,10vw,8rem) 0', textAlign: 'center', borderTop: '1px solid rgb(var(--border))' }}>
          <div className="max-w-xl mx-auto px-5">
            <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>{isRTL ? 'جاهز للبناء؟' : 'Ready to Build?'}</span>
            <h2 style={{ fontFamily: isRTL ? "'IBM Plex Sans Arabic','Alexandria',system-ui,sans-serif" : "'Inter',system-ui,sans-serif", fontSize: 'clamp(1.75rem,4vw,2.75rem)', fontWeight: 700, color: 'rgb(var(--text-primary))', lineHeight: 1.15, letterSpacing: isRTL ? 0 : '-0.03em', marginBottom: '2rem' }}>
              {isRTL ? 'حوّل هذه المعرفة إلى منتج حقيقي.' : 'Turn This Knowledge Into a Product'}
            </h2>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsFormOpen(true)}
                className="btn-primary"
                style={{ fontSize: '13.5px', padding: '14px 32px' }}
              >
                {isRTL ? 'ابدأ مشروعك' : 'Start a Project'} <ArrowUpRight size={15} aria-hidden style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
              </button>
              <Link
                to="/blog"
                className="btn-secondary"
                style={{ fontSize: '13.5px', padding: '14px 28px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                {isRTL ? 'مقالات أخرى' : 'More Articles'}
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
      <ProjectRequestForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </>
  );
};

export default BlogPost;
