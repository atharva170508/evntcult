"use client"

import { useId, useState } from "react"
import { FileType } from "@/registry-reui/bases/radix/reui/file-type"

import { Button } from "@/registry/bases/radix/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/registry/bases/radix/ui/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/registry/bases/radix/ui/radio-group"

type ExportFormat = "pdf" | "docx" | "xlsx" | "csv" | "png"

const FORMATS: Array<{
  value: ExportFormat
  title: string
  description: string
}> = [
  {
    value: "pdf",
    title: "PDF document",
    description: "Fixed layout, ready to share or print",
  },
  {
    value: "docx",
    title: "Word document",
    description: "Editable in Word or Google Docs",
  },
  {
    value: "xlsx",
    title: "Excel workbook",
    description: "Every table on its own sheet",
  },
  {
    value: "csv",
    title: "CSV table",
    description: "Plain rows for any data tool",
  },
  {
    value: "png",
    title: "PNG images",
    description: "One image per page, for slides",
  },
]

export default function Pattern() {
  // A prefix from useId keeps every label paired with its own radio when the
  // picker renders more than once on a page.
  const id = useId()
  // Preselected on purpose: an export always needs a format, so there is no
  // empty state worth showing.
  const [format, setFormat] = useState<ExportFormat>("pdf")
  const [exported, setExported] = useState<ExportFormat | null>(null)

  return (
    <FieldSet className="mx-auto w-full max-w-sm">
      <FieldLegend>Export format</FieldLegend>
      <FieldDescription>Q3 revenue report, 24 pages.</FieldDescription>
      {/* The group reports a plain value, narrowed back to the union here. */}
      <RadioGroup
        value={format}
        onValueChange={(value) => setFormat(value as ExportFormat)}
      >
        {FORMATS.map((option) => (
          <FieldLabel key={option.value} htmlFor={`${id}-${option.value}`}>
            <Field orientation="horizontal">
              {/*
               * The icon keeps its own accessible name ("DOCX file"): the
               * title beside it is a plain name, not the extension.
               */}
              <FileType type={option.value} />
              <FieldContent>
                <FieldTitle>{option.title}</FieldTitle>
                <FieldDescription>{option.description}</FieldDescription>
              </FieldContent>
              <RadioGroupItem
                value={option.value}
                id={`${id}-${option.value}`}
              />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
      <div className="flex items-center justify-between gap-3">
        {/* Exporting changes nothing on screen, so the result is announced here. */}
        <p role="status" className="text-muted-foreground min-w-0 text-xs">
          {exported ? `Exported q3-revenue-report.${exported}` : null}
        </p>
        <Button type="button" onClick={() => setExported(format)}>
          Export {format.toUpperCase()}
        </Button>
      </div>
    </FieldSet>
  )
}
