import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/**
 * EvntCult Cinematic Editorial Design Tokens.
 * Deep charcoal (#161820), warm ivory (#EFEAE0), champagne gold (#D4B87A),
 * Cormorant Garamond 600/700 italic display, Inter 300/400/500 body & micro labels.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: "#EFEAE0",
        canvas: "rgb(var(--c-canvas) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        sunken: "rgb(var(--c-sunken) / <alpha-value>)",
        mist: "rgb(var(--c-mist) / <alpha-value>)",
        line: {
          DEFAULT: "rgb(var(--c-line) / <alpha-value>)",
          strong: "rgb(var(--c-line-strong) / <alpha-value>)",
        },
        cream: "#EFEAE0",
        lavender: {
          DEFAULT: "rgb(var(--c-lavender) / <alpha-value>)",
          hover: "rgb(var(--c-lavender-hover) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
          2: "rgb(var(--c-ink-2) / <alpha-value>)",
          muted: "rgb(var(--c-ink-muted) / <alpha-value>)",
          subtle: "rgb(var(--c-ink-subtle) / <alpha-value>)",
          inverse: "#161820",
        },
        night: {
          DEFAULT: "#161820",
          2: "#1E212B",
          3: "#101218",
          line: "rgba(239,234,224,0.14)",
        },
        accent: {
          DEFAULT: "#D4B87A",
          hover: "#E0C78E",
          soft: "rgb(var(--c-accent-soft) / <alpha-value>)",
          ink: "rgb(var(--c-accent-ink) / <alpha-value>)",
          foreground: "#161820",
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
          foreground: "#EFEAE0",
        },
        border: "rgb(var(--c-line) / <alpha-value>)",
        input: "rgb(var(--c-line-strong) / <alpha-value>)",
        ring: "#D4B87A",
        gold: {
          DEFAULT: "#D4B87A",
          soft: "rgb(var(--c-gold-soft) / <alpha-value>)",
          ink: "rgb(var(--c-gold-ink) / <alpha-value>)",
        },
        live: {
          DEFAULT: "rgb(var(--c-live) / <alpha-value>)",
          soft: "rgb(var(--c-live-soft) / <alpha-value>)",
          dot: "#D4B87A",
        },
        warn: {
          DEFAULT: "rgb(var(--c-warn) / <alpha-value>)",
          soft: "rgb(var(--c-warn-soft) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--c-danger) / <alpha-value>)",
          soft: "rgb(var(--c-danger-soft) / <alpha-value>)",
        },
        volt: { DEFAULT: "#D4B87A", hover: "#E0C78E" },
        brand: {
          DEFAULT: "#D4B87A",
          hover: "#E0C78E",
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
        "display-2xl": ["clamp(44px, 5.8vw, 76px)", { lineHeight: "0.94", letterSpacing: "-0.02em" }],
        "display-xl": ["clamp(36px, 4.2vw, 56px)", { lineHeight: "0.98", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(28px, 3vw, 42px)", { lineHeight: "1.04", letterSpacing: "-0.015em" }],
        "display-md": ["clamp(22px, 2.2vw, 28px)", { lineHeight: "1.14", letterSpacing: "-0.01em" }],
        h3: ["22px", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        h4: ["16px", { lineHeight: "1.35" }],
        body: ["16px", { lineHeight: "1.6" }],
        lead: ["18px", { lineHeight: "1.55" }],
        small: ["14px", { lineHeight: "1.5" }],
        micro: ["10.5px", { lineHeight: "1.3", letterSpacing: "0.14em" }],
      },
      letterSpacing: {
        tightest: "-0.025em",
        tighter: "-0.018em",
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
        panel: "20px",
        "4xl": "24px",
      },
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
        slow: "550ms",
      },
      keyframes: {
        "caret-blink": {
          "0%, 45%": { opacity: "1" },
          "55%, 92%": { opacity: "0.1" },
          "100%": { opacity: "1" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
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
