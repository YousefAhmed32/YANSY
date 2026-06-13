import { Toaster } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const Toast = () => {
  const { isDark } = useTheme();
  const { isRTL } = useLanguage();

  return (
    <Toaster
      position={isRTL ? 'top-left' : 'top-right'}
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options
        duration: 4000,
        className: isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900',
        style: {
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#ffffff' : '#111827',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        },
        // Success toast
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
          className: isDark 
            ? 'bg-green-900/20 text-green-400 border-green-800' 
            : 'bg-green-50 text-green-800 border-green-200',
          style: {
            background: isDark ? 'rgba(6, 78, 59, 0.2)' : '#f0fdf4',
            color: isDark ? '#4ade80' : '#166534',
            border: `1px solid ${isDark ? 'rgba(34, 197, 94, 0.3)' : '#86efac'}`,
          },
        },
        // Error toast
        error: {
          duration: 4000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
          className: isDark 
            ? 'bg-red-900/20 text-red-400 border-red-800' 
            : 'bg-red-50 text-red-800 border-red-200',
          style: {
            background: isDark ? 'rgba(127, 29, 29, 0.2)' : '#fef2f2',
            color: isDark ? '#f87171' : '#991b1b',
            border: `1px solid ${isDark ? 'rgba(248, 113, 113, 0.3)' : '#fca5a5'}`,
          },
        },
        // Loading toast
        loading: {
          iconTheme: {
            primary: '#d4af37',
            secondary: '#fff',
          },
          className: isDark 
            ? 'bg-gray-800 text-white' 
            : 'bg-white text-gray-900',
        },
      }}
    />
  );
};

export default Toast;
