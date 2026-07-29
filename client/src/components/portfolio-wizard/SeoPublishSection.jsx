import { useEffect, useState } from 'react';
import { TK, RADIUS, TextInput, Switch } from '../../admin-ui';
import api from '../../utils/api';
import { Field } from './shared';

/**
 * Related-projects override — a manual pick that beats the automatic
 * category/industry matching on the public page (see the /related route).
 * Left empty, the algorithm keeps deciding; picking anything here pins it.
 */
const RelatedPicker = ({ value = [], onChange, excludeId, isRTL }) => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api.get('/portfolio/admin', { params: { limit: 100 } })
      .then(({ data }) => setProjects((data.projects || []).filter((p) => p._id !== excludeId)))
      .catch(() => {});
  }, [excludeId]);

  const toggle = (id) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div style={{ maxHeight: 220, overflowY: 'auto', border: `1px solid ${TK.border}`, borderRadius: RADIUS.md }}>
      {projects.length === 0 && <p style={{ padding: 14, fontSize: 12, color: TK.textLight, textAlign: isRTL ? 'right' : 'left' }}>{isRTL ? 'لا توجد مشاريع أخرى بعد.' : 'No other projects yet.'}</p>}
      {projects.map((p) => (
        <label key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: `1px solid ${TK.border}`, cursor: 'pointer', fontSize: 12.5, color: TK.text, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <input type="checkbox" checked={value.includes(p._id)} onChange={() => toggle(p._id)} />
          {p.title}
        </label>
      ))}
    </div>
  );
};

const SeoPublishSection = ({ form, set, projectId, isRTL }) => {
  const L = {
    metaTitle: isRTL ? 'عنوان SEO' : 'Meta title',
    metaTitleHint: isRTL ? 'يعود افتراضيًا إلى عنوان المشروع' : 'Falls back to the project title',
    metaDescription: isRTL ? 'وصف SEO' : 'Meta description',
    metaDescriptionHint: isRTL ? 'يعود افتراضيًا إلى الملخص' : 'Falls back to the summary',
    featured: isRTL ? 'مميز (يظهر في الصفحة الرئيسية)' : 'Featured (show on Home)',
    relatedOverride: isRTL ? 'تخصيص المشاريع ذات الصلة' : 'Related projects override',
    relatedHint: isRTL ? 'اتركه فارغًا لترك المطابقة التلقائية حسب الفئة/المجال تقرر.' : 'Leave empty to let the automatic category/industry matching decide.',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={L.metaTitle} hint={L.metaTitleHint} isRTL={isRTL}>
          <TextInput value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} placeholder={form.title} dir={isRTL ? 'rtl' : 'ltr'} />
        </Field>
        <Field label={L.metaDescription} hint={L.metaDescriptionHint} isRTL={isRTL}>
          <TextInput value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} placeholder={form.description?.slice(0, 60)} dir={isRTL ? 'rtl' : 'ltr'} />
        </Field>
      </div>

      <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 20 }}>
        <Switch checked={form.featured} onChange={(v) => set('featured', v)} label={L.featured} />
      </div>

      <div style={{ borderTop: `1px solid ${TK.border}`, paddingTop: 20 }}>
        <Field label={L.relatedOverride} hint={L.relatedHint} isRTL={isRTL}>
          <RelatedPicker value={form.relatedProjectsOverride || []} onChange={(v) => set('relatedProjectsOverride', v)} excludeId={projectId} isRTL={isRTL} />
        </Field>
      </div>
    </div>
  );
};

export default SeoPublishSection;
