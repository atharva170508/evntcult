"use client";

import { useEffect, useState } from "react";

const KEY = "evntcult-wa-prompt-dismissed";

/** Consent is the person's own tap. Nothing is switched on for them. */
export function WhatsAppPrompt({ phone }: { phone: string }) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setShow(localStorage.getItem(KEY) !== "1");
    } catch {
      setShow(true);
    }
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // the card just comes back next time
    }
  }

  async function turnOn() {
    setBusy(true);
    const res = await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, whatsappOptIn: true }) }).catch(() => null);
    setBusy(false);
    if (res?.ok) setShow(false);
  }

  if (!show) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-4">
      <p className="text-[14px] font-semibold">Get event reminders on WhatsApp?</p>
      <div className="flex gap-2">
        <button disabled={busy} onClick={turnOn} className="rounded-full bg-volt px-4 py-2 text-[13px] font-bold text-ink-inverse disabled:opacity-50">
          Yes
        </button>
        <button onClick={dismiss} className="rounded-full border border-line px-4 py-2 text-[13px] font-semibold">
          No
        </button>
      </div>
    </div>
  );
}
