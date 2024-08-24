/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        primary: "#dfdfd7",
        secondary: "#9999a0",
        card: "#252529",
        main: "#73BBA3",
        button: "#88D66C"
      },
      animation: {
        spin: 'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
}