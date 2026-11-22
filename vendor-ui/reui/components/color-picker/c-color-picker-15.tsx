"use client"

import { useId, useState } from "react"
import {
  ColorPicker,
  ColorPickerContent,
  ColorPickerInput,
} from "@/registry-reui/bases/radix/reui/color-picker"

import { Button } from "@/registry/bases/radix/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/registry/bases/radix/ui/field"

export default function Pattern() {
  const id = useId()
  const [invalid, setInvalid] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)

  return (
    /* `noValidate`: the Field draws the error, not the browser bubble. */
    <form
      noValidate
      className="mx-auto w-full max-w-sm"
      onSubmit={(event) => {
        event.preventDefault()
        /* The picker submits its value under `name`, or "" while empty. */
        const color = String(
          new FormData(event.currentTarget).get("brandColor") ?? ""
        )
        setInvalid(!color)
        setSaved(color || null)
      }}
      onReset={() => {
        /* The picker returns to its default (empty) on the same reset. */
        setInvalid(false)
        setSaved(null)
      }}
    >
      <FieldGroup>
        <Field data-invalid={invalid || undefined}>
          <FieldLabel htmlFor={id}>Brand color</FieldLabel>
          <ColorPicker
            id={id}
            name="brandColor"
            required
            invalid={invalid}
            aria-describedby={`${id}-hint`}
            onValueChange={(next) => {
              if (next) setInvalid(false)
            }}
          >
            <ColorPickerInput placeholder="Type or pick a color" />
            <ColorPickerContent />
          </ColorPicker>
          {/* One id for both, so aria-describedby follows whichever shows. */}
          {invalid ? (
            <FieldError id={`${id}-hint`}>
              Choose a brand color to continue.
            </FieldError>
          ) : (
            <FieldDescription id={`${id}-hint`}>
              Used on the login page, emails and invoices.
            </FieldDescription>
          )}
        </Field>
        <div className="flex items-center gap-2">
          <Button type="submit">Save</Button>
          <Button type="reset" variant="outline">
            Reset
          </Button>
          <p
            role="status"
            className="text-muted-foreground ms-auto min-w-0 truncate text-sm"
          >
            {saved && `Saved ${saved.toUpperCase()}`}
          </p>
        </div>
      </FieldGroup>
    </form>
  )
}
