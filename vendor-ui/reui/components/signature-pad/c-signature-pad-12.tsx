"use client"

import { useRef, useState } from "react"
import {
  SignaturePad,
  SignaturePadArea,
  SignaturePadGuide,
  SignaturePadPlaceholder,
  type SignaturePadApi,
} from "@/registry-reui/bases/radix/reui/signature-pad"

import { Button } from "@/registry/bases/radix/ui/button"

export default function Pattern() {
  /* `apiRef` reaches the pad from code outside its tree, such as a form
     library's submit handler. */
  const padRef = useRef<SignaturePadApi>(null)
  const [upload, setUpload] = useState<{ name: string; size: number } | null>(
    null
  )
  const [empty, setEmpty] = useState(true)

  const prepareUpload = async () => {
    const blob = await padRef.current?.toBlob({ scale: 3 })
    if (!blob) return
    const file = new File([blob], "signature.png", { type: "image/png" })
    /* Append `file` to a FormData and POST it to your own endpoint. */
    setUpload({ name: file.name, size: file.size })
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
      <SignaturePad
        apiRef={padRef}
        onValueChange={(strokes) => {
          setEmpty(strokes.length === 0)
          setUpload(null)
        }}
      >
        <SignaturePadArea className="h-44">
          <SignaturePadGuide />
          <SignaturePadPlaceholder />
        </SignaturePadArea>
      </SignaturePad>
      <div className="flex items-center gap-2">
        <Button disabled={empty} onClick={prepareUpload}>
          Attach as PNG
        </Button>
        <Button
          variant="ghost"
          disabled={empty}
          onClick={() => {
            padRef.current?.clear()
            /* This button disables itself, so focus moves to the pad. */
            padRef.current?.focus()
          }}
        >
          Clear
        </Button>
        <p
          role="status"
          className="text-muted-foreground ms-auto truncate text-sm"
        >
          {upload && `${upload.name}, ${(upload.size / 1024).toFixed(1)} KB`}
        </p>
      </div>
    </div>
  )
}
