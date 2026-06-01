import type { Config } from 'tailwindcss'

export const ribera_tailwind_preset: Partial<Config> = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f0ff',
          100: '#b3ccff',
          200: '#80aaff',
          300: '#4d88ff',
          400: '#1a66ff',
          500: '#0066FF', // primary
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433',
        },
        accent: {
          300: '#f9d07e',
          400: '#f7c44e',
          500: '#F5A623', // gold accent
          600: '#d4891a',
          700: '#a36c14',
        },
        // Landing page accent palette (from ribera-app-web)
        coral: {
          400: '#ff7080',
          500: '#FF4B5C', // landing primary CTA
          600: '#e63342',
        },
        teal: {
          400: '#22d8eb',
          500: '#00C1D4', // landing secondary
          600: '#009aab',
        },
        violet: {
          500: '#7D2AE8', // landing tertiary/gradient
          600: '#6520c0',
        },
        surface: {
          900: '#0A0A0F', // page background
          800: '#141420', // card background
          700: '#1E1E2E', // elevated card
          600: '#28283A', // border/divider
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.12s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
}
