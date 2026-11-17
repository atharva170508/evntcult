"use client";

import { useState } from "react";

export function WaTestButton({ eventId }: { eventId: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  return (
    <button
      disabled={state === "busy"}
      onClick={async () => {
        setState("busy");
        const res = await fetch(`/api/events/${eventId}/notifications/test`, { method: "POST" }).catch(() => null);
        setState(res?.ok ? "done" : "error");
      }}
      className="inline-flex h-8 items-center rounded-[10px] bg-surface px-3.5 text-[13px] font-medium shadow-card transition-shadow hover:shadow-raised disabled:opacity-50"
    >
      {state === "done" ? "Test queued" : state === "error" ? "Didn't work. Try again" : "Send test to my number"}
    </button>
  );
}
