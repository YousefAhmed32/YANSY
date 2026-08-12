import { TextInput, Select, Button } from '../../admin-ui';
import FormField from './FormField';
import { YANSY_DEFAULT_BRANDING } from './brandingDefaults';

const coverStyleOptions = (isRTL) => [
  { value: 'light', label: isRTL ? 'فاتح' : 'Light' },
  { value: 'dark', label: isRTL ? 'داكن' : 'Dark' },
];

const colorInputStyle = { width: 44, height: 36, padding: 2, border: '1px solid #E8EBF0', borderRadius: 8, cursor: 'pointer', flexShrink: 0 };

const StepBranding = ({ branding, onChange, isRTL }) => {
  const set = (patch) => onChange({ ...branding, ...patch });

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Button size="sm" variant="secondary" onClick={() => onChange({ ...YANSY_DEFAULT_BRANDING })}>
          {isRTL ? 'استخدام هوية YANSY الافتراضية' : 'Reset to YANSY defaults'}
        </Button>
      </div>

      <FormField label={isRTL ? 'رابط الشعار' : 'Logo URL'}>
        <TextInput value={branding.logoUrl || ''} onChange={(e) => set({ logoUrl: e.target.value })} placeholder="/assets/image/logo/logo-2.png" />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FormField label={isRTL ? 'اللون الأساسي' : 'Primary Color'}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" style={colorInputStyle} value={branding.primaryColor || '#2563EB'} onChange={(e) => set({ primaryColor: e.target.value })} />
            <TextInput value={branding.primaryColor || ''} onChange={(e) => set({ primaryColor: e.target.value })} />
          </div>
        </FormField>
        <FormField label={isRTL ? 'اللون الثانوي' : 'Accent Color'}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" style={colorInputStyle} value={branding.accentColor || '#A98A52'} onChange={(e) => set({ accentColor: e.target.value })} />
            <TextInput value={branding.accentColor || ''} onChange={(e) => set({ accentColor: e.target.value })} />
          </div>
        </FormField>
      </div>

      <FormField label={isRTL ? 'نمط الغلاف' : 'Cover Style'}>
        <Select value={branding.coverStyle || 'light'} onChange={(e) => set({ coverStyle: e.target.value })} options={coverStyleOptions(isRTL)} />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FormField label={isRTL ? 'نص التذييل' : 'Footer Text'}>
          <TextInput value={branding.footerText || ''} onChange={(e) => set({ footerText: e.target.value })} />
        </FormField>
        <FormField label={isRTL ? 'نص التذييل (عربي)' : 'Footer Text (Arabic)'}>
          <TextInput dir="rtl" value={branding.footerTextAr || ''} onChange={(e) => set({ footerTextAr: e.target.value })} />
        </FormField>
      </div>

      <FormField label={isRTL ? 'البريد الإلكتروني للتواصل' : 'Contact Email'}>
        <TextInput value={branding.contactEmail || ''} onChange={(e) => set({ contactEmail: e.target.value })} />
      </FormField>
      <FormField label={isRTL ? 'رقم الهاتف / واتساب' : 'Contact Phone / WhatsApp'}>
        <TextInput value={branding.contactPhone || ''} onChange={(e) => set({ contactPhone: e.target.value })} placeholder="+201090385390" />
      </FormField>
      <FormField label={isRTL ? 'الموقع الإلكتروني' : 'Website'}>
        <TextInput value={branding.contactWebsite || ''} onChange={(e) => set({ contactWebsite: e.target.value })} placeholder="yansytech.com" />
      </FormField>
    </div>
  );
};

export default StepBranding;
