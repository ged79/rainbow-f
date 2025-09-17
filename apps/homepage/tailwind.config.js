/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['Playfair Display', 'Noto Serif KR', 'Crimson Text', 'serif'],
        'sans': ['Noto Sans KR', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        }
      },
      spacing: {
        'section': '80px',
        'container': '1280px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        'card-hover': '0 10px 25px -5px rgb(0 0 0 / 0.1)',
        'nav': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
    }
  },
  plugins: [],
}