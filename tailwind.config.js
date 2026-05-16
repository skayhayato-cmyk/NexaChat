/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        nexa: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bbfc',
          400: '#8199f8',
          500: '#6272f1',
          600: '#4f55e5',
          700: '#4244cb',
          800: '#3638a4',
          900: '#313582',
          950: '#1e1f4d',
        },
        dark: {
          900: '#0a0a0f',
          800: '#111118',
          700: '#1a1a25',
          600: '#22222f',
          500: '#2d2d3e',
          400: '#3d3d52',
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in':    'fadeIn 0.2s ease-out',
        'pop':        'pop 0.15s ease-out',
        'pulse-ring': 'pulseRing 1.5s ease-out infinite',
        'typing':     'typing 1s steps(3) infinite',
        'blob':       'blob 7s infinite',
        'shimmer':    'shimmer 2s linear infinite',
      },
      keyframes: {
        slideUp:   { from: { transform: 'translateY(100%)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideDown: { from: { transform: 'translateY(-10px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        pop:       { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.12)' }, '100%': { transform: 'scale(1)' } },
        pulseRing: { '0%': { transform: 'scale(0.8)', opacity: 1 }, '100%': { transform: 'scale(2)', opacity: 0 } },
        typing:    { '0%': { content: "'...'" }, '33%': { content: "'.  '" }, '66%': { content: "'.. '" } },
        blob:      { '0%,100%': { borderRadius: '60% 40% 30% 70%/60% 30% 70% 40%' }, '50%': { borderRadius: '30% 60% 70% 40%/50% 60% 30% 60%' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'nexa': '0 0 30px rgba(98, 114, 241, 0.3)',
        'nexa-lg': '0 0 60px rgba(98, 114, 241, 0.4)',
        'inner-nexa': 'inset 0 0 20px rgba(98, 114, 241, 0.1)',
      }
    },
  },
  plugins: [],
}
