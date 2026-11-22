import {
  FileType,
  type FileTypeName,
} from "@/registry-reui/bases/radix/reui/file-type"

const formats = [
  "pdf",
  "docx",
  "xlsx",
  "pptx",
  "jpg",
  "mp4",
  "mp3",
  "zip",
  "fig",
  "html",
] as const satisfies readonly FileTypeName[]

export default function Pattern() {
  // No captions: each icon names itself ("PDF file", "MP4 file"), so a screen
  // reader still hears every format.
  return (
    <div className="mx-auto grid w-fit grid-cols-5 gap-x-4 gap-y-6">
      {formats.map((type) => (
        <FileType key={type} type={type} />
      ))}
    </div>
  )
}
