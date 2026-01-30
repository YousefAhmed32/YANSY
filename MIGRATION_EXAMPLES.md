# Complete Migration Examples

## ✅ Fully Migrated Components

### 1. ProjectRequests.jsx
**Status:** ✅ Complete
- Theme-aware colors
- Full i18n translations
- RTL layout support
- Theme switching works
- Language switching works

### 2. Dashboard.jsx
**Status:** ✅ Complete
- Theme-aware colors
- Full i18n translations
- RTL layout support
- Dynamic welcome message
- Theme switching works

### 3. Login.jsx
**Status:** ✅ Complete
- Theme-aware colors
- Full i18n translations
- RTL layout support
- Form inputs theme-aware
- Theme switching works

### 4. Footer.jsx
**Status:** ✅ Complete
- Theme-aware colors
- Full i18n translations
- RTL layout support
- Links respect RTL
- Theme switching works

---

## 📋 Migration Checklist Template

Use this checklist for each component:

```markdown
## Component Name

### Imports Added
- [ ] useTheme from ThemeContext
- [ ] useLanguage from LanguageContext
- [ ] useTranslation from react-i18next

### Theme Integration
- [ ] Theme-aware classes defined
- [ ] bgClass, textClass, surfaceClass, etc.
- [ ] All hardcoded colors replaced
- [ ] Root element has bgClass and textClass
- [ ] Transitions added (duration-300)

### Language Integration
- [ ] All hardcoded text replaced with t()
- [ ] Translation keys added to en.json
- [ ] Translation keys added to ar.json
- [ ] dir={dir} added to root element

### RTL Support
- [ ] Spacing utilities respect RTL (ml-5 vs mr-5)
- [ ] Flex directions respect RTL (flex-row-reverse)
- [ ] Icons flip directionally
- [ ] Text alignment respects RTL
- [ ] space-x-reverse used where needed

### Testing
- [ ] Theme toggle works
- [ ] Language toggle works
- [ ] RTL layout correct
- [ ] No visual glitches
- [ ] No text overflow
- [ ] Responsive design maintained
```

---

## 🎯 Quick Reference

### Theme Classes Pattern
```jsx
const bgClass = isDark ? 'bg-black' : 'bg-white';
const textClass = isDark ? 'text-white/90' : 'text-gray-900';
const textMuted = isDark ? 'text-white/60' : 'text-gray-600';
const surfaceClass = isDark ? 'bg-white/5' : 'bg-black/5';
const borderClass = isDark ? 'border-white/10' : 'border-gray-200';
```

### RTL Spacing Pattern
```jsx
// Margin
className={`${isRTL ? 'mr-5' : 'ml-5'}`}

// Padding
className={`${isRTL ? 'pr-4' : 'pl-4'}`}

// Flex
className={`flex ${isRTL ? 'flex-row-reverse' : ''}`}

// Space utilities
className={`${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}
```

### Translation Pattern
```jsx
// Simple text
{t('key', 'Fallback')}

// With interpolation
{t('key', 'Hello {name}', { name: userName })}

// Nested keys
{t('section.subsection.key', 'Fallback')}
```

---

## 🚀 Next Steps

1. **Migrate remaining pages** using the pattern from ProjectRequests, Dashboard, Login
2. **Migrate remaining components** using Footer as reference
3. **Add missing translations** as you migrate
4. **Test thoroughly** - theme toggle, language toggle, RTL layout
5. **Verify responsiveness** in both themes and languages

---

**Foundation Complete | Ready for Full Migration**

