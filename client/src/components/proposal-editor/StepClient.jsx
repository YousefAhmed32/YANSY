import RelationPicker from '../portfolio-wizard/RelationPicker';
import FormField from './FormField';

/**
 * Step 1 — Client. Reuses the same search-as-you-type + inline "+ New"
 * RelationPicker every other content-library field in the admin already
 * uses (see AdminLibrary.jsx), pointed at the proposal-specific
 * `/proposal-clients` library instead of the portfolio-CMS `/clients` one.
 */
const StepClient = ({ value, onChange, isRTL }) => (
  <div>
    <FormField label={isRTL ? 'العميل' : 'Client'} required hint={isRTL ? 'اختر عميلاً موجودًا أو أنشئ عميلاً جديدًا مباشرة من هنا' : 'Pick an existing client or create a new one inline'}>
      <RelationPicker
        apiBase="/proposal-clients"
        value={value}
        onChange={onChange}
        multiple={false}
        allowCreate
        hasAvatar={false}
        placeholder={isRTL ? 'اختر عميلاً أو أنشئ عميلاً جديدًا…' : 'Select or create a client…'}
        createTitle={{ en: 'New client', ar: 'عميل جديد' }}
        quickCreateFields={[
          { key: 'name', label: 'Name', labelAr: 'الاسم', required: true },
          { key: 'company', label: 'Company', labelAr: 'الشركة' },
          { key: 'email', label: 'Email', labelAr: 'البريد الإلكتروني' },
          { key: 'phone', label: 'Phone', labelAr: 'الهاتف' },
          { key: 'whatsapp', label: 'WhatsApp', labelAr: 'واتساب' },
          { key: 'country', label: 'Country', labelAr: 'الدولة' },
          { key: 'city', label: 'City', labelAr: 'المدينة' },
          { key: 'notes', label: 'Notes', labelAr: 'ملاحظات', multiline: true },
        ]}
      />
    </FormField>
  </div>
);

export default StepClient;
