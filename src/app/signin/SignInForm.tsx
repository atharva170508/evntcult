"use client";

import { useEffect, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { PhoneFields } from "@/components/profile/PhoneFields";

type ApiErr = { error?: { code: string; message: string } };

/** This address never logs in as a student: it opens the owner code popup. The server checks the code. */
const OWNER_EMAIL = "evntcult@gmail.com";

const inputCls =
  "mt-1.5 w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-[15px] placeholder:text-ink-subtle focus:outline-none";

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
        <form onSubmit={submitOwner} className="w-full max-w-sm space-y-3 rounded-3xl border border-line bg-surface p-6">
          <h2 id="owner-title" className="text-[20px] font-bold">Owner code</h2>
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
            <p role="alert" className="rounded-2xl bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger">
              {ownerError}
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setOwnerOpen(false)} className="flex-1 rounded-full border border-line py-3 text-[14px] font-semibold">
              Cancel
            </button>
            <button disabled={busy || !ownerCode} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-volt py-3 text-[14px] font-bold text-ink-inverse disabled:opacity-50">
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Open
            </button>
          </div>
        </form>
      </div>
    )}
    <form onSubmit={submit} className="mt-7 space-y-3">
      {step === "email" ? (
        <label className="block">
          <span className="text-[13px] font-semibold text-ink-2">Email</span>
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
          <p className="flex items-start gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 text-[14px] text-ink-2" role="status">
            <MailCheck className="mt-0.5 size-4 shrink-0 text-live" aria-hidden />
            <span>
              We emailed a 6-digit code to <b className="text-ink">{email}</b>. It works for 10 minutes. Check spam if you don&apos;t see it.
            </span>
          </p>
          <label className="block">
            <span className="text-[13px] font-semibold text-ink-2">6-digit code</span>
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
              className={`${inputCls} text-center font-mono text-[26px] font-bold tracking-[0.5em]`}
            />
          </label>
        </div>
      )}

      {needName && (
        <>
          <label className="block">
            <span className="text-[13px] font-semibold text-ink-2">Your name</span>
            <input required minLength={2} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </label>
          <PhoneFields phone={phone} setPhone={setPhone} optIn={optIn} setOptIn={setOptIn} />
        </>
      )}

      {error && (
        <p role="alert" className="rounded-2xl bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger">
          {error}
        </p>
      )}

      <button
        disabled={busy || (step === "code" && code.length !== 6)}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-volt py-3.5 text-[15px] font-bold text-ink-inverse transition-colors hover:bg-volt-hover disabled:opacity-50"
      >
        {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {codeLogin && step === "email" ? "Email me a code" : needName ? "Create account" : "Log in"}
      </button>

      {codeLogin && step === "code" && (
        <div className="flex items-center justify-between text-[13.5px]">
          <button type="button" onClick={() => { setStep("email"); setError(null); }} className="font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline">
            Use a different email
          </button>
          <button type="button" disabled={busy || resendIn > 0} onClick={sendCode} className="font-semibold text-brand-ink underline-offset-4 hover:underline disabled:text-ink-subtle disabled:no-underline">
            {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
          </button>
        </div>
      )}
    </form>
    </>
  );
}
