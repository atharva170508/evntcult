import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { THEME_SCRIPT } from "@/components/site/ThemeSwitch";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { Toaster } from "@/components/ui/Toaster";
import { PlayfulExtras } from "@/components/site/PlayfulExtras";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    siteName: "EvntCult",
    locale: "en_IN",
    title: "EvntCult: Every event, one pass",
    description: "Concerts, hackathons, workshops, sports, and live nights across your city. Claim your seat in a tap and walk in with your phone.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "EvntCult: every event, one pass" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
  title: { default: "EvntCult: Every event, one pass", template: "%s, EvntCult" },
  description: "Every event, one pass. Find what is on, register in a tap, and walk in offline.",
  applicationName: "EvntCult",
  authors: [{ name: "Synchronous Labs", url: "mailto:evntcult@gmail.com" }],
  creator: "Synchronous Labs",
  publisher: "Synchronous Labs",
  appleWebApp: { capable: true, title: "EvntCult", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#161820",
  colorScheme: "dark light",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${sans.variable} ${serif.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <a
          href="#main"
          className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-[6px] bg-[#D4B87A] px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#161820] transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <MotionProvider>
          {children}
          <Toaster />
          <PlayfulExtras />
        </MotionProvider>
      </body>
    </html>
  );
}
