import { TextInput, TextArea, Select } from '../../admin-ui';
import FormField from './FormField';

const priorityOptions = (isRTL) => [
  { value: 'low', label: isRTL ? 'منخفضة' : 'Low' },
  { value: 'normal', label: isRTL ? 'عادية' : 'Normal' },
  { value: 'high', label: isRTL ? 'عالية' : 'High' },
  { value: 'urgent', label: isRTL ? 'عاجلة' : 'Urgent' },
];

const StepProject = ({ value, onChange, isRTL }) => {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <div>
      <FormField label={isRTL ? 'عنوان المشروع' : 'Project Title'} required>
        <TextInput value={value.title || ''} onChange={(e) => set({ title: e.target.value })} placeholder={isRTL ? 'مثال: منصة تعليمية متكاملة' : 'e.g. Integrated Learning Platform'} />
      </FormField>
      <FormField label={isRTL ? 'عنوان المشروع (عربي)' : 'Project Title (Arabic)'}>
        <TextInput dir="rtl" value={value.titleAr || ''} onChange={(e) => set({ titleAr: e.target.value })} />
      </FormField>
      <FormField label={isRTL ? 'نوع المشروع' : 'Project Type'} hint={isRTL ? 'يظهر كشارة أعلى العرض (مثال: CUSTOM PLATFORM DEVELOPMENT)' : 'Shown as the hero eyebrow badge'}>
        <TextInput value={value.type || ''} onChange={(e) => set({ type: e.target.value })} placeholder="Custom Platform Development" />
      </FormField>
      <FormField label={isRTL ? 'وصف مختصر' : 'Short Description'}>
        <TextArea value={value.description || ''} onChange={(e) => set({ description: e.target.value })} rows={3} />
      </FormField>
      <FormField label={isRTL ? 'وصف مختصر (عربي)' : 'Short Description (Arabic)'}>
        <TextArea dir="rtl" value={value.descriptionAr || ''} onChange={(e) => set({ descriptionAr: e.target.value })} rows={3} />
      </FormField>
      <FormField label={isRTL ? 'هدف المشروع' : 'Project Objective'}>
        <TextArea value={value.objective || ''} onChange={(e) => set({ objective: e.target.value })} rows={2} />
      </FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label={isRTL ? 'تاريخ البدء' : 'Start Date'}>
          <TextInput type="date" value={value.startDate ? String(value.startDate).slice(0, 10) : ''} onChange={(e) => set({ startDate: e.target.value })} />
        </FormField>
        <FormField label={isRTL ? 'المدة المتوقعة' : 'Estimated Duration'}>
          <TextInput value={value.estimatedDuration || ''} onChange={(e) => set({ estimatedDuration: e.target.value })} placeholder="6–8 weeks" />
        </FormField>
      </div>
      <FormField label={isRTL ? 'الأولوية' : 'Priority'}>
        <Select value={value.priority || 'normal'} onChange={(e) => set({ priority: e.target.value })} options={priorityOptions(isRTL)} />
      </FormField>
    </div>
  );
};

export default StepProject;
