/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#030712',
          900: '#0a0f1e',
          800: '#111827',
          700: '#1a2235',
          600: '#243049',
          500: '#2d3a54',
        },
        neon: {
          purple: '#a855f7',
          blue: '#6366f1',
          cyan: '#22d3ee',
          green: '#10b981',
          pink: '#ec4899',
          orange: '#f97316',
          yellow: '#eab308',
        },
        glass: {
          light: 'rgba(255,255,255,0.05)',
          medium: 'rgba(255,255,255,0.08)',
          heavy: 'rgba(255,255,255,0.12)',
          border: 'rgba(255,255,255,0.1)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 80, 255, 0.15), transparent)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'counter': 'counter 1.5s ease-out',
        'gradient-shift': 'gradient-shift 8s ease infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 1 },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(139, 92, 246, 0.3)',
        'glow-md': '0 0 30px -5px rgba(139, 92, 246, 0.3)',
        'glow-lg': '0 0 50px -8px rgba(139, 92, 246, 0.4)',
        'glow-cyan': '0 0 30px -5px rgba(34, 211, 238, 0.3)',
        'glow-green': '0 0 30px -5px rgba(16, 185, 129, 0.3)',
        'glow-pink': '0 0 30px -5px rgba(236, 72, 153, 0.3)',
        'neon': '0 0 5px theme(colors.neon.purple), 0 0 20px rgba(168, 85, 247, 0.2)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
