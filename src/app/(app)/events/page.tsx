import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LayoutGrid, List, X } from "lucide-react";
import { listEvents } from "@/lib/data/events";
import { listQuerySchema } from "@/lib/validation";
import { EventCard } from "@/components/landing/EventCard";
import { KindRail } from "@/components/landing/KindRail";
import { CATEGORY_NAMES } from "@/components/site/categories";
import { cn } from "@/lib/utils";
import { EventTimeline } from "@/components/events/EventTimeline";
import { EventPeek } from "@/components/events/EventPeek";

export const metadata: Metadata = { title: "Events" };
export const dynamic = "force-dynamic";

const WHEN: Record<string, string> = { today: "Today", weekend: "This weekend", week: "This week", month: "This month" };

export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const raw = await searchParams;
  // Blank fields from the search bar mean "any", not "invalid".
  const parsed = listQuerySchema.safeParse(Object.fromEntries(Object.entries(raw).filter(([, v]) => v)));
  const q = parsed.success ? parsed.data : {};
  const { events, nextCursor } = await listEvents(q);
  const view = raw.view === "list" ? "list" : "grid";

  /** URL that keeps the other filters and drops the cursor. */
  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { type: q.type, when: q.when, price: q.price, q: q.q, view: view === "list" ? "list" : undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/events?${s}` : "/events";
  };
  const chip = (active: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-4 text-[14px] transition-colors duration-fast",
      active ? "border-ink bg-ink font-semibold text-white" : "border-line-strong bg-white text-ink hover:border-ink",
    );
  const nextHref = nextCursor ? `${href({})}${href({}).includes("?") ? "&" : "?"}cursor=${encodeURIComponent(nextCursor)}` : null;

  const title = [
    q.type ? CATEGORY_NAMES[q.type] : null,
    q.price === "free" ? "Free" : q.price === "paid" ? "Paid" : null,
    q.when ? WHEN[q.when].toLowerCase() : null,
  ].filter(Boolean);

  return (
    <div className="pb-6">
      <div className="border-b border-line">
        <Suspense>
          <KindRail />
        </Suspense>
      </div>

      <div className="no-scrollbar -mx-gutter flex items-center gap-2 overflow-x-auto px-gutter pt-6 sm:mx-0 sm:px-0">
        {Object.entries(WHEN).map(([k, v]) => (
          <Link key={k} href={href({ when: q.when === k ? undefined : k })} className={chip(q.when === k)}>
            {v}
          </Link>
        ))}
        <span className="mx-1 h-6 w-px shrink-0 bg-line-strong" aria-hidden />
        <Link href={href({ price: q.price === "free" ? undefined : "free" })} className={chip(q.price === "free")}>
          Free
        </Link>
        <Link href={href({ price: q.price === "paid" ? undefined : "paid" })} className={chip(q.price === "paid")}>
          Paid
        </Link>
        {q.q && (
          <Link href={href({ q: undefined })} className={chip(true)}>
            &ldquo;{q.q}&rdquo; <X className="size-3.5" aria-hidden />
          </Link>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <h1 className="text-[22px] font-semibold text-ink" role="status">
          {events.length === 0
            ? "No events found"
            : `${events.length}${nextCursor ? "+" : ""} ${title.length ? `${title.join(", ")} ` : ""}event${events.length === 1 ? "" : "s"}`}
        </h1>
        {events.length > 0 && (
          <div role="group" aria-label="Layout" className="inline-flex shrink-0 rounded-lg border border-line-strong bg-white p-0.5">
            {[
              { v: "grid", label: "Grid", Icon: LayoutGrid },
              { v: "list", label: "List", Icon: List },
            ].map(({ v, label, Icon }) => (
              <Link
                key={v}
                href={href({ view: v === "list" ? "list" : undefined })}
                aria-label={`${label} view`}
                aria-current={view === v ? "true" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[13.5px] font-medium transition-colors duration-fast",
                  view === v ? "bg-ink text-white" : "text-ink-2 hover:bg-sunken",
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[16px] text-ink-muted">Try removing a filter.</p>
          <Link href="/events" className="mt-6 inline-flex h-12 items-center rounded-lg border border-ink px-6 text-[16px] font-semibold text-ink hover:bg-sunken">
            Show all events
          </Link>
        </div>
      ) : (
        <EventPeek events={events}>
          {view === "list" ? (
            <EventTimeline events={events} />
          ) : (
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:gap-x-6 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {events.map((e) => (
                <li key={e.id} data-peek={e.slug}>
                  <EventCard e={e} />
                </li>
              ))}
            </ul>
          )}
        </EventPeek>
      )}

      {nextHref && (
        <div className="mt-14 flex flex-col items-center gap-3">
          <p className="text-[16px] font-semibold text-ink">Continue exploring</p>
          <Link href={nextHref} className="inline-flex h-12 items-center rounded-lg bg-ink px-6 text-[16px] font-semibold text-white hover:bg-black">
            Show more
          </Link>
        </div>
      )}
    </div>
  );
}
