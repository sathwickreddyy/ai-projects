/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        arch: {
          bg: '#0a0a0f',
          surface: '#0f1117',
          panel: '#161b27',
          border: '#1e2430',
          text: '#c9d1e0',
          muted: '#6b7280',
          accent: '#2563eb',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
