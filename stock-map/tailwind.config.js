/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#0b3d1b',
          light: '#eef3f0',
        }
      },
      fontFamily: {
        sans: ['Prompt', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
