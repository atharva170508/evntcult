"use client"

import { useId, useState, type ReactNode } from "react"

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/registry/bases/radix/ui/attachment"
import { Field, FieldLabel } from "@/registry/bases/radix/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/registry/bases/radix/ui/input-group"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

const ICON_SHEET = (
  <IconPlaceholder
    lucide="FileSpreadsheetIcon"
    tabler="IconFileSpreadsheet"
    hugeicons="GoogleSheetIcon"
    phosphor="FileTextIcon"
    remixicon="RiFileTextLine"
    aria-hidden="true"
  />
)

const ICON_IMAGE = (
  <IconPlaceholder
    lucide="ImageIcon"
    tabler="IconPhoto"
    hugeicons="ImageIcon"
    phosphor="ImageIcon"
    remixicon="RiImageLine"
    aria-hidden="true"
  />
)

const ICON_TEXT = (
  <IconPlaceholder
    lucide="FileTextIcon"
    tabler="IconFileText"
    hugeicons="File02Icon"
    phosphor="FileTextIcon"
    remixicon="RiFileTextLine"
    aria-hidden="true"
  />
)

const ICON_CODE = (
  <IconPlaceholder
    lucide="CodeIcon"
    tabler="IconCode"
    hugeicons="SourceCodeIcon"
    phosphor="CodeIcon"
    remixicon="RiCodeSSlashLine"
    aria-hidden="true"
  />
)

const ICON_REMOVE = (
  <IconPlaceholder
    lucide="XIcon"
    tabler="IconX"
    hugeicons="Cancel01Icon"
    phosphor="XIcon"
    remixicon="RiCloseLine"
    aria-hidden="true"
  />
)

const ICON_ATTACH = (
  <IconPlaceholder
    lucide="PaperclipIcon"
    tabler="IconPaperclip"
    hugeicons="Attachment02Icon"
    phosphor="PaperclipIcon"
    remixicon="RiAttachment2"
    aria-hidden="true"
  />
)

const ICON_SEND = (
  <IconPlaceholder
    lucide="ArrowUpIcon"
    tabler="IconArrowUp"
    hugeicons="ArrowUp01Icon"
    phosphor="ArrowUpIcon"
    remixicon="RiArrowUpLine"
    aria-hidden="true"
  />
)

type Source = {
  id: string
  name: string
  icon: ReactNode
}

// Icons ride in the data as ready made nodes rather than component
// references. The shadcn CLI rewrites IconPlaceholder props where it finds
// them, so the five names have to sit in the source as plain literals.
const FILES: Source[] = [
  { id: "churn", name: "churn-drivers.csv", icon: ICON_SHEET },
  { id: "pricing", name: "pricing-tiers-v4.xlsx", icon: ICON_SHEET },
  { id: "latency", name: "checkout-latency.png", icon: ICON_IMAGE },
  { id: "limits", name: "rate-limits.md", icon: ICON_TEXT },
  { id: "trace", name: "stack-trace-2041.log", icon: ICON_CODE },
  { id: "invoice", name: "invoice-3182.pdf", icon: ICON_TEXT },
]

export default function Pattern() {
  // useId rather than a fixed string, so the label and the textarea stay
  // paired even when two copies of this composer share one page.
  const id = useId()
  const [attachedIds, setAttachedIds] = useState<string[]>([
    "churn",
    "pricing",
    "latency",
  ])

  // Both lists are derived during render rather than stored. A second piece of
  // state for "the next file" would only have to be kept in step with the
  // first, and the paperclip already knows everything it needs from the ids.
  const attached = FILES.filter((file) => attachedIds.includes(file.id))
  const next = FILES.find((file) => !attachedIds.includes(file.id))

  // The tray renders only when it holds something. An empty block-start addon
  // still draws its own padding, which would leave a dead band above the
  // textarea the moment the last chip is removed.
  const hasTray = attached.length > 0

  // One sentence, rendered twice. The visible copy sits in the composer
  // chrome, which nothing announces, so a live region repeats it below and
  // makes each removal audible.
  const summary = `${attached.length} of ${FILES.length} attached`

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
      <form onSubmit={(event) => event.preventDefault()}>
        <Field>
          <FieldLabel htmlFor={id} className="sr-only">
            Message the assistant
          </FieldLabel>
          <InputGroup>
            {hasTray ? (
              <InputGroupAddon align="block-start">
                {/*
                 * AttachmentGroup forces its children to flex-none and scrolls
                 * them, so the fourth and fifth chips slide sideways instead of
                 * adding a second row and shoving the transcript off screen.
                 */}
                <AttachmentGroup role="group" aria-label="Attached files">
                  {attached.map((file) => (
                    <Attachment key={file.id} size="xs" className="max-w-52">
                      <AttachmentMedia>{file.icon}</AttachmentMedia>
                      <AttachmentContent>
                        <AttachmentTitle>{file.name}</AttachmentTitle>
                      </AttachmentContent>
                      <AttachmentActions>
                        {/*
                         * type="button" is spelled out because this composer is
                         * a real form, and a button with no explicit type
                         * submits it.
                         */}
                        <AttachmentAction
                          type="button"
                          aria-label={`Remove ${file.name}`}
                          onClick={() =>
                            setAttachedIds((current) =>
                              current.filter((value) => value !== file.id)
                            )
                          }
                        >
                          {ICON_REMOVE}
                        </AttachmentAction>
                      </AttachmentActions>
                    </Attachment>
                  ))}
                </AttachmentGroup>
              </InputGroupAddon>
            ) : null}

            {/*
             * The textarea grows with the draft and stops at a cap, so a long
             * message scrolls inside the box instead of pushing the tray off
             * the top.
             */}
            <InputGroupTextarea
              id={id}
              placeholder="Ask about the billing incident..."
              className="field-sizing-content max-h-32 min-h-10"
            />

            <InputGroupAddon align="block-end">
              {/*
               * Once the pool runs dry the paperclip is disabled rather than
               * removed: a control that vanishes reflows the row and explains
               * nothing.
               */}
              <InputGroupButton
                type="button"
                size="icon-sm"
                aria-label="Attach a file"
                disabled={!next}
                onClick={() => {
                  if (next) {
                    setAttachedIds((current) => [...current, next.id])
                  }
                }}
              >
                {ICON_ATTACH}
              </InputGroupButton>
              <InputGroupText>{summary}</InputGroupText>
              <InputGroupButton
                type="submit"
                size="icon-sm"
                variant="default"
                className="ms-auto"
              >
                {ICON_SEND}
                <span className="sr-only">Send</span>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </form>
      <span className="sr-only" aria-live="polite">
        {summary}
      </span>
    </div>
  )
}
