import { Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { TK, RADIUS, Card, Button, IconButton, Badge, Select, TextInput, TextArea, Switch } from '../../admin-ui';
import FormField from './FormField';

let uidCounter = 0;
const uid = () => `k-${Date.now()}-${uidCounter++}`;

// Bullets are edited as one plain-text line per bullet — a full per-bullet
// bilingual (text/textAr) row editor would slow down exactly the "create a
// proposal in a few minutes" workflow this wizard is built for. The schema
// still carries a `textAr` field per bullet (ProposalRenderer falls back to
// `text` when it's empty) for a future dedicated translation pass.
const bulletsToText = (bullets) => (bullets || []).map((b) => b.text || '').join('\n');
const textToBullets = (text) => text.split('\n').map((s) => s.trim()).filter(Boolean).map((t) => ({ text: t }));

const SECTION_TYPE_OPTIONS = (isRTL) => [
  { value: 'vision', label: isRTL ? 'رؤية' : 'Vision' },
  { value: 'features-grid', label: isRTL ? 'شبكة أنظمة/ميزات' : 'Features Grid' },
  { value: 'spotlight', label: isRTL ? 'إبراز (خلفية داكنة)' : 'Spotlight (dark)' },
  { value: 'process', label: isRTL ? 'خطوات التنفيذ' : 'Process Steps' },
  { value: 'terms', label: isRTL ? 'نقاط' : 'Bullet List' },
  { value: 'custom', label: isRTL ? 'نص حر' : 'Custom Text' },
];

const newSection = (type) => ({
  _key: uid(), type,
  title: '', titleAr: '', eyebrow: '', eyebrowAr: '',
  description: '', descriptionAr: '',
  bullets: [], items: [],
  emphasis: false, isHidden: false, order: 0,
});

const newItem = () => ({
  _key: uid(), title: '', titleAr: '', icon: '',
  description: '', descriptionAr: '', bullets: [], span: 1, order: 0,
});

// ── Items repeater (features-grid cards / process steps) ─────────────────
const ItemsEditor = ({ section, onChange, isRTL, allowSpan }) => {
  const items = section.items || [];
  const setItems = (next) => onChange({ items: next });
  const addItem = () => setItems([...items, newItem()]);
  const updateItem = (i, patch) => setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const moveItem = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: TK.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {allowSpan ? (isRTL ? 'البطاقات' : 'Cards') : (isRTL ? 'الخطوات' : 'Steps')}
        </span>
        <Button size="sm" variant="secondary" icon={Plus} onClick={addItem}>{isRTL ? 'إضافة' : 'Add'}</Button>
      </div>

      {items.map((item, i) => (
        <div key={item._key || item._id || i} style={{ border: `1px solid ${TK.border}`, borderRadius: RADIUS.md, padding: 12, marginBottom: 8, background: TK.bgSubtle }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: TK.textLight, flexShrink: 0 }}>#{i + 1}</span>
            <TextInput containerStyle={{ flex: 1 }} placeholder={isRTL ? 'العنوان' : 'Title'} value={item.title || ''} onChange={(e) => updateItem(i, { title: e.target.value })} />
            <TextInput dir="rtl" containerStyle={{ flex: 1 }} placeholder={isRTL ? 'العنوان (عربي)' : 'Title (Arabic)'} value={item.titleAr || ''} onChange={(e) => updateItem(i, { titleAr: e.target.value })} />
            <IconButton icon={ArrowUp} size={24} onClick={() => moveItem(i, -1)} disabled={i === 0} title={isRTL ? 'أعلى' : 'Move up'} />
            <IconButton icon={ArrowDown} size={24} onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} title={isRTL ? 'أسفل' : 'Move down'} />
            <IconButton icon={Trash2} size={24} onClick={() => removeItem(i)} title={isRTL ? 'حذف' : 'Remove'} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: allowSpan ? '1fr 90px' : '1fr', gap: 8, marginBottom: 8 }}>
            <TextInput placeholder={isRTL ? 'أيقونة (اسم lucide، مثال GraduationCap)' : 'Icon (lucide name, e.g. GraduationCap)'} value={item.icon || ''} onChange={(e) => updateItem(i, { icon: e.target.value })} />
            {allowSpan && (
              <TextInput type="number" min={1} max={4} placeholder="Span" value={item.span || 1} onChange={(e) => updateItem(i, { span: Math.min(4, Math.max(1, Number(e.target.value) || 1)) })} />
            )}
          </div>
          <TextArea containerStyle={{ marginBottom: 8 }} rows={2} placeholder={isRTL ? 'الوصف' : 'Description'} value={item.description || ''} onChange={(e) => updateItem(i, { description: e.target.value })} />
          <TextArea rows={3} placeholder={isRTL ? 'نقاط (سطر لكل نقطة)' : 'Bullets (one per line)'} value={bulletsToText(item.bullets)} onChange={(e) => updateItem(i, { bullets: textToBullets(e.target.value) })} />
        </div>
      ))}

      {items.length === 0 && <p style={{ fontSize: 12, color: TK.textLight, textAlign: 'center', padding: '12px 0' }}>{isRTL ? 'لا توجد عناصر بعد' : 'No items yet'}</p>}
    </div>
  );
};

