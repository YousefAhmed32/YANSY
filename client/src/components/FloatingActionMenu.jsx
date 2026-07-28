import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Sparkles, ArrowUp } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { trackWhatsAppClick, trackCTAClick } from '../utils/ga4';
import { trackContact } from '../utils/metaPixel';
import { floatingAlign, floatingCornerStyle } from '../constants/floatingUi';

const WA_URL = 'https://wa.me/201090385390';

const WhatsAppGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const CSS = `
  .fab-main {
    width: 56px; height: 56px; border-radius: 50%;
    background: #FFFFFF; border: 1px solid #E8EBF0;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; padding: 0; color: #111827; flex-shrink: 0;
    box-shadow: 0 8px 28px rgba(13,17,23,0.14), 0 2px 8px rgba(13,17,23,0.06);
    transition: transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s cubic-bezier(.34,1.56,.64,1),
                border-color .25s ease, color .25s ease;
  }
  .fab-main:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(13,17,23,0.18), 0 3px 10px rgba(13,17,23,0.08); }
  .fab-main[aria-expanded="true"] {
    border-color: rgba(37,99,235,.35);
    color: #2563EB;
    box-shadow: 0 8px 28px rgba(37,99,235,0.18), 0 2px 8px rgba(37,99,235,0.08);
  }
  .fab-main-icon { display: block; transition: transform .3s cubic-bezier(.34,1.56,.64,1); }

  .fab-item {
    display: flex; align-items: center; gap: 10px;
    height: 48px; padding-inline-start: 6px; padding-inline-end: 16px;
    background: #FFFFFF; border: 1px solid #E8EBF0; border-radius: 999px;
    cursor: pointer; white-space: nowrap; margin: 0;
    box-shadow: 0 4px 20px rgba(13,17,23,0.10), 0 1px 4px rgba(13,17,23,0.05);
    opacity: 0; transform: translateY(10px) scale(.94); pointer-events: none;
    transition: opacity .28s cubic-bezier(.34,1.56,.64,1), transform .28s cubic-bezier(.34,1.56,.64,1),
                box-shadow .2s ease;
  }
  .fab-item.fab-item-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
  .fab-item:hover { box-shadow: 0 6px 24px rgba(13,17,23,0.14), 0 2px 6px rgba(13,17,23,0.07); }
  .fab-item.fab-item-open:hover { transform: translateY(-1px) scale(1); }

  .fab-item-icon {
    width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .fab-item-label { font-size: 13px; font-weight: 600; color: #0D1117; letter-spacing: -.005em; font-family: 'Inter', system-ui, sans-serif; }
  .fab-item[dir="rtl"] .fab-item-label { font-family: 'IBM Plex Sans Arabic', 'Alexandria', system-ui, sans-serif; letter-spacing: 0 !important; }

  .fab-main:focus-visible, .fab-item:focus-visible {
    outline: 2px solid #2563EB; outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .fab-main, .fab-main-icon, .fab-item { transition-duration: .01ms !important; }
  }

  @media (max-width: 640px) {
    .fab-main { width: 52px; height: 52px; }
    .fab-item { height: 46px; }
  }
`;

/**
 * Premium floating speed-dial replacing the old "instantly opens AI chat +
 * greeting bubble" behavior. Closed state is a single neutral button; opening
 * it reveals WhatsApp / YANSY AI / Back-to-top as three calm, equal-weight
 * options — the visitor decides, nothing is pushed on them.
 */
