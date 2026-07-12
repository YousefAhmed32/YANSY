/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Accent — single modern blue (consistent, never mixed)
        accent: {
          DEFAULT:  '#2563EB',
          light:    '#EFF6FF',
          muted:    '#DBEAFE',
          hover:    '#1D4ED8',
          subtle:   '#BFDBFE',
        },
        // Semantic surface tokens
        surface: {
          DEFAULT:   '#F6F7F9',
          secondary: '#FAFAFA',
          white:     '#FFFFFF',
        },
        // Border tokens
        border: {
          DEFAULT: '#E7EAF0',
          light:   '#F1F3F7',
          strong:  '#D1D5DB',
        },
        // Content tokens
        content: {
          primary:   '#111827',
          secondary: '#6B7280',
          tertiary:  '#9CA3AF',
          inverse:   '#FFFFFF',
        },
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
