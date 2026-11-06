import { prisma } from "@/lib/prisma";
import { getViewer, canManageEvent } from "@/lib/rbac";
import { isDemoMode } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * GET /api/events/:id/headcount — Server-Sent Events stream of live headcount.
 * Polls Postgres every 3s; swap for LISTEN/NOTIFY or Redis pub/sub at scale.
 * In demo mode it simulates arrivals so the dashboard feels live.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer || !(await canManageEvent(viewer, id, "scan"))) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;
  let demoCount = Number(new URL(req.url).searchParams.get("start") ?? 0);

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      const tick = async () => {
        try {
          if (isDemoMode()) {
            demoCount += Math.random() < 0.7 ? Math.ceil(Math.random() * 3) : 0;
            send({ checkedIn: demoCount, at: Date.now() });
            return;
          }
          const [checkedIn, outs] = await Promise.all([
            prisma.checkIn.findMany({ where: { pass: { registration: { eventId: id } }, direction: "IN" }, distinct: ["passId"], select: { passId: true } }),
            prisma.checkIn.count({ where: { pass: { registration: { eventId: id } }, direction: "OUT" } }),
          ]);
          send({ checkedIn: checkedIn.length, outs, at: Date.now() });
        } catch {
          send({ error: "unavailable" });
        }
      };

      void tick();
      timer = setInterval(tick, 3000);
      req.signal.addEventListener("abort", () => {
        clearInterval(timer);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel() {
      clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
