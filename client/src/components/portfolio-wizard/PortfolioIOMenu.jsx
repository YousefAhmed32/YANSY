import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Upload, Download, Copy, FileJson } from 'lucide-react';
import { TK, RADIUS, SHADOW } from '../../admin-ui';

/**
 * Compact "More actions" menu for the sticky editor toolbar — Import JSON /
 * Export JSON / Duplicate, kept out of the primary action row so Publish
 * stays the one unambiguous primary action (see the Portfolio Import/Export
 * brief's toolbar IA guidance). Shared by both PortfolioWizard.jsx and
 * PortfolioQuickShowcase.jsx rather than reimplemented per editor.
 *
 * A hand-rolled popover (the admin-ui kit has no generic Menu primitive yet)
 * — deliberately minimal: outside-click + Escape to close, focus returns to
 * the trigger on close, every item is a real `<button role="menuitem">` so
 * it's reachable by Tab even without full roving-tabindex arrow-key
 * navigation. `disabled` items (e.g. Duplicate/Export before the project has
 * been saved once) stay in the DOM so their reason is visible, not hidden.
 */
const PortfolioIOMenu = ({ isRTL, onExport, onImport, onDownloadTemplate, onDuplicate, exporting, duplicating, canDuplicate = true }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const L = {
    more: isRTL ? 'المزيد من الإجراءات' : 'More actions',
    importJson: isRTL ? 'استيراد JSON' : 'Import JSON',
    exportJson: isRTL ? 'تصدير JSON' : 'Export JSON',
    template: isRTL ? 'تنزيل قالب الاستيراد' : 'Download Import Template',
    duplicate: isRTL ? 'نسخ' : 'Duplicate',
  };

  const runAndClose = (fn) => () => { setOpen(false); fn?.(); };

  const items = [
    { key: 'import', icon: Upload, label: L.importJson, onClick: runAndClose(onImport), disabled: false },
    { key: 'export', icon: Download, label: L.exportJson, onClick: runAndClose(onExport), disabled: exporting },
    { key: 'template', icon: FileJson, label: L.template, onClick: runAndClose(onDownloadTemplate), disabled: false },
    onDuplicate && { key: 'duplicate', icon: Copy, label: L.duplicate, onClick: runAndClose(onDuplicate), disabled: !canDuplicate || duplicating },
  ].filter(Boolean);

  return (
    <div ref={containerRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={L.more}
        onClick={() => setOpen((o) => !o)}
        className="au-icon-btn"
        style={{
          width: 30, height: 30, borderRadius: RADIUS.md, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? TK.bgSubtle : 'transparent', border: `1px solid ${open ? TK.border : 'transparent'}`,
          cursor: 'pointer', color: TK.textMuted,
        }}
      >
        <MoreHorizontal style={{ width: 16, height: 16 }} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={L.more}
          style={{
            position: 'absolute', top: '100%', marginTop: 6, [isRTL ? 'left' : 'right']: 0, zIndex: 120,
            minWidth: 180, background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: RADIUS.md,
            boxShadow: SHADOW.lg, padding: 6,
          }}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={item.onClick}
              className="au-row"
              style={{
                display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 10px',
                background: 'transparent', border: 'none', borderRadius: RADIUS.sm, cursor: item.disabled ? 'default' : 'pointer',
                fontSize: 12.5, fontWeight: 500, color: item.disabled ? TK.textLight : TK.text,
                opacity: item.disabled ? 0.55 : 1, textAlign: isRTL ? 'right' : 'left', fontFamily: 'inherit',
                flexDirection: isRTL ? 'row-reverse' : 'row',
              }}
            >
              <item.icon style={{ width: 14, height: 14, flexShrink: 0 }} aria-hidden />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PortfolioIOMenu;
