"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, ScanFace, Trash2 } from "lucide-react";
import { FaceIdEnrollCard } from "@/components/photos/FaceIdEnrollCard";
import { fmtDate } from "@/lib/utils";

interface ProfileFaceIdProps {
  initialHasFaceId: boolean;
  initialUpdatedAt: string | null;
}

export function ProfileFaceId({ initialHasFaceId, initialUpdatedAt }: ProfileFaceIdProps) {
  const [hasFaceId, setHasFaceId] = useState(initialHasFaceId);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [isEditing, setIsEditing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/me/face-id", { method: "PUT" });
      const data = (await res.json().catch(() => ({}))) as { matchedPhotos?: number };
      if (res.ok) {
        setSyncMsg(
          data.matchedPhotos && data.matchedPhotos > 0
            ? `Synced! Discovered ${data.matchedPhotos} new photo${data.matchedPhotos === 1 ? "" : "s"}!`
            : "Synced! All event galleries are up to date.",
        );
      }
    } catch {
      setSyncMsg("Sync failed. Check connection.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to remove your Photo Vault Face ID? Automatic tagging will stop.")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/me/face-id", { method: "DELETE" });
      if (res.ok) {
        setHasFaceId(false);
        setUpdatedAt(null);
        setIsEditing(false);
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line-strong bg-white p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-volt">
            <ScanFace className="size-3.5" aria-hidden /> Photo Vault
          </p>
          <h3 className="text-[20px] font-bold leading-snug tracking-[-0.02em] text-ink">Photo Vault Face ID</h3>
          <p className="text-[13.5px] leading-relaxed text-ink-muted">
            Your 1-time facial fingerprint enables zero-effort automatic photo collection after every event.
          </p>
        </div>

        {hasFaceId && !isEditing && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-volt/40 bg-volt/10 px-3 py-1 text-[12px] font-bold text-ink">
            <CheckCircle2 className="size-3.5 text-volt" aria-hidden /> Active
          </span>
        )}
      </div>

      <div className="mt-5 border-t border-line pt-4">
        {hasFaceId && !isEditing ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-sunken/60 p-4">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-semibold text-ink">Automatic Tagging:</span>
                <span className="font-medium text-live">Enabled</span>
              </div>
              {updatedAt && (
                <div className="mt-1.5 flex items-center justify-between text-[12px] text-ink-muted">
                  <span>Configured:</span>
                  <span className="font-mono">
                    {fmtDate(new Date(updatedAt), { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>

            {syncMsg && (
              <p className="rounded-xl bg-volt/10 p-2.5 text-center text-[12.5px] font-semibold text-ink">
                {syncMsg}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                disabled={syncing}
                onClick={handleSync}
                className="inline-flex items-center gap-1.5 rounded-full bg-volt px-4 py-2 text-[13px] font-bold text-ink-inverse shadow-brand transition-colors hover:bg-volt-hover active:scale-[0.98] disabled:opacity-40"
              >
                <RefreshCw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} aria-hidden />
                Sync with my events
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-volt/60 active:scale-[0.98]"
              >
                Update selfie
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-medium text-danger hover:bg-danger-soft active:scale-[0.98] disabled:opacity-40"
              >
                {deleting ? <Loader2 className="size-3 animate-spin" aria-hidden /> : <Trash2 className="size-3" aria-hidden />}
                Remove Face ID
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <FaceIdEnrollCard
              title={isEditing ? "Update your Photo Vault Face ID" : "Activate Automatic Photo Vault"}
              subtitle="Photos from your registered events will automatically land in your Photo Vault!"
              onSuccess={() => {
                setHasFaceId(true);
                setUpdatedAt(new Date().toISOString());
                setIsEditing(false);
              }}
              onSkip={isEditing ? () => setIsEditing(false) : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}
