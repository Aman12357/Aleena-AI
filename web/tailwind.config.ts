import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#050510",
        card: "rgba(15,15,40,0.7)",
        glass: "rgba(255,255,255,0.05)",
        accent: "#7c3aed",
        accent2: "#a855f7",
        glow: "#c084fc",
        "neon-blue": "#00f2ff",
        "neon-green": "#00ffaa",
        "neon-amber": "#ffae00",
        "text-main": "#e8e8f0",
        "text-dim": "#8888aa",
        border: "rgba(124,58,237,0.2)",
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        float: "float 6s ease-in-out infinite",
        breathe: "breathe 4s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(124,58,237,0.5), 0 0 20px rgba(124,58,237,0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(124,58,237,0.8), 0 0 60px rgba(124,58,237,0.4)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
