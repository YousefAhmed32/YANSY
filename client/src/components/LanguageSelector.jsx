import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Globe, Check, ChevronDown, X } from 'lucide-react';
import { gsap } from 'gsap';

const LanguageSelector = () => {
  const { t } = useTranslation();
  const { language, changeLanguage, isRTL } = useLanguage();
  const { isDark } = useTheme();

  const [isOpen, setIsOpen]       = useState(false);
  const [isMobile, setIsMobile]   = useState(false);

  const containerRef   = useRef(null);
  const dropdownRef    = useRef(null);
  const sheetRef       = useRef(null);
  const overlayRef     = useRef(null);
  const triggerRef     = useRef(null);

  // ── Detect mobile ──────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Body scroll lock ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isMobile]);

  // ── Outside click (desktop only) ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || isMobile) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, isMobile]);

  // ── ESC key ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') closeMenu(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  // ── Animate desktop dropdown open ─────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || isMobile || !dropdownRef.current) return;
    gsap.fromTo(
      dropdownRef.current,
      { opacity: 0, y: -8, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'power3.out' }
    );
  }, [isOpen, isMobile]);

  // ── Animate mobile bottom sheet open ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !isMobile) return;
    if (overlayRef.current) {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
    if (sheetRef.current) {
      gsap.fromTo(sheetRef.current,
        { y: '100%' },
        { y: '0%', duration: 0.4, ease: 'power3.out' }
      );
    }
  }, [isOpen, isMobile]);

  // ── Language label animation ───────────────────────────────────────────────
  useEffect(() => {
    const label = triggerRef.current?.querySelector('.lang-label');
    if (label) {
      gsap.fromTo(label,
        { opacity: 0, y: -4 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [language]);

  const closeDropdown = () => {
    if (!dropdownRef.current) { setIsOpen(false); return; }
    gsap.to(dropdownRef.current, {
      opacity: 0, y: -6, scale: 0.97,
      duration: 0.18, ease: 'power2.in',
      onComplete: () => setIsOpen(false),
    });
  };

  const closeSheet = (cb) => {
    const done = () => { setIsOpen(false); cb?.(); };
    if (sheetRef.current) {
      gsap.to(sheetRef.current, { y: '100%', duration: 0.3, ease: 'power3.in', onComplete: done });
      if (overlayRef.current) gsap.to(overlayRef.current, { opacity: 0, duration: 0.3 });
    } else {
      done();
    }
  };

  const closeMenu = () => isMobile ? closeSheet() : closeDropdown();

  const handleSelect = (lang) => {
    if (lang === language) { closeMenu(); return; }
    const label = triggerRef.current?.querySelector('.lang-label');
    const doChange = () => { changeLanguage(lang); };
    if (label) {
      gsap.to(label, {
        opacity: 0, y: 4, duration: 0.15, ease: 'power2.in',
        onComplete: () => { doChange(); isMobile ? closeSheet() : closeDropdown(); },
      });
    } else {
      doChange();
      closeMenu();
    }
  };

  const languages = [
    { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'Arabic',  native: 'العربية', flag: '🇸🇦' },
  ];

  const current = languages.find(l => l.code === language);

  // ── Theme tokens ───────────────────────────────────────────────────────────
  const tk = {
    bg:          isDark ? '#0a0a0a'               : '#ffffff',
    border:      isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    textMuted:   isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
    textMain:    isDark ? '#ffffff'               : '#0a0a0a',
    rowHover:    isDark ? 'rgba(255,255,255,0.05)': 'rgba(0,0,0,0.04)',
    selectedBg:  isDark ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.07)',
    subText:     isDark ? 'rgba(255,255,255,0.35)': 'rgba(0,0,0,0.35)',
    triggerBorder: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)',
    sheetHandle: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
  };

  // ── Shared language option row ─────────────────────────────────────────────
  const LangOption = ({ lang }) => {
    const selected = language === lang.code;
    return (
      <button
        onClick={(e) => { e.stopPropagation(); handleSelect(lang.code); }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: isMobile ? '16px 20px' : '12px 16px',
          background: selected ? tk.selectedBg : 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.2s',
          position: 'relative',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = tk.rowHover; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = selected ? tk.selectedBg : 'transparent'; }}
      >
        {/* Left accent bar */}
        <span style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: '2px',
          background: '#2563EB',
          opacity: selected ? 1 : 0,
          transition: 'opacity 0.2s',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: isMobile ? '1.5rem' : '1.25rem', lineHeight: 1 }}>{lang.flag}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{
              fontSize: isMobile ? '1rem' : '0.875rem',
              fontWeight: selected ? 500 : 300,
              color: selected ? tk.textMain : tk.textMuted,
              letterSpacing: '0.01em',
              transition: 'color 0.2s, font-weight 0.2s',
            }}>
              {lang.native}
            </span>
            <span style={{ fontSize: '0.7rem', color: tk.subText, letterSpacing: '0.05em' }}>
              {lang.label}
            </span>
          </div>
        </div>

        {/* Check circle */}
        <div style={{
          width: isMobile ? '22px' : '18px',
          height: isMobile ? '22px' : '18px',
          borderRadius: '50%',
          background: selected ? '#2563EB' : 'transparent',
          border: selected ? 'none' : `1px solid ${tk.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.25s',
        }}>
          {selected && <Check style={{ width: '10px', height: '10px', color: '#000' }} />}
        </div>
      </button>
    );
  };

  return (
    <>
      {/* ── Trigger ─────────────────────────────────────────────────────────── */}
      <div ref={containerRef} style={{ position: 'relative', zIndex: 200 }} dir="ltr">
        <button
          ref={triggerRef}
          onClick={(e) => { e.stopPropagation(); isOpen ? closeMenu() : setIsOpen(true); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: 'transparent',
            border: `1px solid ${isOpen ? 'rgba(37,99,235,0.5)' : tk.triggerBorder}`,
            borderRadius: '6px',
            cursor: 'pointer',
            color: isOpen ? '#2563EB' : tk.textMuted,
            transition: 'all 0.25s',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#2563EB';
            e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)';
          }}
          onMouseLeave={(e) => {
            if (!isOpen) {
              e.currentTarget.style.color = tk.textMuted;
              e.currentTarget.style.borderColor = tk.triggerBorder;
            }
          }}
          aria-label={t('common.toggleLanguage', 'Toggle language')}
          aria-expanded={isOpen}
        >
          <Globe style={{ width: '15px', height: '15px', transition: 'transform 0.3s', transform: isOpen ? 'rotate(15deg)' : 'none' }} />
          <span className="lang-label" style={{ fontSize: '11px', letterSpacing: '0.15em', fontWeight: 300, whiteSpace: 'nowrap' }}>
            {/* Mobile: show code, Desktop: show native name */}
            <span className="hidden sm:inline">{current?.native}</span>
            <span className="sm:hidden">{current?.code?.toUpperCase()}</span>
          </span>
          <ChevronDown style={{ width: '12px', height: '12px', transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />

          {/* Gold underline */}
          <span style={{
            position: 'absolute', bottom: '-1px', left: '50%', transform: 'translateX(-50%)',
            height: '1px', background: '#2563EB',
            width: isOpen ? '60%' : '0%',
            transition: 'width 0.3s ease',
          }} />
        </button>

        {/* ── Desktop Dropdown ──────────────────────────────────────────────── */}
        {isOpen && !isMobile && (
          <div
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              [isRTL ? 'right' : 'left']: 0,
              minWidth: '190px',
              background: tk.bg,
              border: `1px solid ${tk.border}`,
              borderRadius: '8px',
              boxShadow: isDark
                ? '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(37,99,235,0.08)'
                : '0 20px 60px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              opacity: 0,
              zIndex: 300,
            }}
          >
            {/* Header */}
            <div style={{
              padding: '10px 16px 8px',
              borderBottom: `1px solid ${tk.border}`,
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            }}>
              <p style={{ fontSize: '9px', letterSpacing: '0.25em', color: 'rgba(37,99,235,0.7)', textTransform: 'uppercase' }}>
                {t('common.language', 'Language')}
              </p>
            </div>

            {/* Options */}
            <div>
              {languages.map((lang, i) => (
                <div key={lang.code} style={{ borderTop: i > 0 ? `1px solid ${tk.border}` : 'none' }}>
                  <LangOption lang={lang} />
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              padding: '7px 16px',
              borderTop: `1px solid ${tk.border}`,
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '9px', color: tk.subText, letterSpacing: '0.1em' }}>Press ESC to close</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Bottom Sheet (Portal-style fixed) ─────────────────────────── */}
      {isOpen && isMobile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }} dir="ltr">
          {/* Overlay */}
          <div
            ref={overlayRef}
            onClick={() => closeSheet()}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              opacity: 0,
            }}
          />

          {/* Sheet */}
          <div
            ref={sheetRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: tk.bg,
              borderRadius: '20px 20px 0 0',
              borderTop: `1px solid ${tk.border}`,
              boxShadow: isDark
                ? '0 -20px 60px rgba(0,0,0,0.9), 0 -1px 0 rgba(37,99,235,0.15)'
                : '0 -20px 60px rgba(0,0,0,0.15)',
              transform: 'translateY(100%)',
              overflow: 'hidden',
            }}
          >
            {/* Handle bar */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: tk.sheetHandle }} />
            </div>

            {/* Sheet header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px 14px',
              borderBottom: `1px solid ${tk.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe style={{ width: '16px', height: '16px', color: '#2563EB' }} />
                <span style={{
                  fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase',
                  color: 'rgba(37,99,235,0.8)', fontWeight: 300,
                }}>
                  {t('common.language', 'Language')}
                </span>
              </div>
              <button
                onClick={() => closeSheet()}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  border: 'none', cursor: 'pointer', color: tk.textMuted,
                }}
              >
                <X style={{ width: '14px', height: '14px' }} />
              </button>
            </div>

            {/* Options */}
            <div style={{ padding: '8px 0' }}>
              {languages.map((lang, i) => (
                <div key={lang.code} style={{ borderTop: i > 0 ? `1px solid ${tk.border}` : 'none' }}>
                  <LangOption lang={lang} />
                </div>
              ))}
            </div>

            {/* Safe area spacer */}
            <div style={{ height: '24px' }} />
          </div>
        </div>
      )}
    </>
  );
};

export default LanguageSelector;