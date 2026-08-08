import { useState, useEffect, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { mediaSrc } from '../utils/media';
import { useLanguage } from '../contexts/LanguageContext';
import {
  TK, RADIUS, FONT, PageHeader, Card, Button, IconButton, Badge, SearchInput,
  ConfirmDialog, Modal, Switch, TextArea, Select, DataTable, useTableState, Avatar, MediaUploadField,
} from '../admin-ui';
import { LIBRARY_CONFIGS } from '../admin-ui/libraryConfigs';
import RelationPicker from '../components/portfolio-wizard/RelationPicker';

// Does the library at `apiBase` show avatars in its own picker? (e.g. Client's
// `industry` relation field doesn't have logos, but Testimonial's `client`
// relation field should show the same client logos the Clients page does —
// derived from the target library's own config instead of re-flagging every
// relation field by hand, so it can never drift out of sync.
const relationHasAvatar = (apiBase) => Object.values(LIBRARY_CONFIGS).some((c) => c.apiBase === apiBase && c.hasAvatar);

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

  const handleSubmit = async () => {
    const missing = config.fields.find((f) => f.required && !form[f.key]?.toString().trim());
    if (missing) return toast.error(T.requiredField);

    const body = { ...form };
    config.fields.forEach((f) => { if (f.type === 'relation') body[f.key] = form[f.key]?._id || null; });
    // Explicit `null` (not `undefined`) here — MediaUploadField's Remove button
    // sets form[avatarField] to null and that has to reach the server as a
    // real "clear this field" value. `undefined` gets dropped by
    // JSON.stringify, which would silently omit the key and leave the old
    // logo in place — the exact bug that made Remove a no-op before this
    // page had a Remove action to test it with.
    if (config.hasAvatar) body[config.avatarField] = form[config.avatarField] || null;

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
      const displayName = item[config.displayField] || item.name;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {config.hasAvatar && (
            <Avatar
              image={mediaSrc(avatar)}
              name={displayName}
              size={26}
              shape={config.avatarShape === 'square' ? 'rounded' : 'circle'}
            />
          )}
          <span style={{ fontWeight: 500 }}>{displayName}</span>
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
        emptyIcon={Icon}
        emptyTitle={search.trim() ? (isRTL ? 'لا توجد نتائج مطابقة' : 'No matches for your search') : T.emptyTitle}
        emptySubtitle={search.trim()
          ? (isRTL ? 'جرّب كلمة بحث مختلفة' : 'Try a different search term')
          : (isRTL ? `أنشئ أول ${itemLabel} للبدء` : `Create your first ${itemLabel} to get started`)}
        emptyAction={!search.trim() && <Button variant="primary" size="sm" icon={Plus} onClick={openAdd}>{T.add} {itemLabel}</Button>}
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
              <MediaUploadField
                value={form[config.avatarField]}
                onChange={(v) => setForm((f) => ({ ...f, [config.avatarField]: v }))}
                onUploadingChange={setUploading}
                isRTL={isRTL}
                size={72}
                shape={config.avatarShape === 'square' ? 'square' : 'circle'}
                fit={config.avatarFit === 'contain' ? 'contain' : 'cover'}
              />
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
                  hasAvatar={relationHasAvatar(f.apiBase)}
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
