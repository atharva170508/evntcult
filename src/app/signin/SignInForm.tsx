"use client";

import { useEffect, useState } from "react";
import { PhoneFields } from "@/components/profile/PhoneFields";
import { fieldClass } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type ApiErr = { error?: { code: string; message: string } };

/** This address never logs in as a student: it opens the owner code popup. The server checks the code. */
const OWNER_EMAIL = "evntcult@gmail.com";

const inputCls = cn(fieldClass, "mt-2 h-12 md:h-10");

/**
 * Sign in / sign up.
 * - codeLogin = true: email -> we email a 6-digit code -> enter it (M6).
 * - codeLogin = false: the old email-only login, until the email provider key is set on the server.
 */
export function SignInForm({ next, signup = false, codeLogin }: { next: string; signup?: boolean; codeLogin: boolean }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [needName, setNeedName] = useState(signup);
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [ownerCode, setOwnerCode] = useState("");
  const [ownerError, setOwnerError] = useState<string | null>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const details = () => (needName ? { name, phone, whatsappOptIn: optIn } : {});

  async function post(url: string, body: unknown) {
    setBusy(true);
    setError(null);
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as ApiErr & { resendAfterSec?: number };
    setBusy(false);
    return { res, data };
  }

  function handleError(data: ApiErr, fallback: string) {
    if (data.error?.code === "name_required" || data.error?.code === "phone_required") {
      setNeedName(true);
      setError("New here? Add your name and number to create your account.");
      return;
    }
    if (data.error?.code === "too_many_tries" || data.error?.code === "code_expired") setCode("");
    setError(data.error?.message ?? fallback);
  }

  async function sendCode() {
    const { res, data } = await post("/api/auth/code", { email });
    if (!res.ok) return handleError(data, "Couldn't send the code. Try again.");
    setStep("code");
    setCode("");
    setResendIn(data.resendAfterSec ?? 30);
  }

  async function submitOwner(e: React.FormEvent) {
    e.preventDefault();
    setOwnerError(null);
    const { res, data } = await post("/api/admin/session", { email, code: ownerCode });
    if (res.ok) return void (window.location.href = "/admin");
    setOwnerCode("");
    setOwnerError(data.error?.message ?? "That didn't work. Try again.");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim().toLowerCase() === OWNER_EMAIL) {
      setError(null);
      setOwnerError(null);
      setOwnerOpen(true);
      return;
    }
    if (!codeLogin) {
      const { res, data } = await post("/api/auth/session", { email, ...details() });
      if (res.ok) return void (window.location.href = next);
      return handleError(data, "Sign-in failed. Try again.");
    }
    if (step === "email") return sendCode();
    const { res, data } = await post("/api/auth/verify", { email, code, ...details() });
    if (res.ok) return void (window.location.href = next);
    handleError(data, "That didn't work. Try again.");
  }

  return (
    <>
    {ownerOpen && (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-labelledby="owner-title">
        <form onSubmit={submitOwner} className="w-full max-w-sm space-y-3 rounded-lg border border-line bg-surface p-6">
          <h2 id="owner-title" className="text-title font-semibold">Owner code</h2>
          <input
            type="password"
            required
            autoFocus
            autoComplete="off"
            aria-labelledby="owner-title"
            value={ownerCode}
            onChange={(e) => setOwnerCode(e.target.value)}
            className={inputCls}
          />
          {ownerError && (
            <p role="alert" className="border-l-2 border-bad pl-3 text-body-sm text-ink">
              {ownerError}
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setOwnerOpen(false)} className="press inline-flex items-center justify-center flex-1 rounded-md border border-line h-10 text-body font-semibold">
              Cancel
            </button>
            <button disabled={busy || !ownerCode} className="press flex flex-1 items-center justify-center gap-2 rounded-md bg-accent h-10 text-body font-semibold text-ink-inverse disabled:opacity-50 hover:bg-[color-mix(in_srgb,var(--accent)_90%,var(--text))]">
              Open
            </button>
          </div>
        </form>
      </div>
    )}
    <form onSubmit={submit} className="mt-8 space-y-3">
      {step === "email" ? (
        <label className="block">
          <span className="text-label text-ink-muted">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className={inputCls}
          />
        </label>
      ) : (
        <div className="space-y-3">
          <p className="border-l-2 border-line-strong pl-3 text-body text-ink-muted" role="status">
            <span>
              We emailed a 6-digit code to <b className="text-ink">{email}</b>. It works for 10 minutes. Check spam if you don&apos;t see it.
            </span>
          </p>
          <label className="block">
            <span className="text-label text-ink-muted">6-digit code</span>
            <input
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className={`${inputCls} text-center font-mono text-title tracking-[0.12em]`}
            />
          </label>
        </div>
      )}

      {needName && (
        <>
          <label className="block">
            <span className="text-label text-ink-muted">Your name</span>
            <input required minLength={2} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </label>
          <PhoneFields phone={phone} setPhone={setPhone} optIn={optIn} setOptIn={setOptIn} />
        </>
      )}

      {error && (
        <p role="alert" className="border-l-2 border-bad pl-3 text-body-sm text-ink">
          {error}
        </p>
      )}

      <button
        disabled={busy || (step === "code" && code.length !== 6)}
        className="press flex w-full items-center justify-center gap-2 rounded-md bg-accent h-12 text-body font-semibold text-ink-inverse disabled:opacity-50 hover:bg-[color-mix(in_srgb,var(--accent)_90%,var(--text))]"
      >
                {codeLogin && step === "email" ? "Email me a code" : needName ? "Create account" : "Log in"}
      </button>

      {codeLogin && step === "code" && (
        <div className="flex items-center justify-between text-body-sm">
          <button type="button" onClick={() => { setStep("email"); setError(null); }} className="font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline">
            Use a different email
          </button>
          <button type="button" disabled={busy || resendIn > 0} onClick={sendCode} className="font-semibold text-ink underline underline-offset-4 disabled:text-ink-subtle disabled:no-underline">
            {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
          </button>
        </div>
      )}
    </form>
    </>
  );
}
