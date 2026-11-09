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
      className="mt-3 rounded-full border border-line px-4 py-2 text-[13px] font-semibold hover:border-volt/60 disabled:opacity-50"
    >
      {state === "done" ? "Test queued" : state === "error" ? "Didn't work. Try again" : "Send test to my number"}
    </button>
  );
}
