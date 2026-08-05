import { useState, useEffect, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Upload, ImageIcon, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { assetFromMediaLibraryItem } from '../utils/media';
import { useLanguage } from '../contexts/LanguageContext';
import {
  TK, RADIUS, FONT, PageHeader, Card, Button, IconButton, Badge, SearchInput,
  ConfirmDialog, Modal, Switch, TextArea, Select, DataTable, useTableState,
} from '../admin-ui';
import { LIBRARY_CONFIGS } from '../admin-ui/libraryConfigs';
import RelationPicker from '../components/portfolio-wizard/RelationPicker';

const labelCls = { fontSize: '10.5px', fontWeight: 500, color: TK.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' };
const inputStyle = { width: '100%', background: TK.bgSubtle, border: `1px solid ${TK.border}`, color: TK.text, fontSize: '13px', padding: '10px 13px', borderRadius: RADIUS.md, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

const emptyFormFor = (config) => {
  const form = {};
  config.fields.forEach((f) => { form[f.key] = f.type === 'switch' ? true : f.type === 'relation' ? null : ''; });
  if (config.hasAvatar) form[config.avatarField] = null;
  return form;
};

/**
 * Generic CRUD page for every reusable content library (Team, Client,
 * Technology, Tag, Testimonial, Award, Category, Industry, Service) — one
 * component driven by LIBRARY_CONFIGS instead of ~9 hand-built pages. See
 * the CMS normalization plan. Route: /app/admin/libraries/:libraryKey
 */
const AdminLibrary = () => {
  const { libraryKey } = useParams();
  const { isRTL } = useLanguage();
  const font = FONT(isRTL);
  const config = LIBRARY_CONFIGS[libraryKey];

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { sortKey, sortDir, onSort, sortRows } = useTableState('name');

  const T = {
    add: isRTL ? `إضافة` : `Add`,
    edit: isRTL ? 'تعديل' : 'Edit',
    delete: isRTL ? 'حذف' : 'Delete',
    cancel: isRTL ? 'إلغاء' : 'Cancel',
    save: isRTL ? 'حفظ' : 'Save',
    create: isRTL ? 'إنشاء' : 'Create',
    active: isRTL ? 'مفعّل' : 'Active',
    inactive: isRTL ? 'غير مفعّل' : 'Inactive',
    usage: isRTL ? 'الاستخدام' : 'Usage',
    emptyTitle: isRTL ? 'لا توجد عناصر بعد' : 'Nothing here yet',
    loadFailed: isRTL ? 'فشل تحميل البيانات' : 'Failed to load data',
    saveFailed: isRTL ? 'فشل الحفظ' : 'Save failed',
    createSuccess: isRTL ? 'تمت الإضافة ✓' : 'Added ✓',
    updateSuccess: isRTL ? 'تم التحديث ✓' : 'Updated ✓',
    deleteSuccess: isRTL ? 'تم الحذف ✓' : 'Deleted ✓',
    deleteFailed: isRTL ? 'فشل الحذف' : 'Delete failed',
    deleteTitle: isRTL ? 'حذف هذا العنصر؟' : 'Delete this item?',
    deleteDesc: isRTL ? 'قد يظل مستخدَمًا في مشاريع أخرى — احذف بحذر.' : 'It may still be referenced by other projects — delete with care.',
    uploadImage: isRTL ? 'رفع صورة' : 'Upload image',
    replaceImage: isRTL ? 'استبدال الصورة' : 'Replace image',
    requiredField: isRTL ? 'يرجى تعبئة الحقول المطلوبة' : 'Please fill in the required fields',
  };

  const fetchItems = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    try {
      const { data } = await api.get(config.apiBase, { params: search.trim() ? { q: search.trim() } : {} });
      setItems(data.items || []);
    } catch {
      toast.error(T.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [config, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchItems(); }, [fetchItems]);

  if (!config) return <Navigate to="/app/admin/portfolio" replace />;

  const itemLabel = isRTL ? config.itemLabelAr : config.itemLabelEn;
  const libraryLabel = isRTL ? config.labelAr : config.labelEn;

  const openAdd = () => { setEditingId(null); setForm(emptyFormFor(config)); setModalOpen(true); };
  const openEdit = (item) => {
    setEditingId(item._id);
    const next = {};
    config.fields.forEach((f) => { next[f.key] = item[f.key] ?? (f.type === 'switch' ? true : f.type === 'relation' ? null : ''); });
    if (config.hasAvatar) next[config.avatarField] = item[config.avatarField] || null;
    setForm(next);
    setModalOpen(true);
  };
  const closeModal = () => { if (!submitting && !uploading) setModalOpen(false); };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const { data } = await api.post('/media-library/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, [config.avatarField]: assetFromMediaLibraryItem(data.item) }));
    } catch (err) {
      toast.error(err?.response?.data?.error || T.saveFailed);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    const missing = config.fields.find((f) => f.required && !form[f.key]?.toString().trim());
    if (missing) return toast.error(T.requiredField);

    const body = { ...form };
    config.fields.forEach((f) => { if (f.type === 'relation') body[f.key] = form[f.key]?._id || null; });
    if (config.hasAvatar) body[config.avatarField] = form[config.avatarField] || undefined;

    setSubmitting(true);
    try {
      if (editingId) {
        const { data } = await api.patch(`${config.apiBase}/${editingId}`, body);
        setItems((prev) => prev.map((i) => (i._id === editingId ? data.item : i)));
        toast.success(T.updateSuccess);
      } else {
        const { data } = await api.post(config.apiBase, body);
        setItems((prev) => [data.item, ...prev]);
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
      await api.delete(`${config.apiBase}/${deleteId}`);
      setItems((prev) => prev.filter((i) => i._id !== deleteId));
      toast.success(T.deleteSuccess);
      setDeleteId(null);
    } catch (err) {
      toast.error(err?.response?.data?.error || T.deleteFailed);
    } finally {
      setDeleting(false);
    }
  };

  const columnLabel = (key) => {
    const field = config.fields.find((f) => f.key === key);
    if (field) return isRTL ? field.labelAr : field.labelEn;
    if (key === 'usageCount') return T.usage;
    return key;
  };

  const renderCell = (item, key) => {
    if (key === 'name') {
      const avatar = config.hasAvatar ? item[config.avatarField] : null;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {config.hasAvatar && (
            avatar?.url ? (
              <img src={avatar.url} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: TK.bgSubtle, border: `1px solid ${TK.border}`, flexShrink: 0 }} />
            )
          )}
          <span style={{ fontWeight: 500 }}>{item[config.displayField] || item.name}</span>
        </div>
      );
    }
    if (key === 'isActive') return <Badge tone={item.isActive ? 'success' : 'neutral'} dot>{item.isActive ? T.active : T.inactive}</Badge>;
    if (key === 'status') return <Badge tone={item.status === 'active' ? 'success' : 'neutral'} dot>{item.status === 'active' ? T.active : T.inactive}</Badge>;
    if (key === 'usageCount') return item.usageCount || 0;
    if (key === 'quote') return <span style={{ color: TK.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 320 }}>{item.quote}</span>;
    return item[key] || '—';
  };

  const columns = [
    ...config.columns.map((key) => ({ key, label: columnLabel(key), sortable: key === config.displayField })),
    {
      key: '_actions', label: '', align: 'end',
      render: (item) => (
        <div style={{ display: 'flex', gap: '2px', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
          <IconButton icon={Edit2} size={28} onClick={() => openEdit(item)} title={T.edit} />
          <IconButton icon={Trash2} size={28} onClick={() => setDeleteId(item._id)} title={T.delete} />
        </div>
      ),
    },
  ].map((c) => (c.render ? c : { ...c, render: (row) => renderCell(row, c.key) }));

  const rows = sortRows(items);
  const Icon = config.icon;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: TK.bg, padding: '32px 32px 60px', fontFamily: font }}>
      <PageHeader
        icon={Icon}
        eyebrow={isRTL ? 'مكتبة المحتوى' : 'Content Library'}
        title={libraryLabel}
        subtitle={isRTL ? `عنصر واحد يُستخدم في كل مكان — بدل تكراره في كل مشروع` : `Defined once, referenced everywhere — never re-typed per project`}
        actions={<Button variant="primary" icon={Plus} onClick={openAdd}>{T.add} {itemLabel}</Button>}
      />

      <Card padding="16px" style={{ marginBottom: '16px' }}>
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} />
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={onSort}
        onRowClick={openEdit}
        isRTL={isRTL}
        emptyTitle={T.emptyTitle}
        footer={`${items.length} ${libraryLabel}`}
      />

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? `${T.edit} ${itemLabel}` : `${T.add} ${itemLabel}`}
        footer={(
          <>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>{T.cancel}</Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitting}>{editingId ? T.save : T.create}</Button>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {config.hasAvatar && (
            <div>
              <label style={labelCls}>{isRTL ? 'الصورة' : 'Image'}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', flexShrink: 0, position: 'relative', overflow: 'hidden',
                  background: TK.bgSubtle, border: `1px solid ${TK.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {form[config.avatarField]?.url ? (
                    <img src={form[config.avatarField].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ImageIcon style={{ width: 18, height: 18, color: TK.textLight }} />
                  )}
                  {uploading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Loader style={{ width: 16, height: 16, color: TK.accent, animation: 'au-spin 0.8s linear infinite' }} />
                    </div>
                  )}
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', border: `1px dashed ${TK.border}`, borderRadius: RADIUS.md, cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: TK.textMuted }}>
                  <Upload style={{ width: 13, height: 13 }} /> {form[config.avatarField]?.url ? T.replaceImage : T.uploadImage}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          )}

          {config.fields.map((f) => (
            <div key={f.key}>
              <label style={labelCls}>{(isRTL ? f.labelAr : f.labelEn)}{f.required && ' *'}</label>
              {f.type === 'textarea' ? (
                <TextArea dir={f.dir} value={form[f.key] || ''} onChange={(e) => setForm((c) => ({ ...c, [f.key]: e.target.value }))} />
              ) : f.type === 'switch' ? (
                <Switch checked={!!form[f.key]} onChange={(v) => setForm((c) => ({ ...c, [f.key]: v }))} label={form[f.key] ? T.active : T.inactive} />
              ) : f.type === 'select' ? (
                <Select
                  value={form[f.key] || f.options[0]?.value}
                  onChange={(e) => setForm((c) => ({ ...c, [f.key]: e.target.value }))}
                  options={f.options.map((o) => ({ value: o.value, label: isRTL ? o.labelAr : o.labelEn }))}
                />
              ) : f.type === 'relation' ? (
                <RelationPicker
                  apiBase={f.apiBase}
                  value={form[f.key]}
                  onChange={(v) => setForm((c) => ({ ...c, [f.key]: v }))}
                  multiple={false}
                  allowCreate={false}
                  placeholder={isRTL ? 'اختيار…' : 'Select…'}
                />
              ) : f.type === 'number' ? (
                <input type="number" dir={f.dir} value={form[f.key] || ''} onChange={(e) => setForm((c) => ({ ...c, [f.key]: e.target.value }))} style={inputStyle} />
              ) : (
                <input dir={f.dir} value={form[f.key] || ''} onChange={(e) => setForm((c) => ({ ...c, [f.key]: e.target.value }))} style={inputStyle} />
              )}
            </div>
          ))}
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

export default AdminLibrary;
