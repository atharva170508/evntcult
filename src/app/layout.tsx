import type { Metadata, Viewport } from "next";
import { Gloock, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { THEME_SCRIPT } from "@/components/site/ThemeSwitch";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { Toaster } from "@/components/ui/Toaster";
import { PlayfulExtras } from "@/components/site/PlayfulExtras";

const serif = Gloock({
  subsets: ["latin"],
  weight: "400",
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
    description: "Concerts, hackathons, workshops, and club nights on one campus passbook. Register in a tap and walk in with your phone.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "EvntCult: every event, one pass" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
  title: { default: "EvntCult: Every event, one pass", template: "%s, EvntCult" },
  description: "Every event, one pass. Find what is on, register, and walk in with a scan.",
  applicationName: "EvntCult",
  authors: [{ name: "Synchronous Labs", url: "mailto:evntcult@gmail.com" }],
  creator: "Synchronous Labs",
  publisher: "Synchronous Labs",
  appleWebApp: { capable: true, title: "EvntCult", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#151412",
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
          className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-[8px] bg-[#C9A26B] px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.06em] text-[#151412] transition-transform focus:translate-y-0"
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
