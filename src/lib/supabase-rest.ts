/**
 * Minimal Supabase REST client using plain fetch (no supabase-js), so it runs unchanged in the
 * Cloudflare Worker and in Node scripts. Server-side only: it uses the service_role key, which
 * bypasses row-level security. Never import this from a client component.
 *
 * Config (Cloudflare secrets in production, .dev.vars locally):
 *   SUPABASE_URL               https://<project>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  Project Settings → API → service_role
 */
export interface SupabaseConfig {
  url: string;
  key: string;
}

type Env = Record<string, string | undefined>;

export function supabaseConfig(env: Env = process.env as Env): SupabaseConfig | null {
  const url = env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/.test(url)) return null;
  return { url, key };
}

export class SupabaseError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** fetch against the Supabase project with the service key, a timeout, and readable errors. */
export async function supabaseFetch(cfg: SupabaseConfig, path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const { timeoutMs = 8000, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${cfg.url}${path}`, {
      ...rest,
      headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, ...headers },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    throw new SupabaseError(504, e instanceof Error && e.name === "TimeoutError" ? "Supabase didn't answer in time." : "Couldn't reach Supabase.");
  }
  if (!res.ok) {
    const body = (await res.text().catch(() => "")).slice(0, 300);
    throw new SupabaseError(res.status, body || res.statusText);
  }
  return res;
}

/** Call a Postgres function exposed through PostgREST (POST /rest/v1/rpc/<fn>). */
export async function supabaseRpc<T>(cfg: SupabaseConfig, fn: string, args: Record<string, unknown>, timeoutMs = 8000): Promise<T> {
  const res = await supabaseFetch(cfg, `/rest/v1/rpc/${encodeURIComponent(fn)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
    timeoutMs,
  });
  return (await res.json()) as T;
}
