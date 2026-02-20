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
  
  // Initialize language — localStorage أولاً، بعدين المتصفح، بعدين 'en'
  const [language, setLanguage] = useState(() => {
    // 1. لو المستخدم اختار قبل كده — احترم اختياره
    const saved = localStorage.getItem('language');
    if (saved && ['en', 'ar'].includes(saved)) {
      return saved;
    }

    // 2. أول مرة — شيل من المتصفح مباشرة
    const browserLang = navigator.language || navigator.languages?.[0] || 'en';
    const detected = browserLang.startsWith('ar') ? 'ar' : 'en';
    return detected;
  });

  // Ref to prevent sync loop
  const isUpdatingI18nRef = useRef(false);
  
  // Initialize: Sync i18n and DOM on mount (only once)
  useEffect(() => {
    if (i18n.language !== language) {
      isUpdatingI18nRef.current = true;
      i18n.changeLanguage(language).catch(console.error);
      isUpdatingI18nRef.current = false;
    }
    applyLanguageDirection(language);
    localStorage.setItem('language', language);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect: Apply language changes to i18n and DOM
  useEffect(() => {
    if (!isUpdatingI18nRef.current && i18n.language !== language) {
      isUpdatingI18nRef.current = true;
      i18n.changeLanguage(language).catch((err) => {
        console.error('Failed to change language:', err);
        isUpdatingI18nRef.current = false;
      });
      Promise.resolve().then(() => {
        isUpdatingI18nRef.current = false;
      });
    }
    applyLanguageDirection(language);
    localStorage.setItem('language', language);
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stable toggle function
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

  // Derived values
  const isRTL = language === 'ar';
  const isLTR = language === 'en';
  const dir   = isRTL ? 'rtl' : 'ltr';

  const value = useMemo(() => ({
    language,
    changeLanguage,
    toggleLanguage,
    isRTL,
    isLTR,
    dir,
  }), [language, changeLanguage, toggleLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};