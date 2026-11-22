"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { CheckCircle2, ChevronDown, ChevronUp, Clock, Copy, Download, Mail, MessageCircle, Ticket, X } from "lucide-react";
import { toast } from "@/components/ui/Toaster";
import { formatINR } from "@/lib/money";

type Guest = {
  name: string; email: string; status: string; pass: string; tier: string | null; amountPaise: number | null; payment: string | null;
  posts: number; otherEvents: number; steps: { label: string; at: string; by: string | null; note?: string; kind?: string }[];
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/**
 * Two things on the attendee table, wired by data attributes on the server-rendered rows:
 * tick rows (or the header box) to act on many at once, and click a name to open the guest's
 * details with their full history, Luma-style.
 */
export function AttendeeTools({ eventId, tableId, slug }: { eventId: string; tableId: string; slug: string }) {
  const [sel, setSel] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);

  const sync = useCallback(() => {
    const t = document.getElementById(tableId);
    if (!t) return;
    const boxes = [...t.querySelectorAll<HTMLInputElement>("input[data-bulk]")];
    const ids = boxes.filter((b) => b.checked).map((b) => b.value);
    setSel(ids);
    boxes.forEach((b) => b.closest("tr")?.toggleAttribute("data-picked", b.checked));
    const all = t.querySelector<HTMLInputElement>("input[data-bulk-all]");
    if (all) {
      all.checked = ids.length > 0 && ids.length === boxes.length;
      all.indeterminate = ids.length > 0 && ids.length < boxes.length;
    }
  }, [tableId]);

  useEffect(() => {
    const t = document.getElementById(tableId);
    if (!t) return;
    const change = (e: Event) => {
      const el = e.target as HTMLInputElement;
      if (el.matches("input[data-bulk-all]")) t.querySelectorAll<HTMLInputElement>("input[data-bulk]").forEach((b) => (b.checked = el.checked));
      if (el.matches("input[data-bulk], input[data-bulk-all]")) sync();
    };
    const click = (e: MouseEvent) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-guest]");
      if (b) setOpen(b.dataset.guest!);
    };
    t.addEventListener("change", change);
    t.addEventListener("click", click);
    return () => {
      t.removeEventListener("change", change);
      t.removeEventListener("click", click);
    };
  }, [tableId, sync]);

  useEffect(() => {
    if (!open) return;
    setGuest(null);
    void fetch(`/api/events/${eventId}/attendees/${open}`)
      .then((r) => (r.ok ? (r.json() as Promise<Guest>) : null))
      .then(setGuest);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        step(1);
      }
      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, eventId]);

  const ids = () => [...document.querySelectorAll<HTMLElement>(`#${tableId} [data-guest]`)].map((b) => b.dataset.guest!);
  const step = (d: number) => {
    const list = ids();
    const i = list.indexOf(open ?? "");
    const next = list[i + d];
    if (next) setOpen(next);
  };
  const rows = () =>
    sel
      .map((id) => document.querySelector<HTMLElement>(`#${tableId} tr[data-reg="${id}"]`))
      .filter(Boolean)
      .map((tr) => ({ name: tr!.dataset.name ?? "", email: tr!.dataset.email ?? "", pass: tr!.dataset.pass ?? "" }));
  const clear = () => {
    document.querySelectorAll<HTMLInputElement>(`#${tableId} input[data-bulk], #${tableId} input[data-bulk-all]`).forEach((b) => (b.checked = false));
    sync();
  };

  return (
    <>
      <AnimatePresence>
        {sel.length > 0 && (
          <m.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0, transition: { duration: 0.14 } }}
            transition={{ type: "spring", stiffness: 500, damping: 36 }}
            role="toolbar"
            aria-label={`${sel.length} selected`}
            className="fixed inset-x-0 bottom-5 z-50 mx-auto flex w-fit max-w-[calc(100%-24px)] items-center gap-1 rounded-2xl bg-ink p-1.5 pl-4 text-white shadow-[0_18px_40px_-12px_rgba(20,14,4,.5)]"
          >
            <span className="mr-2 text-[13.5px] font-semibold tabular-nums">{sel.length} selected</span>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(rows().map((r) => r.email).join(", "));
                toast(`Copied ${sel.length} ${sel.length === 1 ? "email" : "emails"}`);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold hover:bg-white/10"
            >
              <Copy className="size-3.5" aria-hidden /> Copy emails
            </button>
            <a href={`mailto:?bcc=${encodeURIComponent(rows().map((r) => r.email).join(","))}`} className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold hover:bg-white/10">
              <Mail className="size-3.5" aria-hidden /> Email
            </a>
            <button
              type="button"
              onClick={() => {
                const csv = ["Name,Email,Pass", ...rows().map((r) => [r.name, r.email, r.pass].map((v) => `"${v.replace(/"/g, '""')}"`).join(","))].join("\n");
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                a.download = `${slug}-selected.csv`;
                a.click();
                URL.revokeObjectURL(a.href);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold hover:bg-white/10"
            >
              <Download className="size-3.5" aria-hidden /> CSV
            </button>
            <button type="button" onClick={clear} aria-label="Clear selection" className="grid size-9 place-items-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white">
              <X className="size-4" aria-hidden />
            </button>
          </m.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <m.div key="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)} className="fixed inset-0 z-50 bg-ink/20" aria-hidden />
            <m.aside
              key="panel"
              role="dialog"
              aria-label="Guest details"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%", transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 420, damping: 40 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[420px] flex-col bg-white shadow-[-20px_0_60px_-20px_rgba(20,14,4,.3)]"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <h2 className="text-[15px] font-semibold text-ink">Guest details</h2>
                <span className="ml-auto mr-1 flex">
                  <button type="button" aria-label="Previous guest" aria-keyshortcuts="k ArrowUp" onClick={() => step(-1)} className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-sunken">
                    <ChevronUp className="size-4" aria-hidden />
                  </button>
                  <button type="button" aria-label="Next guest" aria-keyshortcuts="j ArrowDown" onClick={() => step(1)} className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-sunken">
                    <ChevronDown className="size-4" aria-hidden />
                  </button>
                </span>
                <button type="button" autoFocus onClick={() => setOpen(null)} aria-label="Close" className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-sunken">
                  <X className="size-4" aria-hidden />
                </button>
              </div>
              {!guest ? (
                <div className="space-y-3 p-5" aria-busy>
                  <div className="h-12 w-12 animate-pulse rounded-full bg-sunken" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-sunken" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-sunken" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-12 place-items-center rounded-full bg-lavender text-[15px] font-semibold" style={{ color: "#1a1a1a" }} aria-hidden>
                      {guest.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[17px] font-semibold text-ink">{guest.name}</p>
                      {guest.email.endsWith("@walkin.invalid") ? (
                        <span className="text-[13.5px] text-ink-muted">Walk-in</span>
                      ) : (
                        <a href={`mailto:${guest.email}`} className="truncate text-[13.5px] text-ink-muted hover:text-ink">
                          {guest.email}
                        </a>
                      )}
                    </div>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-2 text-[13px]">
                    {[
                      ["Pass", guest.pass],
                      ["Status", guest.status === "registered" ? "Going" : guest.status === "waitlisted" ? "Waitlist" : guest.status],
                      ...(guest.tier ? [["Ticket", guest.tier]] : []),
                      ...(guest.amountPaise ? [["Paid", `${formatINR(guest.amountPaise)}${guest.payment === "paid" ? "" : " (unverified)"}`]] : []),
                      ["Your other events", String(guest.otherEvents)],
                      ["Wall posts", String(guest.posts)],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-sunken/60 px-3 py-2.5">
                        <dt className="text-ink-subtle">{k}</dt>
                        <dd className="mt-0.5 truncate font-semibold capitalize text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <h3 className="mt-6 text-[13px] font-semibold text-ink-muted">History</h3>
                  <ol className="relative mt-3 space-y-4 border-l border-line pl-5">
                    {guest.steps.map((s, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[27px] top-0.5 grid size-[13px] place-items-center rounded-full bg-white ring-1 ring-line-strong" aria-hidden>
                          <span className={`size-[7px] rounded-full ${s.label === "Checked in" ? "bg-live" : s.label === "Cancelled" || s.note?.startsWith("Failed") ? "bg-danger" : s.kind === "message" ? "bg-line-strong" : "bg-ink"}`} />
                        </span>
                        <p className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
                          {s.label === "Checked in" ? <CheckCircle2 className="size-3.5 text-live" aria-hidden /> : s.label === "Registered" ? <Ticket className="size-3.5" aria-hidden /> : s.kind === "message" ? <Mail className="size-3.5 text-ink-muted" aria-hidden /> : <Clock className="size-3.5 text-ink-muted" aria-hidden />}
                          {s.label}
                        </p>
                        <p className="text-[12.5px] text-ink-muted">
                          {when(s.at)}
                          {s.by && <>, by {s.by}</>}
                          {s.note && <>. {s.note}</>}
                        </p>
                      </li>
                    ))}
                  </ol>
                  {guest.posts > 0 && (
                    <a href={`/events/${slug}#wall`} className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink underline decoration-line-strong underline-offset-4">
                      <MessageCircle className="size-3.5" aria-hidden /> See the guest wall
                    </a>
                  )}
                </div>
              )}
            </m.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
