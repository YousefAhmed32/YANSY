import { createContext, useContext, useMemo } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

// Light-only: ThemeContext is kept for API compatibility with existing components
// that import useTheme, but isDark is always false.
export const ThemeProvider = ({ children }) => {
  const value = useMemo(() => ({
    theme:         'light',
    resolvedTheme: 'light',
    isDark:        false,
    isLight:       true,
    changeTheme:   () => {},
    toggleTheme:   () => {},
  }), []);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
