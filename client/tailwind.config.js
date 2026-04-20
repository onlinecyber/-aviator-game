/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#1a1b2e',
          100: '#16213e',
          200: '#0f3460',
          300: '#0d1117',
          400: '#080b14',
        },
        brand: {
          primary: '#e63946',
          secondary: '#f4a261',
          accent: '#06d6a0',
          gold: '#ffd60a',
          blue: '#4cc9f0',
        },
        crash: '#ff2d55',
        win: '#06d6a0',
        lose: '#e63946',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%': { textShadow: '0 0 10px rgba(230, 57, 70, 0.5)' },
          '100%': { textShadow: '0 0 25px rgba(230, 57, 70, 1), 0 0 50px rgba(230, 57, 70, 0.5)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
