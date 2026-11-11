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
      className="press inline-flex items-center justify-center mt-3 rounded-sm border border-line px-4 h-8 text-body-sm font-semibold hover:border-line-strong disabled:opacity-50"
    >
      {state === "done" ? "Test queued" : state === "error" ? "Didn't work. Try again" : "Send test to my number"}
    </button>
  );
}