const FloatingActionMenu = ({ isRTL, onOpenAI, hidden = false }) => {
  const [open, setOpen] = useState(false);
  const prefersReduced = useReducedMotion();
  const containerRef = useRef(null);
  const mainBtnRef = useRef(null);
  const firstItemRef = useRef(null);

  const closeMenu = useCallback((refocusMain = false) => {
    setOpen(false);
    if (refocusMain) mainBtnRef.current?.focus();
  }, []);

  // Click/tap outside closes the menu.
  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) closeMenu(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open, closeMenu]);

  // Escape closes and returns focus to the main button.
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e) => { if (e.key === 'Escape') closeMenu(true); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, closeMenu]);

  // Scrolling the page closes the menu (preferred per spec).
  useEffect(() => {
    if (!open) return undefined;
    const handleScroll = () => closeMenu(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [open, closeMenu]);

  // Move focus into the menu once it's open, for keyboard users.
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => firstItemRef.current?.focus(), prefersReduced ? 0 : 80);
    return () => clearTimeout(t);
  }, [open, prefersReduced]);

  if (hidden) return null;

  const actions = [
    {
      id: 'whatsapp',
      label: isRTL ? 'واتساب' : 'WhatsApp',
      color: '#25D366',
      tint: '#EAFBF1',
      border: 'rgba(37,211,102,.35)',
      icon: <WhatsAppGlyph />,
      delay: 0,
      onSelect: () => {
        trackWhatsAppClick('floating_menu');
        trackContact({ content_name: 'floating_menu' });
        window.open(WA_URL, '_blank', 'noopener,noreferrer');
      },
    },
    {
      id: 'ai',
      label: isRTL ? 'يانسي AI' : 'YANSY AI',
      color: '#2563EB',
      tint: '#EFF6FF',
      border: 'rgba(37,99,235,.3)',
      icon: <Sparkles size={16} strokeWidth={2.25} />,
      delay: 55,
      refocus: false, // let focus land inside the chat panel instead
      onSelect: () => {
        trackCTAClick('ai_assistant', 'floating_menu');
        onOpenAI?.();
      },
    },
    {
      id: 'top',
      label: isRTL ? 'العودة للأعلى' : 'Back to top',
      color: '#374151',
      tint: '#F6F7F9',
      border: '#E8EBF0',
      icon: <ArrowUp size={16} strokeWidth={2.25} />,
      delay: 110,
      onSelect: () => {
        window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
      },
    },
  ];

  const handleSelect = (action) => {
    closeMenu(action.refocus !== false);
    action.onSelect();
  };

  const align = floatingAlign(isRTL);

  return (
    <>
      <style>{CSS}</style>
      <div
        ref={containerRef}
        style={{
          // Shared corner geometry: identical edge gap in both directions, so
          // RTL is a real mirror of LTR rather than a separately tuned offset.
          ...floatingCornerStyle(isRTL),
          zIndex: 998,
          gap: 12,
        }}
      >
        <div
          id="fab-menu-panel"
          role="group"
          aria-label={isRTL ? 'إجراءات سريعة' : 'Quick actions'}
          aria-hidden={!open}
          // `direction` is inherited from the corner wrapper; only `alignItems`
          // has to be restated, since it doesn't cascade.
          style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: align }}
        >
          {[...actions].reverse().map((action) => (
            <button
              key={action.id}
              ref={action.id === 'whatsapp' ? firstItemRef : null}
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={() => handleSelect(action)}
              dir={isRTL ? 'rtl' : 'ltr'}
              className={`fab-item${open ? ' fab-item-open' : ''}`}
              style={{ transitionDelay: open && !prefersReduced ? `${action.delay}ms` : '0ms' }}
              aria-label={action.label}
            >
              <span
                className="fab-item-icon"
                style={{ background: action.tint, color: action.color, border: `1px solid ${action.border}` }}
                aria-hidden="true"
              >
                {action.icon}
              </span>
              <span className="fab-item-label">{action.label}</span>
            </button>
          ))}
        </div>

        <button
          ref={mainBtnRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="fab-main"
          aria-expanded={open}
          aria-controls="fab-menu-panel"
          aria-label={open ? (isRTL ? 'إغلاق القائمة' : 'Close quick actions') : (isRTL ? 'فتح الإجراءات السريعة' : 'Open quick actions')}
        >
          <Plus
            className="fab-main-icon"
            size={24}
            strokeWidth={2.25}
            style={{ transform: `rotate(${open ? 45 : 0}deg)` }}
            aria-hidden="true"
          />
        </button>
      </div>
    </>
  );
};

export default FloatingActionMenu;
