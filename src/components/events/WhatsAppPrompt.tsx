"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
    <div className="flex items-start gap-3 rounded-tile bg-live-soft/70 p-3.5">
      <MessageCircle className="mt-0.5 size-4 shrink-0 text-live" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-medium">Get event reminders on WhatsApp?</p>
        <div className="mt-2.5 flex gap-2">
          <Button size="sm" loading={busy} onClick={turnOn}>
            Turn on
          </Button>
          <Button size="sm" variant="ghost" onClick={dismiss}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
