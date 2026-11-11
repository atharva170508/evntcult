import type { Metadata, Viewport } from "next";
import { Barlow_Semi_Condensed, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { TOKENS } from "@/styles/tokens";

/* §5 — display: Bahnschrift where installed (Windows), Barlow Semi Condensed elsewhere. Body: the system face. Mono: ui-monospace, then IBM Plex Mono. */
const barlow = Barlow_Semi_Condensed({ subsets: ["latin"], weight: ["600"], variable: "--font-barlow", display: "swap" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex", display: "swap" });

export const metadata: Metadata = {
  title: { default: "EvntCult", template: "%s · EvntCult" },
  description: "Every event, one place. Discover, register, check in, relive.",
  appleWebApp: { capable: true, title: "EvntCult", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: TOKENS.surface0,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${barlow.variable} ${plex.variable}`}>
      <body>{children}</body>
    </html>
  );
}
