import { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Pin, Clock, TrendingUp, ChevronDown, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { TK, RADIUS, SHADOW, Modal, Button, Spinner } from '../../admin-ui';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Search-as-you-type relation picker for reusable content libraries (Team,
 * Client, Technology, Tag, Testimonial, Award, Category, Industry, Service).
 * Replaces the free-text repeaters/selects that used to duplicate this data
 * per-project — see the CMS normalization plan.
 *
 * `value`/`onChange` deal in full library item OBJECTS (not bare ids) — the
 * parent already has populated objects from the API's PROJECT_POPULATE, and
 * returning objects means the picker never needs a second fetch to resolve
 * what's already selected.
 *
 * Modeled on the existing "Copy Tech Stack" modal in TechTagInput.jsx and the
 * RelatedPicker in SeoPublishSection.jsx — the same interaction patterns,
 * generalized to every library instead of reimplemented per field.
 */
const RelationPicker = ({
  apiBase,                    // e.g. '/technologies'
  value,                      // object | object[] | null
  onChange,                   // (object | object[] | null) => void
  multiple = false,
  displayField = 'name',      // key, or (item) => string
  placeholder,
  allowCreate = true,
  quickCreateFields = null,   // [{ key, label, labelAr, required, multiline }] — defaults to [displayField]
  copyFromField,              // PortfolioProject field name to offer "Copy from another project" for, e.g. 'team'
  disabled = false,
}) => {
  const { isRTL } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({});
  const [creating, setCreating] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyProjects, setCopyProjects] = useState(null);
  const containerRef = useRef(null);

  const label = (item) => (typeof displayField === 'function' ? displayField(item) : item?.[displayField]) || '';
  const fields = quickCreateFields || [{ key: typeof displayField === 'string' ? displayField : 'name', label: 'Name', labelAr: 'الاسم', required: true }];

  const selectedList = multiple ? (value || []) : (value ? [value] : []);
  const selectedIds = new Set(selectedList.map((i) => i._id));

  useEffect(() => {
    if (!open || items.length) return;
    setLoading(true);
    api.get(apiBase, { params: { limit: 200 } })
      .then(({ data }) => setItems(data.items || []))
      .catch(() => toast.error(isRTL ? 'فشل تحميل القائمة' : 'Failed to load list'))
      .finally(() => setLoading(false));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter((i) => label(i).toLowerCase().includes(q)) : items;
  const available = filtered.filter((i) => !selectedIds.has(i._id));
  const pinned = !q ? available.filter((i) => i.isPinned) : [];
  const recent = !q ? [...available].filter((i) => i.lastUsedAt).sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt)).slice(0, 5) : [];
  const mostUsed = !q ? [...available].filter((i) => i.usageCount > 0).sort((a, b) => b.usageCount - a.usageCount).slice(0, 5) : [];
  const bucketedIds = new Set([...pinned, ...recent, ...mostUsed].map((i) => i._id));
  const rest = q ? available : available.filter((i) => !bucketedIds.has(i._id));

  const select = (item) => {
    if (multiple) onChange([...(value || []), item]);
    else { onChange(item); setOpen(false); }
    setQuery('');
  };
  const remove = (item) => {
    if (multiple) onChange((value || []).filter((i) => i._id !== item._id));
    else onChange(null);
  };

  const togglePin = async (item, e) => {
    e.stopPropagation();
    try {
      const { data } = await api.patch(`${apiBase}/${item._id}/pin`);
      setItems((prev) => prev.map((i) => (i._id === item._id ? data.item : i)));
    } catch { /* non-critical UI affordance — silently ignore */ }
  };

  const openCreate = () => {
    const seed = {};
    fields.forEach((f) => { seed[f.key] = f.key === (typeof displayField === 'string' ? displayField : 'name') ? query : ''; });
    setCreateForm(seed);
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const missing = fields.find((f) => f.required && !createForm[f.key]?.trim());
    if (missing) return toast.error(isRTL ? 'يرجى تعبئة الحقول المطلوبة' : 'Please fill in the required fields');
    setCreating(true);
    try {
      const { data } = await api.post(apiBase, createForm);
      setItems((prev) => [data.item, ...prev]);
      select(data.item);
      setCreateOpen(false);
      toast.success(isRTL ? 'تمت الإضافة ✓' : 'Added ✓');
    } catch (err) {
      toast.error(err?.response?.data?.error || (isRTL ? 'فشلت الإضافة' : 'Failed to create'));
    } finally {
      setCreating(false);
    }
  };

  const openCopyFrom = async () => {
    setCopyOpen(true);
    if (copyProjects) return;
    try {
      const { data } = await api.get('/portfolio/admin', { params: { limit: 30 } });
      setCopyProjects(data.projects || []);
    } catch {
      toast.error(isRTL ? 'فشل تحميل المشاريع' : 'Failed to load projects');
      setCopyProjects([]);
    }
  };

  const applyCopyFrom = (project) => {
    const source = project[copyFromField];
    if (!source) return;
    const resolved = Array.isArray(source)
      ? source.map((s) => (copyFromField === 'team' ? s.member : s)).filter(Boolean)
      : (copyFromField === 'client' ? source : source);
    if (multiple) onChange(resolved);
    else onChange(Array.isArray(resolved) ? resolved[0] || null : resolved);
    setCopyOpen(false);
    toast.success(isRTL ? 'تم النسخ ✓' : 'Copied ✓');
  };

  const Row = ({ item, icon: Icon }) => (
    <button
      type="button"
      onClick={() => select(item)}
      className="au-row"
      style={{
        display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px',
        background: 'transparent', border: 'none', cursor: 'pointer', textAlign: isRTL ? 'right' : 'left',
        borderRadius: RADIUS.sm, fontSize: '12.5px', color: TK.text,
      }}
    >
      {item.avatar?.url || item.logo?.url ? (
        <img src={(item.avatar || item.logo).url} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
      ) : Icon ? (
        <Icon style={{ width: 12, height: 12, color: TK.textLight, flexShrink: 0 }} />
      ) : null}
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label(item)}</span>
      <span onClick={(e) => togglePin(item, e)} title={isRTL ? 'تثبيت' : 'Pin'} style={{ display: 'flex', color: item.isPinned ? TK.accent : TK.borderSoft, flexShrink: 0 }}>
        <Pin style={{ width: 11, height: 11, fill: item.isPinned ? TK.accent : 'none' }} />
      </span>
    </button>
  );

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Selected chips */}
      {selectedList.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {selectedList.map((item) => (
            <span key={item._id} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 6px 4px 10px',
              background: TK.accentBg, border: `1px solid ${TK.accentBd}`, borderRadius: RADIUS.pill,
              fontSize: '12px', fontWeight: 500, color: TK.accent,
            }}>
              {(item.avatar?.url || item.logo?.url) && (
                <img src={(item.avatar || item.logo).url} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }} />
              )}
              {label(item)}
              {!disabled && (
                <button type="button" onClick={() => remove(item)} aria-label={isRTL ? 'إزالة' : 'Remove'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.accent, display: 'flex', padding: 0 }}>
                  <X style={{ width: 12, height: 12 }} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {!disabled && (multiple || !selectedList.length) && (
        <div
          className="au-input"
          onClick={() => setOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
            background: TK.surface, border: `1px solid ${open ? TK.accentBd : TK.border}`, borderRadius: RADIUS.md, padding: '8px 12px',
          }}
        >
          <Search style={{ width: 13, height: 13, color: TK.textMuted, flexShrink: 0 }} />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder || (isRTL ? 'بحث أو اختيار…' : 'Search or select…')}
            style={{ flex: 1, fontSize: '12.5px', color: TK.text, minWidth: 0 }}
          />
          <ChevronDown style={{ width: 12, height: 12, color: TK.textMuted, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none' }} />
        </div>
      )}

      {open && !disabled && (
        <div style={{
          position: 'absolute', top: '100%', insetInlineStart: 0, insetInlineEnd: 0, marginTop: '4px', zIndex: 50,
          background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: RADIUS.md, boxShadow: SHADOW.lg,
          maxHeight: '320px', overflowY: 'auto', padding: '6px',
        }} className="au-scroll">
          {loading ? (
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}><Spinner size={18} /></div>
          ) : (
            <>
              {allowCreate && q && !filtered.some((i) => label(i).toLowerCase() === q) && (
                <button type="button" onClick={openCreate} className="au-row" style={{
                  display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px',
                  background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: RADIUS.sm,
                  fontSize: '12.5px', fontWeight: 500, color: TK.accent, textAlign: isRTL ? 'right' : 'left',
                }}>
                  <Plus style={{ width: 13, height: 13 }} />
                  {isRTL ? `إنشاء "${query}"` : `Create "${query}"`}
                </button>
              )}

              {pinned.length > 0 && (
                <>
                  <div style={{ padding: '6px 10px 3px', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: TK.textLight }}>{isRTL ? 'مثبّت' : 'Pinned'}</div>
                  {pinned.map((item) => <Row key={item._id} item={item} icon={Pin} />)}
                </>
              )}
              {recent.length > 0 && (
                <>
                  <div style={{ padding: '6px 10px 3px', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: TK.textLight }}>{isRTL ? 'الأخيرة' : 'Recent'}</div>
                  {recent.map((item) => <Row key={item._id} item={item} icon={Clock} />)}
                </>
              )}
              {mostUsed.length > 0 && (
                <>
                  <div style={{ padding: '6px 10px 3px', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: TK.textLight }}>{isRTL ? 'الأكثر استخدامًا' : 'Most Used'}</div>
                  {mostUsed.map((item) => <Row key={item._id} item={item} icon={TrendingUp} />)}
                </>
              )}
              {(pinned.length > 0 || recent.length > 0 || mostUsed.length > 0) && rest.length > 0 && (
                <div style={{ margin: '4px 8px', borderTop: `1px solid ${TK.borderSoft}` }} />
              )}
              {rest.length > 0 ? (
                rest.map((item) => <Row key={item._id} item={item} />)
              ) : !loading && !pinned.length && !recent.length && !mostUsed.length && (
                <div style={{ padding: '16px 10px', textAlign: 'center', fontSize: '12px', color: TK.textLight }}>
                  {isRTL ? 'لا توجد نتائج' : 'No matches'}
                </div>
              )}

              {copyFromField && (
                <>
                  <div style={{ margin: '4px 8px', borderTop: `1px solid ${TK.borderSoft}` }} />
                  <button type="button" onClick={openCopyFrom} className="au-row" style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px',
                    background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: RADIUS.sm,
                    fontSize: '12px', fontWeight: 500, color: TK.textMuted, textAlign: isRTL ? 'right' : 'left',
                  }}>
                    <Copy style={{ width: 12, height: 12 }} />
                    {isRTL ? 'نسخ من مشروع آخر' : 'Copy from another project'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Quick-create modal */}
      <Modal
        open={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        title={isRTL ? 'إنشاء جديد' : 'Create new'}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button variant="primary" onClick={submitCreate} loading={creating}>{isRTL ? 'إنشاء' : 'Create'}</Button>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {fields.map((f) => (
            <div key={f.key}>
              <label style={{ fontSize: '10.5px', fontWeight: 500, color: TK.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                {(isRTL ? f.labelAr : f.label) || f.key}{f.required && ' *'}
              </label>
              {f.multiline ? (
                <textarea
                  rows={3}
                  value={createForm[f.key] || ''}
                  onChange={(e) => setCreateForm((c) => ({ ...c, [f.key]: e.target.value }))}
                  style={{ width: '100%', background: TK.bgSubtle, border: `1px solid ${TK.border}`, color: TK.text, fontSize: '13px', padding: '10px 13px', borderRadius: RADIUS.md, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
                />
              ) : (
                <input
                  value={createForm[f.key] || ''}
                  onChange={(e) => setCreateForm((c) => ({ ...c, [f.key]: e.target.value }))}
                  style={{ width: '100%', background: TK.bgSubtle, border: `1px solid ${TK.border}`, color: TK.text, fontSize: '13px', padding: '10px 13px', borderRadius: RADIUS.md, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* Copy-from-project modal */}
      <Modal open={copyOpen} onClose={() => setCopyOpen(false)} title={isRTL ? 'نسخ من مشروع آخر' : 'Copy from another project'} width="440px">
        {copyProjects === null ? (
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}><Spinner size={18} /></div>
        ) : copyProjects.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', fontSize: '12.5px', color: TK.textLight }}>{isRTL ? 'لا توجد مشاريع أخرى' : 'No other projects yet'}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '320px', overflowY: 'auto' }} className="au-scroll">
            {copyProjects.map((p) => (
              <button key={p._id} type="button" onClick={() => applyCopyFrom(p)} className="au-row" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 10px',
                background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: RADIUS.sm,
                fontSize: '12.5px', color: TK.text, textAlign: isRTL ? 'right' : 'left',
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isRTL && p.titleAr ? p.titleAr : p.title}</span>
                {!p[copyFromField] || (Array.isArray(p[copyFromField]) && !p[copyFromField].length) ? (
                  <span style={{ fontSize: '10.5px', color: TK.textLight, flexShrink: 0 }}>{isRTL ? 'فارغ' : 'empty'}</span>
                ) : (
                  <Check style={{ width: 13, height: 13, color: TK.green, flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RelationPicker;
