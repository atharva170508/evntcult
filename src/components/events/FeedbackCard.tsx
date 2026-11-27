"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Star } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { toast } from "@/components/ui/Toaster";
import { cn } from "@/lib/utils";
import { EASE } from "@/components/motion/MotionProvider";

const WORDS = ["", "Not great", "Okay", "Good", "Really good", "Loved it"];

const QUICK_TAGS = [
  "Great vibe",
  "Smooth check-in",
  "Well organized",
  "Loved the speakers",
  "Great music",
  "Would attend again",
];

/**
 * Editorial post-event feedback card. Opens pre-rated when guests arrive from the 5-star email,
 * offers 1-tap highlight tags + optional written reflection, and animates smoothly on submit.
 */
export function FeedbackCard({
  slug,
  host,
  initial,
}: {
  slug: string;
  host: string;
  initial: { rating: number; comment: string | null } | null;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [done, setDone] = useState(!!initial);
  const [busy, setBusy] = useState(false);

  const send = async (r: number, c?: string) => {
    setBusy(true);
    const res = await fetch(`/api/events/${slug}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: r, ...(c ? { comment: c } : {}) }),
    });
    setBusy(false);
    if (!res.ok) {
      toast("Couldn't save your rating. Try again.", { tone: "error" });
      return false;
    }
    return true;
  };

  useEffect(() => {
    const r = Number(new URLSearchParams(location.search).get("rate"));
    if (r >= 1 && r <= 5 && !initial) {
      setRating(r);
      void send(r);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const composedComment = () => {
    const parts: string[] = [];
    if (selectedTags.length > 0) parts.push(`Highlights: ${selectedTags.join(", ")}`);
    if (comment.trim()) parts.push(comment.trim());
    return parts.join("\n").slice(0, 600);
  };

  const shown = hover || rating;

  return (
    <section
      id="feedback"
      aria-labelledby="fb-h"
      className="scroll-mt-36 overflow-hidden rounded-[4px] border border-line bg-surface p-6 md:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="fb-h" className="font-display text-[30px] leading-none tracking-[-0.025em] text-ink">
            {done ? (
              <>
                Thanks for <em>sharing.</em>
              </>
            ) : (
              <>
                How was <em>the event?</em>
              </>
            )}
          </h2>
          <p className="mt-2 text-[14.5px] text-ink-muted">
            {done
              ? `${host} sees your note. You can update it anytime.`
              : `${host} reads every response to make the next one even better.`}
          </p>
        </div>

        {done && (
          <button
            type="button"
            onClick={() => setDone(false)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-sunken px-3 text-[13px] font-semibold text-ink hover:bg-mist"
          >
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </button>
        )}
      </div>

      {/* Interactive star row */}
      <div
        className="mt-5 flex flex-wrap items-center gap-1.5"
        role="radiogroup"
        aria-label="Your rating"
        onPointerLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const lit = n <= shown;
          return (
            <m.button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} of 5, ${WORDS[n]}`}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
              onPointerEnter={() => setHover(n)}
              onClick={() => {
                setRating(n);
                void send(n).then((ok) => ok && setDone(false));
              }}
              className={cn(
                "grid size-12 place-items-center rounded-xl transition-colors duration-fast",
                lit ? "bg-accent-soft" : "bg-sunken/70 hover:bg-sunken",
              )}
            >
              <Star
                className={cn(
                  "size-6 transition-colors duration-fast",
                  lit ? "fill-accent text-accent" : "text-ink-subtle",
                )}
                strokeWidth={1.6}
                aria-hidden
              />
            </m.button>
          );
        })}

        <AnimatePresence mode="wait">
          {shown > 0 && (
            <m.span
              key={shown}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 4 }}
              transition={{ duration: 0.16, ease: EASE }}
              className="ml-2 font-display text-[22px] leading-none text-ink"
              aria-live="polite"
            >
              {WORDS[shown]}
            </m.span>
          )}
        </AnimatePresence>
      </div>

      {/* Expanded reflection drawer after picking a star */}
      <AnimatePresence initial={false}>
        {rating > 0 && !done && (
          <m.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="overflow-hidden"
            onSubmit={async (e) => {
              e.preventDefault();
              const finalText = composedComment();
              if (await send(rating, finalText || undefined)) {
                setDone(true);
                toast("Thanks, sent straight to the host.");
              }
            }}
          >
            <div className="mt-6 border-t border-line pt-5">
              <p className="text-[13px] font-semibold text-ink">
                What stood out? <span className="font-normal text-ink-muted">(optional)</span>
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Quick highlights">
                {QUICK_TAGS.map((tag) => {
                  const on = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "ui-press inline-flex h-8 items-center gap-1.5 rounded-[4px] px-3 text-[12.5px] font-medium transition-colors",
                        on
                          ? "bg-[#D4B87A] text-[#161820]"
                          : "bg-sunken text-ink-2 hover:bg-mist hover:text-ink",
                      )}
                    >
                      {on && <Check className="size-3" strokeWidth={2.8} aria-hidden />}
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="fb-c" className="text-[13px] font-semibold text-ink">
                    Add a note for {host}
                  </label>
                  <span className="font-mono text-[11.5px] tabular-nums text-ink-subtle">
                    {comment.length} / 600
                  </span>
                </div>
                <textarea
                  id="fb-c"
                  rows={3}
                  maxLength={600}
                  placeholder="Anything they should keep or improve next time…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mt-1.5 w-full rounded-xl bg-sunken px-3.5 py-3 text-[14.5px] text-ink outline-none transition-shadow placeholder:text-ink-subtle focus-visible:shadow-[var(--focus-field)]"
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={busy}
                  className="ui-press inline-flex h-11 items-center gap-2 rounded-[4px] bg-[#D4B87A] px-5 text-[12.5px] font-medium uppercase tracking-[0.12em] text-[#161820] hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? "Sending…" : "Send feedback"}
                </button>
              </div>
            </div>
          </m.form>
        )}
      </AnimatePresence>

      {/* Submitted confirmation pill */}
      {done && (
        <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-live-soft px-4 py-3 text-[13.5px] font-medium text-live">
          <Check className="size-4 shrink-0" strokeWidth={2.8} aria-hidden />
          <span>Your {rating}-star review has been saved.</span>
        </div>
      )}
    </section>
  );
}
