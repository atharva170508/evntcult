/**
 * Bespoke editorial poster artwork for the Hero pass showcase.
 * Pure lightweight SVG + CSS gradients (zero WebGL, zero external images)
 * designed to read like printed gig posters and limited-edition physical passes.
 */
export type HeroArtKind = "sunset" | "hacknight" | "garba";

export function HeroPassArt({ kind }: { kind: HeroArtKind }) {
  if (kind === "sunset") {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden bg-[#1D1230]"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 95% at 78% 18%, rgba(238,144,104,0.68) 0%, rgba(164,62,118,0.52) 38%, rgba(44,24,78,0.88) 76%, #160D27 100%)",
          }}
        />
        <svg
          viewBox="0 0 360 225"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 size-full"
        >
          <defs>
            <linearGradient id="sunDisc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFE8B6" />
              <stop offset="58%" stopColor="#F59B6C" />
              <stop offset="100%" stopColor="#C9456E" />
            </linearGradient>
            <linearGradient id="waveLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFE8B6" stopOpacity="0" />
              <stop offset="50%" stopColor="#FFE8B6" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#F0D7FF" stopOpacity="0" />
            </linearGradient>
            <pattern id="sunDots" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.7" fill="#FFF7E8" fillOpacity="0.16" />
            </pattern>
          </defs>
          <rect width="360" height="225" fill="url(#sunDots)" />
          {/* Acoustic rings radiating from the setting sun */}
          <g fill="none" stroke="#FFE6C2" strokeOpacity="0.2">
            <circle cx="238" cy="86" r="108" strokeWidth="0.75" />
            <circle cx="238" cy="86" r="82" strokeWidth="0.75" strokeDasharray="3 4" />
            <circle cx="238" cy="86" r="58" strokeWidth="0.85" />
          </g>
          {/* Warm dusk sun with horizon slice bars */}
          <circle cx="238" cy="86" r="38" fill="url(#sunDisc)" />
          <g fill="#22133A" fillOpacity="0.45">
            <rect x="196" y="96" width="84" height="2.2" />
            <rect x="196" y="103" width="84" height="3.2" />
            <rect x="196" y="111" width="84" height="4.5" />
          </g>
          {/* Editorial audio wave horizon */}
          <path
            d="M0 148 Q 52 128, 108 144 T 218 138 T 360 146"
            fill="none"
            stroke="url(#waveLine)"
            strokeWidth="1.4"
          />
          <path
            d="M0 162 Q 64 146, 128 158 T 256 150 T 360 158"
            fill="none"
            stroke="#F0D7FF"
            strokeOpacity="0.28"
            strokeWidth="1"
          />
          {/* Subtle fine registration crosshair */}
          <g stroke="#FFF8EB" strokeOpacity="0.32" strokeWidth="0.75">
            <path d="M22 104h12M28 98v12" />
            <circle cx="28" cy="104" r="3.5" fill="none" />
          </g>
        </svg>
      </div>
    );
  }

  if (kind === "hacknight") {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden bg-[#0D1730]"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(105% 95% at 80% 20%, rgba(64,126,255,0.44) 0%, rgba(24,52,126,0.78) 48%, #0A1124 100%)",
          }}
        />
        <svg
          viewBox="0 0 360 225"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 size-full"
        >
          <defs>
            <pattern id="hackGrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path
                d="M 24 0 L 0 0 0 24"
                fill="none"
                stroke="#9EC2FF"
                strokeOpacity="0.12"
                strokeWidth="0.7"
              />
            </pattern>
            <linearGradient id="traceGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFE09A" />
              <stop offset="100%" stopColor="#F5A64B" />
            </linearGradient>
          </defs>
          <rect width="360" height="225" fill="url(#hackGrid)" />
          {/* Isometric architectural PCB traces */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M 18 118 H 96 L 122 92 H 204 L 234 62 H 336"
              stroke="url(#traceGold)"
              strokeWidth="1.6"
            />
            <path
              d="M 48 148 H 146 L 172 122 H 264 L 292 94 H 348"
              stroke="#7AB2FF"
              strokeOpacity="0.55"
              strokeWidth="1.1"
            />
            <path
              d="M 204 92 V 144 L 226 166 H 316"
              stroke="#9EC2FF"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
          </g>
          {/* Precision silicon die module */}
          <g transform="translate(184 54)">
            <rect
              width="78"
              height="64"
              rx="10"
              fill="#0E1B3B"
              fillOpacity="0.88"
              stroke="#89B6FF"
              strokeOpacity="0.45"
              strokeWidth="1.1"
            />
            <rect
              x="12"
              y="12"
              width="54"
              height="40"
              rx="6"
              fill="#1E3F8F"
              fillOpacity="0.65"
              stroke="#FFE09A"
              strokeOpacity="0.55"
              strokeWidth="0.9"
            />
            <path
              d="M24 32h8l4-8 6 16 4-8h8"
              fill="none"
              stroke="#FFE09A"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          {/* Glowing circuit solder pads */}
          <circle cx="122" cy="92" r="3.5" fill="#FFE09A" />
          <circle cx="292" cy="94" r="3" fill="#7AB2FF" />
          <circle cx="96" cy="118" r="2.5" fill="#0D1730" stroke="#FFE09A" strokeWidth="1.4" />
          <circle cx="234" cy="62" r="4" fill="#0D1730" stroke="#FFE09A" strokeWidth="1.6" />
        </svg>
      </div>
    );
  }

  // garba — festive crimson-garnet night with fine gold geometric filigree
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[#3B0F22]"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(110% 95% at 75% 26%, rgba(235,105,134,0.58) 0%, rgba(138,30,66,0.82) 48%, #2B0917 100%)",
        }}
      />
      <svg
        viewBox="0 0 360 225"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
      >
        <defs>
          <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE9B5" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#F5B25E" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F5B25E" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Delicate celebratory mandala rings */}
        <g transform="translate(248 92)" fill="none" stroke="#FFE2A8">
          <circle r="92" strokeOpacity="0.16" strokeWidth="0.8" />
          <circle r="70" strokeOpacity="0.26" strokeWidth="0.85" strokeDasharray="2 5" />
          <circle r="48" strokeOpacity="0.4" strokeWidth="0.9" />
          <circle r="24" strokeOpacity="0.55" strokeWidth="1" />
          {Array.from({ length: 12 }, (_, i) => {
            const angle = i * 30;
            return (
              <path
                key={i}
                d="M 0 -24 Q 10 -44, 0 -68 Q -10 -44, 0 -24 Z"
                strokeOpacity="0.34"
                strokeWidth="0.8"
                transform={`rotate(${angle})`}
              />
            );
          })}
          <circle r="18" fill="url(#lanternGlow)" stroke="none" />
          <circle r="4" fill="#FFF3D2" stroke="none" />
        </g>
        {/* Warm festival light garland */}
        <path
          d="M-10 26 Q 90 62, 190 22 T 370 30"
          fill="none"
          stroke="#FFE2A8"
          strokeOpacity="0.32"
          strokeWidth="0.8"
        />
        {[26, 74, 126, 178, 296, 336].map((x, i) => (
          <circle
            key={x}
            cx={x}
            cy={34 + (i % 2) * 10}
            r="2"
            fill="#FFE9B5"
            fillOpacity="0.78"
          />
        ))}
      </svg>
    </div>
  );
}
