import type { Config } from "tailwindcss";

/**
 * EvntCult design tokens — dark "cinematic event night" theme (M7 redesign).
 * References: luxury event-agency sites (huge editorial serif, marquee type),
 * premium booking platforms (purple→blue aurora gradients, glass cards, volt-lime CTAs).
 * Near-black control-room canvas, bright poster accents (violet + sun yellow).
 * Every text colour here passes WCAG AA (4.5:1) on canvas and surface.
 * `ink.inverse` is the dark text used on light fills (ink pills, brand buttons, white chips).
 * Ideas combined from Meetup / District (dark pill buttons, rounded cards),
 * Luma (per-event poster colours), Eventbrite & AllEvents (badges, price labels),
 * Unstop / Zoho Backstage (app sidebar, number boxes).
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#08080c",
        surface: "#121219",
        line: { DEFAULT: "#262a35", strong: "#353a48" },
        ink: {
          DEFAULT: "#f2f3f7",
          2: "#c8ccd8",
          muted: "#9aa0b1",
          subtle: "#7d8396",
          inverse: "#08080c",
        },
        brand: {
          DEFAULT: "#7c66ff",
          hover: "#9480ff",
          soft: "#221d45",
          ink: "#a594ff",
        },
        live: { DEFAULT: "#34d399", soft: "#0f2a20" },
        warn: { DEFAULT: "#fbbf24", soft: "#2e230b" },
        danger: { DEFAULT: "#ff6b6e", soft: "#331618" },
        sun: "#ffd25e",
        /** Neon-lime call-to-action accent (always with dark text). */
        volt: { DEFAULT: "#d4ff3a", hover: "#e2ff73" },
        /** Aurora gradient stops: violet → electric blue → magenta. */
        aurora: { 1: "#7c66ff", 2: "#4f7bff", 3: "#b14dff" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Consolas", "monospace"],
        /** Editorial serif for statements and huge headlines (Instrument Serif). */
        serif: ["var(--font-serif)", "Georgia", "Times New Roman", "serif"],
        /** Wide poster grotesk for uppercase shouts (Unbounded). */
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.025em",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.03) inset, 0 10px 30px -18px rgba(0,0,0,0.8)",
        pop: "0 30px 70px -30px rgba(0,0,0,0.9)",
        brand: "0 12px 30px -12px rgba(124,102,255,0.55)",
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
        drift: {
          "0%, 100%": { transform: "translateY(0) rotate(var(--tilt, 0deg))" },
          "50%": { transform: "translateY(-14px) rotate(var(--tilt, 0deg))" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        aurora: {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(4%,-6%) scale(1.12)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "pulse-dot": "pulse_dot 1.6s ease-in-out infinite",
        float: "float 5s ease-in-out infinite",
        drift: "drift 7s ease-in-out infinite",
        marquee: "marquee 38s linear infinite",
        "spin-slow": "spin 18s linear infinite",
        aurora: "aurora 14s ease-in-out infinite",
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
