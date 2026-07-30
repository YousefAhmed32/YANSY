import { useState, useEffect, useRef } from 'react';
import {
  Plus, Edit2, Trash2, GripVertical, Eye, EyeOff, ExternalLink, Upload,
  Award, Image as ImageIcon, Loader,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { mediaSrc } from '../utils/media';
import { useLanguage } from '../contexts/LanguageContext';
import {
  TK, RADIUS, FONT, PageHeader, Card, Button, IconButton, Badge,
  ConfirmDialog, Modal, Switch, EmptyState, PageSpinner,
} from '../admin-ui';

const labelCls = { fontSize: '10.5px', fontWeight: 500, color: TK.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' };
const inputStyle = { width: '100%', background: TK.bgSubtle, border: `1px solid ${TK.border}`, color: TK.text, fontSize: '13px', padding: '10px 13px', borderRadius: RADIUS.md, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const sectionTitle = { fontSize: '13px', fontWeight: 600, color: TK.text, margin: '0 0 16px' };

const EMPTY_FORM = { name: '', website: '', isActive: true, logo: null };

const AdminClientLogos = () => {
  const { language, isRTL } = useLanguage();
  const font = FONT(isRTL);

  const T = {
    eyebrow:        language === 'ar' ? 'الصفحة الرئيسية' : 'Homepage',
    title:          language === 'ar' ? 'العملاء الموثوقون' : 'Trusted By',
    subtitle:       language === 'ar' ? 'شعارات الشركات التي تعاملت معها YANSY، معروضة في الصفحة الرئيسية' : 'Brand logos of companies YANSY has worked with, shown on the homepage',
    enabled:        language === 'ar' ? 'القسم مُفعّل' : 'Section enabled',
    disabled:       language === 'ar' ? 'القسم معطّل' : 'Section disabled',
    sectionCopy:    language === 'ar' ? 'محتوى القسم' : 'Section copy',
    titleEn:        language === 'ar' ? 'العنوان (إنجليزي)' : 'Title (EN)',
    titleAr:        language === 'ar' ? 'العنوان (عربي)' : 'Title (AR)',
    subtitleEn:     language === 'ar' ? 'العنوان الفرعي (إنجليزي)' : 'Subtitle (EN)',
    subtitleAr:     language === 'ar' ? 'العنوان الفرعي (عربي)' : 'Subtitle (AR)',
    saveSettings:   language === 'ar' ? 'حفظ محتوى القسم' : 'Save section copy',
    brandsTitle:    language === 'ar' ? 'العلامات التجارية' : 'Brands',
    brandsSubtitle: language === 'ar' ? 'اسحب الصفوف لإعادة الترتيب' : 'Drag rows to reorder',
    addBrand:       language === 'ar' ? 'إضافة علامة تجارية' : 'Add brand',
    emptyTitle:     language === 'ar' ? 'لا توجد علامات تجارية بعد' : 'No brands yet',
    emptySubtitle:  language === 'ar' ? 'أضف أول شعار عميل ليظهر في الصفحة الرئيسية' : 'Add your first client logo to show it on the homepage',
    active:         language === 'ar' ? 'مفعّل' : 'Active',
    inactive:       language === 'ar' ? 'غير مفعّل' : 'Inactive',
    hide:           language === 'ar' ? 'إخفاء' : 'Hide',
    show:           language === 'ar' ? 'إظهار' : 'Show',
    edit:           language === 'ar' ? 'تعديل' : 'Edit',
    delete:         language === 'ar' ? 'حذف' : 'Delete',
    openWebsite:    language === 'ar' ? 'فتح الموقع' : 'Open website',
    modalTitleAdd:  language === 'ar' ? 'إضافة علامة تجارية' : 'Add brand',
    modalTitleEdit: language === 'ar' ? 'تعديل العلامة التجارية' : 'Edit brand',
    name:           language === 'ar' ? 'اسم الشركة' : 'Brand name',
    namePlaceholder: language === 'ar' ? 'مثال: أكمي' : 'e.g. Acme Inc.',
    website:        language === 'ar' ? 'الموقع الإلكتروني (اختياري)' : 'Website (optional)',
    websitePlaceholder: 'https://example.com',
    logo:           language === 'ar' ? 'الشعار' : 'Logo',
    uploadLogo:     language === 'ar' ? 'رفع شعار' : 'Upload logo',
    replaceLogo:    language === 'ar' ? 'استبدال الشعار' : 'Replace logo',
    logoHint:       language === 'ar' ? 'PNG أو SVG أو WEBP — يُفضّل خلفية شفافة' : 'PNG, SVG, or WEBP — transparent background recommended',
    isActiveLabel:  language === 'ar' ? 'ظاهر في الصفحة الرئيسية' : 'Visible on homepage',
    cancel:         language === 'ar' ? 'إلغاء' : 'Cancel',
    save:           language === 'ar' ? 'حفظ' : 'Save',
    deleteTitle:    language === 'ar' ? 'حذف هذه العلامة التجارية؟' : 'Delete this brand?',
    deleteDesc:     language === 'ar' ? 'سيُزال الشعار نهائيًا من الصفحة الرئيسية.' : 'The logo will be permanently removed from the homepage.',
    loadFailed:     language === 'ar' ? 'فشل تحميل البيانات' : 'Failed to load data',
    saveSuccess:    language === 'ar' ? 'تم الحفظ ✓' : 'Saved ✓',
    saveFailed:     language === 'ar' ? 'فشل الحفظ' : 'Save failed',
    uploadFailed:   language === 'ar' ? 'فشل رفع الصورة' : 'Image upload failed',
    nameRequired:   language === 'ar' ? 'اسم الشركة مطلوب' : 'Brand name is required',
    logoRequired:   language === 'ar' ? 'الشعار مطلوب' : 'Logo image is required',
    createSuccess:  language === 'ar' ? 'تمت إضافة العلامة التجارية ✓' : 'Brand added ✓',
    updateSuccess:  language === 'ar' ? 'تم تحديث العلامة التجارية ✓' : 'Brand updated ✓',
    deleteSuccess:  language === 'ar' ? 'تم الحذف ✓' : 'Deleted ✓',
    deleteFailed:   language === 'ar' ? 'فشل الحذف' : 'Delete failed',
    reorderFailed:  language === 'ar' ? 'فشل حفظ الترتيب' : 'Failed to save order',
  };

  const [settings, setSettings]   = useState(null);
  const [logos, setLogos]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId]   = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const fileInputRef = useRef(null);
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [settingsRes, logosRes] = await Promise.all([
        api.get('/client-logos/admin/settings'),
        api.get('/client-logos/admin'),
      ]);
      setSettings(settingsRes.data.settings);
      setLogos(logosRes.data.logos);
    } catch {
      toast.error(T.loadFailed);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setLocalized = (field, lang, v) => setSettings((s) => ({ ...s, [field]: { ...s[field], [lang]: v } }));

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const { data } = await api.put('/client-logos/admin/settings', {
        enabled: settings.enabled, title: settings.title, subtitle: settings.subtitle,
      });
      setSettings(data.settings);
      toast.success(T.saveSuccess);
    } catch {
      toast.error(T.saveFailed);
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleActive = async (logo) => {
    try {
      const { data } = await api.patch(`/client-logos/admin/${logo._id}/toggle`);
      setLogos((prev) => prev.map((l) => (l._id === logo._id ? data.logo : l)));
    } catch {
      toast.error(T.saveFailed);
    }
  };

  // ── Drag reorder ─────────────────────────────────────────────────────────
  const handleDrop = async () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) return;
    const reordered = [...logos];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOver.current, 0, moved);
    setLogos(reordered);
    dragItem.current = null;
    dragOver.current = null;

    try {
      await api.patch('/client-logos/admin/reorder', {
        items: reordered.map((l, i) => ({ id: l._id, order: i })),
      });
    } catch {
      toast.error(T.reorderFailed);
      fetchAll();
    }
  };

  // ── Modal ────────────────────────────────────────────────────────────────
  const openAddModal = () => { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEditModal = (logo) => {
    setEditingId(logo._id);
    setForm({ name: logo.name, website: logo.website || '', isActive: logo.isActive, logo: logo.logo });
    setModalOpen(true);
  };
  const closeModal = () => { if (!uploading && !submitting) setModalOpen(false); };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const { data } = await api.post('/client-logos/admin/media', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({ ...f, logo: data.asset }));
    } catch (err) {
      toast.error(err?.response?.data?.error || T.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error(T.nameRequired);
    if (!form.logo?.url) return toast.error(T.logoRequired);

    setSubmitting(true);
    try {
      const body = { name: form.name.trim(), website: form.website.trim(), logo: form.logo, isActive: form.isActive };
      if (editingId) {
        const { data } = await api.put(`/client-logos/admin/${editingId}`, body);
        setLogos((prev) => prev.map((l) => (l._id === editingId ? data.logo : l)));
        toast.success(T.updateSuccess);
      } else {
        const { data } = await api.post('/client-logos/admin', body);
        setLogos((prev) => [...prev, data.logo]);
        toast.success(T.createSuccess);
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.error || T.saveFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/client-logos/admin/${deleteId}`);
      setLogos((prev) => prev.filter((l) => l._id !== deleteId));
      toast.success(T.deleteSuccess);
      setDeleteId(null);
    } catch {
      toast.error(T.deleteFailed);
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !settings) {
    return <div style={{ minHeight: '100vh', background: TK.bg }}><PageSpinner /></div>;
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px', fontFamily: font }}>
      <PageHeader
        icon={Award}
        eyebrow={T.eyebrow}
        title={T.title}
        subtitle={T.subtitle}
        actions={<Switch checked={settings.enabled} onChange={(v) => setSettings((s) => ({ ...s, enabled: v }))} label={settings.enabled ? T.enabled : T.disabled} />}
      />

      {/* Section copy */}
      <Card style={{ marginBottom: '20px' }}>
        <p style={sectionTitle}>{T.sectionCopy}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelCls}>{T.titleEn}</label>
            <input value={settings.title?.en || ''} onChange={(e) => setLocalized('title', 'en', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelCls}>{T.titleAr}</label>
            <input dir="rtl" value={settings.title?.ar || ''} onChange={(e) => setLocalized('title', 'ar', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelCls}>{T.subtitleEn}</label>
            <input value={settings.subtitle?.en || ''} onChange={(e) => setLocalized('subtitle', 'en', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelCls}>{T.subtitleAr}</label>
            <input dir="rtl" value={settings.subtitle?.ar || ''} onChange={(e) => setLocalized('subtitle', 'ar', e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={handleSaveSettings} loading={savingSettings}>{T.saveSettings}</Button>
        </div>
      </Card>

      {/* Brand list */}
      <Card padding="16px">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: TK.text, margin: 0 }}>{T.brandsTitle}</p>
            {logos.length > 1 && <p style={{ fontSize: '10.5px', color: TK.textLight, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '3px 0 0' }}>{T.brandsSubtitle}</p>}
          </div>
          <Button variant="primary" icon={Plus} onClick={openAddModal}>{T.addBrand}</Button>
        </div>

        {logos.length === 0 ? (
          <EmptyState icon={ImageIcon} title={T.emptyTitle} subtitle={T.emptySubtitle} action={<Button variant="primary" icon={Plus} onClick={openAddModal}>{T.addBrand}</Button>} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {logos.map((logo, i) => (
              <Card
                key={logo._id}
                hover
                padding="10px 14px"
                draggable
                onDragStart={() => (dragItem.current = i)}
                onDragEnter={() => (dragOver.current = i)}
                onDragEnd={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, opacity: logo.isActive ? 1 : 0.55 }}
              >
                <GripVertical style={{ width: '15px', height: '15px', color: TK.textLight, cursor: 'grab', flexShrink: 0 }} />

                <div style={{
                  width: '52px', height: '52px', borderRadius: RADIUS.md, flexShrink: 0,
                  background: TK.bgSubtle, border: `1px solid ${TK.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', overflow: 'hidden',
                }}>
                  <img src={mediaSrc(logo.logo)} alt={logo.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: TK.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{logo.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <Badge tone={logo.isActive ? 'success' : 'neutral'} dot>{logo.isActive ? T.active : T.inactive}</Badge>
                    {logo.website && (
                      <span style={{ fontSize: '11px', color: TK.textLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{logo.website.replace(/^https?:\/\//, '')}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1px', flexShrink: 0 }}>
                  {logo.website && (
                    <a href={logo.website} target="_blank" rel="noopener noreferrer" title={T.openWebsite} className="au-icon-btn"
                      style={{ width: '30px', height: '30px', borderRadius: RADIUS.md, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TK.textMuted, flexShrink: 0 }}>
                      <ExternalLink style={{ width: '14px', height: '14px' }} />
                    </a>
                  )}
                  <IconButton icon={logo.isActive ? Eye : EyeOff} size={30} onClick={() => toggleActive(logo)} title={logo.isActive ? T.hide : T.show} />
                  <IconButton icon={Edit2} size={30} onClick={() => openEditModal(logo)} title={T.edit} />
                  <IconButton icon={Trash2} size={30} onClick={() => setDeleteId(logo._id)} title={T.delete} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Add / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? T.modalTitleEdit : T.modalTitleAdd}
        footer={(
          <>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>{T.cancel}</Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitting}>{T.save}</Button>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelCls}>{T.logo}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: RADIUS.md, flexShrink: 0,
                background: TK.bgSubtle, border: `1px solid ${TK.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', overflow: 'hidden', position: 'relative',
              }}>
                {form.logo?.url ? (
                  <img src={mediaSrc(form.logo)} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <ImageIcon style={{ width: '18px', height: '18px', color: TK.textLight }} />
                )}
                {uploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader style={{ width: '16px', height: '16px', color: TK.accent, animation: 'au-spin 0.8s linear infinite' }} />
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', border: `1px dashed ${TK.border}`, borderRadius: RADIUS.md, cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: TK.textMuted }}>
                  <Upload style={{ width: '13px', height: '13px' }} /> {form.logo?.url ? T.replaceLogo : T.uploadLogo}
                  <input ref={fileInputRef} type="file" accept="image/png,image/svg+xml,image/webp" onChange={handleFileSelect} style={{ display: 'none' }} />
                </label>
                <p style={{ fontSize: '10.5px', color: TK.textLight, margin: '6px 0 0' }}>{T.logoHint}</p>
              </div>
            </div>
          </div>

          <div>
            <label style={labelCls}>{T.name}</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={T.namePlaceholder} style={inputStyle} />
          </div>

          <div>
            <label style={labelCls}>{T.website}</label>
            <input dir="ltr" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder={T.websitePlaceholder} style={{ ...inputStyle, textAlign: isRTL ? 'right' : 'left' }} />
          </div>

          <Switch checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} label={T.isActiveLabel} />
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

export default AdminClientLogos;
