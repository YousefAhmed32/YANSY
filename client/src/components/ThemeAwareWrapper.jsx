import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

export const useThemeAware = () => {
  const { isRTL, dir, language, toggleLanguage } = useLanguage();
  const { t } = useTranslation();

  const classes = {
    bg: {
      primary:      'bg-white',
      secondary:    'bg-[#FAFAFA]',
      surface:      'bg-[#F6F7F9]',
      surfaceHover: 'bg-[#F0F2F5]',
    },
    text: {
      primary:   'text-[#0D1117]',
      secondary: 'text-[#374151]',
      muted:     'text-[#6B7280]',
      tertiary:  'text-[#9CA3AF]',
    },
    border: {
      default: 'border-[#E8EBF0]',
      light:   'border-[#E8EBF0]',
      dark:    'border-[#C9CDD6]',
    },
    spacing: {
      x: isRTL ? 'space-x-reverse space-x-4' : 'space-x-4',
      y: 'space-y-4',
      margin:  { left: isRTL ? 'mr-' : 'ml-', right: isRTL ? 'ml-' : 'mr-' },
      padding: { left: isRTL ? 'pr-' : 'pl-', right: isRTL ? 'pl-' : 'pr-' },
    },
    flex: {
      row:       isRTL ? 'flex-row-reverse' : '',
      direction: isRTL ? 'flex-row-reverse' : 'flex-row',
    },
  };

  return { isDark: false, isRTL, dir, language, toggleLanguage, t, classes };
};
