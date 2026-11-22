"use client"

import { useId, useState } from "react"
import {
  SignaturePad,
  SignaturePadArea,
  SignaturePadGuide,
} from "@/registry-reui/bases/radix/reui/signature-pad"

import { Button } from "@/registry/bases/radix/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/registry/bases/radix/ui/field"
import { Input } from "@/registry/bases/radix/ui/input"

export default function Pattern() {
  const id = useId()
  const [invalid, setInvalid] = useState(false)
  const [submitted, setSubmitted] = useState<{
    name: string
    size: number
  } | null>(null)

  return (
    <form
      noValidate
      className="mx-auto w-full max-w-md"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        /* The pad writes an SVG data URL into the form under its `name`. */
        const signature = String(data.get("signature") ?? "")
        setInvalid(!signature)
        setSubmitted(
          signature
            ? {
                name: String(data.get("name") ?? "").trim() || "Unnamed signer",
                size: new Blob([signature]).size,
              }
            : null
        )
      }}
      onReset={() => {
        setInvalid(false)
        setSubmitted(null)
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`${id}-name`}>Full name</FieldLabel>
          <Input
            id={`${id}-name`}
            name="name"
            autoComplete="name"
            placeholder="Maya Chen"
          />
        </Field>
        <Field data-invalid={invalid || undefined}>
          <FieldLabel id={`${id}-label`}>Signature</FieldLabel>
          <SignaturePad
            name="signature"
            format="svg"
            required
            onStrokeStart={() => setInvalid(false)}
          >
            <SignaturePadArea
              aria-labelledby={`${id}-label`}
              aria-describedby={`${id}-hint`}
              aria-invalid={invalid || undefined}
            >
              <SignaturePadGuide />
            </SignaturePadArea>
          </SignaturePad>
          {invalid ? (
            <FieldError id={`${id}-hint`}>Sign above to continue.</FieldError>
          ) : (
            <FieldDescription id={`${id}-hint`}>
              Use a mouse, a finger or a stylus.
            </FieldDescription>
          )}
        </Field>
        <div className="flex items-center gap-2">
          <Button type="submit">Submit</Button>
          <Button type="reset" variant="outline">
            Reset
          </Button>
          <p
            role="status"
            className="text-muted-foreground ms-auto min-w-0 truncate text-sm"
          >
            {submitted &&
              `Signed by ${submitted.name}, ${(submitted.size / 1024).toFixed(1)} KB SVG`}
          </p>
        </div>
      </FieldGroup>
    </form>
  )
}
