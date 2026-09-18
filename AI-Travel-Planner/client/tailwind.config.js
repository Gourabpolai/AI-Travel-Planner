/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
        heading: ['"Playfair Display"', 'serif'],
      },
      colors: {
        deep: '#3d4127',
        olive: '#636b2f',
        'soft-olive': '#bac095',
        lime: '#d4de95',
        paper: '#f7f7f1',
        line: '#e3e5d7',
        muted: '#7d826a',
        brand: {
          50: '#f7f8f0',
          100: '#eef1da',
          200: '#dce4b2',
          300: '#d4de95',
          400: '#bac095',
          500: '#899446',
          600: '#636b2f',
          700: '#505726',
          800: '#3d4127',
          900: '#2c2f1c',
          950: '#1b1d11',
        },
        sand: {
          50: '#fdfdfb',
          100: '#f7f7f1',
          200: '#eef0e3',
          300: '#e3e5d7',
          400: '#cfd3be',
          500: '#bac095',
          600: '#9fa875',
          700: '#7d826a',
          800: '#636b2f',
          900: '#3d4127',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
