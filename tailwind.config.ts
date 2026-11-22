import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/**
 * EvntCult design tokens.
 *
 * Browse like a marketplace, feel like a warm product site: a cream page, white cards,
 * #1A1A1A ink, lavender call-to-action buttons with a dark outline, brand red for search,
 * the logo and live states. Figtree for the interface, EB Garamond for big headlines.
 *
 * Contrast (WCAG 2.1 on white): ink 15.9 · ink-2 10.7 · ink-muted 5.4 · ink-subtle 4.9
 * · white on accent 4.6.
 *
 * Older token names (canvas, volt, brand, sun, ink.inverse) are kept as aliases so every
 * screen resolves inside this system.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      /* Colours are CSS variables (RGB channels) so they switch with the theme: see :root and
         .dark in globals.css. Opacity modifiers (bg-canvas/80) keep working. */
      colors: {
        canvas: "rgb(var(--c-canvas) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        sunken: "rgb(var(--c-sunken) / <alpha-value>)",
        mist: "rgb(var(--c-mist) / <alpha-value>)",
        line: { DEFAULT: "rgb(var(--c-line) / <alpha-value>)", strong: "rgb(var(--c-line-strong) / <alpha-value>)" },
        cream: "#FFFFEB",
        lavender: { DEFAULT: "rgb(var(--c-lavender) / <alpha-value>)", hover: "rgb(var(--c-lavender-hover) / <alpha-value>)" },
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
          2: "rgb(var(--c-ink-2) / <alpha-value>)",
          muted: "rgb(var(--c-ink-muted) / <alpha-value>)",
          subtle: "rgb(var(--c-ink-subtle) / <alpha-value>)",
          inverse: "#FFFFFF",
        },
        night: { DEFAULT: "#1A1A1A", 2: "#262626", 3: "#000000", line: "rgba(255,255,255,0.12)" },
        accent: {
          DEFAULT: "#E3264F",
          hover: "#C81E44",
          soft: "rgb(var(--c-accent-soft) / <alpha-value>)",
          ink: "rgb(var(--c-accent-ink) / <alpha-value>)",
          // shadcn components pair bg-accent with this; here accent is the brand red.
          foreground: "#FFFFFF",
        },
        /* shadcn registry tokens, mapped onto EvntCult colours so pulled-in components land on brand. */
        background: "rgb(var(--c-canvas) / <alpha-value>)",
        foreground: "rgb(var(--c-ink) / <alpha-value>)",
        card: { DEFAULT: "rgb(var(--c-surface) / <alpha-value>)", foreground: "rgb(var(--c-ink) / <alpha-value>)" },
        popover: { DEFAULT: "rgb(var(--c-surface) / <alpha-value>)", foreground: "rgb(var(--c-ink) / <alpha-value>)" },
        primary: { DEFAULT: "rgb(var(--c-ink) / <alpha-value>)", foreground: "#FFFFFF" },
        secondary: { DEFAULT: "rgb(var(--c-sunken) / <alpha-value>)", foreground: "rgb(var(--c-ink) / <alpha-value>)" },
        muted: { DEFAULT: "rgb(var(--c-sunken) / <alpha-value>)", foreground: "rgb(var(--c-ink-muted) / <alpha-value>)" },
        destructive: { DEFAULT: "rgb(var(--c-danger) / <alpha-value>)", foreground: "#FFFFFF" },
        border: "rgb(var(--c-line) / <alpha-value>)",
        input: "rgb(var(--c-line-strong) / <alpha-value>)",
        ring: "rgb(var(--c-ink) / <alpha-value>)",
        gold: { DEFAULT: "#C9A45C", soft: "rgb(var(--c-gold-soft) / <alpha-value>)", ink: "rgb(var(--c-gold-ink) / <alpha-value>)" },
        live: { DEFAULT: "rgb(var(--c-live) / <alpha-value>)", soft: "rgb(var(--c-live-soft) / <alpha-value>)", dot: "#12A56F" },
        warn: { DEFAULT: "rgb(var(--c-warn) / <alpha-value>)", soft: "rgb(var(--c-warn-soft) / <alpha-value>)" },
        danger: { DEFAULT: "rgb(var(--c-danger) / <alpha-value>)", soft: "rgb(var(--c-danger-soft) / <alpha-value>)" },

        /* aliases */
        volt: { DEFAULT: "#E3264F", hover: "#C81E44" },
        brand: { DEFAULT: "#E3264F", hover: "#C81E44", soft: "rgb(var(--c-accent-soft) / <alpha-value>)", ink: "rgb(var(--c-accent-ink) / <alpha-value>)" },
        sun: "rgb(var(--c-warn) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
        display: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        logo: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        brand: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-2xl": ["clamp(40px, 5vw, 64px)", { lineHeight: "1.06", letterSpacing: "-0.025em" }],
        "display-xl": ["clamp(32px, 3.6vw, 48px)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(26px, 2.6vw, 32px)", { lineHeight: "1.2", letterSpacing: "-0.015em" }],
        "display-md": ["clamp(22px, 2vw, 26px)", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        h3: ["20px", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
        h4: ["16px", { lineHeight: "1.35" }],
        body: ["15px", { lineHeight: "1.55" }],
        lead: ["17px", { lineHeight: "1.5" }],
        small: ["13.5px", { lineHeight: "1.45" }],
        micro: ["11.5px", { lineHeight: "1.3", letterSpacing: "0.04em" }],
      },
      letterSpacing: {
        tightest: "-0.035em",
        tighter: "-0.022em",
      },
      spacing: {
        section: "clamp(80px, 11vw, 152px)",
        gutter: "clamp(20px, 4vw, 48px)",
      },
      maxWidth: {
        shell: "1280px",
        prose: "660px",
      },
      borderRadius: {
        tile: "12px",
        card: "16px",
        panel: "24px",
        "4xl": "2rem",
      },
      boxShadow: {
        /* Warm-tinted, lit from above (DESIGN.md › Elevation & Depth). */
        card: "0 0 0 1px rgb(var(--c-line-strong)), inset 0 1px 0 var(--edge-hi-c)",
        raised: "0 1px 2px rgba(60,40,10,0.06), 0 10px 28px -8px rgba(60,40,10,0.16)",
        pop: "0 0 0 1px rgba(60,40,10,0.06), 0 16px 40px -10px rgba(60,40,10,0.22)",
        search: "0 1px 2px rgba(60,40,10,0.06), 0 6px 18px -4px rgba(60,40,10,0.14)",
        inset: "inset 0 1px 0 var(--edge-hi-c)",
        button: "inset 0 1px 0 rgba(255,255,255,0.5)",
        accent: "inset 0 1px 0 rgba(255,255,255,0.5)",
        brand: "none",
        float: "0 1px 2px rgba(60,40,10,0.06), 0 10px 28px -8px rgba(60,40,10,0.16)",
        glow: "0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.08)",
      },
      transitionTimingFunction: {
        /* quick out, long settle — default for UI */
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        /* tactile overshoot for press/release */
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        apple: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        /* antislop-design motion table: hover 150ms, entrances 200–250ms. */
        fast: "150ms",
        base: "200ms",
        slow: "250ms",
      },
      keyframes: {
        "caret-blink": {
          "0%, 45%": { opacity: "1" },
          "55%, 92%": { opacity: "0.1" },
          "100%": { opacity: "1" },
        },
        "type-in": {
          "0%": { opacity: "0", transform: "translateY(0.12em)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
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
          "0%": { opacity: "0", transform: "scale(0.97) translateY(6px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        pulse_dot: {
          "0%": { boxShadow: "0 0 0 0 rgba(18,165,111,0.45)" },
          "70%": { boxShadow: "0 0 0 6px rgba(18,165,111,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(18,165,111,0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(450%)" },
        },
        flap: {
          "0%": { transform: "rotateX(90deg)", opacity: "0" },
          "60%": { transform: "rotateX(-8deg)", opacity: "1" },
          "100%": { transform: "rotateX(0)", opacity: "1" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "caret-blink": "caret-blink 1.1s ease-in-out infinite",
        "type-in": "type-in 140ms cubic-bezier(0.16,1,0.3,1) both",
        "fade-up": "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.4s cubic-bezier(0.16,1,0.3,1) both",
        "slide-in-right": "slide-in-right 0.42s cubic-bezier(0.16,1,0.3,1) both",
        "scale-in": "scale-in 0.32s cubic-bezier(0.16,1,0.3,1) both",
        "pulse-dot": "pulse_dot 1.8s cubic-bezier(0.16,1,0.3,1) infinite",
        marquee: "marquee 48s linear infinite",
        shimmer: "shimmer 1.4s linear infinite",
        flap: "flap 520ms cubic-bezier(0.2,0.9,0.25,1) both",
        rise: "rise 900ms cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [animate],
};

export default config;
