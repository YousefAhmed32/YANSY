// Theme management utility
export const getThemePreference = () => {
  const saved = localStorage.getItem('theme');
  if (saved && ['light', 'dark'].includes(saved)) {
    return saved;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const initTheme = () => {
  const theme = getThemePreference();
  applyTheme(theme);
  return theme;
};

export const setTheme = (theme) => {
  localStorage.setItem('theme', theme);
  applyTheme(theme === 'auto' ? getThemePreference() : theme);
};

// Watch for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const saved = localStorage.getItem('theme');
    if (saved === 'auto' || !saved) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}

