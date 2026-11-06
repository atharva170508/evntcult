"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/** Google-Classroom-style "join with a code" sheet. */
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
    const res = await fetch("/api/codes/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setState({ status: "error", message: data.error ?? "Something went wrong." });
    setState({ status: "ok", message: `Unlocked ${data.event.title}` });
    setTimeout(() => {
      onClose();
      router.push(`/events/${data.event.slug}`);
    }, 700);
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(92vw,420px)] rounded-[28px] border border-line bg-surface p-0 text-ink shadow-pop backdrop:bg-ink/40 backdrop:backdrop-blur-sm open:animate-fade-up"
    >
      <form onSubmit={submit} className="p-7">
        <div className="flex items-start justify-between">
          <div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
            <KeyRound className="size-5" />
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-ink-subtle hover:bg-canvas hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
        <h2 className="headline mt-5 text-[24px]">Join with a code</h2>
        <p className="mt-1 text-[14px] text-ink-muted">Private events share a 7-character code. Ask the organizer for yours.</p>

        <input
          ref={inputRef}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (state.status === "error") setState({ status: "idle" });
          }}
          maxLength={9}
          autoComplete="off"
          spellCheck={false}
          placeholder="ACK3PQ7"
          aria-label="Event code"
          className={cn(
            "mt-6 w-full rounded-2xl border-2 bg-canvas px-4 py-3.5 text-center font-mono text-[22px] font-bold tracking-[0.35em] text-ink placeholder:text-ink-subtle/50 transition-colors focus:outline-none",
            state.status === "error" ? "border-danger/60" : "border-transparent focus:border-brand",
          )}
        />
        <p
          className={cn(
            "mt-2 h-5 text-center text-[13px] font-semibold",
            state.status === "error" ? "text-danger" : state.status === "ok" ? "text-live" : "text-transparent",
          )}
          role="status"
        >
          {state.message ?? "—"}
        </p>

        <Button type="submit" className="mt-3 w-full py-3.5" disabled={code.replace(/[\s-]/g, "").length < 7 || state.status === "loading"}>
          {state.status === "loading" && <Loader2 className="size-4 animate-spin" />}
          Continue
        </Button>
      </form>
    </dialog>
  );
}
