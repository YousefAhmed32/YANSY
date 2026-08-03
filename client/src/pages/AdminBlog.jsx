import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Globe, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { CATEGORIES } from '../data/blogPosts';
import { useLanguage } from '../contexts/LanguageContext';
import {
  TK, PageHeader, Card, Badge, Button, IconButton,
  SearchInput, Tabs, Switch, TextInput, TextArea, Select,
  Modal, ConfirmDialog, Spinner, EmptyState,
} from '../admin-ui';

const emptyForm = () => ({
  title: { en: '', ar: '' },
  slug: { en: '', ar: '' },
  excerpt: { en: '', ar: '' },
  content: { en: '', ar: '' },
  seoTitle: { en: '', ar: '' },
  seoDescription: { en: '', ar: '' },
  category: 'web-development',
  tags: { en: '', ar: '' },
  coverImage: '/placeholders/blog-default.webp',
  published: true,
  featured: false,
  authorName: 'YANSY Tech Team',
  authorNameAr: 'فريق يانسي تك',
});

const slugify = (s) => s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

const AdminBlog = () => {
  const { language, isRTL } = useLanguage();
  const ar = language === 'ar';

  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [activeTab, setActiveTab] = useState('en');
  const [editingPost, setEditingPost] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/blog/admin/all');
      setPosts(data.posts || []);
    } catch {
      toast.error(ar ? 'فشل تحميل المقالات' : 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  }, [ar]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const filtered = posts.filter((p) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const titleEn = (typeof p.title === 'object' ? p.title.en : p.title) || '';
    const titleAr = (typeof p.title === 'object' ? p.title.ar : '') || '';
    return titleEn.toLowerCase().includes(q) || titleAr.includes(search.trim());
  });

  const openModal = (post = null) => {
    setActiveTab('en');
    if (post) {
      setEditingPost(post);
      setForm({
        title: typeof post.title === 'object' ? post.title : { en: post.title || '', ar: '' },
        slug: typeof post.slug === 'object' ? post.slug : { en: post.slug || '', ar: '' },
        excerpt: typeof post.excerpt === 'object' ? post.excerpt : { en: post.excerpt || '', ar: '' },
        content: {
          en: typeof post.content?.en === 'string' ? post.content.en : JSON.stringify(post.content?.en || '', null, 2),
          ar: typeof post.content?.ar === 'string' ? post.content.ar : JSON.stringify(post.content?.ar || '', null, 2),
        },
        seoTitle: typeof post.seoTitle === 'object' ? post.seoTitle : { en: post.seoTitle || '', ar: '' },
        seoDescription: typeof post.seoDescription === 'object' ? post.seoDescription : { en: post.seoDescription || '', ar: '' },
        category: post.category || 'web-development',
        tags: {
          en: Array.isArray(post.tags?.en) ? post.tags.en.join(', ') : '',
          ar: Array.isArray(post.tags?.ar) ? post.tags.ar.join(', ') : '',
        },
        coverImage: post.coverImage || '/placeholders/blog-default.webp',
        published: post.published !== false,
        featured: !!post.featured,
        authorName: post.author?.name || 'YANSY Tech Team',
        authorNameAr: post.author?.nameAr || 'فريق يانسي تك',
      });
    } else {
      setEditingPost(null);
      setForm(emptyForm());
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.en || !form.title.ar || !form.excerpt.en || !form.excerpt.ar || !form.content.en || !form.content.ar) {
      toast.error(ar ? 'يرجى تعبئة الحقول الأساسية بالعربية والإنجليزية' : 'Please fill required fields in both languages');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      slug: {
        en: form.slug.en || slugify(form.title.en),
        ar: form.slug.ar || slugify(form.title.ar),
      },
      excerpt: form.excerpt,
      content: {
        en: [{ type: 'paragraph', text: form.content.en }],
        ar: [{ type: 'paragraph', text: form.content.ar }],
      },
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      category: form.category,
      tags: {
        en: form.tags.en.split(',').map((t) => t.trim()).filter(Boolean),
        ar: form.tags.ar.split(',').map((t) => t.trim()).filter(Boolean),
      },
      author: { name: form.authorName, nameAr: form.authorNameAr },
      coverImage: form.coverImage,
      published: form.published,
      featured: form.featured,
    };

    try {
      if (editingPost?._id) {
        await api.put(`/blog/${editingPost._id}`, payload);
        toast.success(ar ? 'تم تحديث المقال' : 'Article updated');
      } else {
        await api.post('/blog', payload);
        toast.success(ar ? 'تم نشر المقال' : 'Article published');
      }
      setModalOpen(false);
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || (ar ? 'فشل حفظ المقال' : 'Error saving article'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await api.delete(`/blog/${deleteId}`);
      toast.success(ar ? 'تم حذف المقال' : 'Article deleted');
      setDeleteId(null);
      fetchPosts();
    } catch {
      toast.error(ar ? 'فشل حذف المقال' : 'Failed to delete article');
    } finally {
      setDeleting(false);
    }
  };

  const togglePublished = async (post) => {
    try {
      await api.put(`/blog/${post._id}`, { published: !post.published });
      toast.success(!post.published ? (ar ? 'تم النشر' : 'Published') : (ar ? 'تم إلغاء النشر' : 'Unpublished'));
      fetchPosts();
    } catch {
      toast.error(ar ? 'فشل التحديث' : 'Update failed');
    }
  };

  const field = (key, value) => setForm((f) => ({ ...f, [key]: { ...f[key], [activeTab]: value } }));

  return (
    <div style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', minWidth: 0 }}>
        <PageHeader
          icon={Globe}
          eyebrow={ar ? 'إدارة المحتوى' : 'Content Management'}
          title={ar ? 'إدارة المدونة' : 'Blog Management'}
          subtitle={ar ? `${posts.length} مقال` : `${posts.length} article${posts.length !== 1 ? 's' : ''}`}
          actions={<Button variant="primary" icon={Plus} onClick={() => openModal()}>{ar ? 'مقال جديد' : 'New Article'}</Button>}
        />

        <div style={{ marginBottom: '18px' }}>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder={ar ? 'ابحث في المقالات...' : 'Search articles...'}
            style={{ maxWidth: '320px' }}
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={Globe}
              title={ar ? 'لا توجد مقالات' : 'No articles yet'}
              subtitle={ar ? 'ابدأ بإنشاء أول مقال في المدونة' : 'Start by publishing your first blog article'}
              action={<Button variant="primary" icon={Plus} onClick={() => openModal()}>{ar ? 'مقال جديد' : 'New Article'}</Button>}
            />
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map((post) => {
              const titleEn = typeof post.title === 'object' ? post.title.en : post.title;
              const titleAr = typeof post.title === 'object' ? post.title.ar : '';
              return (
                <Card key={post._id} hover padding="14px 16px" style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: TK.text, margin: 0 }}>{titleEn}</h3>
                      {post.featured && <Badge tone="purple">{ar ? 'مميز' : 'Featured'}</Badge>}
                      <Badge tone={post.published ? 'success' : 'neutral'} dot>{post.published ? (ar ? 'منشور' : 'Published') : (ar ? 'مسودة' : 'Draft')}</Badge>
                    </div>
                    {titleAr && <p dir="rtl" style={{ fontSize: '12px', color: TK.textMuted, margin: '4px 0 0' }}>{titleAr}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <Badge tone="info">{post.category}</Badge>
                      <span style={{ fontSize: '11px', color: TK.textLight }}>{ar ? `${post.views || 0} مشاهدة` : `${post.views || 0} views`}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                    <IconButton
                      icon={post.published ? Eye : EyeOff}
                      size={32}
                      onClick={() => togglePublished(post)}
                      title={post.published ? (ar ? 'إلغاء النشر' : 'Unpublish') : (ar ? 'نشر' : 'Publish')}
                    />
                    <IconButton icon={Edit2} size={32} onClick={() => openModal(post)} title={ar ? 'تعديل' : 'Edit'} />
                    <IconButton
                      icon={Trash2} size={32} onClick={() => setDeleteId(post._id)}
                      title={ar ? 'حذف' : 'Delete'}
                      className="au-icon-btn au-icon-btn-danger"
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          width="720px"
          title={editingPost ? (ar ? 'تعديل المقال' : 'Edit Article') : (ar ? 'مقال جديد' : 'New Article')}
        >
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: TK.textMuted, marginBottom: '6px' }}>
                  {ar ? 'الفئة' : 'Category'}
                </label>
                <Select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  options={CATEGORIES.filter((c) => c.slug !== 'all').map((c) => ({ value: c.slug, label: ar ? (c.labelAr || c.label) : c.label }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: TK.textMuted, marginBottom: '6px' }}>
                  {ar ? 'رابط صورة الغلاف' : 'Cover Image URL'}
                </label>
                <TextInput value={form.coverImage} onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))} containerStyle={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Switch checked={form.published} onChange={(v) => setForm((f) => ({ ...f, published: v }))} label={ar ? 'منشور' : 'Published'} />
              <Switch checked={form.featured} onChange={(v) => setForm((f) => ({ ...f, featured: v }))} label={ar ? 'مميز' : 'Featured'} />
            </div>

            <Tabs
              value={activeTab}
              onChange={setActiveTab}
              items={[
                { value: 'en', label: 'English' },
                { value: 'ar', label: 'العربية' },
              ]}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} dir={activeTab === 'ar' ? 'rtl' : 'ltr'}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: TK.textMuted, marginBottom: '6px' }}>
                  {activeTab === 'ar' ? 'عنوان المقال *' : 'Article Title *'}
                </label>
                <TextInput
                  required
                  value={form.title[activeTab]}
                  onChange={(e) => field('title', e.target.value)}
                  containerStyle={{ width: '100%' }}
                  style={{ textAlign: activeTab === 'ar' ? 'right' : 'left' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: TK.textMuted, marginBottom: '6px' }}>
                  {activeTab === 'ar' ? 'الملخص *' : 'Excerpt *'}
                </label>
                <TextArea
                  required
                  rows={2}
                  value={form.excerpt[activeTab]}
                  onChange={(e) => field('excerpt', e.target.value)}
                  containerStyle={{ width: '100%' }}
                  style={{ textAlign: activeTab === 'ar' ? 'right' : 'left' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: TK.textMuted, marginBottom: '6px' }}>
                  {activeTab === 'ar' ? 'محتوى المقال *' : 'Article Content *'}
                </label>
                <TextArea
                  required
                  rows={7}
                  value={form.content[activeTab]}
                  onChange={(e) => field('content', e.target.value)}
                  containerStyle={{ width: '100%' }}
                  style={{ textAlign: activeTab === 'ar' ? 'right' : 'left', fontFamily: 'monospace', fontSize: '12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: TK.textMuted, marginBottom: '6px' }}>
                  {activeTab === 'ar' ? 'الوسوم (مفصولة بفاصلة)' : 'Tags (comma-separated)'}
                </label>
                <TextInput
                  value={form.tags[activeTab]}
                  onChange={(e) => field('tags', e.target.value)}
                  containerStyle={{ width: '100%' }}
                  style={{ textAlign: activeTab === 'ar' ? 'right' : 'left' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: `1px solid ${TK.border}` }}>
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>{ar ? 'إلغاء' : 'Cancel'}</Button>
              <Button type="submit" variant="primary" loading={saving}>
                {editingPost ? (ar ? 'حفظ التعديلات' : 'Save Changes') : (ar ? 'نشر المقال' : 'Publish Article')}
              </Button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          loading={deleting}
          title={ar ? 'حذف هذا المقال؟' : 'Delete this article?'}
          description={ar ? 'لا يمكن التراجع عن هذا الإجراء.' : 'This action cannot be undone.'}
          confirmLabel={ar ? 'حذف' : 'Delete'}
        />
      </div>
    </div>
  );
};

export default AdminBlog;
