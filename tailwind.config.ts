import type { Config } from "tailwindcss";

/**
 * EvntCult design tokens — "Paper, Ink & Signal".
 *
 * A light, editorial system: warm paper canvas, near-black ink, and ONE signal colour
 * (vermilion) that marks what matters — the live dot, the logo caret, the register button.
 * Primary actions are ink-black; the signal colour is reserved for the single most
 * important action on a screen. Full rationale lives in /DESIGN.md.
 *
 * Contrast (WCAG 2.1): every text colour below is ≥ 4.5:1 on `canvas` and `surface`.
 *   ink 17.3 · ink-2 10.4 · ink-muted 5.8 · ink-subtle 4.8 · accent-ink 5.8 · white on accent 4.6
 *
 * Legacy aliases (volt, brand, sun, ink.inverse) map onto the new palette so any screen
 * not yet touched still renders inside the system. Don't use them in new code.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F6F5F1",
        surface: "#FFFFFF",
        sunken: "#EEECE6",
        line: { DEFAULT: "#E4E1DA", strong: "#D1CDC4" },
        ink: {
          DEFAULT: "#111110",
          2: "#3B3A36",
          muted: "#62605A",
          subtle: "#6E6C66",
          /** Text on ink or accent fills. */
          inverse: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#D93A12",
          hover: "#C2330F",
          soft: "#FBE9E2",
          /** Accent used as text on paper (passes AA). */
          ink: "#B22F0D",
        },
        live: { DEFAULT: "#16734A", soft: "#E4F2EA", dot: "#1F9D63" },
        warn: { DEFAULT: "#8F5200", soft: "#FAEFD9" },
        danger: { DEFAULT: "#B42619", soft: "#FBE7E4" },

        /* ── legacy aliases ───────────────────────────────── */
        volt: { DEFAULT: "#D93A12", hover: "#C2330F" },
        brand: { DEFAULT: "#D93A12", hover: "#C2330F", soft: "#FBE9E2", ink: "#B22F0D" },
        sun: "#8F5200",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
        /** One-word editorial accents inside headlines (<em>). */
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        display: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        logo: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        brand: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        /* [size, { lineHeight, letterSpacing }] — fluid display steps, fixed UI steps */
        "display-2xl": ["clamp(56px, 9vw, 136px)", { lineHeight: "0.9", letterSpacing: "-0.05em" }],
        "display-xl": ["clamp(44px, 6.4vw, 96px)", { lineHeight: "0.95", letterSpacing: "-0.045em" }],
        "display-lg": ["clamp(36px, 4.6vw, 64px)", { lineHeight: "1", letterSpacing: "-0.04em" }],
        "display-md": ["clamp(28px, 3.2vw, 40px)", { lineHeight: "1.05", letterSpacing: "-0.035em" }],
        h3: ["22px", { lineHeight: "1.2", letterSpacing: "-0.025em" }],
        h4: ["17px", { lineHeight: "1.3", letterSpacing: "-0.015em" }],
        body: ["15px", { lineHeight: "1.6", letterSpacing: "-0.005em" }],
        lead: ["18px", { lineHeight: "1.55", letterSpacing: "-0.01em" }],
        small: ["13px", { lineHeight: "1.45" }],
        micro: ["11px", { lineHeight: "1.3", letterSpacing: "0.08em" }],
      },
      letterSpacing: {
        tightest: "-0.045em",
        tighter: "-0.03em",
      },
      spacing: {
        /* section rhythm */
        section: "clamp(72px, 10vw, 136px)",
        gutter: "clamp(16px, 4vw, 40px)",
      },
      maxWidth: {
        shell: "1240px",
        prose: "640px",
      },
      borderRadius: {
        /* controls are pills; containers use these */
        tile: "14px",
        card: "20px",
        panel: "28px",
        "4xl": "2rem",
      },
      boxShadow: {
        /* hairline-first depth: a 1px edge + a soft ambient drop */
        card: "0 0 0 1px rgba(17,17,16,0.06), 0 1px 2px rgba(17,17,16,0.04)",
        raised: "0 0 0 1px rgba(17,17,16,0.06), 0 2px 4px rgba(17,17,16,0.04), 0 12px 32px -12px rgba(17,17,16,0.16)",
        pop: "0 0 0 1px rgba(17,17,16,0.06), 0 24px 64px -20px rgba(17,17,16,0.32)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.9)",
        button: "inset 0 1px 0 rgba(255,255,255,0.14), 0 1px 2px rgba(17,17,16,0.24)",
        accent: "inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px rgba(178,47,13,0.3), 0 8px 20px -8px rgba(217,58,18,0.5)",
        brand: "0 8px 20px -8px rgba(217,58,18,0.45)",
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
          "0%": { boxShadow: "0 0 0 0 rgba(217,58,18,0.45)" },
          "70%": { boxShadow: "0 0 0 6px rgba(217,58,18,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(217,58,18,0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
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
      },
    },
  },
  plugins: [],
};

export default config;
