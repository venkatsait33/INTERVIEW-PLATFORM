/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f0ff',
          100: '#e0e0ff',
          500: '#667eea',
          600: '#5a67d8',
          700: '#4c51bf',
          900: '#3730a3',
        },
      },
    },
  },
  plugins: [],
};
