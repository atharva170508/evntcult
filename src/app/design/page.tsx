import { notFound } from "next/navigation";
import { Gallery } from "./Gallery";

export const dynamic = "force-dynamic";
export const metadata = { title: "Design system", robots: { index: false } };

/** Every building block in every state, for checking §8 by eye and by keyboard. Off unless DESIGN_GALLERY=1 (never on the live site). */
export default function DesignPage() {
  if (process.env.DESIGN_GALLERY !== "1") notFound();
  return <Gallery />;
}
