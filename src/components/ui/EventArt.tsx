import { cn } from "@/lib/utils";

/**
 * Generated poster for events without an uploaded image, drawn like a quiet travel poster:
 * a flat sky, one sun, three horizons. Each event gets its own variation of the composition
 * (sun position and size, which way the land falls) from its seed, so a grid of events never
 * repeats, while the category keeps the colour family.
 */
type Palette = { sky: string; sun: string; far: string; near: string; ground: string };

const palettes: Record<string, Palette> = {
  blue: { sky: "#23408F", sun: "#FFD688", far: "#2E57B5", near: "#1A3474", ground: "#10224F" },
  violet: { sky: "#4D2F7C", sun: "#FFC3D2", far: "#623E98", near: "#3D2366", ground: "#29174B" },
  orange: { sky: "#E37B3F", sun: "#FFE7AE", far: "#CF6230", near: "#B04C21", ground: "#853713" },
  teal: { sky: "#167C70", sun: "#F5E9BA", far: "#11695E", near: "#0C534A", ground: "#083C36" },
  pink: { sky: "#C4547D", sun: "#FFE2BD", far: "#AE436C", near: "#913357", ground: "#6C2441" },
  green: { sky: "#4F7D3D", sun: "#F6E8AA", far: "#416B32", near: "#335628", ground: "#243F1C" },
  red: { sky: "#BF3D2E", sun: "#FFDBA4", far: "#A63124", near: "#89271B", ground: "#661B11" },
};

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function EventArt({
  accent,
  seed,
  className,
  scrim = true,
  flat = false,
}: {
  accent: string;
  /** Usually the event id; varies the composition within the colour family. */
  seed?: string;
  className?: string;
  /** Darkens the lower third so overlaid white type stays readable. */
  scrim?: boolean;
  /** Small tiles: just the sky and the land, no sun, so type sits cleanly on top. */
  flat?: boolean;
  intensity?: number;
}) {
  const p = palettes[accent] ?? palettes.blue;
  const h = hash(seed ?? accent);
  const sunX = [30, 50, 70, 38, 62][h % 5];
  const sunY = 30 + (h % 11);
  const sunR = 11 + (h % 7);
  const flip = (h >> 3) % 2 === 1;

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} style={{ background: p.sky }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        {!flat && (
          <>
            <circle cx={sunX} cy={sunY} r={sunR} fill={p.sun} />
            <circle cx={sunX} cy={sunY} r={sunR + 7} fill="none" stroke={p.sun} strokeOpacity="0.18" strokeWidth="0.5" />
          </>
        )}
        <g transform={flip ? "translate(100 0) scale(-1 1)" : undefined}>
          <path d="M0 60 C 16 51, 30 57, 48 54 S 80 47, 100 56 V100 H0Z" fill={p.far} />
          <path d="M0 71 C 18 63, 36 73, 56 67 S 86 60, 100 69 V100 H0Z" fill={p.near} />
          <path d="M0 84 C 28 79, 62 88, 100 81 V100 H0Z" fill={p.ground} />
        </g>
      </svg>
      {scrim && <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 to-transparent" />}
    </div>
  );
}

export const accentHex = (accent: string) => (palettes[accent] ?? palettes.blue).sky;
