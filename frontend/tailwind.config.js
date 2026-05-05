export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT:"#2563EB", dark:"#1d4ed8", light:"#3b82f6", 50:"#eff6ff", 100:"#dbeafe" },
        secondary: { DEFAULT:"#6366f1", light:"#818cf8" },
        accent:    "#06b6d4",
        success:   "#10b981",
        warning:   "#f59e0b",
        danger:    "#ef4444",
        dark:      { DEFAULT:"#0A0F1E", card:"#111827", border:"#1f2937", muted:"#374151" },
      },
      fontFamily: {
       
        display:  ["'Lilita One'",   "sans-serif"],
        heading:  ["'Lilita One'",   "sans-serif"],
       
        josefin:  ["'Josefin Sans'", "sans-serif"],
        
        sans:     ["'Exo 2'",        "'Inter'", "sans-serif"],
        body:     ["'Exo 2'",        "'Inter'", "sans-serif"],
        ui:       ["'Exo 2'",        "'Inter'", "sans-serif"],
        exo:      ["'Exo 2'",        "sans-serif"],
       
        bungee:   ["'Bungee'",       "sans-serif"],
      },
      borderRadius: { "2xl":"16px", "3xl":"24px", "4xl":"32px" },
      boxShadow: {
        soft:      "0 2px 12px rgba(0,0,0,0.05)",
        card:      "0 4px 24px rgba(0,0,0,0.07)",
        blue:      "0 4px 16px rgba(37,99,235,0.28)",
        "blue-lg": "0 8px 28px rgba(37,99,235,0.35)",
        glow:      "0 0 20px rgba(37,99,235,0.2)",
      },
    },
  },
  plugins: [],
}