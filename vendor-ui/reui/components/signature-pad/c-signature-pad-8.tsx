"use client"

import { useRef, useState } from "react"
import {
  SignaturePad,
  SignaturePadArea,
  SignaturePadClear,
  SignaturePadControls,
  SignaturePadGuide,
  SignaturePadPlaceholder,
  SignaturePadPreview,
  SignaturePadUndo,
  type SignaturePadStroke,
} from "@/registry-reui/bases/radix/reui/signature-pad"

import { Button } from "@/registry/bases/radix/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/registry/bases/radix/ui/dialog"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemTitle,
} from "@/registry/bases/radix/ui/item"

export default function Pattern() {
  const [open, setOpen] = useState(false)
  const [signature, setSignature] = useState<SignaturePadStroke[]>([])
  /* Edits land in a draft, so Cancel leaves the saved signature untouched. */
  const [draft, setDraft] = useState<SignaturePadStroke[]>([])
  const editRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <Item variant="outline" className="mx-auto w-full max-w-lg">
        <ItemContent>
          <ItemTitle>Authorized signature</ItemTitle>
          <ItemDescription>
            Printed on invoices and purchase orders.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button
            ref={editRef}
            variant="outline"
            size="sm"
            onClick={(event) => {
              /* Safari does not focus a clicked button; focusing it here gives
                 both dialog libraries the same element to return focus to. */
              event.currentTarget.focus()
              setDraft(signature)
              setOpen(true)
            }}
          >
            {signature.length > 0 ? "Edit" : "Add signature"}
          </Button>
        </ItemActions>
        {signature.length > 0 && (
          <ItemFooter>
            <SignaturePadPreview strokes={signature} className="h-10 w-auto" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSignature([])
                /* Remove unmounts itself, so focus moves to the row's action. */
                editRef.current?.focus()
              }}
            >
              Remove
            </Button>
          </ItemFooter>
        )}
      </Item>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Draw your signature</DialogTitle>
            <DialogDescription>
              Saved to your profile and reused on new documents.
            </DialogDescription>
          </DialogHeader>
          <SignaturePad value={draft} onValueChange={setDraft}>
            <SignaturePadArea variant="muted" className="h-48">
              <SignaturePadGuide />
              <SignaturePadPlaceholder />
              <SignaturePadControls>
                <SignaturePadUndo />
                <SignaturePadClear />
              </SignaturePadControls>
            </SignaturePadArea>
          </SignaturePad>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={draft.length === 0}
              onClick={() => {
                setSignature(draft)
                setOpen(false)
              }}
            >
              Save signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
