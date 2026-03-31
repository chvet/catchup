import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'catchup': {
          primary: '#6C63FF',
          secondary: '#FF6584',
          accent: '#00D2FF',
          bg: '#F0F2F5',
          dark: '#1A1A2E',
        },
        'parcoureo': '#2D5F8A',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        'bounce-once': {
          '0%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-6px)' },
          '60%': { transform: 'translateY(2px)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'skeleton': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'bounce-once': 'bounce-once 0.6s ease-in-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
