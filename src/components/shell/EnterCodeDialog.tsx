"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/** "Join with a code" modal: one segmented mono input, inline status, auto-redirect on success. */
export function EnterCodeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [code, setCode] = useState("");
  const [state, setState] = useState<{ status: "idle" | "loading" | "error" | "ok"; message?: string }>({ status: "idle" });

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    if (!open && d.open) d.close();
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: "loading" });
    const res = await fetch("/api/events/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => null);
    if (!res) return setState({ status: "error", message: "You seem to be offline. Try again." });
    const data = (await res.json().catch(() => ({}))) as { error?: { message?: string }; event?: { title: string; slug: string } };
    if (!res.ok || !data.event) return setState({ status: "error", message: data.error?.message ?? "Something went wrong." });
    const ev = data.event;
    setState({ status: "ok", message: `Unlocked · ${ev.title}` });
    setTimeout(() => {
      onClose();
      router.push(`/events/${ev.slug}?code=${encodeURIComponent(code)}`);
    }, 700);
  }

  const ready = code.replace(/[\s-]/g, "").length >= 7;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="code-title"
      className="m-auto w-[min(92vw,420px)] rounded-panel bg-surface p-0 text-ink shadow-pop backdrop:bg-ink/40 backdrop:backdrop-blur-[2px] open:animate-scale-in"
    >
      <form onSubmit={submit} className="p-6 md:p-7">
        <div className="flex items-start justify-between">
          <span className="grid size-10 place-items-center rounded-tile bg-sunken text-ink">
            <KeyRound className="size-[18px]" />
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 -mt-2 grid size-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-ink/[0.05] hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
        <h2 id="code-title" className="mt-5 text-h3 font-semibold">Join with a code</h2>
        <p className="mt-1 text-small text-ink-muted">Private events share a 7-character code. Ask the organizer for yours.</p>

        <input
          ref={inputRef}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (state.status === "error") setState({ status: "idle" });
          }}
          maxLength={9}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="ACK3PQ7"
          aria-label="Event code"
          aria-invalid={state.status === "error" || undefined}
          aria-describedby="code-status"
          className={cn("field mt-6 h-16 text-center font-mono text-[24px] font-medium tracking-[0.4em] placeholder:text-ink-subtle/40")}
        />
        <p
          id="code-status"
          role="status"
          className={cn(
            "mt-2 flex h-5 items-center justify-center gap-1.5 text-[13px] font-medium",
            state.status === "error" ? "text-danger" : state.status === "ok" ? "text-live" : "text-transparent",
          )}
        >
          {state.status === "ok" && <Check className="size-3.5" aria-hidden />}
          {state.message ?? "—"}
        </p>

        <Button type="submit" size="lg" className="mt-3 w-full" disabled={!ready} loading={state.status === "loading"}>
          Continue
        </Button>
      </form>
    </dialog>
  );
}
