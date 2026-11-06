import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Tell the event's Durable Object about new gate counts so every open scanner and
 * dashboard updates instantly. Best-effort: if the binding isn't there (plain `next dev`)
 * or the call fails, scanners still see the right number by polling /gate-count.
 */
export async function publishGateCounts(eventId: string, counts: { checkedIn: number; registered: number }) {
  try {
    const { env, ctx } = await getCloudflareContext({ async: true });
    const ns = (env as CloudflareEnv).EVENT_LIVE;
    if (!ns) return;
    const stub = ns.get(ns.idFromName(eventId));
    const send = stub
      .fetch("https://event-live/bump", { method: "POST", body: JSON.stringify({ ...counts, at: Date.now() }) })
      .then(() => undefined)
      .catch(() => undefined);
    ctx.waitUntil(send);
  } catch {
    // No Durable Objects in this environment.
  }
}
