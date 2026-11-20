import { cn } from "@/lib/utils";

/**
 * Generated cover for events without an uploaded banner. Each kind of event has its own
 * drawn scene (a court for sports, a circuit for tech, diyas for cultural nights…), and the
 * event's id varies the composition so two events of the same kind never look identical.
 */
type Palette = { bg: string; a: string; b: string; c: string };

const palettes: Record<string, Palette> = {
  blue: { bg: "#2346A8", a: "#3C64D6", b: "#FFD27A", c: "#14296B" },
  violet: { bg: "#4B2E86", a: "#6B47B8", b: "#FFB8D0", c: "#2C1856" },
  orange: { bg: "#E8743A", a: "#F59A5E", b: "#FFF1C9", c: "#A9461A" },
  teal: { bg: "#11796D", a: "#1E9A8B", b: "#F3E7B3", c: "#0A4C44" },
  pink: { bg: "#C7457A", a: "#E06C98", b: "#FFE3B8", c: "#87264F" },
  green: { bg: "#3F7A3A", a: "#5C9A52", b: "#F4E9A6", c: "#24481F" },
  red: { bg: "#C2392B", a: "#DE5B47", b: "#FFD9A0", c: "#7E1F15" },
};

type Scene = "court" | "circuit" | "pixels" | "diyas" | "talk" | "party" | "hills";
/** Palette keys follow the event's category (see accentFor), so this picks the scene by kind. */
const SCENE: Record<string, Scene> = { orange: "court", blue: "circuit", red: "pixels", pink: "diyas", teal: "talk", violet: "party", green: "hills" };

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const rng = (seed: number) => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

type Props = { p: Palette; r: () => number };

function Court({ p, r }: Props) {
  const x = 30 + r() * 40;
  return (
    <>
      <rect x="-5" y="58" width="110" height="50" fill={p.a} />
      <g stroke="#fff" strokeOpacity="0.85" strokeWidth="1.1" fill="none">
        <path d="M-5 58H105" />
        <circle cx={x} cy="78" r="13" />
        <path d={`M${x} 58V105`} />
        <rect x={x - 32} y="64" width="18" height="30" />
        <rect x={x + 14} y="64" width="18" height="30" />
      </g>
      <circle cx={x + 6} cy={26 + r() * 8} r="11" fill={p.b} />
    </>
  );
}

function Circuit({ p, r }: Props) {
  const dots = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) dots.push(<circle key={`${i}-${j}`} cx={8 + i * 17} cy={8 + j * 17} r="0.9" fill="#fff" opacity="0.25" />);
  const n = [0, 1, 2, 3].map(() => [8 + Math.floor(r() * 6) * 17, 8 + Math.floor(r() * 6) * 17]);
  return (
    <>
      {dots}
      <path d={`M${n[0][0]} ${n[0][1]}H${n[1][0]}V${n[1][1]}H${n[2][0]}V${n[2][1]}`} stroke={p.b} strokeWidth="1.6" fill="none" />
      <path d={`M${n[1][0]} ${n[1][1]}V${n[3][1]}H${n[3][0]}`} stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" fill="none" />
      <rect x="34" y="36" width="32" height="28" rx="4" fill={p.c} stroke={p.a} strokeWidth="1.4" />
      <rect x="41" y="43" width="18" height="14" rx="2" fill={p.a} />
      {n.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 2 ? 4.5 : 3} fill={i === 2 ? p.b : p.c} stroke="#fff" strokeWidth="1.2" />
      ))}
    </>
  );
}

function Pixels({ p, r }: Props) {
  const cells = [];
  for (let i = 0; i < 10; i++)
    for (let j = 0; j < 10; j++) {
      const v = r();
      if (v > 0.8) cells.push(<rect key={`${i}-${j}`} x={i * 10} y={j * 10} width="10" height="10" fill={v > 0.94 ? p.b : p.a} opacity={v > 0.94 ? 1 : 0.6} />);
    }
  return (
    <>
      {cells}
      <g transform="translate(26 34)">
        <rect x="0" y="6" width="48" height="24" rx="12" fill={p.c} />
        <path d="M10 18h10M15 13v10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="34" cy="15" r="2.6" fill={p.b} />
        <circle cx="40" cy="21" r="2.6" fill="#fff" />
      </g>
    </>
  );
}

