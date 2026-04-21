/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#1a1b2e',
          100: '#0f1525',
          200: '#0b0f1a',
          300: '#080c15',
          400: '#050810',
        },
        neon: {
          green:  '#00e676',
          cyan:   '#00e5ff',
          purple: '#cc44ff',
          red:    '#ff1744',
          gold:   '#ffd700',
          blue:   '#2979ff',
        },
        brand: {
          primary:   '#ff1744',
          secondary: '#ff6d00',
          accent:    '#00e676',
          gold:      '#ffd700',
          blue:      '#00e5ff',
          purple:    '#cc44ff',
        },
      },
      fontFamily: {
        sans:      ['Inter', 'sans-serif'],
        mono:      ['JetBrains Mono', 'monospace'],
        orbitron:  ['Orbitron', 'sans-serif'],
      },
      animation: {
        'pulse-fast':    'pulse 0.7s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':         'float 3s ease-in-out infinite',
        'glow-green':    'glowGreen 2s ease-in-out infinite alternate',
        'glow-red':      'glowRed 2s ease-in-out infinite alternate',
        'slide-in':      'slideIn 0.3s ease-out',
        'slide-up':      'slideUp 0.35s ease-out',
        'fade-in':       'fadeIn 0.4s ease-out',
        'scale-in':      'scaleIn 0.25s ease-out',
        'spin-slow':     'spin 8s linear infinite',
        'neon-flicker':  'neonFlicker 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        glowGreen: {
          '0%':   { textShadow: '0 0 8px rgba(0,230,118,0.5)' },
          '100%': { textShadow: '0 0 25px rgba(0,230,118,1), 0 0 50px rgba(0,230,118,0.5)' },
        },
        glowRed: {
          '0%':   { textShadow: '0 0 8px rgba(255,23,68,0.5)' },
          '100%': { textShadow: '0 0 30px rgba(255,23,68,1), 0 0 60px rgba(255,23,68,0.5)' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',       opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        neonFlicker: {
          '0%, 95%, 100%': { opacity: '1' },
          '96%':            { opacity: '0.85' },
          '97%':            { opacity: '1' },
          '98%':            { opacity: '0.9' },
        },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'neon-green':  '0 0 20px rgba(0,230,118,0.4), 0 0 60px rgba(0,230,118,0.15)',
        'neon-red':    '0 0 20px rgba(255,23,68,0.4),  0 0 60px rgba(255,23,68,0.15)',
        'neon-cyan':   '0 0 20px rgba(0,229,255,0.4),  0 0 60px rgba(0,229,255,0.15)',
        'neon-purple': '0 0 20px rgba(204,68,255,0.4), 0 0 60px rgba(204,68,255,0.15)',
      },
    },
  },
  plugins: [],
}
