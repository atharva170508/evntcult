import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EvntCult",
    short_name: "EvntCult",
    description: "Every event, one place.",
    id: "/",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    // The app's cream canvas, so the splash screen and Android's status bar match the first screen.
    background_color: "#FFFEF6",
    theme_color: "#FFFEF6",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
