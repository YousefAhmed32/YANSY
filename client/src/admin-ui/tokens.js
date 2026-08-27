// Single source of truth for the authenticated-app (dashboard) design system.
// Public-site tokens live separately in index.css — these are dashboard-only.

export const TK = {
  bg:         '#F4F6FA',
  bgSubtle:   '#F8FAFD',
  surface:    '#FFFFFF',
  border:     '#E1E6EF',
  borderSoft: '#EDF1F7',

  text:       '#111827',
  textMuted:  '#5F6B7A',
  textLight:  '#8792A2',

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

export const RADIUS = { sm: '8px', md: '10px', lg: '14px', xl: '18px', pill: '999px' };

// Deterministic per-name color set for identity avatars (Client/Team/Testimonial
// initials fallback) — distinct from STATUS_TONE, which is semantic (success/
// danger/...) and shouldn't be repurposed to mean "this is the 3rd client
// alphabetically". Picked for AA contrast on their own bg at 13px+ bold text.
export const AVATAR_PALETTE = [
  { fg: '#2563EB', bg: 'rgba(37,99,235,0.10)',  bd: 'rgba(37,99,235,0.22)'  }, // blue
  { fg: '#7C3AED', bg: 'rgba(124,58,237,0.10)', bd: 'rgba(124,58,237,0.22)' }, // violet
  { fg: '#0D9488', bg: 'rgba(13,148,136,0.10)', bd: 'rgba(13,148,136,0.22)' }, // teal
  { fg: '#D97706', bg: 'rgba(217,119,6,0.10)',  bd: 'rgba(217,119,6,0.22)'  }, // amber
  { fg: '#DB2777', bg: 'rgba(219,39,119,0.10)', bd: 'rgba(219,39,119,0.22)' }, // pink
  { fg: '#16A34A', bg: 'rgba(22,163,74,0.10)',  bd: 'rgba(22,163,74,0.22)'  }, // green
  { fg: '#4F46E5', bg: 'rgba(79,70,229,0.10)',  bd: 'rgba(79,70,229,0.22)'  }, // indigo
  { fg: '#E11D48', bg: 'rgba(225,29,72,0.10)',  bd: 'rgba(225,29,72,0.22)'  }, // rose
];

// Stable hash so the same name always lands on the same palette color across
// renders/sessions (no Math.random — this is identity, not decoration).
export const colorFromName = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};

export const SPACE = { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '20px', xxl: '28px' };

export const SHADOW = {
  xs: '0 1px 2px rgba(15,23,42,0.04)',
  sm: '0 6px 18px rgba(15,23,42,0.055)',
  md: '0 12px 30px rgba(15,23,42,0.075)',
  lg: '0 24px 64px rgba(15,23,42,0.14)',
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
