"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneFields } from "./PhoneFields";
import { Button } from "@/components/ui/Button";

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
    <form onSubmit={save} className="card flex max-w-[720px] flex-col gap-4 p-4 sm:p-6">
      <div>
        <h2 className="text-title">Add your mobile number</h2>
        <p className="mt-1 text-body-sm text-ink-muted">For event reminders and pass updates. Organizers never see it.</p>
      </div>
      <PhoneFields phone={phone} setPhone={setPhone} optIn={optIn} setOptIn={setOptIn} />
      {error && (
        <p role="alert" className="border-l-2 border-bad bg-surface px-4 py-3 text-body-sm">
          {error}
        </p>
      )}
      <Button type="submit" variant="secondary" loading={busy} className="w-fit">
        Save number
      </Button>
    </form>
  );
}
