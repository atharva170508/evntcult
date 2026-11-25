import { z } from "zod";
import { moderated } from "@/lib/moderation/zod";
import { getDB } from "@/lib/db";
import { getViewer } from "@/lib/rbac";
import { findCity } from "@/lib/discovery";
import { newId } from "@/lib/tokens";
import { nowIso } from "@/lib/time";

const schema = z.object({
  title: z.string().trim().min(3, "Add an event name.").max(120).superRefine(moderated("Event name")),
  eventUrl: z.string().trim().url("Enter a valid link (https://...)").max(400).optional().or(z.literal("")),
  note: z.string().trim().max(400).superRefine(moderated("Note")).optional().or(z.literal("")),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const city = findCity(slug);
  if (!city) {
    return Response.json({ error: { code: "not_found", message: "City not found." } }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Check your details and try again.";
    return Response.json({ error: { code: "bad_request", message: msg } }, { status: 400 });
  }

  const viewer = await getViewer();
  const db = await getDB();
  const id = newId();
  await db
    .prepare(
      "INSERT INTO city_submissions (id, city_slug, user_id, title, event_url, note, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)",
    )
    .bind(
      id,
      city.slug,
      viewer?.id ?? null,
      parsed.data.title,
      parsed.data.eventUrl || null,
      parsed.data.note || null,
      nowIso(),
    )
    .run();

  return Response.json({ ok: true, id });
}
