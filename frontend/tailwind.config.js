/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // custom colors
        lilac: {
          light: "#e7d6e1",
          DEFAULT: "#C599B6",
          dark: "#896b7f",
        },
        "orchid-pink": "#E6B2BA",
        seashell: "#FFF7F3",
        gunmetal: "#253031",
        "dark-slate": "#315659",
      },
    },
  },
};
