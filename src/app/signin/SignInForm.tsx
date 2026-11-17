"use client";

import { useEffect, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { PhoneFields } from "@/components/profile/PhoneFields";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { TermsCheckbox } from "@/components/terms/AcceptTerms";

type ApiErr = { error?: { code: string; message: string } };

/** This address never logs in as a student: it opens the owner code popup. The server checks the code. */
const OWNER_EMAIL = "evntcult@gmail.com";

const inputCls =
  "mt-1.5 h-12 w-full rounded-tile border border-line bg-surface px-4 text-[15px] shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)] transition-[border-color,box-shadow] duration-fast placeholder:text-ink-subtle hover:border-line-strong focus:border-ink focus:outline-none focus:ring-4 focus:ring-ink/[0.06]";

/**
 * Sign in / sign up.
 * - codeLogin = true: email -> we email a 6-digit code -> enter it (M6).
 * - codeLogin = false: the old email-only login, until the email provider key is set on the server.
 */
export function SignInForm({
  next,
  signup = false,
  codeLogin,
}: {
  next: string;
  signup?: boolean;
  codeLogin: boolean;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
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

  const details = () => (needName ? { name, phone, whatsappOptIn: optIn, acceptTerms } : {});

  async function post(url: string, body: unknown) {
    setBusy(true);
    setError(null);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as ApiErr & {
      resendAfterSec?: number;
    };
    setBusy(false);
    return { res, data };
  }

  function handleError(data: ApiErr, fallback: string) {
    if (
      data.error?.code === "name_required" ||
      data.error?.code === "phone_required"
    ) {
      setNeedName(true);
      setError("New here? Add your name and number to create your account.");
      return;
    }
    if (data.error?.code === "terms_required") {
      setNeedName(true);
      setError(data.error.message);
      return;
    }
    if (
      data.error?.code === "too_many_tries" ||
      data.error?.code === "code_expired"
    )
      setCode("");
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
    const { res, data } = await post("/api/admin/session", {
      email,
      code: ownerCode,
    });
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
      const { res, data } = await post("/api/auth/session", {
        email,
        ...details(),
      });
      if (res.ok) return void (window.location.href = next);
      return handleError(data, "Sign-in failed. Try again.");
    }
    if (step === "email") return sendCode();
    const { res, data } = await post("/api/auth/verify", {
      email,
      code,
      ...details(),
    });
    if (res.ok) return void (window.location.href = next);
    handleError(data, "That didn't work. Try again.");
  }

  return (
    <>
      {ownerOpen && (
        <ModalDialog label="Owner code" onClose={() => setOwnerOpen(false)}>
          <div className="grid h-full place-items-center bg-ink/40 px-4">
            <form
              onSubmit={submitOwner}
              className="w-full max-w-sm space-y-4 rounded-panel bg-surface p-6 shadow-pop"
            >
              <h2 id="owner-title" className="text-h3 font-semibold">
                Owner code
              </h2>
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
                <p
                  role="alert"
                  className="rounded-tile bg-danger-soft px-3.5 py-2.5 text-[13px] font-medium text-danger"
                >
                  {ownerError}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOwnerOpen(false)}
                  className="h-11 flex-1 rounded-xl bg-surface text-[14px] font-semibold ring-1 ring-inset ring-line-strong transition-colors duration-fast hover:bg-sunken"
                >
                  Cancel
                </button>
                <button
                  disabled={busy || !ownerCode}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink text-[14px] font-semibold text-white disabled:opacity-50"
                >
                  {busy && (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  )}{" "}
                  Open
                </button>
              </div>
            </form>
          </div>
        </ModalDialog>
      )}
      <form onSubmit={submit} className="mt-6 space-y-4">
        {step === "email" ? (
          <label className="block">
            <span className="text-[13px] font-medium text-ink-2">Email</span>
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
            <p
              className="flex items-start gap-2.5 rounded-tile bg-live-soft px-4 py-3 text-[14px] text-ink-2"
              role="status"
            >
              <MailCheck
                className="mt-0.5 size-4 shrink-0 text-live"
                aria-hidden
              />
              <span>
                We emailed a 6-digit code to <b className="text-ink">{email}</b>
                . It works for 10 minutes. Check spam if you don&apos;t see it.
              </span>
            </p>
            <label className="block">
              <span className="text-[13px] font-medium text-ink-2">
                6-digit code
              </span>
              <input
                required
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                className={`${inputCls} text-center h-16 font-mono text-[26px] font-medium tracking-[0.5em]`}
              />
            </label>
          </div>
        )}

        {needName && (
          <>
            <label className="block">
              <span className="text-[13px] font-medium text-ink-2">
                Your name
              </span>
              <input
                required
                minLength={2}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />
            </label>
            <PhoneFields
              phone={phone}
              setPhone={setPhone}
              optIn={optIn}
              setOptIn={setOptIn}
            />
            {/* Required to create an account. Opens the terms in a new tab so the form isn't lost. */}
            <TermsCheckbox checked={acceptTerms} onChange={setAcceptTerms} newTab />
          </>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-tile bg-danger-soft px-3.5 py-2.5 text-[13px] font-medium text-danger"
          >
            {error}
          </p>
        )}

        <button
          disabled={busy || (step === "code" && code.length !== 6)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lavender text-[16px] font-semibold text-ink ring-2 ring-inset ring-ink transition-[background-color,transform] duration-fast hover:bg-lavender-hover active:scale-[0.98] disabled:opacity-50"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {codeLogin && step === "email"
            ? "Email me a code"
            : needName
              ? "Create account"
              : "Log in"}
        </button>

        {codeLogin && step === "code" && (
          <div className="flex items-center justify-between text-[13.5px]">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError(null);
              }}
              className="font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Use a different email
            </button>
            <button
              type="button"
              disabled={busy || resendIn > 0}
              onClick={sendCode}
              className="font-semibold text-accent-ink underline-offset-4 hover:underline disabled:text-ink-subtle disabled:no-underline"
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>
          </div>
        )}
      </form>
    </>
  );
}
