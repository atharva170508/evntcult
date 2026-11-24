import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDB } from "@/lib/db";
import { getViewer } from "@/lib/rbac";
import { listEvents } from "@/lib/data/events";
import { CATEGORY_HUBS, findCategoryHub, getTopicStats } from "@/lib/discovery";
import { EventCard } from "@/components/landing/EventCard";
import { SubscribeTopicButton } from "@/components/discovery/SubscribeTopicButton";
import { accentHex } from "@/components/ui/EventArt";
import { fmtDate } from "@/lib/utils";
import type { EventSummary } from "@/lib/data/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const hub = findCategoryHub(slug);
  return { title: hub ? hub.name : "Category" };
}

function groupByMonth(events: EventSummary[]) {
  const map = new Map<string, { label: string; items: EventSummary[] }>();
  for (const e of events) {
    const label = fmtDate(e.startsAt, { month: "long", year: "numeric" });
    const bucket = map.get(label) ?? { label, items: [] };
    bucket.items.push(e);
    map.set(label, bucket);
  }
  return [...map.values()];
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hub = findCategoryHub(slug);
  if (!hub) notFound();

  const [viewer, db, { events }] = await Promise.all([
    getViewer(),
    getDB(),
    listEvents({ type: hub.code as "TECH" | "SPORTS" | "PARTY" | "CULTURAL" | "WORKSHOP" | "TALK" | "GAMING" }),
  ]);

  const stats = await getTopicStats(db, "category", hub.slug, viewer?.id ?? null);
  const months = groupByMonth(events);

  return (
    <div className="relative isolate space-y-10 pb-12 pt-4">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[360px] opacity-[0.12] dark:opacity-[0.18]"
        style={{
          background: `radial-gradient(760px 320px at 25% 0%, ${accentHex(hub.accent)}, transparent 75%)`,
        }}
      />

      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> All events
      </Link>

      {/* Category Hero */}
      <section className="flex flex-col justify-between gap-6 rounded-[24px] bg-surface p-7 shadow-card md:flex-row md:items-end md:p-10">
        <div>
          <h1 className="font-display text-[clamp(40px,5.4vw,66px)] leading-[0.95] tracking-[-0.03em] text-ink">
            {hub.name}
          </h1>
          <p className="mt-3 max-w-[50ch] text-[16px] leading-relaxed text-ink-2">
            {hub.blurb}
          </p>
          <p className="mt-4 flex flex-wrap items-center gap-4 text-[13.5px] font-medium text-ink-muted">
            <span>
              <strong className="font-semibold tabular-nums text-ink">{events.length}</strong> upcoming event{events.length === 1 ? "" : "s"}
            </span>
            <span>·</span>
            <span>
              <strong className="font-semibold tabular-nums text-ink">{stats.count}</strong> subscriber{stats.count === 1 ? "" : "s"}
            </span>
          </p>
        </div>

        <SubscribeTopicButton
          kind="category"
          slug={hub.slug}
          initialSubscribed={stats.subscribed}
          initialCount={stats.count}
          signedIn={Boolean(viewer)}
        />
      </section>

      {/* Switcher across categories */}
      <nav aria-label="All categories" className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORY_HUBS.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            aria-current={c.slug === hub.slug ? "page" : undefined}
            className={
              c.slug === hub.slug
                ? "shrink-0 rounded-full bg-ink px-4 py-1.5 text-[13.5px] font-semibold text-white"
                : "shrink-0 rounded-full border border-line-strong bg-surface px-4 py-1.5 text-[13.5px] font-medium text-ink-2 hover:border-ink hover:text-ink"
            }
          >
            {c.name}
          </Link>
        ))}
      </nav>

      {/* Month-grouped events */}
      {months.length === 0 ? (
        <div className="rounded-[24px] border border-line-strong bg-surface p-10 text-center">
          <h2 className="font-display text-[36px] leading-tight text-ink">
            No {hub.name.toLowerCase()} scheduled yet.
          </h2>
          <p className="mx-auto mt-2 max-w-[40ch] text-[15px] text-ink-muted">
            Subscribe above to get pinged as soon as an organizer publishes one.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {months.map((m) => (
            <section key={m.label} className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-line pb-2.5">
                <h2 className="font-display text-[28px] leading-none text-ink">{m.label}</h2>
                <span className="font-mono text-[12px] text-ink-muted">
                  {m.items.length} event{m.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {m.items.map((e) => (
                  <li key={e.id}>
                    <EventCard e={e} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
