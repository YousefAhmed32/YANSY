/**
 * PortfolioDetail — Premium Case Study Page (schema v3)
 *
 * Fetches the published project and hands it to PortfolioDetailView, which
 * owns the actual render (see that file's doc comment for the section
 * breakdown, and why it's shared with the admin preview).
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { trackViewContent } from '../utils/metaPixel';
import api from '../utils/api';
import { useSEO } from '../hooks/useSEO';
import { mediaSrc } from '../utils/media';
import PortfolioDetailView from '../components/portfolio-detail/PortfolioDetailView';

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
  const [project, setProject] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return <PortfolioDetailView project={project} related={related} isRTL={isRTL} dir={dir} />;
};

export default PortfolioDetail;
