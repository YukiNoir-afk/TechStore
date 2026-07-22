/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f6fb",
          100: "#e1ecf7",
          200: "#c3daef",
          300: "#a4c7e7",
          400: "#5f9ad1",
          500: "#2E86C1",
          600: "#1B3A5C",
          700: "#152d48",
          800: "#0f2034",
          900: "#0a1520",
        },
        secondary: {
          50: "#f3f7fc",
          100: "#e7eff9",
          200: "#cfdff3",
          300: "#b7cfed",
          400: "#7fafe1",
          500: "#2E86C1",
          600: "#1d5a8f",
          700: "#164470",
          800: "#0f2e50",
          900: "#0a1830",
        },
        accent: "#E74C3C",
        success: "#27AE60",
        warning: "#F39C12",
        background: "#F8F9FA",
        surface: "#FFFFFF",
        text: {
          primary: "#2C3E50",
          secondary: "#7F8C8D",
        },
      },
      fontFamily: {
        sans: ["Inter", "Nunito", "system-ui", "-apple-system", "sans-serif"],
        heading: ["Plus Jakarta Sans", "Poppins", "system-ui", "-apple-system", "sans-serif"],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.05)",
        md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
        lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
        xl: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
      },
      transitionDuration: {
        200: "200ms",
        300: "300ms",
      },
    },
  },
  plugins: [],
};
