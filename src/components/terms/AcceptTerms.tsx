"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Field";
import { TERMS_LABEL } from "@/lib/terms";

/**
 * Shown at the top of the terms page to signed-in people who haven't accepted the current version
 * (existing accounts, or everyone after the terms change). Accepting saves the date and version.
 */
export function AcceptTerms({ next }: { next: string }) {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept(e: React.FormEvent) {
    e.preventDefault();
    if (!checked) return setError("Tick the box to continue.");
    setBusy(true);
    setError(null);
    const res = await fetch("/api/terms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accept: true }) }).catch(() => null);
    if (!res?.ok) {
      setBusy(false);
      return setError("Couldn't save that. Check your connection and try again.");
    }
    window.location.href = next;
  }

  return (
    <form onSubmit={accept} className="card space-y-4 p-5 md:p-6" aria-labelledby="accept-h">
      <div>
        <h2 id="accept-h" className="text-[18px] font-semibold text-ink">
          Before you carry on
        </h2>
        <p className="mt-1 text-[15px] text-ink-2">We&apos;ve added Terms &amp; Conditions and User Rules. Please read them below and agree once to keep using EvntCult.</p>
      </div>
      <TermsCheckbox checked={checked} onChange={setChecked} />
      {error && <Notice tone="danger">{error}</Notice>}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button type="submit" variant="accent" size="lg" loading={busy}>
          Agree and continue
        </Button>
        <Link href="#terms" className="text-[15px] font-semibold text-ink underline decoration-line-strong decoration-2 underline-offset-[5px] hover:decoration-ink">
          Read the terms
        </Link>
      </div>
    </form>
  );
}

/** The one checkbox, shared by sign-up and the accept panel, with a link to the terms page. */
export function TermsCheckbox({ checked, onChange, newTab = false }: { checked: boolean; onChange: (v: boolean) => void; newTab?: boolean }) {
  const [before, after] = TERMS_LABEL.split("Terms & Conditions and User Rules");
  return (
    <label className="flex cursor-pointer items-start gap-3 text-[14px] leading-snug text-ink-2">
      <input
        type="checkbox"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-5 shrink-0 cursor-pointer rounded accent-ink"
      />
      <span>
        {before}
        <Link
          href="/terms"
          target={newTab ? "_blank" : undefined}
          rel={newTab ? "noopener" : undefined}
          className="font-semibold text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink"
        >
          Terms &amp; Conditions and User Rules
        </Link>
        {after}
      </span>
    </label>
  );
}
