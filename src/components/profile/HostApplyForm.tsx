"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

/** Apply to host. Checked on blur, then on change (§8); the server checks again. */
export function HostApplyForm({ club: club0, note: note0 }: { club: string; note: string }) {
  const router = useRouter();
  const [club, setClub] = useState(club0);
  const [note, setNote] = useState(note0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/host", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ club, note }) });
    setBusy(false);
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      return setError(d.error?.message ?? "That didn't send. Try again.");
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <Input
        label="Club or group"
        value={club}
        onChange={(e) => setClub(e.target.value)}
        placeholder="e.g. Coding Club, Music Society"
        maxLength={80}
        validate={(v) => (v.trim().length >= 2 ? null : "required")}
      />
      <Textarea
        label="What will you run?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="e.g. Monthly game nights in the Old Gym, about 60 people each."
        maxLength={500}
        helper="A sentence or two is enough."
        validate={(v) => (v.trim().length >= 10 ? null : "Say in a sentence what you plan to run.")}
      />
      {error && (
        <p role="alert" className="border-l-2 border-bad pl-3 text-body-sm">
          {error}
        </p>
      )}
      <Button type="submit" loading={busy} className="w-fit">
        Apply to host
      </Button>
    </form>
  );
}
