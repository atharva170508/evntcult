"use client";

import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Notice } from "@/components/ui/Field";
import { PhoneFields } from "@/components/profile/PhoneFields";

type ApiErr = { error?: { code: string; message: string } };


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

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const details = () => (needName ? { name, phone, whatsappOptIn: optIn } : {});

  async function post(url: string, body: unknown) {
    setBusy(true);
    setError(null);
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const data = ((await res?.json().catch(() => ({}))) ?? { error: { code: "offline", message: "You seem to be offline. Check your connection and try again." } }) as ApiErr & { resendAfterSec?: number };
    setBusy(false);
    return { res: res ?? ({ ok: false } as Response), data };
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
    <form onSubmit={submit} className="mt-8 space-y-4" noValidate={false}>
      {step === "email" ? (
        <Field label="College email">
          {(a) => <Input {...a} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" className="h-12" />}
        </Field>
      ) : (
        <div className="space-y-4">
          <Notice tone="live" icon={MailCheck}>
            <span className="font-normal text-ink-2">
              We emailed a 6-digit code to <span className="font-medium text-ink">{email}</span>. It works for 10 minutes. Check spam if you don&apos;t see it.
            </span>
          </Notice>
          <Field label="6-digit code">
            {(a) => (
              <Input
                {...a}
                required
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="h-16 text-center font-mono text-[28px] font-medium tracking-[0.5em] placeholder:text-ink-subtle/40"
              />
            )}
          </Field>
        </div>
      )}

      {needName && (
        <div className="space-y-4 animate-fade-up">
          <Field label="Your name">{(a) => <Input {...a} required minLength={2} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12" />}</Field>
          <PhoneFields phone={phone} setPhone={setPhone} optIn={optIn} setOptIn={setOptIn} />
        </div>
      )}

      {error && <Notice tone="danger">{error}</Notice>}

      <Button type="submit" size="lg" variant={needName ? "accent" : "primary"} loading={busy} disabled={step === "code" && code.length !== 6} className="w-full">
        {codeLogin && step === "email" ? "Email me a code" : needName ? "Create account" : "Log in"}
      </Button>

      {codeLogin && step === "code" && (
        <div className="flex items-center justify-between text-[13.5px]">
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setError(null);
            }}
            className="font-medium text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Use a different email
          </button>
          <button type="button" disabled={busy || resendIn > 0} onClick={sendCode} className="font-medium text-ink underline decoration-line-strong underline-offset-4 disabled:text-ink-subtle disabled:no-underline">
            {resendIn > 0 ? (
              <>
                Resend in <span className="font-mono tabular-nums">{resendIn}s</span>
              </>
            ) : (
              "Resend code"
            )}
          </button>
        </div>
      )}

      {!codeLogin && (
        <p className="rounded-tile border border-dashed border-line-strong px-3.5 py-3 text-[12.5px] text-ink-muted">
          <span className="mr-1.5 rounded-full bg-warn-soft px-2 py-0.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-warn">Planned</span>
          Email code check isn&apos;t switched on yet, so anyone who types your email can log in as you.
        </p>
      )}
    </form>
  );
}
