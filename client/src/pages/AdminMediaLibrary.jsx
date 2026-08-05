import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, Trash2, Image as ImageIcon, Film, Music, FileText, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import {
  TK, RADIUS, FONT, PageHeader, Card, Button, IconButton, Badge, SearchInput, FilterPills,
  ConfirmDialog, Modal, TextArea, EmptyState, PageSpinner,
} from '../admin-ui';

const TYPE_ICON = { image: ImageIcon, video: Film, audio: Music, document: FileText, logo: ImageIcon, icon: ImageIcon };

const labelCls = { fontSize: '10.5px', fontWeight: 500, color: TK.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' };
const inputStyle = { width: '100%', background: TK.bgSubtle, border: `1px solid ${TK.border}`, color: TK.text, fontSize: '13px', padding: '10px 13px', borderRadius: RADIUS.md, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

/**
 * Browsable catalog over the GridFS media store — makes the byte-level
 * dedup that server/media/media.service.js already does (identical files
 * reuse the same blob) visible and reusable, instead of every wizard field
 * silently re-uploading. See the CMS normalization plan.
 */
const AdminMediaLibrary = () => {
  const { isRTL } = useLanguage();
  const font = FONT(isRTL);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const T = {
    eyebrow: isRTL ? 'مكتبة المحتوى' : 'Content Library',
    title: isRTL ? 'مكتبة الوسائط' : 'Media Library',
    subtitle: isRTL ? 'كل صورة وفيديو مرفوع — قابل لإعادة الاستخدام بدل الرفع من جديد في كل مرة' : 'Every image and video uploaded — reusable everywhere instead of re-uploading each time',
    upload: isRTL ? 'رفع ملف' : 'Upload file',
    all: isRTL ? 'الكل' : 'All',
    image: isRTL ? 'صور' : 'Images', video: isRTL ? 'فيديو' : 'Video', audio: isRTL ? 'صوت' : 'Audio',
    document: isRTL ? 'مستندات' : 'Documents', logo: isRTL ? 'شعارات' : 'Logos', icon: isRTL ? 'أيقونات' : 'Icons',
    empty: isRTL ? 'لا توجد ملفات بعد' : 'No files yet',
    emptySub: isRTL ? 'ارفع أول ملف لبدء المكتبة' : 'Upload your first file to start the library',
    edit: isRTL ? 'تفاصيل الملف' : 'File details',
    alt: isRTL ? 'نص بديل (EN)' : 'Alt text (EN)', altAr: isRTL ? 'نص بديل (عربي)' : 'Alt text (AR)',
    caption: isRTL ? 'تعليق (EN)' : 'Caption (EN)', captionAr: isRTL ? 'تعليق (عربي)' : 'Caption (AR)',
    save: isRTL ? 'حفظ' : 'Save', cancel: isRTL ? 'إلغاء' : 'Cancel', delete: isRTL ? 'حذف' : 'Delete',
    usedIn: isRTL ? 'مستخدم في' : 'Used in',
    notUsed: isRTL ? 'غير مستخدم في أي مشروع' : 'Not used in any project',
    deleteTitle: isRTL ? 'حذف هذا الملف؟' : 'Delete this file?',
    deleteDesc: isRTL ? 'لا يمكن التراجع عن هذا الإجراء.' : 'This cannot be undone.',
    loadFailed: isRTL ? 'فشل تحميل الملفات' : 'Failed to load files',
    uploadFailed: isRTL ? 'فشل رفع الملف' : 'Upload failed',
    reused: isRTL ? 'هذا الملف موجود مسبقًا في المكتبة ✓' : 'This file already exists in the library ✓',
    uploaded: isRTL ? 'تم الرفع ✓' : 'Uploaded ✓',
    saveFailed: isRTL ? 'فشل الحفظ' : 'Save failed',
    saved: isRTL ? 'تم الحفظ ✓' : 'Saved ✓',
    deleteFailed: isRTL ? 'فشل الحذف' : 'Delete failed',
    deleted: isRTL ? 'تم الحذف ✓' : 'Deleted ✓',
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/media-library', { params: { q: search.trim() || undefined, type: type === 'all' ? undefined : type, limit: 100 } });
      setItems(data.items || []);
    } catch {
      toast.error(T.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [search, type]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const { data } = await api.post('/media-library/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setItems((prev) => [data.item, ...prev.filter((i) => i._id !== data.item._id)]);
      toast.success(data.reused ? T.reused : T.uploaded);
    } catch (err) {
      toast.error(err?.response?.data?.error || T.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (item) => {
    setEditing(item);
    setEditForm({ alt: item.alt || '', altAr: item.altAr || '', caption: item.caption || '', captionAr: item.captionAr || '' });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/media-library/${editing._id}`, editForm);
      setItems((prev) => prev.map((i) => (i._id === editing._id ? data.item : i)));
      toast.success(T.saved);
      setEditing(null);
    } catch {
      toast.error(T.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/media-library/${deleteId}`);
      setItems((prev) => prev.filter((i) => i._id !== deleteId));
      toast.success(T.deleted);
      setDeleteId(null);
    } catch (err) {
      toast.error(err?.response?.data?.error || T.deleteFailed);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px', fontFamily: font }}>
      <PageHeader
        icon={ImageIcon}
        eyebrow={T.eyebrow}
        title={T.title}
        subtitle={T.subtitle}
        actions={(
          <label>
            <Button variant="primary" icon={Upload} loading={uploading} onClick={() => fileInputRef.current?.click()}>{T.upload}</Button>
            <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        )}
      />

      <Card padding="16px" style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} />
        <FilterPills
          value={type}
          onChange={setType}
          options={[
            { value: 'all', label: T.all }, { value: 'image', label: T.image }, { value: 'video', label: T.video },
            { value: 'audio', label: T.audio }, { value: 'document', label: T.document }, { value: 'logo', label: T.logo }, { value: 'icon', label: T.icon },
          ]}
        />
      </Card>

      {loading ? (
        <PageSpinner />
      ) : items.length === 0 ? (
        <Card><EmptyState icon={ImageIcon} title={T.empty} subtitle={T.emptySub} /></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
          {items.map((item) => {
            const Icon = TYPE_ICON[item.type] || FileText;
            return (
              <Card key={item._id} hover padding="0" style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => openEdit(item)}>
                <div style={{ aspectRatio: '1', background: TK.bgSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {item.type === 'image' || item.type === 'logo' || item.type === 'icon' ? (
                    <img src={item.url} alt={item.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Icon style={{ width: 28, height: 28, color: TK.textLight }} />
                  )}
                  {item.usedIn?.length > 0 && (
                    <span style={{ position: 'absolute', top: 6, insetInlineEnd: 6, background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: RADIUS.pill, padding: '2px 7px', fontSize: 10, fontWeight: 600, color: TK.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Link2 style={{ width: 9, height: 9 }} /> {item.usedIn.length}
                    </span>
                  )}
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <p style={{ fontSize: 11, fontWeight: 500, color: TK.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.filename || item.alt || '—'}</p>
                  <Badge tone="neutral">{item.type}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => !saving && setEditing(null)}
        title={T.edit}
        footer={(
          <>
            <IconButton icon={Trash2} variant="outline" onClick={() => { setDeleteId(editing._id); setEditing(null); }} />
            <div style={{ flex: 1 }} />
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>{T.cancel}</Button>
            <Button variant="primary" onClick={saveEdit} loading={saving}>{T.save}</Button>
          </>
        )}
      >
        {editing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ aspectRatio: '16/9', background: TK.bgSubtle, borderRadius: RADIUS.md, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {editing.type === 'image' || editing.type === 'logo' || editing.type === 'icon' ? (
                <img src={editing.url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (() => { const EditingIcon = TYPE_ICON[editing.type] || FileText; return <EditingIcon style={{ width: 32, height: 32, color: TK.textLight }} />; })()}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelCls}>{T.alt}</label>
                <input value={editForm.alt} onChange={(e) => setEditForm((f) => ({ ...f, alt: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelCls}>{T.altAr}</label>
                <input dir="rtl" value={editForm.altAr} onChange={(e) => setEditForm((f) => ({ ...f, altAr: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelCls}>{T.caption}</label>
              <TextArea value={editForm.caption} onChange={(e) => setEditForm((f) => ({ ...f, caption: e.target.value }))} rows={2} />
            </div>
            <div>
              <label style={labelCls}>{T.captionAr}</label>
              <TextArea dir="rtl" value={editForm.captionAr} onChange={(e) => setEditForm((f) => ({ ...f, captionAr: e.target.value }))} rows={2} />
            </div>
            <div>
              <label style={labelCls}>{T.usedIn}</label>
              {editing.usedIn?.length ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {editing.usedIn.map((u, i) => <Badge key={i} tone="info">{u.field}</Badge>)}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: TK.textLight, margin: 0 }}>{T.notUsed}</p>
              )}
            </div>
          </div>
        )}
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

export default AdminMediaLibrary;
