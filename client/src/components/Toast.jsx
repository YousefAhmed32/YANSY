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
          background: 'rgb(var(--bg-elevated))',
          color: 'rgb(var(--text-primary))',
          border: '1px solid rgb(var(--border))',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 500,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
          padding: '10px 16px',
          maxWidth: '380px',
        },
        success: {
          duration: 3000,
          iconTheme: { primary: 'rgb(var(--success))', secondary: '#fff' },
          style: {
            background: 'rgb(var(--success-light))',
            color: 'rgb(var(--success))',
            border: '1px solid rgb(var(--success) / 0.35)',
          },
        },
        error: {
          duration: 4000,
          iconTheme: { primary: 'rgb(var(--danger))', secondary: '#fff' },
          style: {
            background: 'rgb(var(--danger-light))',
            color: 'rgb(var(--danger))',
            border: '1px solid rgb(var(--danger) / 0.35)',
          },
        },
        loading: {
          iconTheme: { primary: 'rgb(var(--accent))', secondary: 'rgb(var(--accent-light))' },
          style: {
            background: 'rgb(var(--accent-light))',
            color: 'rgb(var(--accent-hover))',
            border: '1px solid rgb(var(--accent-muted))',
          },
        },
      }}
    />
  );
};

export default Toast;
