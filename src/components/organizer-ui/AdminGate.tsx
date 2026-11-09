"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function post(url: string, body: object) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { error?: { message: string } };
  return res.ok ? null : (data.error?.message ?? "Something went wrong.");
}

export function AdminGate() {
  const [step, setStep] = useState<"secret" | "otp">("secret");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const failed = step === "secret" ? await post("/api/admin/code", { email, code }) : await post("/api/admin/session", { otp });
    setBusy(false);
    if (failed) return setError(failed);
    if (step === "secret") {
      setCode("");
      setStep("otp");
    } else window.location.reload();
  }

  return (
    <div className="a-gate">
      <h1 className="o-title">Owners</h1>
      <form onSubmit={submit} className="a-form">
        {step === "secret" ? (
          <>
            <label className="o-label" htmlFor="a-email">Email</label>
            <input id="a-email" className="o-input" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <label className="o-label" htmlFor="a-code">Secret code</label>
            <input id="a-code" className="o-input" type="password" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} required />
          </>
        ) : (
          <>
            <label className="o-label" htmlFor="a-otp">Code sent to your email</label>
            <input id="a-otp" className="o-input o-mono" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} required autoFocus />
          </>
        )}
        {error && <p className="o-err" role="alert">{error}</p>}
        <button className="o-btn o-btn-primary a-submit" disabled={busy}>
          {step === "secret" ? "Continue" : "Open"}
        </button>
      </form>
    </div>
  );
}

export function OwnerAction({ kind, id, label, ask }: { kind: "block" | "unblock" | "take_down" | "restore"; id: string; label: string; ask: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="o-btn a-act"
      disabled={busy}
      onClick={async () => {
        if (!confirm(ask)) return;
        setBusy(true);
        const failed = await post("/api/admin/action", { kind, id });
        setBusy(false);
        if (failed) alert(failed);
        else router.refresh();
      }}
    >
      {label}
    </button>
  );
}

export function AdminLock() {
  return (
    <button
      type="button"
      className="o-btn"
      onClick={async () => {
        await fetch("/api/admin/session", { method: "DELETE" });
        window.location.reload();
      }}
    >
      Lock
    </button>
  );
}
