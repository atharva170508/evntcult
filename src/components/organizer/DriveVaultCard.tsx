"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, FolderOpen, HardDrive, Trash2 } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { toast } from "@/components/ui/Toaster";

interface DriveVaultCardProps {
  eventId: string;
  initialFolderId: string | null;
  initialFolderUrl: string | null;
  initialLinkedAt: string | null;
}

/**
 * Organizer panel card: link a public Google Drive album folder so EvntCult's Photo Vault
 * scans event photos and automatically delivers matches to attendees with Face ID.
 */
export function DriveVaultCard({
  eventId,
  initialFolderId,
  initialFolderUrl,
  initialLinkedAt,
}: DriveVaultCardProps) {
  const [folderId, setFolderId] = useState(initialFolderId);
  const [folderUrl, setFolderUrl] = useState(initialFolderUrl);
  const [linkedAt, setLinkedAt] = useState(initialLinkedAt);
  const [input, setInput] = useState(initialFolderUrl ?? "");
  const [editing, setEditing] = useState(!initialFolderId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const indexCmd = folderId
    ? `npm run photos:index -- --event ${eventId} --folder ${folderId}`
    : "";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/drive`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        folderId?: string;
        folderUrl?: string;
        linkedAt?: string;
        error?: { message: string };
      };
      if (!res.ok || !data.ok) {
        setError(data.error?.message ?? "Could not connect that Drive folder.");
      } else {
        setFolderId(data.folderId ?? null);
        setFolderUrl(data.folderUrl ?? null);
        setLinkedAt(data.linkedAt ?? null);
        setInput(data.folderUrl ?? "");
        setEditing(false);
        toast("Google Drive album connected for Photo Vault.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/drive`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFolderId(null);
        setFolderUrl(null);
        setLinkedAt(null);
        setInput("");
        setEditing(true);
        toast("Google Drive folder disconnected.");
      }
    } finally {
      setBusy(false);
    }
  };

  const copyCmd = async () => {
    if (!indexCmd) return;
    try {
      await navigator.clipboard.writeText(indexCmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast("Select and copy the command manually.");
    }
  };

  return (
    <section aria-labelledby="drive-vault-h" className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="drive-vault-h" className="flex items-center gap-2 text-h4 font-semibold">
          <HardDrive className="size-4 text-ink-subtle" aria-hidden /> Photo Vault Drive
        </h2>
        <Chip tone={folderId ? "live" : "neutral"}>
          {folderId ? "Connected" : "Not linked"}
        </Chip>
      </div>

      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
        Link your photographer&apos;s Google Drive folder (set sharing to{" "}
        <strong className="font-semibold text-ink-2">Anyone with the link</strong>). Photo Vault
        scans faces from this folder and delivers HD photos straight to attendees.
      </p>

      {folderId && !editing ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-sunken/80 px-3.5 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <FolderOpen className="size-4 shrink-0 text-live" aria-hidden />
              <div className="min-w-0">
                <p className="truncate font-mono text-[12px] font-medium text-ink">
                  {folderId}
                </p>
                {linkedAt && (
                  <p className="text-[11.5px] text-ink-muted">
                    Linked {new Date(linkedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                )}
              </div>
            </div>
            {folderUrl && (
              <a
                href={folderUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Google Drive folder"
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-surface px-2.5 text-[12px] font-semibold text-ink ring-1 ring-line-strong hover:bg-mist"
              >
                Open <ExternalLink className="size-3" aria-hidden />
              </a>
            )}
          </div>

          <div className="rounded-xl bg-sunken/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] font-semibold text-ink-muted">Scan &amp; index album</span>
              <button
                type="button"
                onClick={copyCmd}
                className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-ink hover:underline"
              >
                {copied ? <Check className="size-3 text-live" aria-hidden /> : <Copy className="size-3" aria-hidden />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <code className="mt-1.5 block overflow-x-auto whitespace-nowrap font-mono text-[11.5px] text-ink-2">
              {indexCmd}
            </code>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-[13px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            >
              Change folder
            </button>
            <button
              type="button"
              onClick={disconnect}
              disabled={busy}
              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-danger hover:underline disabled:opacity-50"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={save} className="mt-4 space-y-3">
          <div>
            <label htmlFor="drive-folder-url" className="sr-only">
              Google Drive folder link
            </label>
            <input
              id="drive-folder-url"
              type="text"
              required
              placeholder="https://drive.google.com/drive/folders/..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="field font-mono text-[13px]"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-[12.5px] font-medium text-danger">
              {error}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={busy}
              className="ui-press inline-flex h-10 items-center rounded-xl bg-lavender px-4 text-[13.5px] font-semibold text-ink ring-2 ring-inset ring-ink hover:bg-lavender-hover disabled:opacity-60"
            >
              {busy ? "Saving…" : folderId ? "Update Drive folder" : "Connect Google Drive"}
            </button>
            {folderId && (
              <button
                type="button"
                onClick={() => {
                  setInput(folderUrl ?? "");
                  setEditing(false);
                  setError(null);
                }}
                className="h-10 rounded-xl px-3 text-[13px] font-semibold text-ink-muted hover:bg-sunken hover:text-ink"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