function Diyas({ p, r }: Props) {
  const count = 3 + Math.floor(r() * 2);
  return (
    <>
      <path d="M-5 4C30 22 70 22 105 4" stroke={p.b} strokeOpacity="0.5" strokeWidth="0.8" fill="none" />
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={i} cx={i * 12.5} cy={6 + Math.sin((i / 8) * Math.PI) * 10} r="1.6" fill={p.b} opacity="0.9" />
      ))}
      <rect x="-5" y="72" width="110" height="40" fill={p.c} />
      {Array.from({ length: count }, (_, i) => {
        const x = 14 + (i * 72) / (count - 1);
        return (
          <g key={i} transform={`translate(${x} 70)`}>
            <circle cx="0" cy="-6" r="8" fill={p.b} opacity="0.16" />
            <path d="M-9 0h18q-2 8-9 8t-9-8Z" fill={p.a} />
            <path d="M0 -12q4 6 0 10q-4-4 0-10Z" fill={p.b} />
          </g>
        );
      })}
    </>
  );
}

function Talk({ p, r }: Props) {
  const y = 24 + r() * 10;
  return (
    <>
      <rect x="14" y={y} width="44" height="26" rx="13" fill={p.b} />
      <path d={`M24 ${y + 24}l-4 10 12-8Z`} fill={p.b} />
      <rect x="44" y={y + 20} width="40" height="22" rx="11" fill={p.a} />
      <path d={`M74 ${y + 40}l4 9-11-7Z`} fill={p.a} />
      <g fill={p.c}>
        <circle cx="28" cy={y + 13} r="2.2" />
        <circle cx="36" cy={y + 13} r="2.2" />
        <circle cx="44" cy={y + 13} r="2.2" />
      </g>
      <rect x="-5" y="86" width="110" height="20" fill={p.c} />
    </>
  );
}

function Party({ p, r }: Props) {
  const bits = Array.from({ length: 26 }, (_, i) => {
    const x = r() * 100;
    const y = r() * 100;
    const rot = r() * 180;
    const col = [p.b, p.a, "#fff"][i % 3];
    return i % 2 ? <rect key={i} x={x} y={y} width="5" height="2" rx="1" fill={col} transform={`rotate(${rot} ${x} ${y})`} /> : <circle key={i} cx={x} cy={y} r="1.5" fill={col} />;
  });
  return (
    <>
      <path d="M50 0V22" stroke="#fff" strokeOpacity="0.6" strokeWidth="0.8" />
      <circle cx="50" cy="44" r="22" fill={p.c} />
      {Array.from({ length: 5 }, (_, i) => (
        <path key={i} d={`M30 ${36 + i * 4}H70`} stroke={p.a} strokeWidth="1.2" opacity="0.7" />
      ))}
      <circle cx="50" cy="44" r="22" fill="none" stroke={p.b} strokeWidth="1.2" />
      {bits}
    </>
  );
}

function Hills({ p, r }: Props) {
  const x = 25 + r() * 50;
  return (
    <>
      <circle cx={x} cy={32 + r() * 8} r="13" fill={p.b} />
      <path d="M0 60 C 16 51, 30 57, 48 54 S 80 47, 100 56 V100 H0Z" fill={p.a} />
      <path d="M0 74 C 20 66, 40 76, 60 70 S 88 64, 100 72 V100 H0Z" fill={p.c} />
    </>
  );
}

const SCENES: Record<Scene, (props: Props) => React.ReactElement> = { court: Court, circuit: Circuit, pixels: Pixels, diyas: Diyas, talk: Talk, party: Party, hills: Hills };

export function EventArt({
  accent,
  seed,
  className,
  scrim = true,
  flat = false,
}: {
  accent: string;
  /** Usually the event id; varies the composition within the scene. */
  seed?: string;
  className?: string;
  /** Darkens the lower half so overlaid white type stays readable. */
  scrim?: boolean;
  /** Small tiles that carry text: colour only. */
  flat?: boolean;
  intensity?: number;
}) {
  const p = palettes[accent] ?? palettes.blue;
  const Draw = SCENES[SCENE[accent] ?? "hills"];
  const r = rng(hash(seed ?? accent));

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} style={{ background: p.bg }}>
      {!flat && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
          {Draw({ p, r })}
        </svg>
      )}
      {scrim && <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />}
    </div>
  );
}

export const accentHex = (accent: string) => (palettes[accent] ?? palettes.blue).bg;
