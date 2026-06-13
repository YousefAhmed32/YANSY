import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { applyTheme } from '../utils/theme';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

/**
 * Get system theme preference
 */
const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
};

/**
 * Resolve theme mode to actual theme
 * 'auto' -> system preference
 * 'light'/'dark' -> that theme
 */
const resolveTheme = (theme) => {
  if (theme === 'auto') {
    return getSystemTheme();
  }
  return theme;
};

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage (single source of truth)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved && ['light', 'dark', 'auto'].includes(saved)) {
      return saved;
    }
    return 'auto';
  });

  // Resolved theme is computed (derived value, not state)
  const resolvedTheme = resolveTheme(theme);

  // Initialize: Apply theme on mount (only once)
  useEffect(() => {
    const initialResolved = resolveTheme(theme);
    applyTheme(initialResolved);
    localStorage.setItem('theme', theme);
  }, []); // Empty deps - ONLY run on mount

  // Effect: Apply theme changes to DOM and localStorage
  // Runs when theme state changes (user action)
  useEffect(() => {
    const resolved = resolveTheme(theme);
    applyTheme(resolved);
    localStorage.setItem('theme', theme);
  }, [theme]); // Only depend on theme state

  // Watch for system theme changes when in auto mode
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // When system theme changes and we're in auto mode,
      // update DOM directly without changing state
      // (state stays 'auto', but resolved theme changes)
      const newResolved = e.matches ? 'dark' : 'light';
      applyTheme(newResolved);
    };

    try {
      mediaQuery.addEventListener('change', handleChange);
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } catch (error) {
      console.error('Failed to setup theme listener:', error);
      return () => {};
    }
  }, [theme]); // Re-setup listener when theme mode changes

  // Stable change function
  const changeTheme = useCallback((newTheme) => {
    if (!['light', 'dark', 'auto'].includes(newTheme)) {
      console.warn(`Invalid theme: ${newTheme}. Using 'auto' instead.`);
      newTheme = 'auto';
    }
    setTheme(newTheme);
  }, []);

  // Stable toggle function using functional update
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const themes = ['light', 'dark', 'auto'];
      const currentIndex = themes.indexOf(prev);
      return themes[(currentIndex + 1) % themes.length];
    });
  }, []);

  // Derived values (computed from resolvedTheme)
  const isDark = resolvedTheme === 'dark';
  const isLight = resolvedTheme === 'light';

  // Memoize context value to prevent unnecessary re-renders
  // Only recreate when theme or resolvedTheme actually changes
  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    changeTheme,
    toggleTheme,
    isDark,
    isLight,
  }), [theme, resolvedTheme, changeTheme, toggleTheme, isDark, isLight]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
