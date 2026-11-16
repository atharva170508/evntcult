import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { withOrganizerActions } from "@/lib/data/organizer-api";
import { createQuestion, deleteQuestion, listQuestions } from "@/lib/data/questions";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

const body = z
  .object({ label: z.string().trim().min(1).max(120), kind: z.enum(["text", "choice"]), options: z.array(z.string().max(60)).max(30).optional(), required: z.boolean().optional() })
  .strict();

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  return Response.json({ questions: await listQuestions(await getDB(), ref) });
});

export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const input = await parseBody(req, body);
  const id = await withOrganizerActions((db) => createQuestion(db, ref, input));
  return Response.json({ id }, { status: 201 });
});

export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) throw new ApiError(400, "no_id", "Choose a question.");
  await withOrganizerActions((db) => deleteQuestion(db, ref, id));
  return Response.json({ ok: true });
});
