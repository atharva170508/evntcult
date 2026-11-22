import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LinkButton } from "./Button";

type Art = "pass" | "certificate" | "photos" | "calendar";

/**
 * "Nothing here yet", with the one next step that fixes it. With `art`, a small drawn scene
 * (a pass on a lanyard, a certificate, a photo stack, a calendar page) instead of an icon, a
 * serif headline and a primary button, so an empty page still feels like EvntCult.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  secondary,
  art,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: { label: string; href: string };
  secondary?: { label: string; href: string };
  art?: Art;
  className?: string;
}) {
  if (!art)
    return (
      <div className={cn("flex flex-col items-center rounded-card border border-dashed border-line-strong px-6 py-10 text-center", className)}>
        <span className="grid size-11 place-items-center rounded-tile bg-surface text-ink-muted shadow-card" aria-hidden>
          <Icon className="size-5" />
        </span>
        <p className="mt-4 text-h4 font-semibold">{title}</p>
        {body && <p className="mt-1 max-w-xs text-small text-ink-muted">{body}</p>}
        {action && (
          <LinkButton href={action.href} size="sm" variant="secondary" className="mt-5">
            {action.label}
          </LinkButton>
        )}
      </div>
    );

  return (
    <div className={cn("relative flex flex-col items-center overflow-hidden rounded-[28px] bg-white px-6 pb-12 pt-10 text-center shadow-[0_0_0_1px_rgba(26,26,26,0.06)] md:pb-14", className)}>
      <div className="relative">{ART[art]}</div>
      <h2 className="relative mt-6 font-display text-[clamp(28px,3.4vw,38px)] leading-[1.02] tracking-[-0.03em] text-ink">{title}</h2>
      {body && <p className="relative mt-3 max-w-[42ch] text-[16px] leading-relaxed text-ink-2">{body}</p>}
      {(action || secondary) && (
        <div className="relative mt-7 flex flex-col items-center gap-3 sm:flex-row">
          {action && (
            <LinkButton href={action.href} size="lg" variant="accent">
              {action.label}
            </LinkButton>
          )}
          {secondary && (
            <LinkButton href={secondary.href} size="lg" variant="ghost">
              {secondary.label}
            </LinkButton>
          )}
        </div>
      )}
    </div>
  );
}

const INK = "#1A1A1A";
const LINE = "#DCD6C6";

const ART: Record<Art, React.ReactNode> = {
  pass: (
    <svg width="132" height="150" viewBox="0 0 132 150" fill="none" aria-hidden>
      <rect x="56" y="0" width="20" height="38" rx="2" fill="#E3264F" />
      <rect x="48" y="34" width="36" height="10" rx="5" fill={INK} />
      <g style={{ transformOrigin: "66px 40px" }}>
        <rect x="16" y="40" width="100" height="106" rx="16" fill="#fff" stroke={LINE} strokeWidth="1.5" />
        <rect x="16" y="40" width="100" height="40" rx="16" fill="#4B2E86" />
        <rect x="16" y="64" width="100" height="16" fill="#4B2E86" />
        <rect x="28" y="92" width="44" height="7" rx="3.5" fill={INK} />
        <rect x="28" y="106" width="30" height="5" rx="2.5" fill={LINE} />
        <rect x="80" y="90" width="26" height="26" rx="4" fill="none" stroke={INK} strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M24 128h84" stroke={LINE} strokeDasharray="4 4" />
      </g>
    </svg>
  ),
  certificate: (
    <svg width="160" height="130" viewBox="0 0 160 130" fill="none" aria-hidden>
      <rect x="10" y="10" width="140" height="96" rx="10" fill="#fff" stroke={LINE} strokeWidth="1.5" />
      <rect x="18" y="18" width="124" height="80" rx="6" stroke="#E9DDB8" strokeWidth="1.5" />
      <rect x="42" y="34" width="76" height="8" rx="4" fill={INK} />
      <rect x="54" y="50" width="52" height="5" rx="2.5" fill={LINE} />
      <rect x="48" y="62" width="64" height="5" rx="2.5" fill={LINE} />
      <circle cx="80" cy="98" r="16" fill="#C9A45C" />
      <circle cx="80" cy="98" r="10" fill="#E3C988" />
      <path d="M70 110l-6 18 8-4 5 7 3-17M90 110l6 18-8-4-5 7-3-17" fill="#E3264F" />
    </svg>
  ),
  photos: (
    <svg width="160" height="130" viewBox="0 0 160 130" fill="none" aria-hidden>
      <g transform="rotate(-8 60 70)">
        <rect x="22" y="22" width="80" height="92" rx="8" fill="#fff" stroke={LINE} strokeWidth="1.5" />
        <rect x="30" y="30" width="64" height="62" rx="4" fill="#C7457A" />
      </g>
      <g transform="rotate(7 100 64)">
        <rect x="62" y="16" width="80" height="92" rx="8" fill="#fff" stroke={LINE} strokeWidth="1.5" />
        <rect x="70" y="24" width="64" height="62" rx="4" fill="#11796D" />
        <circle cx="102" cy="48" r="10" fill="#fff" fillOpacity=".35" />
        <path d="M86 86c2-12 10-18 16-18s14 6 16 18" fill="#fff" fillOpacity=".3" />
      </g>
    </svg>
  ),
  calendar: (
    <svg width="140" height="130" viewBox="0 0 140 130" fill="none" aria-hidden>
      <rect x="14" y="16" width="112" height="104" rx="14" fill="#fff" stroke={LINE} strokeWidth="1.5" />
      <path d="M14 30a14 14 0 0114-14h84a14 14 0 0114 14v14H14z" fill="#E3264F" />
      <rect x="40" y="8" width="6" height="18" rx="3" fill={INK} />
      <rect x="94" y="8" width="6" height="18" rx="3" fill={INK} />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3, 4].map((c) => <rect key={`${r}${c}`} x={26 + c * 19} y={56 + r * 15} width="12" height="8" rx="2" fill={r === 1 && c === 3 ? "#4B2E86" : "#F1EDE3"} />),
      )}
    </svg>
  ),
};
