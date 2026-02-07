/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        night: {
          900: '#0a0a1a', // Deep night blue
          800: '#1a1a2e', // Dark violet/blue
          700: '#16213e', // Anthracite/blue
        },
        violet: {
          900: '#2e0249', // Deep violet
          800: '#570a57',
        },
        gold: {
          400: '#fbbf24', // Warm amber
          500: '#f59e0b',
          glow: '#ffaa00',
        },
        grey: {
          900: '#111827', // Anthracite
          800: '#1f2937',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'serif'], // Elegant for typography
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    },
  },
  plugins: [],
}
