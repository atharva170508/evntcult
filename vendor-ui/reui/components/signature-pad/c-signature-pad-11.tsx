"use client"

import { useId, useState } from "react"
import { Badge } from "@/registry-reui/bases/radix/reui/badge"
import {
  SignaturePad,
  SignaturePadArea,
  SignaturePadClear,
  SignaturePadControls,
  SignaturePadGuide,
  SignaturePadPlaceholder,
  SignaturePadUndo,
  type SignaturePadStroke,
} from "@/registry-reui/bases/radix/reui/signature-pad"

import { Button } from "@/registry/bases/radix/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/bases/radix/ui/card"
import { Field, FieldLabel } from "@/registry/bases/radix/ui/field"
import { Input } from "@/registry/bases/radix/ui/input"

export default function Pattern() {
  const id = useId()
  const [recipient, setRecipient] = useState("")
  const [strokes, setStrokes] = useState<SignaturePadStroke[]>([])
  const [confirmed, setConfirmed] = useState(false)

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>Proof of delivery</CardTitle>
        <CardDescription>
          <span className="flex items-center gap-2">
            Order #48213
            <span
              aria-hidden="true"
              className="bg-muted-foreground/40 size-1 shrink-0 rounded-full"
            />
            3 parcels
          </span>
        </CardDescription>
        {confirmed && (
          <CardAction>
            <Badge variant="success-light">Delivered</Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor={`${id}-recipient`}>Received by</FieldLabel>
            <Input
              id={`${id}-recipient`}
              value={recipient}
              disabled={confirmed}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="Recipient name"
              autoComplete="off"
            />
          </Field>
          <Field>
            <FieldLabel id={`${id}-signature`}>Recipient signature</FieldLabel>
            {/* The area blocks page scroll under a finger, so the recipient can sign on a phone. */}
            <SignaturePad
              value={strokes}
              onValueChange={setStrokes}
              readOnly={confirmed}
            >
              <SignaturePadArea
                aria-labelledby={`${id}-signature`}
                className="h-44"
              >
                <SignaturePadGuide />
                <SignaturePadPlaceholder>
                  Hand the device to the recipient
                </SignaturePadPlaceholder>
                {!confirmed && (
                  <SignaturePadControls position="top-end">
                    <SignaturePadUndo variant="ghost" />
                    <SignaturePadClear variant="ghost" />
                  </SignaturePadControls>
                )}
              </SignaturePadArea>
            </SignaturePad>
          </Field>
        </div>
      </CardContent>
      <CardFooter>
        {confirmed ? (
          <p
            ref={(node) => node?.focus()}
            tabIndex={-1}
            role="status"
            className="w-full text-center text-sm font-medium outline-none"
          >
            Delivered to {recipient.trim()}
          </p>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={!recipient.trim() || strokes.length === 0}
            onClick={() => setConfirmed(true)}
          >
            Confirm delivery
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
