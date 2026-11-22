"use client"

import { useMemo, useState } from "react"
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/registry-reui/bases/radix/reui/data-grid/data-grid"
import { DataGridColumnHeader } from "@/registry-reui/bases/radix/reui/data-grid/data-grid-column-header"
import { DataGridScrollArea } from "@/registry-reui/bases/radix/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/registry-reui/bases/radix/reui/data-grid/data-grid-table"
import {
  FileType,
  getFileType,
  getFileTypeCategory,
  type FileTypeCategory,
} from "@/registry-reui/bases/radix/reui/file-type"
import { useTable } from "@tanstack/react-table"
import type { ColumnDef, SortingState } from "@tanstack/react-table"

interface FileItem {
  id: string
  name: string
  kind: "file" | "folder"
  /** Bytes. Files only: a folder has an item count instead. */
  size?: number
  items?: number
  /** ISO date. */
  modified: string
  owner: string
}

const files: FileItem[] = [
  {
    id: "1",
    name: "Brand assets",
    kind: "folder",
    items: 24,
    modified: "2026-10-02",
    owner: "Ava Patel",
  },
  {
    id: "2",
    name: "Legal",
    kind: "folder",
    items: 6,
    modified: "2026-09-21",
    owner: "Marco Silva",
  },
  {
    id: "3",
    name: "Q3 financial report.pdf",
    kind: "file",
    size: 2516582,
    modified: "2026-10-05",
    owner: "Marco Silva",
  },
  {
    id: "4",
    name: "Customer interviews - synthesis and next steps.docx",
    kind: "file",
    size: 190464,
    modified: "2026-10-06",
    owner: "You",
  },
  {
    id: "5",
    name: "Revenue forecast 2027.xlsx",
    kind: "file",
    size: 933888,
    modified: "2026-10-01",
    owner: "Lena Fischer",
  },
  {
    id: "6",
    name: "Waitlist export.csv",
    kind: "file",
    size: 5033165,
    modified: "2026-09-29",
    owner: "You",
  },
  {
    id: "7",
    name: "Launch keynote.pptx",
    kind: "file",
    size: 19503513,
    modified: "2026-10-04",
    owner: "Ava Patel",
  },
  {
    id: "8",
    name: "Homepage hero.png",
    kind: "file",
    size: 1363149,
    modified: "2026-09-30",
    owner: "Ava Patel",
  },
  {
    id: "9",
    name: "Team offsite.jpg",
    kind: "file",
    size: 3250586,
    modified: "2026-09-12",
    owner: "Lena Fischer",
  },
  {
    id: "10",
    name: "Product walkthrough.mp4",
    kind: "file",
    size: 149631795,
    modified: "2026-10-03",
    owner: "Noah Kim",
  },
  {
    id: "11",
    name: "Podcast episode 12.mp3",
    kind: "file",
    size: 40055603,
    modified: "2026-09-24",
    owner: "Noah Kim",
  },
  {
    id: "12",
    name: "Press kit.zip",
    kind: "file",
    size: 59139686,
    modified: "2026-10-02",
    owner: "Ava Patel",
  },
  {
    id: "13",
    name: "Design system.fig",
    kind: "file",
    size: 24012390,
    modified: "2026-10-06",
    owner: "Ava Patel",
  },
  {
    id: "14",
    name: "app.config.json",
    kind: "file",
    size: 4301,
    modified: "2026-10-06",
    owner: "Noah Kim",
  },
  {
    id: "15",
    name: "Office floor plan.dwg",
    kind: "file",
    size: 7864320,
    modified: "2026-08-27",
    owner: "Lena Fischer",
  },
]

const FAMILY_LABELS: Record<Exclude<FileTypeCategory, "file">, string> = {
  archive: "Archive",
  audio: "Audio",
  code: "Code",
  design: "Design",
  document: "Document",
  empty: "File",
  executable: "Application",
  folder: "Folder",
  font: "Font",
  image: "Image",
  presentation: "Presentation",
  spreadsheet: "Spreadsheet",
  video: "Video",
}

