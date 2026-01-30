# Migration Pattern Guide

## Standard Migration Steps

### 1. Import Contexts
```jsx
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
```

### 2. Get Theme/Language Values
```jsx
const { isDark, resolvedTheme } = useTheme();
const { isRTL, dir, language } = useLanguage();
const { t } = useTranslation();
```

### 3. Replace Hardcoded Colors
```jsx
// Before
className="bg-black text-white"

// After
className={isDark ? 'bg-black text-white' : 'bg-white text-gray-900'}
```

### 4. Replace Hardcoded Text
```jsx
// Before
<h1>Welcome</h1>

// After
<h1>{t('dashboard.welcome', 'Welcome')}</h1>
```

### 5. Add RTL Support
```jsx
// Before
<div className="flex space-x-4">

// After
<div className={`flex ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`} dir={dir}>
```

### 6. Theme-Aware Classes Pattern
```jsx
const bgClass = isDark ? 'bg-black' : 'bg-white';
const textClass = isDark ? 'text-white/90' : 'text-gray-900';
const textMuted = isDark ? 'text-white/60' : 'text-gray-600';
const borderClass = isDark ? 'border-white/10' : 'border-gray-200';
const surfaceClass = isDark ? 'bg-white/5' : 'bg-black/5';
```

