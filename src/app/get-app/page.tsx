import type { Metadata } from "next";
import Link from "next/link";
import { LogoWordmark } from "@/components/brand/MissingE";
import { InstallApp } from "./InstallApp";

export const metadata: Metadata = { title: "Get the app" };

export default function GetAppPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-[760px] px-4 py-8 md:py-16">
      <Link href="/dashboard" aria-label="EvntCult home">
        <LogoWordmark className="text-display text-ink" />
      </Link>
      <h1 className="title-xl mt-12 mb-8 text-display">Get the app</h1>
      <InstallApp />
    </main>
  );
}