// A folder name is not a file name: "v2.1 exports" would resolve to a
// "1 exports" extension, so folders never go through getFileType.
function fileTypeOf(file: FileItem) {
  return file.kind === "folder" ? "folder" : getFileType(file.name)
}

function kindOf(file: FileItem) {
  const type = fileTypeOf(file)
  const category = getFileTypeCategory(type)
  // An unknown extension has no family to name, so it names the kind itself.
  return category === "file"
    ? `${type.toUpperCase()} file`
    : FAMILY_LABELS[category]
}

const UNITS = ["B", "KB", "MB", "GB"]
const sizeNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 })

function formatBytes(bytes: number) {
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${sizeNumber.format(value)} ${UNITS[unit]}`
}

// A date-only ISO string parses as UTC midnight, so it is formatted in UTC:
// a local zone west of it would show the previous day, and differ from the
// server render.
const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

// A fixed locale keeps the order identical on the server and the client, and
// numeric puts "episode 2" before "episode 12".
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" })

// Folders group ahead of files, as in a file manager. A descending sort
// reverses the whole order, so they then move to the end.
function compareByName(a: FileItem, b: FileItem) {
  if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1
  return collator.compare(a.name, b.name)
}

export default function Pattern() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ])

  const columns = useMemo<ColumnDef<DataGridFeatures, FileItem>[]>(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <DataGridColumnHeader title="Name" column={column} />
        ),
        cell: ({ row }) => {
          const file = row.original
          // The name already reads its extension, so a file's icon is
          // hidden. A folder name says nothing about what the row is, so
          // the folder icon keeps its "Folder" name.
          return (
            <div className="flex min-w-0 items-center gap-2">
              <FileType
                type={fileTypeOf(file)}
                size="mini"
                aria-hidden={file.kind === "folder" ? undefined : true}
              />
              <span className="truncate font-medium" title={file.name}>
                {file.name}
              </span>
            </div>
          )
        },
        sortFn: (a, b) => compareByName(a.original, b.original),
        size: 300,
      },
      {
        id: "type",
        accessorFn: kindOf,
        header: ({ column }) => (
          <DataGridColumnHeader title="Type" column={column} />
        ),
        size: 130,
      },
      {
        accessorKey: "size",
        header: ({ column }) => (
          <DataGridColumnHeader title="Size" column={column} />
        ),
        cell: ({ row }) => {
          const { size, items } = row.original
          return size === undefined ? (
            <span className="text-muted-foreground">{items} items</span>
          ) : (
            formatBytes(size)
          )
        },
        // Folders have no byte size, so they sit last in both directions.
        sortFn: "basic",
        sortUndefined: "last",
        size: 100,
        // The header is a padded button in a flex row: justify-end moves it
        // to the end, and -me-2 mirrors the header's own -ms-2, so the sort
        // arrow lines up with the figures below.
        meta: {
          headerClassName: "text-end [&>div]:-me-2 [&>div]:justify-end",
          cellClassName: "text-end tabular-nums",
        },
      },
      {
        accessorKey: "modified",
        header: ({ column }) => (
          <DataGridColumnHeader title="Modified" column={column} />
        ),
        cell: ({ row }) => dateFormat.format(new Date(row.original.modified)),
        // ISO dates sort chronologically as plain text.
        sortFn: "text",
        size: 130,
      },
      {
        accessorKey: "owner",
        header: ({ column }) => (
          <DataGridColumnHeader title="Owner" column={column} />
        ),
        size: 140,
      },
    ],
    []
  )

  const table = useTable({
    features: dataGridFeatures,
    // The shared bundle registers a pagination row model; manualPagination
    // says the data is already the page, so every file renders.
    manualPagination: true,
    columns,
    data: files,
    getRowId: (row: FileItem) => row.id,
    state: { sorting },
    onSortingChange: setSorting,
  })

  return (
    <DataGrid table={table} recordCount={files.length}>
      <DataGridContainer>
        <DataGridScrollArea>
          <DataGridTable />
        </DataGridScrollArea>
      </DataGridContainer>
    </DataGrid>
  )
}
