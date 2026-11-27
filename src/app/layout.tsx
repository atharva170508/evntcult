import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { THEME_SCRIPT } from "@/components/site/ThemeSwitch";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { Toaster } from "@/components/ui/Toaster";
import { PlayfulExtras } from "@/components/site/PlayfulExtras";

/* Plus Jakarta Sans for crisp modern UI, Instrument Serif for contemporary editorial display headlines,
   and self-hosted JetBrains Mono for pass codes & timestamps. */
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
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
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    siteName: "EvntCult",
    locale: "en_IN",
    title: "EvntCult: Every event, one pass",
    description: "Concerts, meetups, workshops, parties and hackathons. Register in a tap, walk in with your phone.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "EvntCult: every event, one pass" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
  title: { default: "EvntCult: Every event, one pass", template: "%s, EvntCult" },
  description: "Every event, one pass. Find what's on, register, and walk in with a scan.",
  applicationName: "EvntCult",
  authors: [{ name: "Synchronous Labs", url: "mailto:evntcult@gmail.com" }],
  creator: "Synchronous Labs",
  publisher: "Synchronous Labs",
  appleWebApp: { capable: true, title: "EvntCult", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#FFFEF6",
  colorScheme: "light dark",
  // Draw edge to edge on notched phones; the header, tab bar and page pad themselves with env(safe-area-inset-*).
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
          className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-lg bg-ink px-4 py-2.5 text-small font-medium text-white transition-transform focus:translate-y-0"
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
