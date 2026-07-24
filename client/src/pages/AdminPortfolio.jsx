  import { useState, useEffect, useCallback, useRef } from 'react';
  import { useNavigate } from 'react-router-dom';
  import {
    Plus, Edit2, Trash2, Eye, EyeOff, Star, StarOff, ExternalLink,
    GripVertical, Archive, CheckSquare, Square, Images, ImageOff,
  } from 'lucide-react';
  import toast from 'react-hot-toast';
  import api from '../utils/api';
  import { mediaSrc } from '../utils/media';
  import { CATEGORIES, categoryLabel } from '../utils/portfolioTaxonomy';
  import { useLanguage } from '../contexts/LanguageContext';
  import {
    TK, RADIUS, PageHeader, Card, Badge, Button, IconButton,
    SearchInput, Select, Tabs, ConfirmDialog, Spinner, EmptyState,
  } from '../admin-ui';

  const getStatusTabs = (language) => [
    { value: 'all',       label: language === 'ar' ? 'الكل' : 'All' },
    { value: 'published', label: language === 'ar' ? 'منشور' : 'Published' },
    { value: 'draft',     label: language === 'ar' ? 'مسودة' : 'Draft' },
    { value: 'archived',  label: language === 'ar' ? 'مؤرشف' : 'Archived' },
  ];

  const STATUS_TONE = { published: 'success', draft: 'neutral', archived: 'warning' };

  const Divider = () => <span aria-hidden style={{ width: '1px', height: '18px', background: TK.border, margin: '0 2px', flexShrink: 0 }} />;

  const Thumb = ({ project, language }) => {
    const [errored, setErrored] = useState(false);
    const showImage = project.coverImage?.url && !errored;
    return (
      <div style={{ position: 'relative', width: '92px', height: '64px', flexShrink: 0, borderRadius: RADIUS.md, overflow: 'hidden', background: TK.bgSubtle, border: `1px solid ${TK.borderSoft}` }}>
        {showImage ? (
          <img
            src={mediaSrc(project.coverImage)}
            alt={project.title}
            onError={() => setErrored(true)}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', color: TK.textLight }}>
            <ImageOff style={{ width: '15px', height: '15px', opacity: 0.6 }} />
            <span style={{ fontSize: '8px', letterSpacing: '0.02em' }}>{language === 'ar' ? 'لا توجد صورة' : 'No image'}</span>
          </div>
        )}
        {project.featured && (
          <span
            title={language === 'ar' ? 'مميز' : 'Featured'}
            style={{
              position: 'absolute', top: '4px', insetInlineStart: '4px',
              width: '18px', height: '18px', borderRadius: RADIUS.pill,
              background: 'rgba(13,17,23,0.55)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Star style={{ width: '10px', height: '10px', color: '#FBBF24', fill: '#FBBF24' }} />
          </span>
        )}
      </div>
    );
  };

  const STATUS_LABEL_AR = { published: 'منشور', draft: 'مسودة', archived: 'مؤرشف' };
  const statusDisplayLabel = (status, language) => (language === 'ar' ? (STATUS_LABEL_AR[status] || status) : status);

  const AdminPortfolio = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const [projects, setProjects]       = useState([]);
    const [loading, setLoading]         = useState(true);
    const [statusCounts, setStatusCounts] = useState({ draft: 0, published: 0, archived: 0 });
    const [status, setStatus]           = useState('all');
    const [category, setCategory]       = useState('All');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch]           = useState('');
    const [page, setPage]               = useState(1);
    const [pages, setPages]             = useState(1);
    const [total, setTotal]             = useState(0);
    const [selected, setSelected]       = useState(new Set());
    const [deleteId, setDeleteId]       = useState(null);
    const [deleting, setDeleting]       = useState(false);
    const [bulkAction, setBulkAction]   = useState(null);
    const [bulkBusy, setBulkBusy]       = useState(false);
    const dragItem  = useRef(null);
    const dragOver  = useRef(null);

    const fetchProjects = useCallback(async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/portfolio/admin', {
          params: { status, ...(category !== 'All' && { category }), ...(search && { search }), page, limit: 20 },
        });
        setProjects(data.projects || []);
        setStatusCounts(data.statusCounts || { draft: 0, published: 0, archived: 0 });
        setPages(data.pages || 1);
        setTotal(data.total || 0);
      } catch {
        toast.error(language === 'ar' ? 'فشل تحميل المشاريع' : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    }, [status, category, search, page]);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    useEffect(() => {
      const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
      return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => { setPage(1); }, [status, category]);
    useEffect(() => { setSelected(new Set()); }, [status, category, search, page]);

    const canReorder = status === 'all' && category === 'All' && !search;

    // ── Selection ────────────────────────────────────────────────────────────
    const toggleSelect = (id) => {
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    };
    const toggleSelectAll = () => {
      setSelected((prev) => (prev.size === projects.length ? new Set() : new Set(projects.map((p) => p._id))));
    };

    // ── Row actions ──────────────────────────────────────────────────────────
    const toggleFeatured = async (p) => {
      try {
        await api.put(`/portfolio/admin/${p._id}`, { featured: !p.featured });
        fetchProjects();
      } catch { toast.error(language === 'ar' ? 'فشل التحديث' : 'Update failed'); }
    };

    const setProjectStatus = async (id, newStatus) => {
      try {
        await api.patch(`/portfolio/admin/${id}/status`, { status: newStatus });
        toast.success(language === 'ar' ? `تم التعليم كـ ${statusDisplayLabel(newStatus, language)}` : `Marked as ${newStatus}`);
        fetchProjects();
      } catch { toast.error(language === 'ar' ? 'فشل التحديث' : 'Update failed'); }
    };

    const confirmDeleteProject = async () => {
      if (!deleteId) return;
      try {
        setDeleting(true);
        await api.delete(`/portfolio/admin/${deleteId}`);
        setDeleteId(null);
        toast.success(language === 'ar' ? 'تم الحذف' : 'Deleted');
        fetchProjects();
      } catch {
        toast.error(language === 'ar' ? 'فشل الحذف' : 'Delete failed');
      } finally {
        setDeleting(false);
      }
    };

    const runBulkAction = async (action) => {
      try {
        if (action === 'delete') setBulkBusy(true);
        await api.post('/portfolio/admin/bulk', { ids: [...selected], action });
        toast.success(language === 'ar' ? `تم تحديث ${selected.size} مشروع` : `${selected.size} project(s) updated`);
        setSelected(new Set());
        setBulkAction(null);
        fetchProjects();
      } catch {
        toast.error(language === 'ar' ? 'فشل الإجراء الجماعي' : 'Bulk action failed');
      } finally {
        if (action === 'delete') setBulkBusy(false);
      }
    };

    // ── Drag reorder ─────────────────────────────────────────────────────────
    const handleDrop = async () => {
      if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) return;
      const reordered = [...projects];
      const [moved] = reordered.splice(dragItem.current, 1);
      reordered.splice(dragOver.current, 0, moved);
      setProjects(reordered);
      dragItem.current = null;
      dragOver.current = null;

      try {
        await api.patch('/portfolio/admin/reorder', {
          items: reordered.map((p, i) => ({ id: p._id, order: i })),
        });
      } catch { toast.error(language === 'ar' ? 'فشل إعادة الترتيب' : 'Reorder failed'); }
    };

    return (
      <div style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', minWidth: 0 }}>
        <PageHeader
          icon={Images}
          eyebrow={language === 'ar' ? 'إدارة معرض الأعمال' : 'Portfolio Manager'}
          title={language === 'ar' ? 'معرض الأعمال' : 'Portfolio'}
          subtitle={language === 'ar' ? `${total} مشروع` : `${total} project${total !== 1 ? 's' : ''}`}
          actions={<Button variant="primary" icon={Plus} onClick={() => navigate('/app/admin/portfolio/new')}>{language === 'ar' ? 'إضافة مشروع' : 'Add Project'}</Button>}
        />

        {/* Status tabs */}
        <div style={{ marginBottom: '18px' }}>
          <Tabs
            value={status}
            onChange={setStatus}
            items={getStatusTabs(language).map(tab => ({ value: tab.value, label: tab.label, count: tab.value !== 'all' ? (statusCounts[tab.value] ?? 0) : undefined }))}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <SearchInput
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onClear={() => setSearchInput('')}
            placeholder={language === 'ar' ? 'ابحث في المشاريع...' : 'Search projects...'}
            style={{ flex: 'none', width: '260px' }}
          />
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[{ value: 'All', label: language === 'ar' ? 'كل الفئات' : 'All categories' }, ...CATEGORIES.map(c => ({ value: c, label: categoryLabel(c, language) }))]}
          />
          {canReorder && <span style={{ fontSize: '10px', color: TK.textLight, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{language === 'ar' ? 'اسحب الصفوف لإعادة الترتيب' : 'Drag rows to reorder'}</span>}
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: TK.accentBg, border: `1px solid ${TK.accentBd}`, borderRadius: RADIUS.md, marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: TK.accent, fontWeight: 500 }}>{language === 'ar' ? `${selected.size} محدد` : `${selected.size} selected`}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <Button size="sm" variant="secondary" onClick={() => runBulkAction('published')}>{language === 'ar' ? 'نشر' : 'Publish'}</Button>
              <Button size="sm" variant="secondary" onClick={() => runBulkAction('draft')}>{language === 'ar' ? 'مسودة' : 'Draft'}</Button>
              <Button size="sm" variant="secondary" onClick={() => runBulkAction('archived')}>{language === 'ar' ? 'أرشفة' : 'Archive'}</Button>
              <Button size="sm" variant="danger" onClick={() => setBulkAction('delete')}>{language === 'ar' ? 'حذف' : 'Delete'}</Button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <Spinner />
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <EmptyState
              icon={Images}
              title={language === 'ar' ? 'لا توجد مشاريع مطابقة لهذه الفلاتر' : 'No projects match these filters'}
              action={<Button variant="primary" icon={Plus} onClick={() => navigate('/app/admin/portfolio/new')}>{language === 'ar' ? 'أضف أول مشروع' : 'Add your first project'}</Button>}
            />
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={toggleSelectAll}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'none', border: 'none', cursor: 'pointer', color: TK.textMuted, fontSize: '11px', fontFamily: 'inherit', padding: '2px 0', alignSelf: 'flex-start' }}
            >
              {selected.size === projects.length ? <CheckSquare style={{ width: '14px', height: '14px', color: TK.accent }} /> : <Square style={{ width: '14px', height: '14px' }} />}
              {language === 'ar' ? 'تحديد الكل' : 'Select all'}
            </button>

            {projects.map((p, i) => {
              const isSelected = selected.has(p._id);
              return (
              <Card
                key={p._id}
                hover
                padding="10px 14px"
                draggable={canReorder}
                onDragStart={() => (dragItem.current = i)}
                onDragEnter={() => (dragOver.current = i)}
                onDragEnd={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0,
                  background: isSelected ? TK.accentBg : TK.surface,
                  borderColor: isSelected ? TK.accentBd : TK.border,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  {canReorder && <GripVertical style={{ width: '15px', height: '15px', color: TK.textLight, cursor: 'grab' }} />}
                  <button onClick={() => toggleSelect(p._id)} aria-label={isSelected ? (language === 'ar' ? 'إلغاء التحديد' : 'Deselect') : (language === 'ar' ? 'تحديد' : 'Select')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.textMuted, display: 'flex' }}>
                    {isSelected ? <CheckSquare style={{ width: '15px', height: '15px', color: TK.accent }} /> : <Square style={{ width: '15px', height: '15px' }} />}
                  </button>
                </div>

                <Thumb project={p} language={language} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: TK.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: '0 1 auto' }}>{p.title}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '5px' }}>
                    <Badge tone="info">{categoryLabel(p.category, language)}</Badge>
                    <Badge tone={STATUS_TONE[p.status] || 'neutral'} dot>{statusDisplayLabel(p.status, language)}</Badge>
                    {p.featured && <Badge tone="purple">{language === 'ar' ? 'مميز' : 'Featured'}</Badge>}
                    {p.viewCount > 0 && <span style={{ fontSize: '10px', color: TK.textLight }}>{language === 'ar' ? `${p.viewCount} مشاهدة` : `${p.viewCount} views`}</span>}
                  </div>
                  <p style={{
                    fontSize: '11.5px', color: TK.textMuted, margin: '5px 0 0', minWidth: 0,
                    display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', wordBreak: 'break-word',
                  }}>{p.description}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  <IconButton icon={p.featured ? Star : StarOff} size={30} onClick={() => toggleFeatured(p)} title={p.featured ? (language === 'ar' ? 'إلغاء التمييز' : 'Unfeature') : (language === 'ar' ? 'تمييز' : 'Feature')} style={p.featured ? { color: TK.accent } : undefined} />
                  <IconButton icon={p.status === 'published' ? Eye : EyeOff} size={30} onClick={() => setProjectStatus(p._id, p.status === 'published' ? 'draft' : 'published')} title={p.status === 'published' ? (language === 'ar' ? 'إلغاء النشر' : 'Unpublish') : (language === 'ar' ? 'نشر' : 'Publish')} />
                  <IconButton icon={Archive} size={30} onClick={() => setProjectStatus(p._id, p.status === 'archived' ? 'draft' : 'archived')} title={p.status === 'archived' ? (language === 'ar' ? 'إلغاء الأرشفة' : 'Unarchive') : (language === 'ar' ? 'أرشفة' : 'Archive')} />

                  <Divider />

                  {p.liveUrl && (
                    <a
                      href={p.liveUrl} target="_blank" rel="noopener noreferrer" title={language === 'ar' ? 'فتح الموقع المباشر' : 'Open live site'}
                      className="au-icon-btn"
                      style={{ width: '30px', height: '30px', borderRadius: RADIUS.md, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TK.textMuted, flexShrink: 0 }}
                    >
                      <ExternalLink style={{ width: '14px', height: '14px' }} />
                    </a>
                  )}
                  <IconButton icon={Edit2} size={30} onClick={() => navigate(`/app/admin/portfolio/${p._id}/edit`)} title={language === 'ar' ? 'تعديل' : 'Edit'} />

                  <Divider />

                  <IconButton
                    icon={Trash2} size={30} onClick={() => setDeleteId(p._id)}
                    title={language === 'ar' ? 'حذف' : 'Delete'}
                    style={{ color: TK.textMuted }}
                    className="au-icon-btn au-icon-btn-danger"
                  />
                </div>
              </Card>
              );
            })}

            {/* Pagination */}
            {pages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', paddingTop: '14px' }}>
                <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{language === 'ar' ? 'السابق' : 'Prev'}</Button>
                <span style={{ fontSize: '11.5px', color: TK.textMuted }}>{page} / {pages}</span>
                <Button size="sm" variant="ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>{language === 'ar' ? 'التالي' : 'Next'}</Button>
              </div>
            )}
          </div>
        )}

        <ConfirmDialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDeleteProject}
          loading={deleting}
          title={language === 'ar' ? 'حذف هذا المشروع؟' : 'Delete this project?'}
          description={language === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء.' : 'This action cannot be undone.'}
          confirmLabel={language === 'ar' ? 'حذف' : 'Delete'}
        />

        <ConfirmDialog
          open={bulkAction === 'delete'}
          onClose={() => setBulkAction(null)}
          onConfirm={() => runBulkAction('delete')}
          loading={bulkBusy}
          title={language === 'ar' ? `حذف ${selected.size} مشروع؟` : `Delete ${selected.size} project(s)?`}
          description={language === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء.' : 'This action cannot be undone.'}
          confirmLabel={language === 'ar' ? 'حذف' : 'Delete'}
        />
      </div>
      </div>
    );
  };

  export default AdminPortfolio;
