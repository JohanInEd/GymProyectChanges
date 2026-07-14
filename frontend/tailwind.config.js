export default {
  darkMode: "class",
  future: {
    relativeContentPathsByDefault: true,
  },
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(10px, -22px) scale(1.05)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-16px, 18px) scale(1.08)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "bell-ring": {
          "0%, 78%, 100%": { transform: "rotate(0deg)" },
          "80%": { transform: "rotate(13deg)" },
          "83%": { transform: "rotate(-11deg)" },
          "86%": { transform: "rotate(9deg)" },
          "89%": { transform: "rotate(-6deg)" },
          "92%": { transform: "rotate(3deg)" },
          "95%": { transform: "rotate(-1deg)" },
        },
      },
      animation: {
        float: "float 9s ease-in-out infinite",
        "float-slow": "float-slow 14s ease-in-out infinite",
        "pop-in": "pop-in 260ms ease-out both",
        "bell-ring": "bell-ring 4.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
