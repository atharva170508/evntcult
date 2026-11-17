import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Viewer } from "@/lib/rbac";
import { TERMS_PATH } from "@/lib/terms";

/**
 * Signed-in people who haven't accepted the current Terms & Conditions and User Rules are sent to
 * the terms page once, then brought back to where they were going (middleware passes the path as x-path).
 */
export async function requireTermsAccepted(viewer: Viewer | null) {
  if (!viewer || viewer.termsAccepted) return;
  const path = (await headers()).get("x-path") || "/dashboard";
  if (path === TERMS_PATH || path.startsWith(`${TERMS_PATH}?`)) return; // the terms page itself
  const next = path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
  redirect(`${TERMS_PATH}?next=${encodeURIComponent(next)}`);
}
