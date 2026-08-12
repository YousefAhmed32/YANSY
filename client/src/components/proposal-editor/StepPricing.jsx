import { Plus, Trash2 } from 'lucide-react';
import { TK, RADIUS, Card, Button, IconButton, TextInput, Select, Switch } from '../../admin-ui';
import FormField from './FormField';
import { computeFinalPrice, computeMilestoneAmount } from '../../utils/proposalPricing';

const CURRENCY_OPTIONS = [
  { value: 'EGP', label: 'EGP' }, { value: 'USD', label: 'USD' }, { value: 'SAR', label: 'SAR' },
  { value: 'AED', label: 'AED' }, { value: 'EUR', label: 'EUR' },
];
const adjustTypeOptions = (isRTL) => [
  { value: 'percentage', label: isRTL ? 'نسبة %' : 'Percentage %' },
  { value: 'fixed', label: isRTL ? 'قيمة ثابتة' : 'Fixed amount' },
];
const scheduleOptions = (isRTL) => [
  { value: 'full', label: isRTL ? '100% مقدمًا' : '100% Upfront' },
  { value: '50-50', label: '50 / 50' },
  { value: '40-30-30', label: '40 / 30 / 30' },
  { value: 'custom', label: isRTL ? 'دفعات مخصصة' : 'Custom Installments' },
];

// Auto-fills sensible milestone defaults when a preset schedule is chosen —
// still fully editable/removable afterwards. 'custom' leaves whatever the
// admin already built alone; 'full' clears milestones since there's nothing
// to split.
const PRESET_MILESTONES = {
  '50-50': [
    { name: 'Deposit', nameAr: 'دفعة أولى', percentage: 50, dueCondition: 'On signing', dueConditionAr: 'عند التوقيع' },
    { name: 'Final Delivery', nameAr: 'التسليم النهائي', percentage: 50, dueCondition: 'On delivery', dueConditionAr: 'عند التسليم' },
  ],
  '40-30-30': [
    { name: 'Deposit', nameAr: 'دفعة أولى', percentage: 40, dueCondition: 'On signing', dueConditionAr: 'عند التوقيع' },
    { name: 'Midpoint', nameAr: 'دفعة منتصف المشروع', percentage: 30, dueCondition: 'At midpoint', dueConditionAr: 'عند منتصف التنفيذ' },
    { name: 'Final Delivery', nameAr: 'التسليم النهائي', percentage: 30, dueCondition: 'On delivery', dueConditionAr: 'عند التسليم' },
  ],
};

