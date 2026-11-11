"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { fieldClass } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

/** Join a private event with its code. Uses the shared modal: focus trapped, Esc returns focus. */
export function EnterCodeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [state, setState] = useState<{ status: "idle" | "loading" | "error" | "ok"; message?: string }>({ status: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: "loading" });
    const res = await fetch("/api/events/unlock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const data = (await res.json().catch(() => ({}))) as { error?: { message?: string }; event?: { title: string; slug: string } };
    if (!res.ok || !data.event) return setState({ status: "error", message: data.error?.message ?? "That didn't work. Check the code and try again." });
    const ev = data.event;
    setState({ status: "ok", message: `Found ${ev.title}.` });
    onClose();
    router.push(`/events/${ev.slug}?code=${encodeURIComponent(code)}`);
  }

  return (
    <Modal open={open} onClose={onClose} title="Join with a code">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label htmlFor="event-code" className="text-label text-ink-muted">
          Event code
        </label>
        <input
          id="event-code"
          autoFocus
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (state.status === "error") setState({ status: "idle" });
          }}
          maxLength={9}
          autoComplete="off"
          spellCheck={false}
          placeholder="e.g. ACK3PQ7"
          aria-invalid={state.status === "error"}
          aria-describedby="event-code-msg"
          className={cn(fieldClass, "h-12 font-mono tracking-[0.12em]")}
        />
        <p id="event-code-msg" role="status" className={cn("min-h-5 text-label", state.status === "error" ? "text-bad" : "text-ink-muted")}>
          {state.message ?? "Ask the organizer for the 7-character code."}
        </p>
        <Button type="submit" size="lg" className="w-full" loading={state.status === "loading"} disabled={code.replace(/[\s-]/g, "").length < 7}>
          Continue
        </Button>
      </form>
    </Modal>
  );
}
