import type { Config } from "tailwindcss";

/**
 * EvntCult design system (master prompt §3–§7). Every value comes from src/styles/tokens.css.
 * One accent (acid lime), three radii plus a pill, seven type sizes, hairlines instead of shadows,
 * no load animation. Text on the accent is always `ink.inverse`.
 */
const v = (name: string) => `color-mix(in srgb, var(--${name}) calc(<alpha-value> * 100%), transparent)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    /* §5 — the only type sizes in the product. */
    fontSize: {
      caption: ["var(--fs-caption)", { lineHeight: "1.5" }],
      label: ["var(--fs-label)", { lineHeight: "1.5", fontWeight: "500" }],
      "body-sm": ["var(--fs-body-sm)", { lineHeight: "1.5" }],
      body: ["var(--fs-body)", { lineHeight: "1.5" }],
      title: ["var(--fs-title)", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
      heading: ["var(--fs-heading)", { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "600" }],
      display: ["var(--fs-display)", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" }],
    },
    /* §4 — three radii and a pill. */
    borderRadius: {
      none: "0",
      sm: "var(--r-1)",
      DEFAULT: "var(--r-1)",
      md: "var(--r-2)",
      lg: "var(--r-3)",
      full: "var(--r-pill)",
    },
    /* §2 law 7 — hairlines, not shadows. Overlays only. */
    boxShadow: {
      none: "none",
      overlay: "var(--shadow-overlay)",
    },
    /* §7 — four durations, two curves. */
    transitionDuration: {
      DEFAULT: "var(--t-micro)",
      0: "0ms",
      press: "var(--t-press)",
      micro: "var(--t-micro)",
      standard: "var(--t-standard)",
      large: "var(--t-large)",
    },
    transitionTimingFunction: {
      DEFAULT: "var(--ease)",
      standard: "var(--ease)",
      emph: "var(--ease-emph)",
    },
    /* §2 law 8 — nothing animates unless the user caused it. A spinner shows only while something the user started is loading. */
    animation: {
      none: "none",
      spin: "spin 700ms linear infinite",
    },
    extend: {
      colors: {
        white: v("text"),
        black: v("surface-0"),
        canvas: v("surface-0"),
        surface: { DEFAULT: v("surface-1"), 2: v("surface-2"), 3: v("surface-3") },
        line: { DEFAULT: v("hair"), strong: v("hair-strong") },
        ink: {
          DEFAULT: v("text"),
          2: v("text-muted"),
          muted: v("text-muted"),
          subtle: v("text-dim"),
          inverse: v("accent-ink"),
        },
        accent: { DEFAULT: v("accent"), ink: v("accent-ink") },
        /* Old names kept so existing classes resolve to the one accent. */
        volt: { DEFAULT: v("accent"), hover: v("accent") },
        brand: { DEFAULT: v("accent"), hover: v("accent"), ink: v("accent"), soft: v("surface-2") },
        live: { DEFAULT: v("ok"), soft: v("surface-2") },
        ok: v("ok"),
        warn: { DEFAULT: v("warn"), soft: v("surface-2") },
        danger: { DEFAULT: v("bad"), soft: v("surface-2") },
        bad: v("bad"),
        sun: v("warn"),
        qr: v("qr-ground"),
        ticket: v("ticket"),
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
        /* The logotype is set in the display face (one display face, §3). */
        logo: ["var(--font-display)"],
        brand: ["var(--font-display)"],
      },
      spacing: {
        "s-1": "var(--s-1)",
        "s-2": "var(--s-2)",
        "s-3": "var(--s-3)",
        "s-4": "var(--s-4)",
        "s-5": "var(--s-5)",
        "s-6": "var(--s-6)",
        "s-7": "var(--s-7)",
        "s-8": "var(--s-8)",
      },
      maxWidth: { app: "1440px", marketing: "1200px", prose: "720px" },
    },
  },
  plugins: [],
};

export default config;
