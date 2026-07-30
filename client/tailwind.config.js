/** @type {import('tailwindcss').Config} */

// Semantic colors resolve through CSS variables (defined in index.css :root)
// instead of static hex, so every component consuming these tokens shares one
// source of truth. `<alpha-value>` lets Tailwind's opacity modifiers (e.g.
// bg-surface/50) keep working.
function themeColor(cssVar) {
  return `rgb(var(${cssVar}) / <alpha-value>)`;
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Accent — single modern blue (consistent, never mixed; identical in both themes)
        accent: {
          DEFAULT:  themeColor('--accent'),
          light:    themeColor('--accent-light'),
          muted:    themeColor('--accent-muted'),
          hover:    themeColor('--accent-hover'),
          subtle:   themeColor('--accent-subtle'),
        },
        // Semantic surface tokens
        surface: {
          DEFAULT:   themeColor('--bg-surface'),
          secondary: themeColor('--bg-secondary'),
          white:     themeColor('--bg-elevated'),
          strong:    themeColor('--surface-strong'),
        },
        // Border tokens
        border: {
          DEFAULT: themeColor('--border'),
          light:   themeColor('--border-light'),
          strong:  themeColor('--border-strong'),
          input:   themeColor('--input'),
        },
        // Content tokens
        content: {
          primary:   themeColor('--text-primary'),
          secondary: themeColor('--text-secondary'),
          tertiary:  themeColor('--text-tertiary'),
          inverse:   themeColor('--text-inverse'),
          onstrong:  themeColor('--on-strong'),
        },
        // Status tokens
        success: { DEFAULT: themeColor('--success'), light: themeColor('--success-light') },
        warning: { DEFAULT: themeColor('--warning'), light: themeColor('--warning-light') },
        danger:  { DEFAULT: themeColor('--danger'),  light: themeColor('--danger-light') },
        ring:    { DEFAULT: themeColor('--ring') },
        // Reserved for tiny premium decorative touches only — never a primary/CTA color.
        gold: { DEFAULT: themeColor('--gold'), light: themeColor('--gold-light') },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        arabic:  ["'IBM Plex Sans Arabic'", 'Alexandria', "'Arabic Fallback'", 'system-ui', 'sans-serif'],
        mono:    ["'JetBrains Mono'", "'Fira Code'", 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1.6' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tight:    '-0.02em',
      },
      maxWidth: {
        content: '1280px',
      },
      animation: {
        'fade-up':   'fadeUp 0.5s ease forwards',
        'fade-in':   'fadeIn 0.4s ease forwards',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
