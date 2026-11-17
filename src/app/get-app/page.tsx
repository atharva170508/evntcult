import type { Metadata } from "next";
import Link from "next/link";
import { BellRing, CloudOff, Zap } from "lucide-react";
import { LogoIcon, LogoWordmark } from "@/components/brand/MissingE";
import { InstallApp } from "./InstallApp";

export const metadata: Metadata = { title: "Get the app" };

export default function GetAppPage() {
  return (
    <main id="main" className="relative isolate min-h-dvh px-gutter pb-16 pt-6">
      <div aria-hidden className="dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_10%,black,transparent_75%)]" />
      <div className="mx-auto max-w-shell">
        <Link href="/dashboard" aria-label="EvntCult home" className="inline-flex">
          <LogoWordmark motion="blink" className="text-[24px] text-ink" />
        </Link>
      </div>
      <div className="mx-auto mt-14 max-w-3xl md:mt-20">
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Install</p>
            <h1 className="mt-3 text-display-lg font-semibold">
              EvntCult on your <em>home screen.</em>
            </h1>
            <p className="mt-4 max-w-md text-lead text-ink-muted">One tap to your passes. Works like an app, no store needed.</p>
          </div>
          <LogoIcon className="size-20 shrink-0 rounded-[20px] shadow-raised" blink={false} />
        </div>
        <ul className="mt-10 grid gap-px overflow-hidden rounded-card bg-line shadow-card sm:grid-cols-3">
          {[
            { icon: Zap, t: "Opens to your passes", b: "No browser tabs to find." },
            { icon: CloudOff, t: "Works offline", b: "Saved passes still show at the gate." },
            { icon: BellRing, t: "Stays in the loop", b: "Event updates in one place." },
          ].map((f) => (
            <li key={f.t} className="bg-surface p-5">
              <f.icon className="size-[18px] text-ink-2" aria-hidden />
              <p className="mt-5 text-[15px] font-semibold">{f.t}</p>
              <p className="mt-0.5 text-[13px] text-ink-muted">{f.b}</p>
            </li>
          ))}
        </ul>
        <div className="mt-12">
          <InstallApp />
        </div>
      </div>
    </main>
  );
}
