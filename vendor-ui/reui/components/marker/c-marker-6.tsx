"use client"

import { useState } from "react"

import {
  Marker,
  MarkerContent,
  MarkerIcon,
} from "@/registry/bases/radix/ui/marker"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

// asChild merges the row onto the anchor rather than wrapping it, so the
// marker's own classes land on the anchor and the primitive's link treatment
// comes for free. A button gets no such treatment, which is why only the
// button carries a hover.
//
// The button toggles real state and the row rewrites itself, because a control
// that only looks clickable is a decorative control. That is the one reason
// this file is a client component.
//
// The icon swap is two complete elements behind a ternary instead of one
// element with a computed name, because every library prop has to stay a
// literal string for the registry installer to rewrite it.
export default function Pattern() {
  const [reverted, setReverted] = useState(false)

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <Marker asChild>
        <a href="#">
          <MarkerIcon>
            <IconPlaceholder
              lucide="GitMergeIcon"
              tabler="IconGitMerge"
              hugeicons="GitMergeIcon"
              phosphor="GitMergeIcon"
              remixicon="RiGitMergeLine"
            />
          </MarkerIcon>
          <MarkerContent>Review pull request #412</MarkerContent>
        </a>
      </Marker>
      <Marker asChild>
        <a href="#">
          <MarkerIcon>
            <IconPlaceholder
              lucide="FileTextIcon"
              tabler="IconFileText"
              hugeicons="File02Icon"
              phosphor="FileTextIcon"
              remixicon="RiFileTextLine"
            />
          </MarkerIcon>
          <MarkerContent>Open the diff for rate-limit.ts</MarkerContent>
        </a>
      </Marker>
      <Marker asChild>
        <button
          type="button"
          className="hover:text-foreground transition-colors"
          onClick={() => setReverted((value) => !value)}
        >
          <MarkerIcon>
            {reverted ? (
              <IconPlaceholder
                lucide="CheckIcon"
                tabler="IconCheck"
                hugeicons="Tick02Icon"
                phosphor="CheckIcon"
                remixicon="RiCheckLine"
              />
            ) : (
              <IconPlaceholder
                lucide="RotateCcwIcon"
                tabler="IconRefresh"
                hugeicons="UndoIcon"
                phosphor="ArrowCounterClockwiseIcon"
                remixicon="RiRefreshLine"
              />
            )}
          </MarkerIcon>
          <MarkerContent>
            {reverted ? "Undo the revert" : "Revert this change"}
          </MarkerContent>
        </button>
      </Marker>
      {/* Mounted empty from the first render, not inserted on the click: a
          live region added at the same moment as its text is not reliably
          announced, and the button's own label changes silently. */}
      <span role="status" aria-live="polite" className="sr-only">
        {reverted ? "Change reverted" : ""}
      </span>
    </div>
  )
}
