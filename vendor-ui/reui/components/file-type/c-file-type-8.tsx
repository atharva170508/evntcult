"use client"

import { useRef, useState } from "react"
import {
  FileType,
  getFileType,
} from "@/registry-reui/bases/radix/reui/file-type"

import { Button } from "@/registry/bases/radix/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/registry/bases/radix/ui/item"
import { Progress } from "@/registry/bases/radix/ui/progress"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

/**
 * The same name, type and size a browser File carries, plus the upload
 * state. `type` is the MIME type, which a Blob or a pasted image has even
 * when its name says nothing useful.
 */
type QueuedFile = {
  id: string
  name: string
  type: string
  size: number
  progress: number
  status: "uploading" | "done" | "failed"
}

const QUEUE: QueuedFile[] = [
  {
    id: "contract",
    name: "vendor-contract-2027.pdf",
    type: "application/pdf",
    size: 2_140_000,
    progress: 100,
    status: "done",
  },
  {
    id: "forecast",
    name: "q4-forecast.xlsx",
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 1_460_000,
    progress: 72,
    status: "uploading",
  },
  {
    id: "walkthrough",
    name: "onboarding-walkthrough.mov",
    type: "video/quicktime",
    size: 48_600_000,
    progress: 18,
    status: "uploading",
  },
  {
    id: "assets",
    name: "brand-assets.zip",
    type: "application/zip",
    size: 12_400_000,
    progress: 38,
    status: "failed",
  },
]

// Decimal units (1 MB is 1,000,000 bytes), as macOS Finder shows them, so a
// size here matches the one the user saw when picking the file.
function formatSize(bytes: number) {
  return bytes < 1_000_000
    ? `${Math.round(bytes / 1_000)} KB`
    : `${(bytes / 1_000_000).toFixed(1)} MB`
}

export default function Pattern() {
  const [files, setFiles] = useState<QueuedFile[]>(QUEUE)
  const statusRef = useRef<HTMLParagraphElement>(null)

  // Counted during render, so the summary can never disagree with the rows.
  const done = files.filter((file) => file.status === "done").length
  const failed = files.filter((file) => file.status === "failed").length

  // The button that was clicked unmounts with its row (or its retry slot),
  // so focus moves to the summary first and the new count is read out.
  const remove = (id: string) => {
    statusRef.current?.focus()
    setFiles((current) => current.filter((file) => file.id !== id))
  }

  // A real retry restarts the transfer. The demo resolves it at once rather
  // than faking progress with a timer.
  const retry = (id: string) => {
    statusRef.current?.focus()
    setFiles((current) =>
      current.map((file) =>
        file.id === id ? { ...file, progress: 100, status: "done" } : file
      )
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
      <p
        ref={statusRef}
        role="status"
        tabIndex={-1}
        className="text-muted-foreground text-xs outline-none"
      >
        {files.length === 0
          ? "No files in the queue."
          : `${done} of ${files.length} uploaded${failed ? `, ${failed} failed` : ""}`}
      </p>
      {files.length > 0 ? (
        <ItemGroup aria-label="Upload queue">
          {files.map((file) => (
            <Item key={file.id} role="listitem" variant="outline" size="sm">
              <ItemMedia>
                {/* Hidden from assistive tech: the name below ends in its extension. */}
                <FileType
                  type={getFileType(file.type)}
                  size="sm"
                  aria-hidden="true"
                />
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle className="max-w-full">
                  <span className="truncate" title={file.name}>
                    {file.name}
                  </span>
                </ItemTitle>
                {/*
                 * One line in every state, so rows keep the same height as
                 * they move from a bar to a result.
                 */}
                {file.status === "uploading" ? (
                  <div className="flex h-4 items-center gap-2">
                    {/*
                     * Named per file: unnamed, every bar in the list is
                     * announced as the same bare percentage.
                     */}
                    <Progress
                      value={file.progress}
                      aria-label={`Uploading ${file.name}`}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground w-8 text-right text-xs tabular-nums">
                      {file.progress}%
                    </span>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs leading-4">
                    {formatSize(file.size)}
                    <span
                      aria-hidden="true"
                      className="bg-muted-foreground/40 mx-1.5 inline-block size-1 rounded-full align-middle"
                    />
                    {file.status === "done" ? (
                      "Uploaded"
                    ) : (
                      <span className="text-destructive">
                        Failed at {file.progress}%
                      </span>
                    )}
                  </p>
                )}
              </ItemContent>
              <ItemActions>
                {file.status === "failed" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Retry upload of ${file.name}`}
                    onClick={() => retry(file.id)}
                  >
                    <IconPlaceholder
                      lucide="RotateCwIcon"
                      tabler="IconRefresh"
                      hugeicons="RefreshIcon"
                      phosphor="ArrowClockwiseIcon"
                      remixicon="RiRefreshLine"
                      aria-hidden="true"
                    />
                  </Button>
                ) : null}
                {/* Cancelling a transfer and removing a result are different promises. */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={
                    file.status === "uploading"
                      ? `Cancel upload of ${file.name}`
                      : `Remove ${file.name}`
                  }
                  onClick={() => remove(file.id)}
                >
                  <IconPlaceholder
                    lucide="XIcon"
                    tabler="IconX"
                    hugeicons="Cancel01Icon"
                    phosphor="XIcon"
                    remixicon="RiCloseLine"
                    aria-hidden="true"
                  />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      ) : null}
    </div>
  )
}
