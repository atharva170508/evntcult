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
    <div className="rounded-[4px] border border-line bg-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#D4B87A]">
            <ScanFace className="size-3.5" aria-hidden /> Photo Vault
          </p>
          <h3 className="font-display text-[26px] italic leading-tight text-ink">Face ID Matching</h3>
          <p className="text-[13.5px] leading-relaxed text-ink-muted">
            Match your photos automatically across every event gallery you attend.
          </p>
        </div>

        {hasFaceId && !isEditing && (
          <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#D4B87A]/40 bg-[#D4B87A]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#D4B87A]">
            <CheckCircle2 className="size-3.5" aria-hidden /> Active
          </span>
        )}
      </div>

      <div className="mt-5 border-t border-line pt-4">
        {hasFaceId && !isEditing ? (
          <div className="space-y-4">
            <div className="rounded-[4px] border border-line bg-canvas/60 p-4">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-medium text-ink">Automatic Tagging</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#D4B87A]">Enabled</span>
              </div>
              {updatedAt && (
                <div className="mt-1.5 flex items-center justify-between text-[12px] text-ink-muted">
                  <span>Configured</span>
                  <span className="font-mono">
                    {fmtDate(new Date(updatedAt), { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>

            {syncMsg && (
              <p className="rounded-[4px] border border-[#D4B87A]/30 bg-[#D4B87A]/10 p-2.5 text-center text-[12.5px] font-medium text-ink">
                {syncMsg}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                disabled={syncing}
                onClick={handleSync}
                className="inline-flex h-10 items-center gap-1.5 rounded-[4px] bg-[#D4B87A] px-4 text-[12px] font-medium uppercase tracking-[0.1em] text-[#161820] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <RefreshCw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} aria-hidden />
                Sync events
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-[4px] border border-line px-3.5 text-[12px] font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:border-[#D4B87A]/60"
              >
                Update selfie
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-[4px] px-3 text-[12px] font-medium text-danger hover:bg-danger-soft disabled:opacity-40"
              >
                {deleting ? <Loader2 className="size-3 animate-spin" aria-hidden /> : <Trash2 className="size-3" aria-hidden />}
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <FaceIdEnrollCard
              title={isEditing ? "Update your Face ID" : "Activate Photo Vault"}
              subtitle="Photos from your events will appear in your vault automatically."
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
