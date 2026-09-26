/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FAFAFA',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'sidebar': 'none',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
