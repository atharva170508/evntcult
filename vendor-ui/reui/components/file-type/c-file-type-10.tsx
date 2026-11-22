import {
  FileType,
  getFileType,
} from "@/registry-reui/bases/radix/reui/file-type"

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/registry/bases/radix/ui/item"

type Revision = {
  file: string
  /** Shown in the label band in place of the extension. */
  label: string
  note: string
  date: string
  dateLabel: string
}

/* Newest first. 3 revisions are the same DOCX, so the label carries the
   version instead of repeating the extension. A longer label (SIGNED,
   CA-1042) keeps the same band and sets its text smaller to fit. */
const REVISIONS: Revision[] = [
  {
    file: "agreement-signed.pdf",
    label: "SIGNED",
    note: "Countersigned",
    date: "2026-10-04",
    dateLabel: "Oct 4",
  },
  {
    file: "agreement-v3.docx",
    label: "V3",
    note: "Counsel review",
    date: "2026-09-28",
    dateLabel: "Sep 28",
  },
  {
    file: "agreement-v2.docx",
    label: "V2",
    note: "Pricing schedule added",
    date: "2026-09-19",
    dateLabel: "Sep 19",
  },
  {
    file: "agreement-v1.docx",
    label: "V1",
    note: "First draft",
    date: "2026-09-12",
    dateLabel: "Sep 12",
  },
]

function Dot() {
  return (
    <span
      aria-hidden="true"
      className="bg-muted-foreground/40 mx-1.5 inline-block size-1 rounded-full align-middle"
    />
  )
}

export default function Pattern() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center gap-3">
        {/* A string label joins the accessible name: "CA-1042, File". */}
        <FileType type="empty" variant="light" size="xl" label="CA-1042" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-sm font-medium">Supply agreement</p>
          <p className="text-muted-foreground truncate text-sm">
            Northwind Foods
            <Dot />
            {REVISIONS.length} revisions
          </p>
        </div>
      </div>
      <ItemGroup aria-label="Revisions">
        {REVISIONS.map((revision) => (
          <Item key={revision.file} role="listitem" variant="outline" size="sm">
            <ItemMedia>
              {/* Light, not outline: an outlined page inside an outlined row
                  reads as a second frame. Hidden because the file name
                  beside it already reads the extension and the version. */}
              <FileType
                type={getFileType(revision.file)}
                variant="light"
                label={revision.label}
                aria-hidden="true"
              />
            </ItemMedia>
            {/* min-w-0 lets the content shrink below the name, and the span
                (not the flex title) carries the ellipsis. */}
            <ItemContent className="min-w-0">
              <ItemTitle className="max-w-full">
                <span className="truncate">{revision.file}</span>
              </ItemTitle>
              <ItemDescription>
                {revision.note}
                <Dot />
                <time dateTime={revision.date}>{revision.dateLabel}</time>
              </ItemDescription>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    </div>
  )
}
