"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Field";
import { PhoneFields } from "./PhoneFields";

/** Dashboard prompt for signed-in people who haven't added a mobile number yet. */
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
    }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { error?: { message: string } } | undefined;
    setBusy(false);
    if (!res?.ok) return setError(data?.error?.message ?? "Couldn't save. Check your connection and try again.");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="card grid gap-6 p-5 md:grid-cols-[1fr_1.2fr] md:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-tile bg-live-soft text-live">
          <MessageCircle className="size-[18px]" aria-hidden />
        </span>
        <div>
          <h2 className="text-h4 font-semibold">Add your mobile number</h2>
          <p className="mt-1 text-small text-ink-muted">So you can get event reminders and pass updates on WhatsApp.</p>
        </div>
      </div>
      <div className="space-y-3">
        <PhoneFields phone={phone} setPhone={setPhone} optIn={optIn} setOptIn={setOptIn} />
        {error && <Notice tone="danger">{error}</Notice>}
        <Button type="submit" loading={busy}>
          Save number
        </Button>
      </div>
    </form>
  );
}
