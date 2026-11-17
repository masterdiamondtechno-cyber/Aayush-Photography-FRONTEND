/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FFC629',
          light: '#FFD358',
          dark: '#E0AC1B',
        },
        secondary: '#E0AC1B',
        accent: '#FFC629',
        gold: {
          DEFAULT: '#FFC629',
          50: '#FFFDF0',
          100: '#FFF8D6',
          200: '#FFED99',
          300: '#FFE25C',
          400: '#FFD726',
          500: '#FFC629',
          600: '#E0AC1B',
          700: '#B88B12',
          800: '#8F6B0C',
          900: '#664B06',
        },
        indigo: {
          50: '#FFFDF0',
          100: '#FFF8D6',
          200: '#FFED99',
          300: '#FFE25C',
          400: '#FFD726',
          500: '#FFC629',
          600: '#E0AC1B',
          700: '#B88B12',
          800: '#8F6B0C',
          900: '#664B06',
          950: '#3D2C02',
        },
        dark: {
          DEFAULT: '#090909',
          surface: '#121212',
          card: '#161616',
          border: '#262626',
          muted: '#8E8E93',
        },
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        deva: ['Noto Sans Devanagari', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      spacing: {
        '18': '4.5rem',
      },
    },
  },
  plugins: [],
}