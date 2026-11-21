import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Public pages only. Event pages need a sign-in, so they aren't listed. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/dashboard`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/get-app`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
