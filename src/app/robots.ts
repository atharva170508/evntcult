import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Search engines may see the public pages; everything personal or organizer-only stays out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/dashboard", "/terms", "/get-app", "/signin"],
        disallow: ["/api/", "/organizer", "/admin", "/passes", "/vault", "/profile", "/gate", "/v/", "/e/", "/c/", "/verify", "/certificates"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
