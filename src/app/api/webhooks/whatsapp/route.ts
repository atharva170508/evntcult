import { getDB } from "@/lib/db";
import { setOptFromWhatsApp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/** GET: Meta's one-time webhook check. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const expected = process.env.WA_VERIFY_TOKEN;
  if (expected && q.get("hub.mode") === "subscribe" && q.get("hub.verify_token") === expected) return new Response(q.get("hub.challenge") ?? "", { status: 200 });
  return new Response("forbidden", { status: 403 });
}

async function signature(secret: string, raw: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  return `sha256=${[...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function sameText(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

interface Inbound {
  entry?: { changes?: { value?: { messages?: { from?: string; text?: { body?: string } }[] } }[] }[];
}

/** POST: replies from people. STOP and START change their consent. Everything else is ignored. */
export async function POST(req: Request) {
  const secret = process.env.WA_APP_SECRET;
  const raw = await req.text();
  if (!secret || !sameText(await signature(secret, raw), req.headers.get("x-hub-signature-256") ?? "")) return new Response("bad signature", { status: 401 });

  const body = JSON.parse(raw) as Inbound;
  const db = await getDB();
  for (const entry of body.entry ?? [])
    for (const change of entry.changes ?? [])
      for (const msg of change.value?.messages ?? []) {
        const text = (msg.text?.body ?? "").trim().toUpperCase();
        if (msg.from && (text === "STOP" || text === "START")) await setOptFromWhatsApp(db, msg.from, text === "START");
      }
  return new Response("ok", { status: 200 });
}
