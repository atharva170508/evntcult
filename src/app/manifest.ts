import type { MetadataRoute } from "next";
import { TOKENS } from "@/styles/tokens";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EvntCult",
    short_name: "EvntCult",
    description: "Every event, one place.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: TOKENS.surface0,
    theme_color: TOKENS.surface0,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
