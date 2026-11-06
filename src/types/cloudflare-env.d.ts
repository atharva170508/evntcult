// Bindings from wrangler.jsonc (see worker-configuration.d.ts, regenerate with `npx wrangler types`).
interface CloudflareEnv extends Cloudflare.Env {
  /** One EventLive Durable Object per event (src/lib/live/event-live.ts). Missing under plain `next dev`. */
  EVENT_LIVE?: DurableObjectNamespace;
  /** Photo Vault bucket "evntcult-photos" (wrangler.jsonc). Missing until R2 is enabled. */
  PHOTOS?: R2Bucket;
}
