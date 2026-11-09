import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Fredoka, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";

const sans = Outfit({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const logo = Bricolage_Grotesque({ subsets: ["latin"], weight: ["800"], variable: "--font-logo", display: "swap" });
const brand = Fredoka({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-brand", display: "swap" });

export const metadata: Metadata = {
  title: { default: "EvntCult", template: "%s · EvntCult" },
  description: "Every campus event, one place. Discover, register, check in, relive.",
  appleWebApp: { capable: true, title: "EvntCult", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#08080c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${sans.variable} ${mono.variable} ${brand.variable} ${logo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
