/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#d4af37',
          50:  '#fef9e7',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#d4af37',
          600: '#b8860b',
          700: '#9a7209',
          800: '#7c5d07',
          900: '#5e4805',
        },
        primary: {
          DEFAULT: '#1E3A8A',
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E3A8A',
          900: '#1E40AF',
        },
        navy: {
          DEFAULT: '#0A1929',
          50:  '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#102A43',
        },
        accent: {
          DEFAULT: '#FFFFFF',
          light: '#F8F9FA',
          dark:  '#E5E7EB',
        },
        /* Theme-aware tokens (CSS variables) */
        bg: {
          DEFAULT:   'var(--color-bg)',
          primary:   'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          tertiary:  'var(--color-bg-tertiary)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
          hover:    'var(--color-surface-hover)',
        },
        text: {
          DEFAULT:   'var(--color-text)',
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary:  'var(--color-text-tertiary)',
          inverse:   'var(--color-text-inverse)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          light:   'var(--color-border-light)',
          dark:    'var(--color-border-dark)',
        },
      },

      fontFamily: {
        /* English / LTR — Inter across all roles */
        sans:    ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif:   ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono:    ["'JetBrains Mono'", "'Fira Code'", "'Cascadia Code'", 'ui-monospace', 'monospace'],
        /* Arabic / RTL — IBM Plex Sans Arabic + Alexandria */
        arabic:           ["'IBM Plex Sans Arabic'", 'Alexandria', "'Arabic Fallback'", 'system-ui', 'sans-serif'],
        'arabic-display': ["'IBM Plex Sans Arabic'", 'Alexandria', "'Arabic Fallback'", 'system-ui', 'sans-serif'],
      },

      /* Type scale extensions */
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1.6' }],
      },

      /* Letter-spacing tokens */
      letterSpacing: {
        tightest: '-0.04em',
        tight:    '-0.02em',
        normal:    '0em',
        wide:      '0.05em',
        wider:     '0.12em',
        widest:    '0.22em',
        ultra:     '0.35em',
        nav:       '0.26em',
        label:     '0.18em',
      },

      /* Line-height tokens */
      lineHeight: {
        none:    '1',
        tight:   '1.04',
        snug:    '1.25',
        normal:  '1.5',
        relaxed: '1.7',
        loose:   '2',
      },

      backdropBlur: {
        xs: '2px',
      },

      animation: {
        'float':    'float 6s ease-in-out infinite',
        'glow':     'glow 2s ease-in-out infinite alternate',
        'gradient': 'gradient 15s ease infinite',
      },

      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%':   { opacity: '0.5' },
          '100%': { opacity: '1' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':       { backgroundPosition: '100% 50%' },
        },
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
