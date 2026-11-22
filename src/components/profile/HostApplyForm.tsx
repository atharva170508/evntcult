"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input, Notice, Textarea } from "@/components/ui/Field";

/** A student's request to host events. The owner approves or rejects it from the owner panel. */
export function HostApplyForm() {
  const router = useRouter();
  const [club, setClub] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  const clubError = club.trim().length < 2 ? "Add your organization or group name." : null;
  const noteError = note.trim().length < 10 ? "Say a little about what you'll run (at least 10 characters)." : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (clubError || noteError) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/host", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ club: club.trim(), note: note.trim() }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { error?: { message: string } } | undefined;
    setBusy(false);
    if (!res?.ok) return setError(data?.error?.message ?? "Couldn't send. Check your connection and try again.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} noValidate className="card space-y-5 p-5 md:p-6">
      <Field label="Organization or group" error={tried ? clubError : null}>
        {(p) => <Input {...p} value={club} onChange={(e) => setClub(e.target.value)} maxLength={80} autoComplete="organization" />}
      </Field>
      <Field label="What will you run?" error={tried ? noteError : null}>
        {(p) => <Textarea {...p} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />}
      </Field>
      {error && <Notice tone="danger">{error}</Notice>}
      <Button type="submit" variant="accent" size="lg" loading={busy}>
        Send application
      </Button>
    </form>
  );
}
