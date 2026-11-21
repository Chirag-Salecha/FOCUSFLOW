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
        cyber: {
          bg: 'var(--cyber-bg)',
          card: 'var(--cyber-card)',
          border: 'var(--cyber-border)',
          'border-rgb': 'rgb(var(--cyber-border-rgb) / <alpha-value>)',
          primary: 'rgb(var(--cyber-primary-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--cyber-secondary-rgb) / <alpha-value>)',
          accent: 'rgb(var(--cyber-accent-rgb) / <alpha-value>)',
          success: 'rgb(var(--cyber-success-rgb) / <alpha-value>)',
          warning: 'rgb(var(--cyber-warning-rgb) / <alpha-value>)',
          danger: 'rgb(var(--cyber-danger-rgb) / <alpha-value>)',
          text: 'var(--cyber-text)',
          textMuted: 'var(--cyber-text-muted)',
          textBold: 'var(--cyber-text-bold)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif']
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'neon-cyan': '0 0 15px rgba(0, 255, 204, 0.25)',
        'neon-purple': '0 0 15px rgba(138, 43, 226, 0.25)',
        'neon-pink': '0 0 15px rgba(255, 0, 127, 0.25)'
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '12px'
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
