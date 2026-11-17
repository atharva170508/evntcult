"use client";

import { m, type Variants } from "motion/react";
import { EASE } from "./MotionProvider";

const item: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
};

/** Appears once when scrolled into view: rises 18px and sharpens from a slight blur. */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "header";
}) {
  const C = m[as];
  return (
    <C
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      variants={item}
      transition={{ delay }}
    >
      {children}
    </C>
  );
}

/** A group whose children (StaggerItem) reveal one after another. */
export function StaggerGroup({ children, className, gap = 0.07, as = "div" }: { children: React.ReactNode; className?: string; gap?: number; as?: "div" | "ul" | "ol" }) {
  const C = m[as];
  return (
    <C
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </C>
  );
}

export function StaggerItem({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "li" }) {
  const C = m[as];
  return (
    <C className={className} variants={item}>
      {children}
    </C>
  );
}
