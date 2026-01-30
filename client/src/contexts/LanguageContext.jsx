import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { applyLanguageDirection } from '../utils/rtl';

const LanguageContext = createContext(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  
  // Initialize language from localStorage (single source of truth)
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    if (saved && ['en', 'ar'].includes(saved)) {
      return saved;
    }
    // Fallback to i18n's current language (only on initial mount)
    const currentLang = i18n.language?.split('-')[0] || 'en';
    return ['en', 'ar'].includes(currentLang) ? currentLang : 'en';
  });

  // Ref to prevent sync loop - tracks if we're updating i18n internally
  const isUpdatingI18nRef = useRef(false);
  
  // Initialize: Sync i18n and DOM on mount (only once)
  useEffect(() => {
    // Update i18n to match our state
    if (i18n.language !== language) {
      isUpdatingI18nRef.current = true;
      i18n.changeLanguage(language).catch(console.error);
      isUpdatingI18nRef.current = false;
    }
    
    // Apply RTL/LTR direction
    applyLanguageDirection(language);
    
    // Ensure localStorage is set
    localStorage.setItem('language', language);
  }, []); // Empty deps - ONLY run on mount

  // Effect: Apply language changes to i18n and DOM
  // This runs when language state changes (user action)
  useEffect(() => {
    // Update i18n (skip if already updating to prevent loop)
    if (!isUpdatingI18nRef.current && i18n.language !== language) {
      isUpdatingI18nRef.current = true;
      i18n.changeLanguage(language).catch((err) => {
        console.error('Failed to change language:', err);
        isUpdatingI18nRef.current = false;
      });
      // Reset flag after a microtask to allow i18n to update
      Promise.resolve().then(() => {
        isUpdatingI18nRef.current = false;
      });
    }
    
    // Update DOM direction (always apply)
    applyLanguageDirection(language);
    
    // Save to localStorage (always save)
    localStorage.setItem('language', language);
  }, [language]); // Only depend on language state - NOT i18n object

  // Stable toggle function using functional update
  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  }, []);

  // Stable change function
  const changeLanguage = useCallback((newLang) => {
    if (!['en', 'ar'].includes(newLang)) {
      console.warn(`Invalid language: ${newLang}. Using 'en' instead.`);
      newLang = 'en';
    }
    setLanguage(newLang);
  }, []);

  // Derived values (computed from language, not separate state)
  const isRTL = language === 'ar';
  const isLTR = language === 'en';
  const dir = isRTL ? 'rtl' : 'ltr';

  // Memoize context value to prevent unnecessary re-renders
  // Only recreate when language actually changes
  const value = useMemo(() => ({
    language,
    changeLanguage,
    toggleLanguage,
    isRTL,
    isLTR,
    dir,
  }), [language, changeLanguage, toggleLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
