import {
  FileType,
  getFileType,
} from "@/registry-reui/bases/radix/reui/file-type"

import { Button } from "@/registry/bases/radix/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/registry/bases/radix/ui/item"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

type Attachment = {
  id: string
  name: string
  size: string
  /** ISO date for the time element, and the short form people read. */
  modified: string
  modifiedLabel: string
}

const ATTACHMENTS: Attachment[] = [
  {
    id: "agreement",
    name: "master-services-agreement-signed.pdf",
    size: "2.1 MB",
    modified: "2026-10-06",
    modifiedLabel: "Oct 6",
  },
  {
    id: "deck",
    name: "q3-board-deck.pptx",
    size: "18.4 MB",
    modified: "2026-10-02",
    modifiedLabel: "Oct 2",
  },
  {
    id: "forecast",
    name: "revenue-forecast-2027.xlsx",
    size: "860 KB",
    modified: "2026-09-29",
    modifiedLabel: "Sep 29",
  },
  {
    id: "brief",
    name: "launch-brief.docx",
    size: "312 KB",
    modified: "2026-09-24",
    modifiedLabel: "Sep 24",
  },
  {
    id: "demo",
    name: "product-demo.mp4",
    size: "64.2 MB",
    modified: "2026-09-18",
    modifiedLabel: "Sep 18",
  },
]

export default function Pattern() {
  return (
    <ItemGroup aria-label="Attachments" className="mx-auto w-full max-w-md">
      {ATTACHMENTS.map((file) => (
        // ItemGroup is a role="list", so each row declares itself a listitem
        // or assistive tech announces an empty list.
        <Item key={file.id} role="listitem" variant="outline" size="sm">
          <ItemMedia>
            {/*
             * The light page keeps its shape against the row border, where an
             * outline page would read as a second frame. aria-hidden because
             * the visible name already ends in the extension.
             */}
            <FileType
              type={getFileType(file.name)}
              variant="light"
              aria-hidden="true"
            />
          </ItemMedia>
          {/*
           * min-w-0 lets the content shrink below the name's width, and the
           * span (not the flex title) carries the ellipsis.
           */}
          <ItemContent className="min-w-0">
            <ItemTitle className="max-w-full">
              <span className="truncate" title={file.name}>
                {file.name}
              </span>
            </ItemTitle>
            <ItemDescription>
              {file.size}
              <span
                aria-hidden="true"
                className="bg-muted-foreground/40 mx-1.5 inline-block size-1 rounded-full align-middle"
              />
              <time dateTime={file.modified}>{file.modifiedLabel}</time>
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Download ${file.name}`}
            >
              <IconPlaceholder
                lucide="DownloadIcon"
                tabler="IconDownload"
                hugeicons="Download01Icon"
                phosphor="DownloadSimpleIcon"
                remixicon="RiDownloadLine"
                aria-hidden="true"
              />
            </Button>
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  )
}
