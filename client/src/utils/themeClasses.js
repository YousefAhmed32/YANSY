/**
 * Theme-aware class utilities
 * Provides helper functions to get theme-aware Tailwind classes
 */

/**
 * Get theme-aware background classes
 */
export const getBgClasses = (isDark) => ({
  primary: isDark ? 'bg-black' : 'bg-white',
  secondary: isDark ? 'bg-gray-900' : 'bg-gray-50',
  tertiary: isDark ? 'bg-gray-800' : 'bg-gray-100',
  surface: isDark ? 'bg-white/5' : 'bg-black/5',
  surfaceElevated: isDark ? 'bg-white/10' : 'bg-black/10',
  surfaceHover: isDark ? 'bg-white/15' : 'bg-black/15',
});

/**
 * Get theme-aware text classes
 */
export const getTextClasses = (isDark) => ({
  primary: isDark ? 'text-white/90' : 'text-gray-900',
  secondary: isDark ? 'text-white/70' : 'text-gray-700',
  tertiary: isDark ? 'text-white/50' : 'text-gray-500',
  muted: isDark ? 'text-white/60' : 'text-gray-600',
  inverse: isDark ? 'text-black' : 'text-white',
});

/**
 * Get theme-aware border classes
 */
export const getBorderClasses = (isDark) => ({
  default: isDark ? 'border-white/10' : 'border-gray-200',
  light: isDark ? 'border-white/5' : 'border-gray-100',
  dark: isDark ? 'border-white/20' : 'border-gray-300',
  hover: isDark ? 'border-white/40' : 'border-gray-400',
});

/**
 * Get combined theme classes for common patterns
 */
export const getThemeClasses = (isDark) => ({
  card: {
    base: `${getBgClasses(isDark).surface} ${getBorderClasses(isDark).default} border`,
    hover: `${getBgClasses(isDark).surfaceHover} ${getBorderClasses(isDark).hover}`,
  },
  button: {
    primary: isDark 
      ? 'bg-gold text-black hover:bg-gold/90' 
      : 'bg-gold text-black hover:bg-gold/90',
    secondary: isDark
      ? `${getBorderClasses(isDark).default} border ${getTextClasses(isDark).primary} hover:${getBgClasses(isDark).surface}`
      : `${getBorderClasses(isDark).default} border ${getTextClasses(isDark).primary} hover:${getBgClasses(isDark).surface}`,
    ghost: isDark
      ? `${getTextClasses(isDark).muted} hover:${getTextClasses(isDark).primary}`
      : `${getTextClasses(isDark).muted} hover:${getTextClasses(isDark).primary}`,
  },
  input: {
    base: `${getBgClasses(isDark).surface} ${getBorderClasses(isDark).default} border-b ${getTextClasses(isDark).primary} placeholder:${getTextClasses(isDark).tertiary} focus:border-gold`,
  },
});

