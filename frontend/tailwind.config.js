/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', '-apple-system', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        body:    ['Inter', '-apple-system', 'sans-serif'],
        mono:    ['Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      colors: {
        accent: {
          DEFAULT: '#C4654A',
          hover:   '#AE5840',
          text:    '#9A4D38',
          light:   'rgba(196, 101, 74, 0.10)',
        },
        sage: {
          DEFAULT: '#4A6741',
          light:   'rgba(74, 103, 65, 0.10)',
        },
      },
      borderRadius: {
        glass:   '16px',
        sidebar: '18px',
        topbar:  '14px',
      },
      boxShadow: {
        glass: '0 4px 24px rgba(31, 20, 12, 0.07), 0 1px 2px rgba(31, 20, 12, 0.04)',
        float: '0 8px 32px rgba(31, 20, 12, 0.10), 0 2px 8px rgba(31, 20, 12, 0.05)',
        card:  '0 2px 12px rgba(31, 20, 12, 0.05), 0 1px 3px rgba(31, 20, 12, 0.03)',
      },
      backdropBlur: {
        sm: '8px',
        md: '16px',
        lg: '24px',
      },
    },
  },
  plugins: [],
};
