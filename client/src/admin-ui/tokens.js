// Single source of truth for the authenticated-app (dashboard) design system.
// Public-site tokens live separately in index.css — these are dashboard-only.

export const TK = {
  bg:         '#F6F7F9',
  bgSubtle:   '#FAFBFC',
  surface:    '#FFFFFF',
  border:     '#E8EBF0',
  borderSoft: '#EEF1F5',

  text:       '#0D1117',
  textMuted:  '#6B7280',
  textLight:  '#9CA3AF',

  accent:     '#2563EB',
  accentHover:'#1D4ED8',
  accentBg:   'rgba(37,99,235,0.07)',
  accentBd:   'rgba(37,99,235,0.2)',
  accentFg:   '#FFFFFF',

  hoverBg:    'rgba(17,24,39,0.03)',
  activeBg:   'rgba(37,99,235,0.06)',

  green:      '#16a34a',
  greenBg:    'rgba(22,163,74,0.08)',
  greenBd:    'rgba(22,163,74,0.22)',
  amber:      '#d97706',
  amberBg:    'rgba(217,119,6,0.08)',
  amberBd:    'rgba(217,119,6,0.22)',
  red:        '#dc2626',
  redBg:      'rgba(220,38,38,0.08)',
  redBd:      'rgba(220,38,38,0.22)',
  purple:     '#7c3aed',
  purpleBg:   'rgba(124,58,237,0.08)',
};

// Semantic status color lookup shared across tables/badges
export const STATUS_TONE = {
  success: { fg: TK.green,  bg: TK.greenBg,  bd: TK.greenBd },
  warning: { fg: TK.amber,  bg: TK.amberBg,  bd: TK.amberBd },
  danger:  { fg: TK.red,    bg: TK.redBg,    bd: TK.redBd   },
  info:    { fg: TK.accent, bg: TK.accentBg, bd: TK.accentBd},
  neutral: { fg: TK.textMuted, bg: 'rgba(107,114,128,0.08)', bd: 'rgba(107,114,128,0.18)' },
  purple:  { fg: TK.purple, bg: TK.purpleBg, bd: 'rgba(124,58,237,0.22)' },
};

export const RADIUS = { sm: '6px', md: '8px', lg: '10px', xl: '12px', pill: '999px' };

export const SPACE = { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '20px', xxl: '28px' };

export const SHADOW = {
  xs: '0 1px 2px rgba(16,24,40,0.04)',
  sm: '0 2px 8px rgba(16,24,40,0.06)',
  md: '0 4px 16px rgba(16,24,40,0.08)',
  lg: '0 12px 40px rgba(16,24,40,0.12)',
};

export const MOTION = { fast: '0.12s', base: '0.18s', slow: '0.28s', ease: 'cubic-bezier(0.4,0,0.2,1)', spring: 'cubic-bezier(0.34,1.56,0.64,1)' };

export const FONT = (isRTL) => isRTL ? "'IBM Plex Sans Arabic', system-ui, sans-serif" : "'Inter', system-ui, sans-serif";

export const TEXT = {
  pageTitle: { fontSize: 'clamp(22px,3vw,28px)', fontWeight: 700, letterSpacing: '-0.02em' },
  section:   { fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase' },
  body:      { fontSize: '13px', fontWeight: 400 },
  label:     { fontSize: '12px', fontWeight: 500 },
  caption:   { fontSize: '11px', fontWeight: 400 },
};
