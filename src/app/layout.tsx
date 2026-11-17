import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

/* Figtree for the interface, Fraunces (upright, soft optical serif) for headlines,
   JetBrains Mono for pass codes and timetable figures. Self-hosted (SIL OFL). */
const sans = localFont({ src: "./fonts/Figtree-Variable.woff2", weight: "300 900", variable: "--font-sans", display: "swap" });
const display = localFont({ src: "./fonts/Fraunces-Variable.woff2", weight: "100 900", variable: "--font-display", display: "swap" });
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
  description: "Everything happening on campus, in one pass. Find events, register in seconds, walk in with a scan.",
  appleWebApp: { capable: true, title: "EvntCult", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body>
        <a
          href="#main"
          className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-xl bg-night px-4 py-2.5 text-small font-medium text-white transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
