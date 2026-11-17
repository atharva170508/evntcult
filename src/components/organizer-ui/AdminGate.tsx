"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function post(url: string, body: object) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { error?: { message: string } };
  return res.ok ? null : (data.error?.message ?? "Something went wrong.");
}

export function OwnerAction({ kind, id, label, ask }: { kind: "block" | "unblock" | "take_down" | "restore" | "approve_host" | "reject_host"; id: string; label: string; ask: string }) {
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
