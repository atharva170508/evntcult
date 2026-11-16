import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck2, QrCode, Users } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { LogoWordmark } from "@/components/brand/MissingE";
import { codeLoginOn } from "@/lib/email";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string }> }) {
  const { next: nextParam, mode } = await searchParams;
  const signup = mode === "signup";
  const next = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";
  if (await getViewer()) redirect(next);

  const steps = [
    { icon: CalendarCheck2, k: "Register", v: "Every campus event in one place" },
    { icon: QrCode, k: "Pass", v: "One QR pass at the gate, even offline" },
    { icon: Users, k: "Attend", v: "A certificate the moment you're scanned in" },
  ];

  return (
    <main id="main" className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      {/* Form */}
      <div className="flex flex-col px-gutter py-6">
        <Link href="/dashboard" aria-label="EvntCult home" className="w-fit">
          <LogoWordmark motion="type" className="text-[26px] text-ink" />
        </Link>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
          <div className="animate-fade-up">
            <p className="eyebrow">{signup ? "Create account" : "Welcome back"}</p>
            <h1 className="mt-3 text-display-md font-semibold">{signup ? <>Get your <em>OnePass.</em></> : <>Log <em>in.</em></>}</h1>
            <p className="mt-3 text-body text-ink-muted">
              {signup ? "Sign up with your college email to register for events and get passes." : "Use your college email to see your events and passes."}
            </p>
            <SignInForm next={next} signup={signup} codeLogin={codeLoginOn()} />
            <div className="mt-8 space-y-2 border-t border-line pt-6 text-[14px] text-ink-muted">
              <p>
                {signup ? "Already have an account? " : "New here? "}
                <Link href={`/signin?${signup ? "" : "mode=signup&"}next=${encodeURIComponent(next)}`} className="link">
                  {signup ? "Log in" : "Create an account"}
                </Link>
              </p>
              <p>
                <Link href="/dashboard" className="link">
                  Browse without an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Brand panel */}
      <aside aria-hidden className="relative isolate m-3 hidden flex-col justify-between overflow-hidden rounded-panel bg-ink p-12 text-white lg:flex">
        <div className="absolute inset-0 -z-10 opacity-[0.5] [background-image:radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1.2px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_80%_70%_at_70%_20%,black,transparent_75%)]" />
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/50">EvntCult · OnePass</p>
        <div>
          <h2 className="max-w-lg text-display-xl font-semibold">
            Register. Pass. Scan. <em className="text-white/70">Attend.</em>
          </h2>
          <ol className="mt-12 grid max-w-lg gap-px overflow-hidden rounded-card bg-white/10">
            {steps.map((st, i) => (
              <li key={st.k} className="flex items-center gap-4 bg-ink/95 px-5 py-4">
                <span className="font-mono text-[12px] text-white/40">0{i + 1}</span>
                <st.icon className="size-[18px] text-white/80" />
                <span className="text-[15px] font-medium">{st.k}</span>
                <span className="ml-auto text-right text-[13px] text-white/55">{st.v}</span>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </main>
  );
}
