import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { MotionProvider } from "@/components/motion/MotionProvider";

/* Figtree for the interface, EB Garamond for big headlines, JetBrains Mono for pass codes.
   Self-hosted (SIL OFL). */
const sans = localFont({ src: "./fonts/Figtree-Variable.woff2", weight: "300 900", variable: "--font-sans", display: "swap" });
const serif = localFont({
  src: [
    { path: "./fonts/EBGaramond-Variable.woff2", weight: "400 800", style: "normal" },
    { path: "./fonts/EBGaramond-Italic-Variable.woff2", weight: "400 800", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
});
const mono = localFont({
  src: [
    { path: "./fonts/JetBrainsMono-Regular.woff2", weight: "400" },
    { path: "./fonts/JetBrainsMono-Medium.woff2", weight: "500" },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "EvntCult — Every event, one pass", template: "%s · EvntCult" },
  description: "Every campus event, one pass. Find what's on, register, and walk in with a scan.",
  appleWebApp: { capable: true, title: "EvntCult", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#FFFEF6",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <a
          href="#main"
          className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-lg bg-ink px-4 py-2.5 text-small font-medium text-white transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
