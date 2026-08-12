import { TK } from '../../admin-ui';

const FormField = ({ label, required, children, hint }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: TK.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
      {label}{required && ' *'}
    </label>
    {children}
    {hint && <p style={{ fontSize: 11, color: TK.textLight, marginTop: 4 }}>{hint}</p>}
  </div>
);

export default FormField;
