import type { Config } from "tailwindcss";

/**
 * EvntCult design tokens — light "campus app" theme.
 * Ideas combined from Meetup / District (dark pill buttons, rounded cards),
 * Luma (per-event poster colours), Eventbrite & AllEvents (badges, price labels),
 * Unstop / Zoho Backstage (app sidebar, number boxes).
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f4f4f7",
        surface: "#ffffff",
        line: { DEFAULT: "#e8e8ef", strong: "#d8d8e2" },
        ink: {
          DEFAULT: "#121218",
          2: "#3d3d48",
          muted: "#6b6b79",
          subtle: "#9c9ca8",
        },
        brand: {
          DEFAULT: "#5b3fff",
          hover: "#4a2fee",
          soft: "#efebff",
          ink: "#3b22d6",
        },
        live: { DEFAULT: "#0fa968", soft: "#e2f7ee" },
        warn: { DEFAULT: "#d97b00", soft: "#fff3df" },
        danger: { DEFAULT: "#e5383b", soft: "#fdeced" },
        sun: "#ffd25e",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Consolas", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.025em",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,18,24,0.04), 0 10px 30px -18px rgba(18,18,24,0.18)",
        pop: "0 30px 70px -30px rgba(18,18,24,0.45)",
        brand: "0 12px 30px -12px rgba(91,63,255,0.55)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse_dot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.8)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "pulse-dot": "pulse_dot 1.6s ease-in-out infinite",
        float: "float 5s ease-in-out infinite",
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
