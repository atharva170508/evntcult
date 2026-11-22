import type { ReactNode } from "react"
import {
  FileType,
  type FileTypeName,
} from "@/registry-reui/bases/radix/reui/file-type"

import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

type FileState = {
  type: FileTypeName
  /** Names the state and the type, so the icons can stay hidden. */
  caption: string
  icon: ReactNode
}

const FILES: FileState[] = [
  {
    type: "pdf",
    caption: "Locked PDF",
    icon: (
      <IconPlaceholder
        lucide="LockIcon"
        tabler="IconLock"
        hugeicons="SquareLock01Icon"
        phosphor="LockSimpleIcon"
        remixicon="RiLockLine"
      />
    ),
  },
  {
    type: "docx",
    caption: "Verified DOCX",
    icon: (
      <IconPlaceholder
        lucide="ShieldCheckIcon"
        tabler="IconShieldCheck"
        hugeicons="ShieldEnergyIcon"
        phosphor="ShieldCheckIcon"
        remixicon="RiShieldCheckLine"
      />
    ),
  },
  {
    type: "xlsx",
    caption: "Shared XLSX",
    icon: (
      <IconPlaceholder
        lucide="LinkIcon"
        tabler="IconLink"
        hugeicons="Link01Icon"
        phosphor="LinkIcon"
        remixicon="RiLinkM"
      />
    ),
  },
  {
    type: "png",
    caption: "Starred PNG",
    icon: (
      <IconPlaceholder
        lucide="StarIcon"
        tabler="IconStar"
        hugeicons="StarIcon"
        phosphor="StarIcon"
        remixicon="RiStarLine"
      />
    ),
  },
  {
    type: "fig",
    caption: "Hidden FIG",
    icon: (
      <IconPlaceholder
        lucide="EyeOffIcon"
        tabler="IconEyeOff"
        hugeicons="ViewOffSlashIcon"
        phosphor="EyeSlashIcon"
        remixicon="RiEyeOffLine"
      />
    ),
  },
  {
    type: "zip",
    caption: "Uploading ZIP",
    icon: (
      <IconPlaceholder
        lucide="CloudUploadIcon"
        tabler="IconCloudUpload"
        hugeicons="CloudUploadIcon"
        phosphor="CloudArrowUpIcon"
        remixicon="RiUploadCloud2Line"
      />
    ),
  },
]

export default function Pattern() {
  return (
    <ul className="mx-auto grid w-fit grid-cols-3 gap-x-8 gap-y-6">
      {FILES.map((file) => (
        <li key={file.type} className="flex flex-col items-center gap-2.5">
          {/* The icon takes the glyph's place and color in every variant. */}
          <div className="flex gap-2">
            <FileType type={file.type} icon={file.icon} aria-hidden="true" />
            <FileType
              type={file.type}
              icon={file.icon}
              variant="solid"
              aria-hidden="true"
            />
          </div>
          <span className="text-muted-foreground text-xs">{file.caption}</span>
        </li>
      ))}
    </ul>
  )
}
