/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Navigation (Midnight Navy System)
        navy: {
          midnight: "#0B1D33",
          deep: "#102A46",
          surface: "#153A5B",
          light: "#1C4A73",
        },
        // Primary Interaction (Ocean Blue & Cyan)
        ocean: {
          DEFAULT: "#1677B8",
          deep: "#075B91",
          light: "#E8F3FA",
        },
        cyan: {
          DEFAULT: "#13BFD3",
          light: "#DDF8FA",
          dark: "#0E8B99",
        },
        // Workspace Surfaces & Backgrounds
        ivory: {
          warm: "#F7F8F5",
          soft: "#F1F4F2",
          DEFAULT: "#F7F8F5",
        },
        surface: {
          white: "#FFFFFF",
          pale: "#EDF3F7",
          card: "#FFFFFF",
          subtle: "#FAFBF9",
          border: "#E2DBD0",
          "border-light": "#E9F0F5",
        },
        // Text
        text: {
          primary: "#152D46",
          secondary: "#60758A",
          muted: "#91A1AF",
          onNavy: "#F5FAFF",
        },
        // Semantic Status
        status: {
          active: "#0D9488",
          warning: "#D97706",
          critical: "#DC2626",
          unknown: "#6B7280",
          info: "#1677B8",
        },
      },
      fontFamily: {
        display: [
          "'Outfit'",
          "'Space Grotesk'",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        grotesk: [
          "'Space Grotesk'",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        body: ["'Outfit'", "'Manrope'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
        sans: ["'Outfit'", "'Manrope'", "system-ui", "-apple-system", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.7s ease-out forwards",
        "slide-in-right": "slideInRight 0.7s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [],
};
