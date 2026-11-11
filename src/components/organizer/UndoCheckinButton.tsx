"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/Button";

/** Take back a mistaken check-in. Asks first, because it also withdraws the certificate. */
export function UndoCheckinButton({ regId, name }: { regId: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="flex items-center justify-end gap-2">
      {err && (
        <span role="alert" className="text-label text-bad">
          {err}
        </span>
      )}
      <button
        type="button"
        disabled={busy}
        className={buttonClass("ghost", "sm")}
        onClick={async () => {
          if (!confirm(`Undo ${name}'s check-in? Their certificate is withdrawn too.`)) return;
          setBusy(true);
          setErr(null);
          const res = await fetch(`/api/registrations/${regId}/undo-checkin`, { method: "POST" });
          setBusy(false);
          if (!res.ok) return setErr("Didn't undo. Try again.");
          router.refresh();
        }}
      >
        Undo check-in
      </button>
    </span>
  );
}
