"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import { PhoneFields } from "./PhoneFields";

/** Shown on the dashboard to signed-in users who haven't added a mobile number yet. */
export function AddPhoneCard() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, whatsappOptIn: optIn }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: { message: string } };
    setBusy(false);
    if (!res.ok) return setError(data.error?.message ?? "Couldn't save. Try again.");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="card space-y-3 p-5">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-xl bg-live-soft text-live">
          <MessageCircle className="size-5" />
        </span>
        <div>
          <h2 className="headline text-[16px]">Add your mobile number</h2>
          <p className="text-[13px] text-ink-muted">So you can get event reminders on WhatsApp.</p>
        </div>
      </div>
      <PhoneFields phone={phone} setPhone={setPhone} optIn={optIn} setOptIn={setOptIn} />
      {error && (
        <p role="alert" className="rounded-2xl bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger">
          {error}
        </p>
      )}
      <button disabled={busy} className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-ink-contrast disabled:opacity-50">
        {busy && <Loader2 className="size-4 animate-spin" />} Save number
      </button>
    </form>
  );
}
