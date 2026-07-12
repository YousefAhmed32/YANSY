import { Toaster } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

const Toast = () => {
  const { isRTL } = useLanguage();

  return (
    <Toaster
      position={isRTL ? 'top-left' : 'top-right'}
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#FFFFFF',
          color: '#0D1117',
          border: '1px solid #E8EBF0',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 500,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
          padding: '10px 16px',
          maxWidth: '380px',
        },
        success: {
          duration: 3000,
          iconTheme: { primary: '#10B981', secondary: '#fff' },
          style: {
            background: '#F0FDF4',
            color: '#166534',
            border: '1px solid #86EFAC',
          },
        },
        error: {
          duration: 4000,
          iconTheme: { primary: '#EF4444', secondary: '#fff' },
          style: {
            background: '#FEF2F2',
            color: '#991B1B',
            border: '1px solid #FECACA',
          },
        },
        loading: {
          iconTheme: { primary: '#2563EB', secondary: '#EFF6FF' },
          style: {
            background: '#EFF6FF',
            color: '#1D4ED8',
            border: '1px solid #DBEAFE',
          },
        },
      }}
    />
  );
};

export default Toast;
