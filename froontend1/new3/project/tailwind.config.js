/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Neutral canvas
        base: {
          950: '#08090b',
          900: '#0c0e12',
          850: '#111419',
          800: '#16191f',
          750: '#1c2027',
          700: '#242932',
          600: '#333a46',
          500: '#4b5463',
          400: '#6b7588',
          300: '#9aa3b5',
          200: '#c4cbd8',
          100: '#e6e9f0',
          50: '#f7faf9',
        },
        // Signal accent — lime
        signal: {
          50: '#f7ffe0',
          100: '#eefdc0',
          200: '#dcfa86',
          300: '#c4f74e',
          400: '#a8e226',
          500: '#84bd12',
          600: '#5f8a0a',
          700: '#3f5c07',
          800: '#243606',
          900: '#131e05',
        },
        // Warm secondary — amber
        ember: {
          100: '#ffe8c0',
          300: '#ffb347',
          400: '#ff9a1f',
          500: '#e07b0a',
          600: '#a85906',
        },
        // Cool tertiary — sky
        sky2: {
          300: '#7cd5ff',
          400: '#38bdf8',
          500: '#0ea5e9',
        },
        success: '#4ade80',
        warning: '#fbbf24',
        error: '#f87171',
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        signal: '0 0 0 1px rgba(196,247,78,0.35), 0 0 28px -4px rgba(196,247,78,0.45)',
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 24px 48px -24px rgba(0,0,0,0.8)',
        float: '0 18px 40px -16px rgba(0,0,0,0.7)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'spin-slow': 'spin-slow 18s linear infinite',
      },
    },
  },
  plugins: [],
};