// ── One section card ───────────────────────────────────────────────────
const SectionCard = ({ section, index, total, onChange, onRemove, onMove, isRTL }) => {
  const set = (patch) => onChange({ ...section, ...patch });
  const hasItems = section.type === 'features-grid' || section.type === 'process';
  const hasBullets = section.type === 'vision' || section.type === 'spotlight' || section.type === 'terms' || section.type === 'custom';
  const hasDescription = section.type !== 'process';

  return (
    <Card padding="16px" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Badge tone="info">{index + 1}</Badge>
          <Select value={section.type} onChange={(e) => set({ type: e.target.value })} options={SECTION_TYPE_OPTIONS(isRTL)} style={{ minWidth: 170 }} />
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <IconButton icon={ArrowUp} size={26} onClick={() => onMove(-1)} disabled={index === 0} title={isRTL ? 'أعلى' : 'Move up'} />
          <IconButton icon={ArrowDown} size={26} onClick={() => onMove(1)} disabled={index === total - 1} title={isRTL ? 'أسفل' : 'Move down'} />
          <IconButton icon={Trash2} size={26} onClick={onRemove} title={isRTL ? 'حذف' : 'Remove'} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <TextInput placeholder={isRTL ? 'تصنيف فرعي (Eyebrow)' : 'Eyebrow label'} value={section.eyebrow || ''} onChange={(e) => set({ eyebrow: e.target.value })} />
        <TextInput dir="rtl" placeholder={isRTL ? 'تصنيف فرعي (عربي)' : 'Eyebrow (Arabic)'} value={section.eyebrowAr || ''} onChange={(e) => set({ eyebrowAr: e.target.value })} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <TextInput placeholder={isRTL ? 'العنوان' : 'Title'} value={section.title || ''} onChange={(e) => set({ title: e.target.value })} />
        <TextInput dir="rtl" placeholder={isRTL ? 'العنوان (عربي)' : 'Title (Arabic)'} value={section.titleAr || ''} onChange={(e) => set({ titleAr: e.target.value })} />
      </div>

      {hasDescription && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <TextArea rows={2} placeholder={isRTL ? 'الوصف' : 'Description'} value={section.description || ''} onChange={(e) => set({ description: e.target.value })} />
          <TextArea dir="rtl" rows={2} placeholder={isRTL ? 'الوصف (عربي)' : 'Description (Arabic)'} value={section.descriptionAr || ''} onChange={(e) => set({ descriptionAr: e.target.value })} />
        </div>
      )}

      {hasBullets && (
        <div style={{ marginTop: 10 }}>
          <FormField
            label={isRTL ? 'نقاط (سطر لكل نقطة)' : 'Bullets (one per line)'}
            hint={section.type === 'vision' ? (isRTL ? 'السطر الأول = الجملة المميزة الكبيرة' : 'First line = the big highlighted statement') : undefined}
          >
            <TextArea rows={4} value={bulletsToText(section.bullets)} onChange={(e) => set({ bullets: textToBullets(e.target.value) })} />
          </FormField>
        </div>
      )}

      {(section.type === 'vision' || section.type === 'spotlight') && (
        <Switch checked={!!section.emphasis} onChange={(v) => set({ emphasis: v })} label={isRTL ? 'إبراز بصري داكن' : 'Dark visual emphasis'} />
      )}

      {hasItems && <ItemsEditor section={section} onChange={set} isRTL={isRTL} allowSpan={section.type === 'features-grid'} />}

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${TK.border}` }}>
        <Switch checked={!section.isHidden} onChange={(v) => set({ isHidden: !v })} label={isRTL ? 'ظاهر في العرض' : 'Visible in proposal'} />
      </div>
    </Card>
  );
};

/**
 * Step 3 — Scope. Add / remove / reorder sections, each rendered by
 * ProposalRenderer's ScopeSection dispatcher on the live preview using the
 * exact same `type` field edited here.
 */
const StepScope = ({ sections, onChange, isRTL }) => {
  const addSection = (type) => onChange([...sections, { ...newSection(type), order: sections.length }]);
  const updateSection = (i, patch) => onChange(sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const removeSection = (i) => onChange(sections.filter((_, idx) => idx !== i));
  const moveSection = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      {sections.map((section, i) => (
        <SectionCard
          key={section._key || section._id || i}
          section={section}
          index={i}
          total={sections.length}
          onChange={(patch) => updateSection(i, patch)}
          onRemove={() => removeSection(i)}
          onMove={(dir) => moveSection(i, dir)}
          isRTL={isRTL}
        />
      ))}

      {sections.length === 0 && (
        <p style={{ fontSize: 13, color: TK.textLight, textAlign: 'center', padding: '24px 0' }}>
          {isRTL ? 'لم تتم إضافة أي قسم بعد' : 'No sections added yet'}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {SECTION_TYPE_OPTIONS(isRTL).map((opt) => (
          <Button key={opt.value} size="sm" variant="secondary" icon={Plus} onClick={() => addSection(opt.value)}>
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default StepScope;
