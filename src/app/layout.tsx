import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

/* Geist for UI and display (tight, optical), Geist Mono for numbers & labels,
   Instrument Serif italic for single editorial accent words.
   Self-hosted (SIL OFL) so builds never depend on Google Fonts being reachable. */
const sans = localFont({ src: "./fonts/Geist-Variable.woff2", weight: "100 900", variable: "--font-sans", display: "swap" });
const mono = localFont({ src: "./fonts/GeistMono-Variable.woff2", weight: "100 900", variable: "--font-mono", display: "swap" });
const serif = localFont({
  src: [
    { path: "./fonts/InstrumentSerif-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/InstrumentSerif-Italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "EvntCult — Every event, one pass", template: "%s · EvntCult" },
  description: "Every event, one place. Discover, register, check in, relive.",
  appleWebApp: { capable: true, title: "EvntCult", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#F6F5F1",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      <body>
        <a
          href="#main"
          className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-full bg-ink px-4 py-2 text-small font-medium text-white transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
