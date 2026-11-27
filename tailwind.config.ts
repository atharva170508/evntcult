import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/**
 * EvntCult Editorial Record-Sleeve Design Tokens.
 * Dark-led by default: --ink (#151412) ground, --paper (#EEE8DD) ink,
 * --surface (#1D1B18) tinted ground, --accent (#C9A26B) warm gold.
 * Structured strictly by 1px hairlines and surface tints — zero drop shadows.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: "#EEE8DD",
        canvas: "rgb(var(--c-canvas) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        sunken: "rgb(var(--c-sunken) / <alpha-value>)",
        mist: "rgb(var(--c-mist) / <alpha-value>)",
        line: {
          DEFAULT: "rgb(var(--c-line) / <alpha-value>)",
          strong: "rgb(var(--c-line-strong) / <alpha-value>)",
        },
        cream: "#EEE8DD",
        lavender: {
          DEFAULT: "rgb(var(--c-lavender) / <alpha-value>)",
          hover: "rgb(var(--c-lavender-hover) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
          2: "rgb(var(--c-ink-2) / <alpha-value>)",
          muted: "rgb(var(--c-ink-muted) / <alpha-value>)",
          subtle: "rgb(var(--c-ink-subtle) / <alpha-value>)",
          inverse: "#151412",
        },
        night: {
          DEFAULT: "#151412",
          2: "#1D1B18",
          3: "#0F0E0C",
          line: "rgba(238,232,221,0.15)",
        },
        accent: {
          DEFAULT: "#C9A26B",
          hover: "#D7B47F",
          soft: "rgb(var(--c-accent-soft) / <alpha-value>)",
          ink: "rgb(var(--c-accent-ink) / <alpha-value>)",
          foreground: "#151412",
        },
        background: "rgb(var(--c-canvas) / <alpha-value>)",
        foreground: "rgb(var(--c-ink) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--c-surface) / <alpha-value>)",
          foreground: "rgb(var(--c-ink) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--c-surface) / <alpha-value>)",
          foreground: "rgb(var(--c-ink) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
          foreground: "rgb(var(--c-canvas) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--c-sunken) / <alpha-value>)",
          foreground: "rgb(var(--c-ink) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--c-sunken) / <alpha-value>)",
          foreground: "rgb(var(--c-ink-muted) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--c-danger) / <alpha-value>)",
          foreground: "#EEE8DD",
        },
        border: "rgb(var(--c-line) / <alpha-value>)",
        input: "rgb(var(--c-line-strong) / <alpha-value>)",
        ring: "#C9A26B",
        gold: {
          DEFAULT: "#C9A26B",
          soft: "rgb(var(--c-gold-soft) / <alpha-value>)",
          ink: "rgb(var(--c-gold-ink) / <alpha-value>)",
        },
        live: {
          DEFAULT: "rgb(var(--c-live) / <alpha-value>)",
          soft: "rgb(var(--c-live-soft) / <alpha-value>)",
          dot: "#C9A26B",
        },
        warn: {
          DEFAULT: "rgb(var(--c-warn) / <alpha-value>)",
          soft: "rgb(var(--c-warn-soft) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--c-danger) / <alpha-value>)",
          soft: "rgb(var(--c-danger-soft) / <alpha-value>)",
        },
        volt: { DEFAULT: "#C9A26B", hover: "#D7B47F" },
        brand: {
          DEFAULT: "#C9A26B",
          hover: "#D7B47F",
          soft: "rgb(var(--c-accent-soft) / <alpha-value>)",
          ink: "rgb(var(--c-accent-ink) / <alpha-value>)",
        },
        sun: "rgb(var(--c-warn) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
        display: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        logo: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        brand: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      fontSize: {
        "display-2xl": ["clamp(48px, 6vw, 76px)", { lineHeight: "0.98", letterSpacing: "-0.02em" }],
        "display-xl": ["clamp(36px, 4.2vw, 56px)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(28px, 3vw, 40px)", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(22px, 2.2vw, 28px)", { lineHeight: "1.18", letterSpacing: "-0.015em" }],
        h3: ["20px", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
        h4: ["16px", { lineHeight: "1.35" }],
        body: ["16px", { lineHeight: "1.55" }],
        lead: ["18px", { lineHeight: "1.55" }],
        small: ["14px", { lineHeight: "1.5" }],
        micro: ["11px", { lineHeight: "1.3", letterSpacing: "0.06em" }],
      },
      letterSpacing: {
        tightest: "-0.025em",
        tighter: "-0.02em",
      },
      spacing: {
        section: "clamp(88px, 10vw, 140px)",
        gutter: "clamp(20px, 3.5vw, 40px)",
      },
      maxWidth: {
        shell: "1200px",
        prose: "680px",
      },
      borderRadius: {
        tile: "8px",
        card: "8px",
        panel: "24px",
        "4xl": "24px",
      },
      /* Strictly hairline-only — zero drop shadows anywhere */
      boxShadow: {
        card: "0 0 0 1px var(--line)",
        raised: "0 0 0 1px var(--line-strong)",
        pop: "0 0 0 1px var(--line-strong)",
        search: "0 0 0 1px var(--line-strong)",
        inset: "none",
        button: "none",
        accent: "none",
        brand: "none",
        float: "0 0 0 1px var(--line-strong)",
        glow: "0 0 0 1px var(--line)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
        spring: "cubic-bezier(0.22, 1, 0.36, 1)",
        apple: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        fast: "180ms",
        base: "250ms",
        slow: "600ms",
      },
      keyframes: {
        "caret-blink": {
          "0%, 45%": { opacity: "1" },
          "55%, 92%": { opacity: "0.1" },
          "100%": { opacity: "1" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.98) translateY(4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(450%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "caret-blink": "caret-blink 1.1s ease-in-out infinite",
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.35s cubic-bezier(0.22,1,0.36,1) both",
        "slide-in-right": "slide-in-right 0.4s cubic-bezier(0.22,1,0.36,1) both",
        "scale-in": "scale-in 0.25s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;
