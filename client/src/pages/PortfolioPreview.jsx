/**
 * Admin-only preview — renders a draft/archived/published project through
 * the exact same PortfolioDetailView the public site uses, just sourced from
 * the admin API (which doesn't gate on status) instead of the public one.
 * This is what the wizard's "Preview" button opens in a new tab: what you
 * see here is pixel-for-pixel what goes live the moment you publish, because
 * it's literally the same component tree, not a second approximation of it.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../utils/api';
import { PageSpinner } from '../admin-ui';
import PortfolioDetailView from '../components/portfolio-detail/PortfolioDetailView';

const STATUS_LABEL = {
  draft:     { en: 'draft',     ar: 'مسودة' },
  published: { en: 'published', ar: 'منشور' },
  archived:  { en: 'archived',  ar: 'مؤرشف' },
};

const PortfolioPreview = () => {
  const { id } = useParams();
  const { isRTL, dir } = useLanguage();
  const [project, setProject] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const { data } = await api.get(`/portfolio/admin/${id}`);
        if (cancelled) return;
        setProject(data.project);
        api.get(`/portfolio/${data.project._id}/related`).then(({ data: rd }) => { if (!cancelled) setRelated(rd.projects || []); }).catch(() => {});
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div style={{ minHeight: '100vh', background: '#fff' }}><PageSpinner /></div>;
  if (error || !project) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <p style={{ color: '#6B7280' }}>{isRTL ? 'تعذر تحميل المعاينة' : 'Could not load preview'}</p>
    </div>
  );

  return (
    <>
      <div style={{
        position: 'sticky', top: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '8px 16px', background: '#0D1117', color: '#fff', fontSize: 12.5, fontWeight: 600,
      }}>
        <Eye style={{ width: 14, height: 14 }} aria-hidden />
        {isRTL
          ? `معاينة إدارية — الحالة: ${STATUS_LABEL[project.status]?.ar || project.status}`
          : `Admin Preview — status: ${STATUS_LABEL[project.status]?.en || project.status}`}
        <Link to={`/app/admin/portfolio/${project._id}/edit`} style={{ color: '#93C5FD', textDecoration: 'underline', marginInlineStart: 8 }}>
          {isRTL ? 'العودة للتحرير' : 'Back to editor'}
        </Link>
      </div>
      <PortfolioDetailView project={project} related={related} isRTL={isRTL} dir={dir} />
    </>
  );
};

export default PortfolioPreview;
