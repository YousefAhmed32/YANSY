// RTL management utility
export const getLanguageDirection = (lang) => {
  return lang === 'ar' ? 'rtl' : 'ltr';
};

export const applyLanguageDirection = (lang) => {
  const direction = getLanguageDirection(lang);
  document.documentElement.setAttribute('dir', direction);
  document.documentElement.setAttribute('lang', lang);
  document.body.setAttribute('dir', direction); // ← أضف السطر ده

  if (lang === 'ar') {
    document.documentElement.classList.add('rtl');
  } else {
    document.documentElement.classList.remove('rtl');
  }
};