const StepPricing = ({ pricing, onChange, isRTL }) => {
  const set = (patch) => onChange({ ...pricing, ...patch });
  const finalPrice = computeFinalPrice(pricing);
  const milestones = pricing.milestones || [];

  const setSchedule = (type) => {
    const preset = PRESET_MILESTONES[type];
    set({
      paymentScheduleType: type,
      milestones: type === 'full' ? [] : preset ? preset.map((m, i) => ({ ...m, order: i })) : milestones,
    });
  };

  const addMilestone = () => set({ milestones: [...milestones, { name: '', nameAr: '', percentage: 0, dueCondition: '', dueConditionAr: '', order: milestones.length }] });
  const updateMilestone = (i, patch) => set({ milestones: milestones.map((m, idx) => (idx === i ? { ...m, ...patch } : m)) });
  const removeMilestone = (i) => set({ milestones: milestones.filter((_, idx) => idx !== i) });

  const percentTotal = milestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
        <FormField label={isRTL ? 'السعر' : 'Price'}>
          <TextInput type="number" min={0} value={pricing.price ?? ''} onChange={(e) => set({ price: Number(e.target.value) })} />
        </FormField>
        <FormField label={isRTL ? 'العملة' : 'Currency'}>
          <Select value={pricing.currency || 'EGP'} onChange={(e) => set({ currency: e.target.value })} options={CURRENCY_OPTIONS} />
        </FormField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FormField label={isRTL ? 'الخصم' : 'Discount'}>
          <TextInput type="number" min={0} value={pricing.discount ?? ''} onChange={(e) => set({ discount: Number(e.target.value) })} />
        </FormField>
        <FormField label={isRTL ? 'نوع الخصم' : 'Discount type'}>
          <Select value={pricing.discountType || 'percentage'} onChange={(e) => set({ discountType: e.target.value })} options={adjustTypeOptions(isRTL)} />
        </FormField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FormField label={isRTL ? 'الضريبة' : 'Tax'}>
          <TextInput type="number" min={0} value={pricing.tax ?? ''} onChange={(e) => set({ tax: Number(e.target.value) })} />
        </FormField>
        <FormField label={isRTL ? 'نوع الضريبة' : 'Tax type'}>
          <Select value={pricing.taxType || 'percentage'} onChange={(e) => set({ taxType: e.target.value })} options={adjustTypeOptions(isRTL)} />
        </FormField>
      </div>

      <Card padding="14px" style={{ background: TK.accentBg, borderColor: TK.accentBd, marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: TK.accent, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{isRTL ? 'السعر النهائي' : 'Final Price'}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: TK.text, marginTop: 4 }}>
          {finalPrice.toLocaleString('en-US')} <span style={{ fontSize: 14, fontWeight: 600, color: TK.textMuted }}>{pricing.currency || 'EGP'}</span>
        </div>
      </Card>

      <div style={{ marginBottom: 16 }}>
        <Switch
          checked={!!pricing.hidePriceFromClient}
          onChange={(v) => set({ hidePriceFromClient: v })}
          label={isRTL ? 'إخفاء السعر عن العميل (يُناقَش في اجتماع لاحق)' : 'Hide price from client (discuss in a follow-up meeting)'}
        />
      </div>

      <FormField label={isRTL ? 'جدول الدفع' : 'Payment Schedule'}>
        <Select value={pricing.paymentScheduleType || 'full'} onChange={(e) => setSchedule(e.target.value)} options={scheduleOptions(isRTL)} />
      </FormField>

      {pricing.paymentScheduleType && pricing.paymentScheduleType !== 'full' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: TK.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{isRTL ? 'الدفعات' : 'Milestones'}</span>
            <Button size="sm" variant="secondary" icon={Plus} onClick={addMilestone}>{isRTL ? 'إضافة دفعة' : 'Add Milestone'}</Button>
          </div>
          {milestones.map((m, i) => (
            <div key={i} style={{ border: `1px solid ${TK.border}`, borderRadius: RADIUS.md, padding: 12, marginBottom: 8, background: TK.bgSubtle }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 32px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <TextInput placeholder={isRTL ? 'اسم الدفعة' : 'Milestone name'} value={m.name || ''} onChange={(e) => updateMilestone(i, { name: e.target.value })} />
                <TextInput dir="rtl" placeholder={isRTL ? 'اسم الدفعة (عربي)' : 'Name (Arabic)'} value={m.nameAr || ''} onChange={(e) => updateMilestone(i, { nameAr: e.target.value })} />
                <TextInput type="number" min={0} max={100} placeholder="%" value={m.percentage ?? ''} onChange={(e) => updateMilestone(i, { percentage: Number(e.target.value) })} />
                <IconButton icon={Trash2} size={30} onClick={() => removeMilestone(i)} title={isRTL ? 'حذف' : 'Remove'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <TextInput placeholder={isRTL ? 'شرط الاستحقاق' : 'Due condition'} value={m.dueCondition || ''} onChange={(e) => updateMilestone(i, { dueCondition: e.target.value })} />
                <TextInput dir="rtl" placeholder={isRTL ? 'شرط الاستحقاق (عربي)' : 'Due condition (Arabic)'} value={m.dueConditionAr || ''} onChange={(e) => updateMilestone(i, { dueConditionAr: e.target.value })} />
              </div>
              <p style={{ fontSize: 11, color: TK.textLight, marginTop: 6 }}>
                {isRTL ? 'المبلغ التقريبي:' : '≈ Amount:'} {computeMilestoneAmount(m.percentage, finalPrice).toLocaleString('en-US')} {pricing.currency || 'EGP'}
              </p>
            </div>
          ))}
          <p style={{ fontSize: 11, color: percentTotal === 100 ? TK.textLight : '#DC2626', marginTop: 4 }}>
            {isRTL ? 'إجمالي النسب:' : 'Total percentage:'} {percentTotal}% {percentTotal !== 100 && (isRTL ? '(يجب أن يساوي 100%)' : '(should total 100%)')}
          </p>
        </div>
      )}
    </div>
  );
};

export default StepPricing;
