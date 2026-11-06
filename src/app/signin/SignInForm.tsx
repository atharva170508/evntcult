"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function SignInForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [needName, setNeedName] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(needName ? { email, name } : { email }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: { code: string; message: string } };
    setBusy(false);
    if (res.ok) {
      window.location.href = next;
      return;
    }
    if (data.error?.code === "name_required") {
      setNeedName(true);
      setError("New here? Add your name to create your account.");
      return;
    }
    setError(data.error?.message ?? "Sign-in failed. Try again.");
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-3">
      <label className="block">
        <span className="text-[13px] font-semibold text-ink-2">College email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@college.edu"
          className="mt-1.5 w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-[15px] placeholder:text-ink-subtle focus:border-brand focus:outline-none"
        />
      </label>
      {needName && (
        <label className="block">
          <span className="text-[13px] font-semibold text-ink-2">Your name</span>
          <input
            required
            minLength={2}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-[15px] focus:border-brand focus:outline-none"
          />
        </label>
      )}
      {error && (
        <p role="alert" className="rounded-2xl bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-black disabled:opacity-50"
      >
        {busy && <Loader2 className="size-4 animate-spin" />}
        {needName ? "Create account" : "Continue"}
      </button>
    </form>
  );
}
