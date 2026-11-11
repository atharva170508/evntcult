"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneFields } from "./PhoneFields";
import { Button } from "@/components/ui/Button";

/** /profile: change your name, mobile number and WhatsApp consent. */
export function ProfileForm(props: { name: string; phone: string | null; whatsappOptIn: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(props.name);
  const [phone, setPhone] = useState(props.phone?.replace(/^\+91/, "") ?? "");
  const [optIn, setOptIn] = useState(props.whatsappOptIn);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, whatsappOptIn: optIn }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: { message: string } };
    setBusy(false);
    if (!res.ok) return setError(data.error?.message ?? "Couldn't save. Try again.");
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="mt-8 flex flex-col gap-6">
      <label className="block">
        <span className="text-label text-ink-muted">Your name</span>
        <input
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false); }}
          className="mt-2 w-full rounded-sm border border-line-strong bg-surface px-3 h-12 md:h-10 text-body text-ink placeholder:text-ink-subtle"
        />
      </label>
      <PhoneFields phone={phone} setPhone={(v) => { setPhone(v); setSaved(false); }} optIn={optIn} setOptIn={(v) => { setOptIn(v); setSaved(false); }} />
      {error && (
        <p role="alert" className="border-l-2 border-bad bg-surface px-4 py-3 text-body-sm">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          Save changes
        </Button>
        <span role="status" className="text-body-sm text-ok">
          {saved && "Saved."}
        </span>
      </div>
    </form>
  );
}
