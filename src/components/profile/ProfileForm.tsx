"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Notice } from "@/components/ui/Field";
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

  const dirty = () => setSaved(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, whatsappOptIn: optIn }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { error?: { message: string } } | undefined;
    setBusy(false);
    if (!res?.ok) return setError(data?.error?.message ?? "Couldn't save. Check your connection and try again.");
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="card space-y-5 p-5 md:p-7">
      <Field label="Your name" hint="Shown on your passes and certificates.">
        {(a) => (
          <Input
            {...a}
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              dirty();
            }}
          />
        )}
      </Field>
      <PhoneFields
        phone={phone}
        setPhone={(v) => {
          setPhone(v);
          dirty();
        }}
        optIn={optIn}
        setOptIn={(v) => {
          setOptIn(v);
          dirty();
        }}
      />
      {error && <Notice tone="danger">{error}</Notice>}
      <div className="flex items-center gap-3 border-t border-line pt-5">
        <Button type="submit" loading={busy}>
          Save changes
        </Button>
        <span role="status" className="text-[13px] font-medium text-live">
          {saved && (
            <span className="inline-flex animate-fade-in items-center gap-1">
              <Check className="size-4" aria-hidden /> Saved
            </span>
          )}
        </span>
      </div>
    </form>
  );
}
