import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LayoutTemplate, Plus, Pencil, Copy, Trash2, Star } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import {
  TK, RADIUS, FONT, PageHeader, Card, Button, IconButton, Badge, Modal, TextInput, TextArea,
  ConfirmDialog, EmptyState,
} from '../admin-ui';

/**
 * Reusable proposal starting points (spec §12). Metadata (name/category/
 * description) is managed here; a template's actual content — sections,
 * pricing, timeline, terms, branding — is edited on a dedicated route that
 * reuses the same step components as the proposal wizard (see
 * AdminProposalTemplateEditor.jsx) rather than duplicating that UI here.
 */
const AdminProposalTemplates = () => {
  const { isRTL } = useLanguage();
  const font = FONT(isRTL);
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', nameAr: '', category: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const T = {
    title: isRTL ? 'قوالب العروض' : 'Proposal Templates',
    subtitle: isRTL ? 'نقاط انطلاق جاهزة لتسريع إنشاء العروض' : 'Reusable starting points for faster proposal creation',
    newTemplate: isRTL ? 'قالب جديد' : 'New Template',
    name: isRTL ? 'الاسم' : 'Name',
    nameAr: isRTL ? 'الاسم (عربي)' : 'Name (Arabic)',
    category: isRTL ? 'الفئة' : 'Category',
    description: isRTL ? 'الوصف' : 'Description',
    create: isRTL ? 'إنشاء ومتابعة التحرير' : 'Create & Continue Editing',
    cancel: isRTL ? 'إلغاء' : 'Cancel',
    edit: isRTL ? 'تعديل المحتوى' : 'Edit Content',
    duplicate: isRTL ? 'نسخ' : 'Duplicate',
    setDefault: isRTL ? 'تعيين كافتراضي' : 'Set as Default',
    default: isRTL ? 'افتراضي' : 'Default',
    delete: isRTL ? 'حذف' : 'Delete',
    deleteTitle: isRTL ? 'حذف هذا القالب؟' : 'Delete this template?',
    deleteDesc: isRTL ? 'لن يؤثر هذا على العروض التي أُنشئت منه سابقًا.' : 'Proposals already created from it are unaffected.',
    emptyTitle: isRTL ? 'لا توجد قوالب بعد' : 'No templates yet',
    emptySubtitle: isRTL ? 'أنشئ أول قالب لتسريع إنشاء العروض القادمة' : 'Create your first template to speed up future proposals',
    loadFailed: isRTL ? 'فشل تحميل القوالب' : 'Failed to load templates',
    saveFailed: isRTL ? 'فشل الحفظ' : 'Save failed',
    created: isRTL ? 'تم إنشاء القالب ✓' : 'Template created ✓',
    duplicated: isRTL ? 'تم النسخ ✓' : 'Duplicated ✓',
    defaultSet: isRTL ? 'تم التعيين كافتراضي ✓' : 'Set as default ✓',
    deleted: isRTL ? 'تم الحذف ✓' : 'Deleted ✓',
    requiredField: isRTL ? 'يرجى إدخال اسم القالب' : 'Please enter a template name',
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/proposal-templates');
      setItems(data.items || []);
    } catch {
      toast.error(T.loadFailed);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => { setForm({ name: '', nameAr: '', category: '', description: '' }); setModalOpen(true); };

  const submitCreate = async () => {
    if (!form.name.trim()) return toast.error(T.requiredField);
    setSubmitting(true);
    try {
      const { data } = await api.post('/proposal-templates', form);
      toast.success(T.created);
      setModalOpen(false);
      navigate(`/app/admin/proposal-templates/${data.item._id}/edit`);
    } catch (err) {
      toast.error(err?.response?.data?.error || T.saveFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const duplicate = async (tpl) => {
    try {
      const { data } = await api.post('/proposal-templates', {
        name: `${tpl.name} (Copy)`, nameAr: tpl.nameAr ? `${tpl.nameAr} (نسخة)` : '', category: tpl.category, description: tpl.description,
        sections: tpl.sections, defaultPricing: tpl.defaultPricing, defaultTimeline: tpl.defaultTimeline, defaultTerms: tpl.defaultTerms, branding: tpl.branding,
      });
      setItems((prev) => [data.item, ...prev]);
      toast.success(T.duplicated);
    } catch {
      toast.error(T.saveFailed);
    }
  };

  const setDefault = async (id) => {
    try {
      const { data } = await api.patch(`/proposal-templates/${id}/set-default`);
      setItems((prev) => prev.map((t) => (t._id === data.item._id ? data.item : { ...t, isDefault: false })));
      toast.success(T.defaultSet);
    } catch {
      toast.error(T.saveFailed);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/proposal-templates/${deleteId}`);
      setItems((prev) => prev.filter((t) => t._id !== deleteId));
      toast.success(T.deleted);
      setDeleteId(null);
    } catch {
      toast.error(T.saveFailed);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px', fontFamily: font }}>
      <PageHeader
        icon={LayoutTemplate}
        eyebrow={isRTL ? 'نظام العروض' : 'Proposal System'}
        title={T.title}
        subtitle={T.subtitle}
        actions={<Button variant="primary" icon={Plus} onClick={openCreate}>{T.newTemplate}</Button>}
      />

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {Array.from({ length: 3 }).map((_, i) => <Card key={i} padding="18px" style={{ height: 140 }} />)}
        </div>
      ) : items.length === 0 ? (
        <Card padding="0"><EmptyState icon={LayoutTemplate} title={T.emptyTitle} subtitle={T.emptySubtitle} action={<Button variant="primary" size="sm" icon={Plus} onClick={openCreate}>{T.newTemplate}</Button>} /></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {items.map((tpl) => (
            <Card key={tpl._id} padding="18px" hover>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{isRTL ? (tpl.nameAr || tpl.name) : tpl.name}</h3>
                {tpl.isDefault && <Badge tone="success" dot>{T.default}</Badge>}
              </div>
              {tpl.category && <Badge tone="neutral">{tpl.category}</Badge>}
              {tpl.description && <p style={{ fontSize: 12, color: TK.textMuted, marginTop: 8, lineHeight: 1.6 }}>{tpl.description}</p>}
              <p style={{ fontSize: 11, color: TK.textLight, marginTop: 8 }}>
                {(tpl.sections || []).length} {isRTL ? 'قسم' : 'sections'} · {tpl.usageCount || 0} {isRTL ? 'استخدام' : 'uses'}
              </p>
              <div style={{ display: 'flex', gap: 4, marginTop: 12, borderTop: `1px solid ${TK.border}`, paddingTop: 10 }}>
                <IconButton icon={Pencil} title={T.edit} onClick={() => navigate(`/app/admin/proposal-templates/${tpl._id}/edit`)} />
                <IconButton icon={Copy} title={T.duplicate} onClick={() => duplicate(tpl)} />
                {!tpl.isDefault && <IconButton icon={Star} title={T.setDefault} onClick={() => setDefault(tpl._id)} />}
                <IconButton icon={Trash2} title={T.delete} onClick={() => setDeleteId(tpl._id)} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={T.newTemplate}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>{T.cancel}</Button>
            <Button variant="primary" onClick={submitCreate} loading={submitting}>{T.create}</Button>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: TK.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{T.name} *</label>
            <TextInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Custom Software" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: TK.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{T.nameAr}</label>
            <TextInput dir="rtl" value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: TK.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{T.category}</label>
            <TextInput value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="SaaS Platform, LMS, E-Commerce…" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: TK.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{T.description}</label>
            <TextArea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title={T.deleteTitle}
        description={T.deleteDesc}
        confirmLabel={T.delete}
        cancelLabel={T.cancel}
      />
    </div>
  );
};

export default AdminProposalTemplates;
