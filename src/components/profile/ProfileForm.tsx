"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { PhoneFields } from "./PhoneFields";

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
    <form onSubmit={save} className="card mt-4 space-y-4 p-5">
      <label className="block">
        <span className="text-[13px] font-semibold text-ink-2">Your name</span>
        <input
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false); }}
          className="mt-1.5 w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-[15px] focus:border-brand focus:outline-none"
        />
      </label>
      <PhoneFields phone={phone} setPhone={(v) => { setPhone(v); setSaved(false); }} optIn={optIn} setOptIn={(v) => { setOptIn(v); setSaved(false); }} />
      {error && (
        <p role="alert" className="rounded-2xl bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-volt px-5 py-2.5 text-[14px] font-semibold text-ink-inverse hover:bg-volt-hover disabled:opacity-50">
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Save changes
        </button>
        <span role="status" className="text-[13px] font-semibold text-live">
          {saved && (
            <span className="inline-flex items-center gap-1">
              <Check className="size-4" aria-hidden /> Saved
            </span>
          )}
        </span>
      </div>
    </form>
  );
}
