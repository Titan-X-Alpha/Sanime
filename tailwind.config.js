/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080910",
        surface: {
          DEFAULT: "#11121C",
          elevated: "#191A29",
          card: "rgba(25, 26, 41, 0.7)",
        },
        accent: {
          DEFAULT: "#8B3DFF",
          hover: "#9E5CFF",
          light: "#B58AFF",
          muted: "rgba(139, 61, 255, 0.15)",
        },
        border: {
          DEFAULT: "#302B48",
          subtle: "rgba(48, 43, 72, 0.5)",
          active: "#8B3DFF",
        },
        text: {
          primary: "#F5F3FF",
          secondary: "#A7A5B8",
          muted: "#6C6885",
        },
        status: {
          success: "#36C98F",
          warning: "#F3B64D",
          error: "#FF647C",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(139, 61, 255, 0.35)",
        "glow-lg": "0 0 45px -5px rgba(139, 61, 255, 0.5)",
        card: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      backdropBlur: {
        glass: "16px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "purple-gradient": "linear-gradient(135deg, #8B3DFF 0%, #6E26E5 100%)",
        "purple-glow": "radial-gradient(circle at 50% 50%, rgba(139, 61, 255, 0.15), transparent 70%)",
      },
    },
  },
  plugins: [],
};
