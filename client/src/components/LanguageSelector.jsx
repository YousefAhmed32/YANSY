import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { gsap } from 'gsap';

const LanguageSelector = () => {
  const { t } = useTranslation();
  const { language, changeLanguage, isRTL } = useLanguage();
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

  // Close on ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
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
          ease: 'back.out(1.2)'
        }
      );
    }
  }, [isOpen]);

  // Animate language label change
  useEffect(() => {
    if (triggerRef.current) {
      const label = triggerRef.current.querySelector('.language-label');
      if (label) {
        gsap.fromTo(
          label,
          { opacity: 0, y: -5 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        );
      }
    }
  }, [language]);

  const handleLanguageSelect = (lang) => {
    if (lang !== language) {
      const label = triggerRef.current?.querySelector('.language-label');
      
      // Animate out current language
      if (label) {
        gsap.to(label, {
          opacity: 0,
          y: 5,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => {
            changeLanguage(lang);
            setIsOpen(false);
          }
        });
      } else {
        changeLanguage(lang);
        setIsOpen(false);
      }
    } else {
      setIsOpen(false);
    }
  };

  const languages = [
    { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'Arabic', native: 'العربية', flag: '🇸🇦' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  // Theme colors
  const colors = {
    textMuted: isDark ? 'text-white/60' : 'text-gray-600',
    textActive: isDark ? 'text-white' : 'text-gray-900',
    bg: isDark ? 'bg-black/95' : 'bg-white',
    bgHover: isDark ? 'hover:bg-white/10' : 'hover:bg-gray-50',
    border: isDark ? 'border-white/10' : 'border-gray-200',
    triggerBg: isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50',
    triggerBorder: isDark ? 'border-white/10' : 'border-gray-200',
    selectedBg: isDark ? 'bg-white/5' : 'bg-gray-100',
  };

  return (
    <div 
      ref={containerRef} 
      className="relative z-[200]" 
      dir="ltr"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`
          group relative
          flex items-center gap-2 
          px-3 sm:px-3.5 py-2 sm:py-2.5
          border ${colors.triggerBorder}
          rounded-lg
          transition-all duration-300
          ${isDark 
            ? 'text-white/80 hover:text-white hover:border-white/20' 
            : 'text-gray-700 hover:text-gray-900 hover:border-gray-300'
          }
          ${colors.triggerBg}
          active:scale-95
        `}
        aria-label={t('common.toggleLanguage', 'Toggle language')}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Globe Icon */}
        <Globe className={`
          w-4 h-4 
          transition-transform duration-300
          ${isOpen ? 'rotate-12 scale-110' : ''}
        `} />
        
        {/* Language Label */}
        <span className={`
          language-label 
          text-xs sm:text-sm 
          font-light 
          tracking-wide
          ${currentLanguage?.code === 'ar' ? 'font-normal' : ''}
        `}>
          <span className="hidden sm:inline">{currentLanguage?.native}</span>
          <span className="sm:hidden">{currentLanguage?.code.toUpperCase()}</span>
        </span>

        {/* Chevron Icon */}
        <ChevronDown 
          className={`
            w-3 h-3 sm:w-3.5 sm:h-3.5
            transition-transform duration-300
            ${isOpen ? 'rotate-180' : ''}
          `}
        />

        {/* Active Indicator */}
        <span className={`
          absolute -bottom-0.5 left-1/2 -translate-x-1/2
          w-0 h-0.5 bg-[#d4af37]
          transition-all duration-300
          ${isOpen ? 'w-3/4' : 'w-0'}
        `} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={dropdownRef}
            className={`
              absolute top-full mt-2 
              ${isRTL ? 'right-0' : 'left-0'}
              min-w-[160px] sm:min-w-[180px]
              ${colors.bg} 
              ${colors.border} border
              rounded-lg
              shadow-2xl
              overflow-hidden 
              z-[300]
              backdrop-blur-xl
            `}
            style={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`
              px-4 py-3 
              ${colors.border} border-b
              ${isDark ? 'bg-white/5' : 'bg-gray-50'}
            `}>
              <p className={`
                text-xs 
                ${colors.textMuted} 
                uppercase 
                tracking-wider 
                font-light
              `}>
                {t('common.language', 'Language')}
              </p>
            </div>

            {/* Language Options */}
            <div className="py-1">
              {languages.map((lang, index) => {
                const isSelected = language === lang.code;
                
                return (
                  <button
                    key={lang.code}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLanguageSelect(lang.code);
                    }}
                    className={`
                      w-full 
                      flex items-center justify-between gap-3
                      px-4 py-3
                      text-left 
                      transition-all duration-200
                      ${colors.bgHover}
                      ${isSelected ? colors.selectedBg : ''}
                      ${isSelected ? colors.textActive : colors.textMuted}
                      group
                      relative
                      ${index === 0 ? '' : `${colors.border} border-t`}
                    `}
                  >
                    {/* Left side: Flag + Text */}
                    <div className="flex items-center gap-3">
                      {/* Flag Emoji */}
                      <span className="text-lg sm:text-xl">
                        {lang.flag}
                      </span>
                      
                      {/* Language Info */}
                      <div className="flex flex-col">
                        <span className={`
                          text-sm sm:text-base
                          font-light
                          ${lang.code === 'ar' ? 'font-normal' : ''}
                          transition-all duration-200
                          ${isSelected ? 'font-medium' : ''}
                        `}>
                          {lang.native}
                        </span>
                        <span className={`
                          text-xs 
                          ${isDark ? 'text-white/40' : 'text-gray-400'}
                          transition-opacity duration-200
                          ${isSelected ? 'opacity-100' : 'opacity-60'}
                        `}>
                          {lang.label}
                        </span>
                      </div>
                    </div>

                    {/* Right side: Check Icon */}
                    <div className={`
                      flex items-center justify-center
                      w-5 h-5 sm:w-6 sm:h-6
                      rounded-full
                      transition-all duration-300
                      ${isSelected 
                        ? 'bg-[#d4af37] scale-100' 
                        : 'bg-transparent scale-0'
                      }
                    `}>
                      {isSelected && (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                      )}
                    </div>

                    {/* Hover Indicator */}
                    <span className={`
                      absolute left-0 top-0 bottom-0
                      w-1 bg-[#d4af37]
                      transition-all duration-300
                      ${isSelected 
                        ? 'opacity-100' 
                        : 'opacity-0 group-hover:opacity-50'
                      }
                    `} />
                  </button>
                );
              })}
            </div>

            {/* Footer Hint (Optional) */}
            <div className={`
              px-4 py-2.5 
              ${colors.border} border-t
              ${isDark ? 'bg-white/5' : 'bg-gray-50'}
            `}>
              <p className={`
                text-xs 
                ${isDark ? 'text-white/40' : 'text-gray-400'}
                text-center
              `}>
                Press ESC to close
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;