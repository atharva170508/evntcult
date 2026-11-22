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
  type SignaturePadStroke,
} from "@/registry-reui/bases/radix/reui/signature-pad"

import { Button } from "@/registry/bases/radix/ui/button"
import { Field, FieldLabel } from "@/registry/bases/radix/ui/field"
import { Input } from "@/registry/bases/radix/ui/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/bases/radix/ui/tabs"

export default function Pattern() {
  const id = useId()
  const [mode, setMode] = useState<"draw" | "type">("draw")
  const [strokes, setStrokes] = useState<SignaturePadStroke[]>([])
  const [typed, setTyped] = useState("")
  const [adopted, setAdopted] = useState<"draw" | "type" | null>(null)

  /* Typing is the keyboard and screen reader route to the same outcome. */
  const ready = mode === "draw" ? strokes.length > 0 : typed.trim().length > 1

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Tabs
        value={mode}
        onValueChange={(value) => setMode(value === "type" ? "type" : "draw")}
      >
        <TabsList>
          <TabsTrigger value="draw">Draw</TabsTrigger>
          <TabsTrigger value="type">Type</TabsTrigger>
        </TabsList>
        <TabsContent value="draw">
          <SignaturePad
            value={strokes}
            onValueChange={(next) => {
              setStrokes(next)
              setAdopted(null)
            }}
          >
            <SignaturePadArea className="h-40">
              <SignaturePadGuide />
              <SignaturePadPlaceholder />
              <SignaturePadControls position="top-end">
                <SignaturePadClear variant="ghost" />
              </SignaturePadControls>
            </SignaturePadArea>
          </SignaturePad>
        </TabsContent>
        <TabsContent value="type">
          <div className="flex flex-col gap-3">
            <Field>
              <FieldLabel htmlFor={`${id}-typed`}>Full name</FieldLabel>
              <Input
                id={`${id}-typed`}
                value={typed}
                onChange={(event) => {
                  setTyped(event.target.value)
                  setAdopted(null)
                }}
                autoComplete="name"
                placeholder="Maya Chen"
              />
            </Field>
            {/* A visual echo of the input, so it stays out of the reading order. */}
            <p
              aria-hidden="true"
              className="flex h-20 items-center justify-center border-b border-dashed px-4"
            >
              {typed.trim() ? (
                <span className="truncate font-serif text-3xl italic">
                  {typed.trim()}
                </span>
              ) : (
                <span className="text-muted-foreground text-sm">
                  Your typed signature appears here
                </span>
              )}
            </p>
          </div>
        </TabsContent>
      </Tabs>
      <div className="flex items-center gap-3">
        <Button disabled={!ready} onClick={() => setAdopted(mode)}>
          Adopt and sign
        </Button>
        <div role="status">
          {adopted && (
            <Badge variant="success-light">
              {adopted === "draw" ? "Drawn" : "Typed"} signature adopted
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
