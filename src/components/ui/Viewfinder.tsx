"use client";

import { m, useReducedMotion } from "motion/react";

/** Four L-shaped corners that snap in to frame a QR, like a camera locking focus. */
export function Viewfinder({
  color = "#1A1A1A",
  inset = -8,
}: {
  color?: string;
  inset?: number;
}) {
  const reduce = useReducedMotion();
  const corners = [
    {
      pos: "left-0 top-0 rounded-tl-[12px] border-b-0 border-r-0",
      from: { x: -10, y: -10 },
    },
    {
      pos: "right-0 top-0 rounded-tr-[12px] border-b-0 border-l-0",
      from: { x: 10, y: -10 },
    },
    {
      pos: "bottom-0 left-0 rounded-bl-[12px] border-r-0 border-t-0",
      from: { x: -10, y: 10 },
    },
    {
      pos: "bottom-0 right-0 rounded-br-[12px] border-l-0 border-t-0",
      from: { x: 10, y: 10 },
    },
  ];
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute"
      style={{ inset }}
    >
      {corners.map((c, i) => (
        <m.span
          key={i}
          className={`absolute size-6 border-[3px] ${c.pos}`}
          style={{ borderColor: color }}
          initial={reduce ? false : { ...c.from, opacity: 0, scale: 1.15 }}
          animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 520,
            damping: 24,
            delay: 0.12 + i * 0.04,
          }}
        />
      ))}
    </span>
  );
}
