import { ApiError, handle, parseBody } from "@/lib/api";
import { first, getDB } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { registerSchema } from "@/lib/validation";
import { normalizeAccessCode } from "@/lib/tokens";
import { register, type EventForRegistration } from "@/lib/data/registrations";
import { withRegistrations } from "@/lib/data/registration-api";
import { withOrganizerActions } from "@/lib/data/organizer-api";
import { cleanAnswers, listQuestions, saveAnswers } from "@/lib/data/questions";
import { resolvePrice } from "@/lib/data/pricing";
import { createTeam, joinTeam, teamByCode, teamNameTaken } from "@/lib/data/teams";
import { kindFor, parseConfig, teamMode } from "@/lib/categories";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

/**
 * POST /api/events/:slug/register  { waitlist?: boolean, code?: string }
 *
 *   201 { status: "registered", registration: { id, pass_code } }
 *   201 { status: "waitlisted", registration: { id }, waitlist_position, hold_expires_at }
 *   200 { full: true, waitlist_position }   ← full, and waitlist wasn't requested: ask the user first
 */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const viewer = await requireUser();
  const { ref } = await params;
  const body = await parseBody(req, registerSchema);

  const event = await first<EventForRegistration & { access: string; access_code: string | null; organizer_id: string; price_paise: number; tiers: string | null; promos: string | null; category: string | null; category_config: string | null }>(
    "SELECT id, slug, capacity, status, starts_at, ends_at, access, access_code, organizer_id, reg_closes_at, requires_approval, price_paise, tiers, promos, category, category_config FROM events WHERE slug = ? OR id = ?",
    ref,
    ref,
  );
  const isOwner = !!event && (viewer.role === "admin" || event.organizer_id === viewer.id);
  if (!event || (event.status === "draft" && !isOwner)) throw new ApiError(404, "not_found", "Event not found.");

  // Private events: the code is required unless you already have a registration (e.g. rejoining).
  if (event.access === "code" && !isOwner) {
    const mine = await first<{ id: string }>("SELECT id FROM registrations WHERE event_id = ? AND user_id = ?", event.id, viewer.id);
    const codeOk = !!body.code && !!event.access_code && normalizeAccessCode(body.code) === event.access_code;
    if (!mine && !codeOk) throw new ApiError(403, "code_required", "This is a private event. Enter its code to register.");
  }

  const db = await getDB();
  // Checked before a seat is taken, so a missing answer can't leave someone half registered.
  // With team sign-up on, an old "Team name" question is answered by the team itself.
  const teamOn = !!teamMode(kindFor(event.category), parseConfig(event.category_config));
  const allQuestions = await listQuestions(db, event.id);
  const teamQ = teamOn ? allQuestions.filter((q) => /team name|squad name/i.test(q.label)) : [];
  const questions = allQuestions.filter((q) => !teamQ.includes(q));
  const answers = await withOrganizerActions(async () => cleanAnswers(questions, body.answers));

  // Ticket type and promo code: checked first, so a bad code never takes a seat.
  const price = event.tiers || body.promo ? await resolvePrice(event, body.tier, body.promo) : null;

  // Team sign-up: check the team before a seat is taken.
  const teams = teamMode(kindFor(event.category), parseConfig(event.category_config));
  const already = await first<{ id: string; status: string; team_id: string | null }>(
    "SELECT id, status, team_id FROM registrations WHERE event_id = ? AND user_id = ?",
    event.id,
    viewer.id,
  );
  const needsTeam = !!teams && !(already && already.status !== "cancelled");
  let joining: Awaited<ReturnType<typeof teamByCode>> = null;
  if (needsTeam) {
    if (!body.team) throw new ApiError(400, "team_required", `Create a ${teams.noun}, or join one with its code.`);
    if ("join" in body.team) {
      joining = await teamByCode(db, event.id, body.team.join);
      if (!joining) throw new ApiError(404, "no_team", `No ${teams.noun} has that code. Check it with your captain.`);
      if (joining.members >= teams.max) throw new ApiError(409, "team_full", `${joining.name} is full (${teams.max} of ${teams.max}).`);
    } else if (await teamNameTaken(db, event.id, body.team.create)) {
      throw new ApiError(409, "name_taken", `A ${teams.noun} called ${body.team.create.trim()} already exists. Pick another name, or ask them for their code.`);
    }
  }

  const result = await withRegistrations((d) => register(d, event, viewer.id, { waitlist: body.waitlist }));
  if (result.kind !== "full" && needsTeam && body.team) {
    const regId = result.registration.id;
    if ("join" in body.team && joining) {
      if (!(await joinTeam(db, joining.id, regId, teams!.max))) {
        await db.prepare("UPDATE registrations SET status = 'cancelled', cancelled_at = ? WHERE id = ?").bind(new Date().toISOString(), regId).run();
        throw new ApiError(409, "team_full", `${joining.name} just filled up. Ask your captain, or create your own ${teams!.noun}.`);
      }
    } else if ("create" in body.team) {
      try {
        await createTeam(db, event.id, viewer.id, regId, body.team.create);
      } catch (e) {
        await db.prepare("UPDATE registrations SET status = 'cancelled', cancelled_at = ? WHERE id = ?").bind(new Date().toISOString(), regId).run();
        if (e instanceof Error && e.message === "name_taken") throw new ApiError(409, "name_taken", `That ${teams!.noun} name was just taken. Pick another.`);
        throw e;
      }
    }
  }
  if (result.kind !== "full") {
    const teamAnswer =
      teamQ.length && body.team ? ("create" in body.team ? body.team.create.trim() : (joining?.name ?? "")) : "";
    await saveAnswers(db, result.registration.id, teamAnswer ? { ...answers, ...Object.fromEntries(teamQ.map((q) => [q.id, teamAnswer])) } : answers);
    // Record what this guest owes, once (a repeat call keeps the first price). Free after a promo = paid.
    if (price)
      await db
        .prepare(
          `UPDATE registrations SET amount_paise = ?1, tier = ?2, promo_code = ?3,
                  payment_status = CASE WHEN ?1 = 0 THEN 'paid' ELSE payment_status END
            WHERE id = ?4 AND amount_paise IS NULL`,
        )
        .bind(price.amountPaise, price.tier, price.promo, result.registration.id)
        .run();
    // Captain pays once: teammates who join owe nothing.
    if (needsTeam && teams?.teamPays && body.team && "join" in body.team)
      await db.prepare("UPDATE registrations SET amount_paise = 0, payment_status = 'paid' WHERE id = ?").bind(result.registration.id).run();
  }

  if (result.kind === "full") return Response.json({ full: true, waitlist_position: result.position });
  if (result.kind === "waitlisted") {
    return Response.json(
      {
        status: "waitlisted",
        approval: !!event.requires_approval,
        registration: { id: result.registration.id },
        waitlist_position: result.position,
        hold_expires_at: result.registration.hold_expires_at,
      },
      { status: 201 },
    );
  }
  return Response.json(
    { status: "registered", registration: { id: result.registration.id, pass_code: result.registration.pass_code } },
    { status: 201 },
  );
});
