"use client";

import { useEffect } from "react";

/** Works out where the visitor came from (utm/ref tag first, then the referrer) and counts one view per tab session. */
function sourceOf(): string {
  const q = new URLSearchParams(location.search);
  const tag = (q.get("utm_source") || q.get("ref") || q.get("src") || "").toLowerCase();
  const r = document.referrer.toLowerCase();
  const pick = (s: string) =>
    /whatsapp|wa\.me/.test(s) ? "whatsapp" : /instagram/.test(s) ? "instagram" : /google/.test(s) ? "google" : /linkedin|lnkd/.test(s) ? "linkedin" : /twitter|x\.com|t\.co/.test(s) ? "x" : /qr|poster/.test(s) ? "qr" : "";
  if (tag) return pick(tag) || "other";
  if (!r) return "direct";
  if (r.includes(location.host)) return "evntcult";
  return pick(r) || "other";
}

export function ViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `ec_view_${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // storage blocked: count anyway
    }
    void fetch(`/api/events/${slug}/view`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: sourceOf() }), keepalive: true }).catch(() => undefined);
  }, [slug]);
  return null;
}
