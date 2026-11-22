"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "@/components/ui/Toaster";
import { cn } from "@/lib/utils";

const WORDS = ["", "Not great", "Okay", "Good", "Really good", "Loved it"];

/** "How was it?" for guests after an event. Opens with a rating picked when they came from the email. */
export function FeedbackCard({ slug, host, initial }: { slug: string; host: string; initial: { rating: number; comment: string | null } | null }) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [done, setDone] = useState(!!initial);
  const [busy, setBusy] = useState(false);

  const send = async (r: number, c?: string) => {
    setBusy(true);
    const res = await fetch(`/api/events/${slug}/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating: r, ...(c ? { comment: c } : {}) }) });
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

  const shown = hover || rating;
  return (
    <section id="feedback" aria-labelledby="fb-h" className="scroll-mt-36 rounded-2xl border border-line bg-white p-5">
      <h2 id="fb-h" className="text-[18px] font-semibold text-ink">
        {done ? "Thanks for the rating" : "How was it?"}
      </h2>
      <p className="mt-1 text-[14px] text-ink-muted">{done ? `${host} sees your answer. You can change it any time.` : `${host} reads every answer.`}</p>
      <div className="mt-4 flex items-center gap-1" role="radiogroup" aria-label="Your rating" onPointerLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} of 5, ${WORDS[n]}`}
            onPointerEnter={() => setHover(n)}
            onClick={() => {
              setRating(n);
              void send(n).then((ok) => ok && setDone(false));
            }}
            className="grid size-11 place-items-center rounded-lg transition-transform active:scale-90"
          >
            <Star className={cn("size-7 transition-colors", n <= shown ? "fill-brand text-brand" : "text-line-strong")} strokeWidth={1.5} aria-hidden />
          </button>
        ))}
        <span className="ml-2 text-[14px] font-semibold text-ink" aria-live="polite">
          {WORDS[shown]}
        </span>
      </div>
      {rating > 0 && !done && (
        <form
          className="mt-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await send(rating, comment.trim() || undefined)) {
              setDone(true);
              toast("Thanks. Sent to the host.");
            }
          }}
        >
          <label htmlFor="fb-c" className="text-[13px] font-semibold text-ink">
            What should they keep or change? <span className="font-normal text-ink-subtle">(optional)</span>
          </label>
          <textarea id="fb-c" rows={3} maxLength={600} value={comment} onChange={(e) => setComment(e.target.value)} className="mt-1.5 w-full rounded-xl bg-sunken px-3 py-2.5 text-[14.5px] text-ink outline-none focus-visible:shadow-[var(--focus-field)]" />
          <button type="submit" disabled={busy} className="mt-3 h-10 rounded-xl bg-ink px-4 text-[14px] font-semibold text-white disabled:opacity-50">
            Send
          </button>
        </form>
      )}
    </section>
  );
}
