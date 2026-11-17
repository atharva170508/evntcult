import type { Config } from "tailwindcss";

/**
 * EvntCult design tokens — "Concourse".
 *
 * Campus life as a terminal: events depart, passes board, the gate scans. A calm white
 * page, a deep night navy for cinematic bands and primary actions, one crimson for the
 * action that matters most, and a brass gold used only as foil on passes.
 * Fraunces (upright, soft optical serif) carries headlines; Figtree carries the interface;
 * JetBrains Mono is reserved for pass codes and timetable figures.
 *
 * Contrast (WCAG 2.1 on white): ink 17.9 · ink-2 10.9 · ink-muted 5.9 · ink-subtle 4.8
 * · accent-ink 6.6 · white on accent 4.9 · white on night 18.4.
 *
 * Older token names (canvas, volt, brand, sun, ink.inverse) are kept as aliases so every
 * screen resolves inside this system.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FFFFFF",
        surface: "#FFFFFF",
        sunken: "#F4F5F7",
        mist: "#EEF0F3",
        line: { DEFAULT: "#E5E7EB", strong: "#D2D6DC" },
        ink: {
          DEFAULT: "#14161B",
          2: "#383D47",
          muted: "#5B626E",
          subtle: "#6A717D",
          inverse: "#FFFFFF",
        },
        night: { DEFAULT: "#0B1626", 2: "#132238", 3: "#1C2E48", line: "rgba(255,255,255,0.12)" },
        accent: {
          DEFAULT: "#D9234B",
          hover: "#BE1B3F",
          soft: "#FDECEF",
          ink: "#B01A3C",
        },
        gold: { DEFAULT: "#C9A45C", soft: "#F7F0E1", ink: "#7A5D1F" },
        live: { DEFAULT: "#0B7A54", soft: "#E3F3EC", dot: "#12A56F" },
        warn: { DEFAULT: "#8A5300", soft: "#FBF0DC" },
        danger: { DEFAULT: "#B42318", soft: "#FDECEA" },

        /* aliases */
        volt: { DEFAULT: "#D9234B", hover: "#BE1B3F" },
        brand: { DEFAULT: "#D9234B", hover: "#BE1B3F", soft: "#FDECEF", ink: "#B01A3C" },
        sun: "#8A5300",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        serif: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        logo: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        brand: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-2xl": ["clamp(52px, 8vw, 120px)", { lineHeight: "0.96", letterSpacing: "-0.035em" }],
        "display-xl": ["clamp(42px, 6vw, 88px)", { lineHeight: "1", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(34px, 4.2vw, 58px)", { lineHeight: "1.04", letterSpacing: "-0.025em" }],
        "display-md": ["clamp(26px, 3vw, 38px)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        h3: ["22px", { lineHeight: "1.25", letterSpacing: "-0.015em" }],
        h4: ["17px", { lineHeight: "1.35", letterSpacing: "-0.01em" }],
        body: ["15.5px", { lineHeight: "1.6" }],
        lead: ["18.5px", { lineHeight: "1.55", letterSpacing: "-0.005em" }],
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
        card: "18px",
        panel: "26px",
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 0 0 1px #E5E7EB",
        raised: "0 0 0 1px rgba(20,22,27,0.04), 0 6px 20px -4px rgba(20,22,27,0.10)",
        pop: "0 0 0 1px rgba(20,22,27,0.05), 0 18px 48px -12px rgba(20,22,27,0.22)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.9)",
        button: "0 1px 1px rgba(11,22,38,0.18)",
        accent: "0 1px 1px rgba(176,26,60,0.25), 0 8px 18px -8px rgba(217,35,75,0.55)",
        brand: "0 8px 18px -8px rgba(217,35,75,0.5)",
        float: "0 1px 2px rgba(20,22,27,0.06), 0 10px 28px -6px rgba(20,22,27,0.14)",
      },
      transitionTimingFunction: {
        /* quick out, long settle — default for UI */
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        /* tactile overshoot for press/release */
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        apple: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        fast: "160ms",
        base: "240ms",
        slow: "420ms",
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
  plugins: [],
};

export default config;
