import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';

/**
 * AppProviders - Centralized provider wrapper
 * Wraps the entire app with theme and language providers
 */
export const AppProviders = ({ children }) => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </ThemeProvider>
  );
};

