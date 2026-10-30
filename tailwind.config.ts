/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Approved PARJANYAH Light Theme Palette
        ivory: {
          DEFAULT: '#F7F3EA',
          warm: '#F7F3EA',
          soft: '#E8D9BF',
        },
        sand: {
          DEFAULT: '#E8D9BF',
          light: '#F4ECE0',
          dark: '#D4C4A8',
        },
        limestone: '#D4C4A8',
        terracotta: {
          DEFAULT: '#C87954',
          hover: '#B86A45',
          dark: '#9E5635',
          light: '#F8ECE7',
        },
        coral: {
          DEFAULT: '#E99A65',
          light: '#FCEFE7',
        },
        sage: {
          DEFAULT: '#A8B99A',
          dark: '#687B59',
          light: '#EEF3EC',
        },
        seaglass: {
          DEFAULT: '#83B9A9',
          dark: '#659D8E',
          light: '#E6F3EF',
        },
        olive: '#687B59',
        charcoal: {
          DEFAULT: '#454640',
          muted: '#6D6E66',
          light: '#8F9087',
        },
        taupe: {
          DEFAULT: '#A69B89',
          light: '#C4BCAD',
          border: '#D4C4A8',
        },
        mist: '#E6E5DF',
        paleAqua: '#DCEBE4',

        // Semantic light-theme mappings
        surface: {
          DEFAULT: '#F7F3EA',
          white: '#FFFFFF',
          card: '#FFFFFF',
          secondary: '#E8D9BF',
          panel: '#F7F3EA',
          border: '#D4C4A8',
          divider: '#E6E5DF',
          subtle: '#FAF7F0',
        },
        text: {
          primary: '#454640',
          secondary: '#A69B89',
          muted: '#A69B89',
          heading: '#454640',
        },
        status: {
          active: '#83B9A9',
          warning: '#E99A65',
          critical: '#C87954',
          success: '#A8B99A',
          info: '#83B9A9',
          inactive: '#E6E5DF',
        },
        // Fallback backward compatibility tokens
        navy: {
          midnight: '#454640',
          deep: '#454640',
          surface: '#F7F3EA',
          light: '#E8D9BF',
        },
        ocean: {
          DEFAULT: '#C87954',
          deep: '#B86A45',
          light: '#F8ECE7',
        },
        cyan: {
          DEFAULT: '#83B9A9',
          light: '#E6F3EF',
          dark: '#659D8E',
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
