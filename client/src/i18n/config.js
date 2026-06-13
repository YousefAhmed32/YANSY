import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      ar: {
        translation: arTranslations,
      },
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // الترتيب: localStorage الأول — لو محفوظ خد منه
      // navigator تاني  — أول مرة خد من المتصفح
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      // بنحول ar-SA / ar-EG وغيره لـ ar
      convertDetectedLanguage: (lng) => {
        if (lng.startsWith('ar')) return 'ar';
        return 'en';
      },
    },
  });

export default i18n;