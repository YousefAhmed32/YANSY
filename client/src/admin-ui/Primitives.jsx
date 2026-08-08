import { forwardRef } from 'react';
import { Search, X, ChevronDown, ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react';
import { TK, RADIUS, STATUS_TONE, MOTION, colorFromName } from './tokens';
import { useLanguage } from '../contexts/LanguageContext';

// ── Button ──────────────────────────────────────────────────────────────────
const BTN_VARIANTS = {
  primary:   { background: TK.accent, border: 'none', color: TK.accentFg },
  secondary: { background: TK.surface, border: `1px solid ${TK.border}`, color: TK.text },
  ghost:     { background: 'transparent', border: 'none', color: TK.textMuted },
  danger:    { background: TK.redBg, border: `1px solid ${TK.redBd}`, color: TK.red },
};
const BTN_SIZES = {
  sm: { padding: '6px 12px', fontSize: '12px', borderRadius: RADIUS.sm },
  md: { padding: '9px 16px', fontSize: '12.5px', borderRadius: RADIUS.md },
  lg: { padding: '11px 20px', fontSize: '13.5px', borderRadius: RADIUS.md },
};

export const Button = forwardRef(({ variant = 'secondary', size = 'md', icon: Icon, loading, children, style, ...props }, ref) => (
  <button
    ref={ref}
    className={`au-btn au-btn-${variant}`}
    disabled={loading || props.disabled}
    style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
      fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
      fontFamily: 'inherit',
      ...BTN_VARIANTS[variant], ...BTN_SIZES[size], ...style,
    }}
    {...props}
  >
    {loading ? <Loader2 style={{ width: '14px', height: '14px', animation: 'au-spin 0.8s linear infinite' }} /> : Icon && <Icon style={{ width: '14px', height: '14px', flexShrink: 0 }} />}
    {children}
  </button>
));
Button.displayName = 'Button';

export const IconButton = forwardRef(({ icon: Icon, size = 30, variant = 'ghost', style, ...props }, ref) => (
  <button
    ref={ref}
    className="au-icon-btn"
    style={{
      width: `${size}px`, height: `${size}px`, borderRadius: RADIUS.md,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: variant === 'filled' ? TK.accentBg : 'transparent',
      border: variant === 'outline' ? `1px solid ${TK.border}` : 'none',
      cursor: 'pointer', color: TK.textMuted, flexShrink: 0,
      ...style,
    }}
    {...props}
  >
    <Icon style={{ width: `${Math.round(size * 0.46)}px`, height: `${Math.round(size * 0.46)}px` }} />
  </button>
));
IconButton.displayName = 'IconButton';

// ── Badge ───────────────────────────────────────────────────────────────────
export const Badge = ({ tone = 'neutral', children, dot = false }) => {
  const c = STATUS_TONE[tone] || STATUS_TONE.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '2px 9px', borderRadius: RADIUS.pill,
      fontSize: '10.5px', fontWeight: 500,
      background: c.bg, color: c.fg, border: `1px solid ${c.bd}`,
    }}>
      {dot && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c.fg }} />}
      {children}
    </span>
  );
};

// ── Card ────────────────────────────────────────────────────────────────────
export const Card = ({ children, hover = false, padding = '20px', style, ...props }) => (
  <div
    className={`au-card ${hover ? 'au-card-hover' : ''}`}
    style={{ background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: RADIUS.xl, padding, ...style }}
    {...props}
  >
    {children}
  </div>
);

