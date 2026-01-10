/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sidebar-bg': '#FAFAFA',
        'sidebar-hover': '#F0F0F0',
        'navbar-bg': '#FFFFFF',
      },
    },
  },
  plugins: [],
}