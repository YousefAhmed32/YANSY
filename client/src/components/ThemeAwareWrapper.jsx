/**
 * ThemeAwareWrapper - Reusable wrapper component
 * Provides theme and language context to any component
 * Use this as a template for migrating components
 */

import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

/**
 * Hook to get all theme and language utilities
 * Use this in any component for consistent theming
 */
export const useThemeAware = () => {
  const { isDark, resolvedTheme, toggleTheme } = useTheme();
  const { isRTL, dir, language, toggleLanguage } = useLanguage();
  const { t } = useTranslation();

  // Theme-aware classes
  const classes = {
    bg: {
      primary: isDark ? 'bg-black' : 'bg-white',
      secondary: isDark ? 'bg-gray-900' : 'bg-gray-50',
      surface: isDark ? 'bg-white/5' : 'bg-black/5',
      surfaceHover: isDark ? 'bg-white/10' : 'bg-black/10',
    },
    text: {
      primary: isDark ? 'text-white/90' : 'text-gray-900',
      secondary: isDark ? 'text-white/70' : 'text-gray-700',
      muted: isDark ? 'text-white/60' : 'text-gray-600',
      tertiary: isDark ? 'text-white/50' : 'text-gray-500',
    },
    border: {
      default: isDark ? 'border-white/10' : 'border-gray-200',
      light: isDark ? 'border-white/20' : 'border-gray-300',
      dark: isDark ? 'border-white/30' : 'border-gray-400',
    },
    spacing: {
      x: isRTL ? 'space-x-reverse space-x-4' : 'space-x-4',
      y: 'space-y-4',
      margin: {
        left: isRTL ? 'mr-' : 'ml-',
        right: isRTL ? 'ml-' : 'mr-',
      },
      padding: {
        left: isRTL ? 'pr-' : 'pl-',
        right: isRTL ? 'pl-' : 'pr-',
      },
    },
    flex: {
      row: isRTL ? 'flex-row-reverse' : '',
      direction: isRTL ? 'flex-row-reverse' : 'flex-row',
    },
  };

  return {
    // Theme
    isDark,
    resolvedTheme,
    toggleTheme,
    // Language
    isRTL,
    dir,
    language,
    toggleLanguage,
    // Translation
    t,
    // Classes
    classes,
  };
};

/**
 * Example usage:
 * 
 * const MyComponent = () => {
 *   const { isDark, isRTL, dir, t, classes } = useThemeAware();
 *   
 *   return (
 *     <div className={`${classes.bg.primary} ${classes.text.primary}`} dir={dir}>
 *       <h1>{t('common.welcome', 'Welcome')}</h1>
 *       <div className={`flex ${classes.flex.row} ${classes.spacing.x}`}>
 *         <span>Item 1</span>
 *         <span>Item 2</span>
 *       </div>
 *     </div>
 *   );
 * };
 */

