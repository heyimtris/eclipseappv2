module.exports = {
  darkMode: 'class', // use 'class' for manual toggling
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './public/index.html',
    './index.html'
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#202c39', // custom dark background
        },
        purple: {
          100: '#F3F3FF',
          200: '#E0E0FF',
          300: '#C8C8FF',
          400: '#AFAFFF',
          500: '#8F8FFF',
          600: '#6F6FFF',
          700: '#4F4FFF',
          800: '#2F2FFF',
          900: '#1A1A40',
        },
      },
    },
  },
  plugins: [],
};
