import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { gsap } from 'gsap';

const LanguageSelector = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage, changeLanguage, isRTL } = useLanguage();
  const { isDark } = useTheme();
  
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Animate dropdown open/close
  useEffect(() => {
    if (!dropdownRef.current) return;

    if (isOpen) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, y: -10, scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        }
      );
    } else {
      gsap.to(dropdownRef.current, {
        opacity: 0,
        y: -10,
        scale: 0.95,
        duration: 0.2,
        ease: 'power2.in'
      });
    }
  }, [isOpen]);

  // Animate language label change
  useEffect(() => {
    if (triggerRef.current) {
      gsap.fromTo(
        triggerRef.current.querySelector('.language-label'),
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [language]);

  const handleLanguageSelect = (lang) => {
    if (lang !== language) {
      // Fade out current
      gsap.to(triggerRef.current?.querySelector('.language-label'), {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          changeLanguage(lang);
          setIsOpen(false);
        }
      });
    } else {
      setIsOpen(false);
    }
  };

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ar', label: 'Arabic', native: 'العربية' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const textColorMuted = isDark ? 'text-white/60' : 'text-gray-600';
  const textColorActive = isDark ? 'text-white' : 'text-gray-900';
  const bgColor = isDark ? 'bg-black' : 'bg-white';
  const borderColor = isDark ? 'border-white/20' : 'border-gray-200';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50';

  return (
    <div ref={containerRef} className="relative" dir="ltr">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-sm transition-all duration-300 group ${
          isDark 
            ? 'text-white/80 hover:text-white hover:bg-white/5' 
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
        }`}
        aria-label={t('common.toggleLanguage', 'Toggle language')}
        aria-expanded={isOpen}
      >
        <Globe className="w-4 h-4" />
        <span className="language-label text-xs font-light">
          {currentLanguage?.native || currentLanguage?.label}
        </span>
        <ChevronDown 
          className={`w-3 h-3 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute top-full mt-2 left-0 min-w-[140px] ${bgColor} ${borderColor} border rounded-sm shadow-lg overflow-hidden z-50`}
          style={{ opacity: 0 }}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-all duration-200 ${hoverBg} ${
                language === lang.code
                  ? textColorActive
                  : textColorMuted
              }`}
            >
              <span className={`text-xs font-light ${
                lang.code === 'ar' ? 'text-base' : ''
              }`}>
                {lang.native}
              </span>
              {language === lang.code && (
                <Check className="w-4 h-4 text-[#d4af37]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