export const SectionHead = ({ icon: Icon, title, subtitle, action }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '10px' }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
        {Icon && <Icon style={{ width: '13px', height: '13px', color: TK.accent, flexShrink: 0 }} />}
        <h2 style={{ fontSize: '10.5px', fontWeight: 600, color: TK.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </h2>
      </div>
      {subtitle && (
        <p style={{ fontSize: '11.5px', color: TK.textLight, margin: '4px 0 0', lineHeight: 1.5 }}>{subtitle}</p>
      )}
    </div>
    {action}
  </div>
);

// ── StatCard ────────────────────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, sub, trend, tone = 'neutral', highlight = false }) => {
  const c = STATUS_TONE[tone] || STATUS_TONE.neutral;
  return (
    <Card hover padding="18px" style={highlight ? { background: TK.accentBg, borderColor: TK.accentBd } : undefined}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: RADIUS.md,
          background: c.bg, border: `1px solid ${c.bd}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon style={{ width: '15px', height: '15px', color: c.fg }} />
        </div>
        {trend !== undefined && (
          <span style={{
            fontSize: '10px', fontWeight: 500, padding: '2px 7px', borderRadius: RADIUS.pill,
            background: trend >= 0 ? TK.greenBg : TK.redBg, color: trend >= 0 ? TK.green : TK.red,
          }}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div style={{ fontSize: '26px', fontWeight: 700, color: TK.text, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: '10.5px', fontWeight: 500, color: TK.textMuted, letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: '6px' }}>{label}</div>
      {sub && <div style={{ fontSize: '10.5px', color: TK.textLight, marginTop: '3px' }}>{sub}</div>}
    </Card>
  );
};

// ── Inputs ──────────────────────────────────────────────────────────────────
export const TextInput = ({ icon: Icon, style, containerStyle, ...props }) => (
  <div className="au-input" style={{
    display: 'flex', alignItems: 'center', gap: '9px',
    background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: RADIUS.md,
    padding: '9px 13px', ...containerStyle,
  }}>
    {Icon && <Icon style={{ width: '14px', height: '14px', color: TK.textMuted, flexShrink: 0 }} />}
    <input style={{ flex: 1, fontSize: '13px', color: TK.text, minWidth: 0, ...style }} {...props} />
  </div>
);

export const TextArea = ({ style, containerStyle, rows = 3, ...props }) => (
  <div className="au-input" style={{
    background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: RADIUS.md,
    padding: '9px 13px', ...containerStyle,
  }}>
    <textarea
      rows={rows}
      style={{ width: '100%', fontSize: '13px', color: TK.text, lineHeight: 1.55, resize: 'vertical', display: 'block', ...style }}
      {...props}
    />
  </div>
);

// ── Switch (toggle) ──────────────────────────────────────────────────────────
export const Switch = ({ checked, onChange, label, disabled }) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      style={{
        width: '36px', height: '20px', borderRadius: RADIUS.pill, flexShrink: 0,
        background: checked ? TK.accent : TK.border, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative', transition: `background ${MOTION.base} ${MOTION.ease}`,
      }}
    >
      <span style={{
        position: 'absolute', top: '2px', insetInlineStart: checked ? '18px' : '2px',
        width: '16px', height: '16px', borderRadius: '50%', background: '#FFFFFF',
        boxShadow: '0 1px 2px rgba(16,24,40,0.2)', transition: `inset-inline-start ${MOTION.base} ${MOTION.ease}`,
      }} />
    </button>
    {label && <span style={{ fontSize: '12.5px', fontWeight: 500, color: TK.text }}>{label}</span>}
  </label>
);

export const SearchInput = ({ value, onChange, placeholder, onClear, style }) => {
  const { isRTL } = useLanguage();
  return (
    <div className="au-input" style={{
      flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '9px',
      background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: RADIUS.md,
      padding: '9px 13px', ...style,
    }}>
      <Search style={{ width: '14px', height: '14px', color: TK.textMuted, flexShrink: 0 }} />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder ?? (isRTL ? 'بحث…' : 'Search…')}
        style={{ flex: 1, fontSize: '13px', color: TK.text, minWidth: 0 }}
      />
      {value && (
        <button onClick={onClear} aria-label={isRTL ? 'مسح' : 'Clear'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TK.textMuted, padding: 0, display: 'flex' }}>
          <X style={{ width: '13px', height: '13px' }} />
        </button>
      )}
    </div>
  );
};

export const Select = ({ value, onChange, options, style }) => (
  <div className="au-input" style={{
    position: 'relative', display: 'flex', alignItems: 'center',
    background: TK.surface, border: `1px solid ${TK.border}`, borderRadius: RADIUS.md,
    padding: '9px 32px 9px 13px', ...style,
  }}>
    <select
      value={value}
      onChange={onChange}
      style={{ appearance: 'none', width: '100%', fontSize: '12.5px', color: TK.text, cursor: 'pointer' }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <ChevronDown style={{ width: '13px', height: '13px', color: TK.textMuted, position: 'absolute', right: '10px', pointerEvents: 'none' }} />
  </div>
);

// ── Segmented filter pills ───────────────────────────────────────────────────
export const FilterPills = ({ value, onChange, options }) => (
  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
    {options.map(o => {
      const active = value === o.value;
      return (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="au-btn"
          style={{
            padding: '8px 14px', borderRadius: RADIUS.md,
            background: active ? TK.accentBg : 'transparent',
            border: `1px solid ${active ? TK.accentBd : TK.border}`,
            color: active ? TK.accent : TK.textMuted,
            fontSize: '11.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

// ── Empty / Loading / Skeleton ───────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
  <div style={{ padding: '48px 20px', textAlign: 'center' }}>
    {Icon && <Icon style={{ width: '28px', height: '28px', margin: '0 auto 12px', opacity: 0.25, color: TK.textMuted }} />}
    <p style={{ fontSize: '13px', fontWeight: 500, color: TK.text, margin: 0 }}>{title}</p>
    {subtitle && <p style={{ fontSize: '12px', color: TK.textMuted, marginTop: '4px' }}>{subtitle}</p>}
    {action && <div style={{ marginTop: '16px' }}>{action}</div>}
  </div>
);

export const Spinner = ({ size = 28 }) => (
  <div style={{
    width: `${size}px`, height: `${size}px`, borderRadius: '50%',
    border: `2px solid ${TK.accentBg}`, borderTopColor: TK.accent,
    animation: 'au-spin 0.8s linear infinite',
  }} />
);

export const PageSpinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
    <Spinner />
  </div>
);

export const Skeleton = ({ width = '100%', height = '14px', radius = '6px', style }) => (
  <div className="au-skeleton" style={{ width, height, borderRadius: radius, ...style }} />
);

// ── Pagination ────────────────────────────────────────────────────────────────
export const Pagination = ({ page, totalPages, onChange, isRTL = false }) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <IconButton icon={PrevIcon} variant="outline" size={30} aria-label={isRTL ? 'الصفحة السابقة' : 'Previous page'} onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} style={{ opacity: page === 1 ? 0.35 : 1 }} />
      {pages.map(p => (
        <button key={p} onClick={() => onChange(p)} aria-current={page === p ? 'page' : undefined} className="au-btn" style={{
          width: '30px', height: '30px', borderRadius: RADIUS.sm,
          background: page === p ? TK.accentBg : 'transparent',
          border: `1px solid ${page === p ? TK.accentBd : TK.border}`,
          color: page === p ? TK.accent : TK.textMuted,
          fontSize: '12px', fontWeight: page === p ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {p}
        </button>
      ))}
      <IconButton icon={NextIcon} variant="outline" size={30} aria-label={isRTL ? 'الصفحة التالية' : 'Next page'} onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={{ opacity: page === totalPages ? 0.35 : 1 }} />
    </div>
  );
};

// ── Tabs ──────────────────────────────────────────────────────────────────────
export const Tabs = ({ value, onChange, items }) => (
  <div style={{ display: 'flex', gap: '4px', borderBottom: `1px solid ${TK.border}` }}>
    {items.map(it => {
      const active = value === it.value;
      return (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          className="au-tab"
          style={{
            padding: '10px 4px', marginBottom: '-1px',
            background: 'none', border: 'none', borderBottom: `2px solid ${active ? TK.accent : 'transparent'}`,
            color: active ? TK.text : TK.textMuted, fontSize: '13px', fontWeight: active ? 600 : 400,
            cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px',
            marginInlineEnd: '18px',
          }}
        >
          {it.icon && <it.icon style={{ width: '14px', height: '14px' }} />}
          {it.label}
          {it.count !== undefined && (
            <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: RADIUS.pill, background: active ? TK.accentBg : 'rgba(107,114,128,0.1)', color: active ? TK.accent : TK.textMuted }}>
              {it.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

// ── Stepper (wizard progress) ────────────────────────────────────────────────
export const Stepper = ({ steps, current, onStepChange }) => {
  const clickable = typeof onStepChange === 'function';
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      {steps.map((label, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : '0 0 auto', minWidth: 0 }}>
            <button
              type="button"
              onClick={clickable ? () => onStepChange(i) : undefined}
              disabled={!clickable}
              style={{
                display: 'flex', alignItems: 'center', gap: '9px',
                background: 'none', border: 'none', padding: 0,
                cursor: clickable ? 'pointer' : 'default', fontFamily: 'inherit',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              <span style={{
                width: '26px', height: '26px', borderRadius: RADIUS.pill, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 600,
                background: done ? TK.accent : active ? TK.accentBg : TK.surface,
                border: `1.5px solid ${done || active ? TK.accent : TK.border}`,
                color: done ? TK.accentFg : active ? TK.accent : TK.textLight,
                transition: `all ${MOTION.base} ${MOTION.ease}`,
              }}>
                {done ? <Check style={{ width: '13px', height: '13px' }} /> : i + 1}
              </span>
              <span style={{
                fontSize: '12.5px', fontWeight: active ? 600 : 500,
                color: active ? TK.text : done ? TK.textMuted : TK.textLight,
              }}>
                {label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: '1px', margin: '0 14px', minWidth: '20px', background: done ? TK.accent : TK.border, transition: `background ${MOTION.base} ${MOTION.ease}` }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Avatar ──────────────────────────────────────────────────────────────────
// Renders `image` if present (a resolved src string — pass through mediaSrc()
// first for library media assets); otherwise falls back to initials on a
// deterministic color. Pass `tone` for semantic coloring (status, role, ...);
// omit it to auto-color from `name` instead (identity avatars — Client/Team/
// Testimonial pickers) so the same entity always renders the same color.
export const Avatar = ({ name, email, image, size = 32, tone, shape = 'rounded' }) => {
  const c = tone ? (STATUS_TONE[tone] || STATUS_TONE.info) : colorFromName(name || email || '?');
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : (email ? email.slice(0, 2).toUpperCase() : '?');
  const radius = shape === 'circle' ? '50%' : RADIUS.md;

  if (image) {
    return (
      <img
        src={image}
        alt=""
        style={{
          width: `${size}px`, height: `${size}px`, borderRadius: radius, flexShrink: 0,
          objectFit: 'cover', border: `1px solid ${TK.border}`, background: TK.bgSubtle,
        }}
      />
    );
  }

  return (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: radius, flexShrink: 0,
      background: c.bg, border: `1px solid ${c.bd}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: `${Math.round(size * 0.34)}px`, fontWeight: 600, color: c.fg,
    }}>
      {initials}
    </div>
  );
};

export const PresenceDot = ({ lastActive }) => {
  const mins = lastActive ? Math.floor((Date.now() - new Date(lastActive).getTime()) / 60000) : Infinity;
  const online = mins < 30;
  const recent = mins < 1440;
  const color = online ? TK.green : recent ? TK.accent : TK.textLight;
  return <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, boxShadow: online ? `0 0 0 3px ${TK.greenBg}` : 'none', flexShrink: 0 }} />;
};
