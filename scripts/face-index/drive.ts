/**
 * Google Drive access for the album importer: list the images in a public folder and download
 * originals. Uses the Drive API v3 with a plain API key (free; no billing, no OAuth): works for
 * folders shared as "Anyone with the link can view".
 */
export interface DriveImage {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
}

const API = "https://www.googleapis.com/drive/v3";

/** Every image file directly inside the folder (not sub-folders), oldest name first. */
export async function listFolderImages(folderId: string, apiKey: string): Promise<DriveImage[]> {
  const out: DriveImage[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
      fields: "nextPageToken, files(id, name, mimeType, size)",
      pageSize: "1000",
      orderBy: "name",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
      key: apiKey,
    });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await fetch(`${API}/files?${params}`);
    if (!res.ok) {
      const msg = (await res.text()).slice(0, 300);
      if (res.status === 404) throw new Error(`Drive folder not found. Is it shared as "Anyone with the link can view"? (${msg})`);
      if (res.status === 403) throw new Error(`Drive refused the request. Check GOOGLE_API_KEY and that the Drive API is enabled for it. (${msg})`);
      throw new Error(`Drive listing failed (${res.status}): ${msg}`);
    }
    const body = (await res.json()) as { nextPageToken?: string; files: { id: string; name: string; mimeType: string; size?: string }[] };
    for (const f of body.files) out.push({ id: f.id, name: f.name, mimeType: f.mimeType, size: f.size ? Number(f.size) : null });
    pageToken = body.nextPageToken;
  } while (pageToken);
  return out;
}

/** Download one original file's bytes. */
export async function downloadFile(fileId: string, apiKey: string): Promise<Uint8Array> {
  const res = await fetch(`${API}/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true&key=${encodeURIComponent(apiKey)}`);
  if (!res.ok) throw new Error(`Download failed (${res.status}) for ${fileId}: ${(await res.text()).slice(0, 200)}`);
  return new Uint8Array(await res.arrayBuffer());
}
