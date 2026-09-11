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
 * Contact row (phone / email) — a real `mailto:`/`tel:` link as the primary
 * action, with a separate copy button beside it.
 *
 * Previously the whole row was a `<div role="button">` that only ever copied
 * to the clipboard — tapping a phone number never offered to actually call
 * it, and tapping an email never opened a mail client. Splitting it into an
 * anchor (navigates) + a button (copies) gives both actions their own
 * affordance instead of overloading one control with a behavior half the
 * audience wouldn't expect from tapping a visible phone number.
 */
const ContactItem = ({ icon, value, label, href, toastMessage }) => {
  const Icon = icon;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await copyText(value);
    } catch {
      return; // clipboard blocked — nothing to confirm, fail quietly
    }
    setCopied(true);
    toast.success(toastMessage);
    setTimeout(() => setCopied(false), 1600);
  }, [value, toastMessage]);

  const active = hovered || focused;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'stretch', gap: 6,
        borderRadius: '8px',
        border: `1px solid ${active ? 'rgb(var(--border-strong))' : 'rgb(var(--border))'}`,
        background: active ? 'rgb(var(--bg-elevated))' : 'rgb(var(--bg-secondary))',
        transition: 'background 0.26s ease, border-color 0.26s ease',
      }}
    >
      <a
        href={href}
        aria-label={`${label}: ${value}`}
        className="focus-ring"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 4px 8px 12px', textDecoration: 'none',
          color: active ? 'rgb(var(--text-primary))' : 'rgb(var(--text-secondary))', fontSize: 12.5,
          transition: 'color 0.26s ease',
        }}
      >
        <Icon style={{
          width: 13, height: 13, flexShrink: 0,
          color: active ? 'rgb(var(--accent))' : 'rgb(var(--text-tertiary))',
          transition: 'color 0.26s ease',
        }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
      </a>

      <button
        type="button"
        onClick={handleCopy}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label={toastMessage}
        title={toastMessage}
        className="focus-ring"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 30, flexShrink: 0, padding: '8px 10px 8px 4px',
          border: 'none', background: 'none', cursor: 'pointer',
        }}
      >
        {copied
          ? <Check style={{ width: 13, height: 13, color: 'rgb(var(--success))' }} />
          : <Copy style={{ width: 13, height: 13, color: active ? 'rgb(var(--accent))' : 'rgb(var(--text-tertiary))', transition: 'color 0.22s ease' }} />}
      </button>
    </div>
  );
};

export default ContactItem;
