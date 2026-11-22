"use client"

import { useState } from "react"
import {
  SignaturePad,
  SignaturePadArea,
  SignaturePadClear,
  SignaturePadControls,
  SignaturePadPlaceholder,
  SignaturePadPreview,
  SignaturePadSave,
  type SignaturePadStroke,
} from "@/registry-reui/bases/radix/reui/signature-pad"

export default function Pattern() {
  const [saved, setSaved] = useState<SignaturePadStroke[]>([])

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
      <SignaturePad>
        <SignaturePadArea variant="muted" className="h-60">
          <SignaturePadPlaceholder />
          <SignaturePadControls position="bottom-end">
            <SignaturePadClear />
            <SignaturePadSave
              format="json"
              onSave={(_, strokes) => setSaved(strokes)}
            />
          </SignaturePadControls>
        </SignaturePadArea>
      </SignaturePad>
      <div role="status">
        {saved.length > 0 && (
          <div className="text-muted-foreground flex items-center gap-3 text-sm">
            Saved
            <SignaturePadPreview strokes={saved} className="h-8 w-auto" />
          </div>
        )}
      </div>
    </div>
  )
}
