import type { Config } from "tailwindcss";

/**
 * EvntCult design tokens.
 *
 * Built the Realtime Colors way: five roles — text, background, primary, secondary,
 * accent — used roughly 60 / 30 / 10, each defined once for light and once for dark
 * in src/app/globals.css as RGB channels. Every class here reads those variables,
 * so flipping the theme never needs a `dark:` variant in components.
 *
 * `paper` / `night` never flip: use them for text and chips that sit on event
 * posters, which are vivid in both themes.
 */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: v("background"),
        surface: { DEFAULT: v("surface"), 2: v("surface-2") },
        line: { DEFAULT: v("line"), strong: v("line-strong") },
        ink: {
          DEFAULT: v("text"),
          2: v("text-2"),
          muted: v("text-muted"),
          subtle: v("text-subtle"),
          contrast: v("background"),
        },
        brand: {
          DEFAULT: v("primary"),
          hover: v("primary-hover"),
          soft: v("secondary"),
          ink: v("primary-ink"),
          on: v("on-primary"),
        },
        accent: { DEFAULT: v("accent"), soft: v("accent-soft"), on: v("on-accent") },
        live: { DEFAULT: v("live"), soft: v("live-soft") },
        warn: { DEFAULT: v("warn"), soft: v("warn-soft") },
        danger: { DEFAULT: v("danger"), soft: v("danger-soft") },
        sun: v("sun"),
        paper: "#ffffff",
        night: "#0d0c14",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Consolas", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.045em",
        tighter: "-0.03em",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        pop: "var(--shadow-pop)",
        brand: "var(--shadow-brand)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse_dot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.8)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "pulse-dot": "pulse_dot 1.6s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
