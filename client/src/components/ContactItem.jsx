import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Check } from 'lucide-react';

/** Clipboard write with a legacy fallback for browsers/contexts where the
 * async Clipboard API is unavailable (non-secure context, older WebViews). */
const copyText = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const el = Object.assign(document.createElement('textarea'), {
    value: text,
    style: 'position:fixed;top:0;left:0;opacity:0;',
  });
  document.body.appendChild(el);
  el.focus();
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

/**
 * Click-to-copy contact row (phone / email / any value worth copying).
 * Never navigates — copies to the clipboard and confirms with a toast.
 */
const ContactItem = ({ icon, value, label, toastMessage }) => {
  const Icon = icon;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await copyText(value);
    } catch {
      return; // clipboard blocked — nothing to confirm, fail quietly
    }
    setCopied(true);
    toast.success(toastMessage);
    setTimeout(() => setCopied(false), 1600);
  }, [value, toastMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCopy();
    }
  };

  const active = hovered || focused;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${label}: ${value}`}
      onClick={handleCopy}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="focus-ring"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        padding: '8px 12px', borderRadius: '8px',
        border: `1px solid ${active ? '#C9CDD6' : '#E8EBF0'}`,
        background: active ? '#FFFFFF' : '#FAFAFA',
        cursor: 'pointer',
        transform: active ? 'scale(1.02)' : 'scale(1)',
        transformOrigin: 'center left',
        transition: 'background 0.26s ease, border-color 0.26s ease, transform 0.26s ease',
      }}
    >
      <span style={{
        display: 'flex', alignItems: 'center', gap: 8, minWidth: 0,
        color: active ? '#0D1117' : '#374151', fontSize: 12.5,
        transition: 'color 0.26s ease',
      }}>
        <Icon style={{
          width: 13, height: 13, flexShrink: 0,
          color: active ? '#2563EB' : '#9BA3AE',
          transition: 'color 0.26s ease',
        }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
      </span>

      {/* Fixed-size slot so the copy/check icon fading in on hover never shifts layout */}
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, flexShrink: 0 }} aria-hidden>
        {copied
          ? <Check style={{ width: 13, height: 13, color: '#16a34a' }} />
          : <Copy style={{ width: 13, height: 13, color: '#2563EB', opacity: active ? 1 : 0, transition: 'opacity 0.22s ease' }} />}
      </span>
    </div>
  );
};

export default ContactItem;
