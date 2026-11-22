"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { Lock, MessageCircle, Trash2 } from "lucide-react";
import { WALL_EMOJI } from "@/lib/effects";
import { toast } from "@/components/ui/Toaster";
import { cn } from "@/lib/utils";

type Post = { id: string; body: string; at: string; name: string; mine: boolean; host: boolean; reactions: Record<string, { n: number; mine: boolean }> };
type Wall = { locked: true; count: number } | { locked: false; posts: Post[] };

const TINTS = ["#F0D7FF", "#FFE4C7", "#D6EEDF", "#FCD9DF", "#DCE7FB", "#F4EBC9"];
const tint = (s: string) => TINTS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];
const ini = (n: string) => {
  const p = n.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() || "?";
};
function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/**
 * Partiful-style guest wall: people who are going post and react; everyone else sees a blurred
 * preview behind a lock, which is the nudge to register.
 */
export function GuestWall({ slug, signedIn, registerHref }: { slug: string; signedIn: boolean; registerHref: string }) {
  const [wall, setWall] = useState<Wall | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const url = `/api/events/${slug}/wall`;

  useEffect(() => {
    void fetch(url)
      .then((r) => r.json())
      .then((d) => setWall(d as Wall))
      .catch(() => setWall({ locked: true, count: 0 }));
  }, [url]);

  const send = async (method: string, payload?: unknown, q = "") => {
    const r = await fetch(url + q, { method, headers: payload ? { "Content-Type": "application/json" } : undefined, body: payload ? JSON.stringify(payload) : undefined });
    const d = (await r.json().catch(() => ({}))) as { error?: { message?: string } };
    if (!r.ok) {
      toast(d?.error?.message ?? "That didn't go through. Try again.", { tone: "error" });
      return false;
    }
    setWall(d as unknown as Wall);
    return true;
  };

  if (!wall) return <div className="h-40 animate-pulse rounded-2xl bg-sunken/60" aria-hidden />;

  if (wall.locked) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-line bg-white/60">
        <div aria-hidden className="pointer-events-none select-none space-y-4 p-5 blur-[6px]">
          {["Can't wait for this!! who else is coming from comps?", "Saving seats in the front row 🙌", "Is there parking near the gate?"].map((t, i) => (
            <div key={i} className="flex gap-3">
              <span className="size-9 shrink-0 rounded-full" style={{ background: TINTS[i] }} />
              <div>
                <p className="h-3 w-24 rounded bg-ink/15" />
                <p className="mt-2 text-[14px] text-ink-2">{t}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-canvas/30 to-canvas/80 p-6 text-center">
          <div>
            <span className="mx-auto grid place-items-center text-ink">
              <Lock className="size-5" aria-hidden />
            </span>
            <p className="mt-3 text-[16px] font-semibold text-ink">Only guests can see the wall</p>
            <p className="mt-1 text-[13.5px] text-ink-muted">
              {wall.count > 0 ? `${wall.count} ${wall.count === 1 ? "post" : "posts"} from people who are going.` : "Register to say hi to everyone who's going."}
            </p>
            <a href={signedIn ? "#register" : registerHref} className="mt-4 inline-flex h-10 items-center rounded-xl bg-lavender px-5 text-[14px] font-semibold text-ink ring-2 ring-inset ring-ink">
              {signedIn ? "Register to join in" : "Log in to join in"}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!body.trim() || busy) return;
          setBusy(true);
          if (await send("POST", { body: body.trim() })) setBody("");
          setBusy(false);
          box.current?.focus();
        }}
        className="ui-field flex-col items-stretch gap-0 p-1.5"
      >
        <label htmlFor="wall-box" className="sr-only">
          Write on the wall
        </label>
        <textarea
          id="wall-box"
          ref={box}
          rows={2}
          maxLength={500}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
          }}
          placeholder="Say hi, ask a question, find your crew…"
          className="w-full resize-none bg-transparent px-2.5 py-2 text-[14.5px] text-ink outline-none placeholder:text-ink-subtle"
        />
        <div className="flex items-center justify-between px-1.5 pb-0.5">
          <span className="text-[11.5px] tabular-nums text-ink-subtle">{body.length > 400 ? `${500 - body.length} left` : "Ctrl + Enter to post"}</span>
          <button type="submit" disabled={!body.trim() || busy} className="h-8 rounded-[10px] bg-ink px-3.5 text-[13px] font-semibold text-white transition-opacity disabled:opacity-40">
            Post
          </button>
        </div>
      </form>

      {wall.posts.length === 0 ? (
        <p className="mt-5 flex items-center gap-2 text-[14px] text-ink-muted">
          <MessageCircle className="size-4" aria-hidden /> Nobody has posted yet. Start it off.
        </p>
      ) : (
        <ul className="mt-5 space-y-5">
          <AnimatePresence initial={false}>
            {wall.posts.map((p) => (
              <m.li key={p.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="group flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold" style={{ background: tint(p.name), color: "#1a1a1a" }} aria-hidden>
                  {ini(p.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[13.5px]">
                    <span className="font-semibold text-ink">{p.name}</span>
                    {p.host && <span className="rounded-lg bg-lavender px-2 py-px text-[11px] font-semibold text-ink">Host</span>}
                    <time dateTime={p.at} className="text-ink-subtle">
                      {ago(p.at)}
                    </time>
                    {p.mine && (
                      <button
                        type="button"
                        aria-label="Delete your post"
                        onClick={() => void send("DELETE", undefined, `?id=${p.id}`).then((ok) => ok && toast("Post deleted"))}
                        className="ml-auto grid size-7 place-items-center rounded-lg text-ink-subtle opacity-0 transition-opacity hover:bg-sunken hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    )}
                  </p>
                  <p className="mt-0.5 whitespace-pre-line break-words text-[14.5px] leading-relaxed text-ink-2">{p.body}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {WALL_EMOJI.map((em) => {
                      const r = p.reactions[em];
                      return (
                        <button
                          key={em}
                          type="button"
                          aria-pressed={!!r?.mine}
                          aria-label={`React ${em}${r ? `, ${r.n}` : ""}`}
                          onClick={() => void send("POST", { react: p.id, emoji: em })}
                          className={cn(
                            "inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[13px] tabular-nums transition-all active:scale-90",
                            r?.mine ? "bg-lavender font-semibold text-ink ring-1 ring-inset ring-ink/20" : r ? "bg-sunken text-ink-2" : "text-ink-subtle opacity-0 hover:bg-sunken focus-visible:opacity-100 group-hover:opacity-100 max-sm:opacity-60",
                          )}
                        >
                          <span aria-hidden>{em}</span>
                          {r && r.n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
