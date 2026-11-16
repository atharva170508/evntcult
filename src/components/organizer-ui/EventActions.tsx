"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Toast, apiJson, type ToastState } from "./primitives";

export function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="o-inline">
      <input aria-label="Share link" readOnly className="o-input o-mono" value={url} onFocus={(e) => e.target.select()} />
      <Button
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }}
      >
        {done ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

export function DuplicateButton({ id }: { id: string }) {
  const router = useRouter();
  const [toast, setToast] = useState<ToastState>(null);
  return (
    <>
      <Button
        onClick={async () => {
          const r = await apiJson<{ id: string }>(`/api/events/${id}/duplicate`, "POST");
          if (r.ok) router.push(`/organizer/events/${r.data.id}`);
          else setToast({ message: r.data.error?.message ?? "Couldn't duplicate." });
        }}
      >
        Duplicate
      </Button>
      <Toast toast={toast} onDone={() => setToast(null)} />
    </>
  );
}

export function UnpublishButton({ id, version }: { id: string; version: number }) {
  const router = useRouter();
  const [toast, setToast] = useState<ToastState>(null);
  return (
    <>
      <Button
        onClick={async () => {
          const r = await apiJson(`/api/events/${id}/unpublish`, "POST", { version });
          if (r.ok) router.push(`/organizer/events/${id}`);
          else setToast({ message: r.data.error?.message ?? "Couldn't unpublish." });
        }}
      >
        Unpublish
      </Button>
      <Toast toast={toast} onDone={() => setToast(null)} />
    </>
  );
}
