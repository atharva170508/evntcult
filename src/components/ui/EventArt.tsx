import { cn } from "@/lib/utils";

/**
 * Generated poster for events without an uploaded image.
 *
 * Styled like a printed campus poster rather than a gradient blob: one flat ink
 * colour, one bold geometric shape in a second colour, a thin rule grid, and paper
 * grain on top. Each accent has its own shape so cards are recognisable at a glance.
 * Posters are vivid in both themes, so text on them uses `paper`, never `ink`.
 */
type Poster = { base: string; shape: string; line: string; kind: "sun" | "rings" | "stripes" | "half" | "grid" | "arch" | "dots" };

const POSTERS: Record<string, Poster> = {
  violet: { base: "#4f3cf0", shape: "#ff8ad8", line: "#ffffff", kind: "sun" },
  blue: { base: "#1f3bd6", shape: "#7fd3ff", line: "#ffffff", kind: "rings" },
  orange: { base: "#ff5a36", shape: "#ffd043", line: "#2a0f06", kind: "half" },
  teal: { base: "#0d7d74", shape: "#b9f36b", line: "#ffffff", kind: "stripes" },
  pink: { base: "#d92a72", shape: "#ffb36b", line: "#ffffff", kind: "arch" },
  green: { base: "#11603d", shape: "#e6ff6b", line: "#ffffff", kind: "grid" },
  red: { base: "#c81f33", shape: "#ffd2b0", line: "#ffffff", kind: "dots" },
};

function Shape({ p }: { p: Poster }) {
  const s = p.shape;
  switch (p.kind) {
    case "sun":
      return (
        <>
          <circle cx="78" cy="34" r="30" fill={s} />
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x="77" y="-10" width="2" height="14" fill={s} transform={`rotate(${i * 30} 78 34)`} />
          ))}
        </>
      );
    case "rings":
      return (
        <g fill="none" stroke={s} strokeWidth="5">
          {[14, 26, 38, 50].map((r) => (
            <circle key={r} cx="86" cy="22" r={r} />
          ))}
        </g>
      );
    case "half":
      return <path d="M40 100 A 40 40 0 0 1 120 100 Z" fill={s} transform="translate(-4 -30)" />;
    case "stripes":
      return (
        <g fill={s}>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={52 + i * 11} y="-20" width="5" height="140" transform="rotate(24 80 50)" />
          ))}
        </g>
      );
    case "arch":
      return <path d="M58 100 V52 A 26 26 0 0 1 110 52 V100 Z" fill={s} transform="translate(0 -18)" />;
    case "grid":
      return (
        <g fill={s}>
          {Array.from({ length: 16 }, (_, i) => (
            <rect key={i} x={60 + (i % 4) * 11} y={8 + Math.floor(i / 4) * 11} width="7" height="7" rx="1.5" />
          ))}
        </g>
      );
    case "dots":
      return (
        <g fill={s}>
          {Array.from({ length: 20 }, (_, i) => (
            <circle key={i} cx={58 + (i % 5) * 10} cy={10 + Math.floor(i / 5) * 10} r={2 + ((i * 7) % 4)} />
          ))}
        </g>
      );
  }
}

export function EventArt({ accent, className, intensity = 1 }: { accent: string; className?: string; intensity?: number }) {
  const p = POSTERS[accent] ?? POSTERS.violet;
  return (
    <div aria-hidden className={cn("grain pointer-events-none absolute inset-0 overflow-hidden", className)} style={{ background: p.base }}>
      {/* Thin print grid across the whole poster. */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.1 * intensity,
          backgroundImage: `linear-gradient(${p.line} 1px, transparent 1px), linear-gradient(90deg, ${p.line} 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
          backgroundPosition: "-1px -1px",
        }}
      />
      {/* The shape lives in a square box pinned top-right, so it never sits under the title. */}
      <svg
        viewBox="34 -26 100 100"
        className="absolute -right-[6%] -top-[12%] aspect-square h-[115%] max-h-[300px] max-w-[52%]"
        style={{ opacity: intensity }}
      >
        <Shape p={p} />
      </svg>
      {/* Keeps white text readable at the bottom of tall posters. */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/35 to-transparent" />
    </div>
  );
}

export const accentHex = (accent: string) => (POSTERS[accent] ?? POSTERS.violet).base;
