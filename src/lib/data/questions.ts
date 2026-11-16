/** Questions an organizer asks at registration: free text or one choice from a list. */
import { newId } from "@/lib/tokens";
import { ActionError } from "@/lib/data/organizer-actions";

export const MAX_QUESTIONS = 10;

export interface Question {
  id: string;
  label: string;
  kind: "text" | "choice";
  options: string[];
  required: boolean;
}

type Row = { id: string; label: string; kind: "text" | "choice"; options: string | null; required: number };

export async function listQuestions(db: D1Database, eventId: string): Promise<Question[]> {
  const rows = await db.prepare("SELECT id, label, kind, options, required FROM event_questions WHERE event_id = ? ORDER BY created_at, id").bind(eventId).all<Row>();
  return (rows.results ?? []).map((r) => ({ id: r.id, label: r.label, kind: r.kind, options: r.options ? (JSON.parse(r.options) as string[]) : [], required: r.required === 1 }));
}

export async function createQuestion(db: D1Database, eventId: string, input: { label: string; kind: "text" | "choice"; options?: string[]; required?: boolean }, now = new Date()) {
  const count = await db.prepare("SELECT COUNT(*) AS n FROM event_questions WHERE event_id = ?").bind(eventId).first<{ n: number }>();
  if ((count?.n ?? 0) >= MAX_QUESTIONS) throw new ActionError(409, "too_many", `An event can have ${MAX_QUESTIONS} questions.`);
  const options = input.kind === "choice" ? [...new Set((input.options ?? []).map((o) => o.trim()).filter(Boolean))] : [];
  if (input.kind === "choice" && options.length < 2) throw new ActionError(422, "need_options", "Add at least two choices, separated by commas.");
  const id = newId();
  await db.prepare("INSERT INTO event_questions (id, event_id, label, kind, options, required, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(id, eventId, input.label, input.kind, options.length ? JSON.stringify(options) : null, input.required ? 1 : 0, now.toISOString()).run();
  return id;
}

/** A question people have answered stays, so their answers aren't lost. */
export async function deleteQuestion(db: D1Database, eventId: string, id: string) {
  const res = await db.prepare("DELETE FROM event_questions WHERE id = ?1 AND event_id = ?2 AND NOT EXISTS (SELECT 1 FROM registration_answers a WHERE a.question_id = ?1)").bind(id, eventId).run();
  if (!res.meta.changes) throw new ActionError(409, "has_answers", "People already answered this, so it can't be removed.");
}

/** Checks the answers before a seat is taken. Returns only answers to real questions. */
export function cleanAnswers(questions: Question[], answers: Record<string, string> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of questions) {
    const value = (answers?.[q.id] ?? "").trim();
    if (!value) {
      if (q.required) throw new ActionError(422, "answer_required", `Please answer: ${q.label}`);
      continue;
    }
    if (q.kind === "choice" && !q.options.includes(value)) throw new ActionError(422, "bad_choice", `Pick one of the choices for: ${q.label}`);
    out[q.id] = value.slice(0, 500);
  }
  return out;
}

export async function saveAnswers(db: D1Database, registrationId: string, answers: Record<string, string>) {
  const statements = Object.entries(answers).map(([q, v]) =>
    db.prepare("INSERT INTO registration_answers (registration_id, question_id, value) VALUES (?, ?, ?) ON CONFLICT (registration_id, question_id) DO UPDATE SET value = excluded.value").bind(registrationId, q, v),
  );
  if (statements.length) await db.batch(statements);
}

/** registration id -> question id -> answer */
export async function eventAnswers(db: D1Database, eventId: string): Promise<Map<string, Record<string, string>>> {
  const rows = await db.prepare("SELECT a.registration_id, a.question_id, a.value FROM registration_answers a JOIN event_questions q ON q.id = a.question_id WHERE q.event_id = ?").bind(eventId).all<{ registration_id: string; question_id: string; value: string }>();
  const map = new Map<string, Record<string, string>>();
  for (const r of rows.results ?? []) map.set(r.registration_id, { ...map.get(r.registration_id), [r.question_id]: r.value });
  return map;
}
