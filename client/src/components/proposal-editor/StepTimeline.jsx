import { Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { TK, RADIUS, Button, IconButton, TextInput, TextArea } from '../../admin-ui';
import FormField from './FormField';

const newPhase = () => ({ title: '', titleAr: '', description: '', descriptionAr: '', duration: '', order: 0 });

const StepTimeline = ({ timeline, onChange, isRTL }) => {
  const set = (patch) => onChange({ ...timeline, ...patch });
  const phases = timeline.phases || [];

  const addPhase = () => set({ phases: [...phases, { ...newPhase(), order: phases.length }] });
  const updatePhase = (i, patch) => set({ phases: phases.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) });
  const removePhase = (i) => set({ phases: phases.filter((_, idx) => idx !== i) });
  const movePhase = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= phases.length) return;
    const next = [...phases];
    [next[i], next[j]] = [next[j], next[i]];
    set({ phases: next });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FormField label={isRTL ? 'إجمالي المدة' : 'Total Duration'} hint={isRTL ? 'مثال: 6–8 أسابيع' : 'e.g. 6–8 weeks'}>
          <TextInput value={timeline.totalDuration || ''} onChange={(e) => set({ totalDuration: e.target.value })} placeholder="6–8 weeks" />
        </FormField>
        <FormField label={isRTL ? 'إجمالي المدة (عربي)' : 'Total Duration (Arabic)'}>
          <TextInput dir="rtl" value={timeline.totalDurationAr || ''} onChange={(e) => set({ totalDurationAr: e.target.value })} placeholder="6–8 أسابيع" />
        </FormField>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 8px' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: TK.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{isRTL ? 'المراحل' : 'Phases'}</span>
        <Button size="sm" variant="secondary" icon={Plus} onClick={addPhase}>{isRTL ? 'إضافة مرحلة' : 'Add Phase'}</Button>
      </div>

      {phases.map((phase, i) => (
        <div key={i} style={{ border: `1px solid ${TK.border}`, borderRadius: RADIUS.md, padding: 12, marginBottom: 8, background: TK.bgSubtle }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: TK.textLight, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
            <TextInput containerStyle={{ flex: 1 }} placeholder={isRTL ? 'اسم المرحلة (مثال: Discovery & Planning)' : 'Phase title'} value={phase.title || ''} onChange={(e) => updatePhase(i, { title: e.target.value })} />
            <TextInput containerStyle={{ width: 110 }} placeholder={isRTL ? 'المدة' : 'Duration'} value={phase.duration || ''} onChange={(e) => updatePhase(i, { duration: e.target.value })} />
            <IconButton icon={ArrowUp} size={26} onClick={() => movePhase(i, -1)} disabled={i === 0} title={isRTL ? 'أعلى' : 'Move up'} />
            <IconButton icon={ArrowDown} size={26} onClick={() => movePhase(i, 1)} disabled={i === phases.length - 1} title={isRTL ? 'أسفل' : 'Move down'} />
            <IconButton icon={Trash2} size={26} onClick={() => removePhase(i)} title={isRTL ? 'حذف' : 'Remove'} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <TextInput dir="rtl" placeholder={isRTL ? 'اسم المرحلة (عربي)' : 'Title (Arabic)'} value={phase.titleAr || ''} onChange={(e) => updatePhase(i, { titleAr: e.target.value })} />
          </div>
          <TextArea rows={2} placeholder={isRTL ? 'وصف المرحلة' : 'Phase description'} value={phase.description || ''} onChange={(e) => updatePhase(i, { description: e.target.value })} />
        </div>
      ))}

      {phases.length === 0 && <p style={{ fontSize: 12, color: TK.textLight, textAlign: 'center', padding: '16px 0' }}>{isRTL ? 'لا توجد مراحل بعد' : 'No phases yet'}</p>}
    </div>
  );
};

export default StepTimeline;
