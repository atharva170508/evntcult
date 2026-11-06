import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck2, QrCode, Users } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { EventArt } from "@/components/ui/EventArt";
import { Logo } from "@/components/shell/Logo";
import { codeLoginOn } from "@/lib/email";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string }> }) {
  const { next: nextParam, mode } = await searchParams;
  const signup = mode === "signup";
  const next = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";
  if (await getViewer()) redirect(next);

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative isolate hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <EventArt accent="violet" />
        <div className="relative flex items-center gap-2.5">
          <Logo />
          <span className="text-[20px] font-extrabold tracking-tighter">EvntCult</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-[48px] font-extrabold leading-[1.02] tracking-tightest">Register. Pass. Scan. Attend.</h2>
          <ul className="mt-8 space-y-3 text-[16px] font-semibold text-white/90">
            <li className="flex items-center gap-3">
              <CalendarCheck2 className="size-5" /> Every campus event in one place
            </li>
            <li className="flex items-center gap-3">
              <QrCode className="size-5" /> One QR pass at the gate
            </li>
            <li className="flex items-center gap-3">
              <Users className="size-5" /> Proof you were actually there
            </li>
          </ul>
        </div>
      </div>

      <div className="grid place-items-center px-5 py-12">
        <div className="w-full max-w-[400px] animate-fade-up">
          <div className="flex items-center gap-2.5 lg:hidden">
            <Logo />
            <span className="text-[20px] font-extrabold tracking-tighter">EvntCult</span>
          </div>
          <h1 className="headline mt-8 text-[34px] leading-tight tracking-tightest lg:mt-0">{signup ? "Create your account" : "Log in"}</h1>
          <p className="mt-2 text-[15px] text-ink-muted">
            {signup ? "Sign up with your college email to register for events and get passes." : "Use your college email to see your events and passes."}
          </p>
          <SignInForm next={next} signup={signup} codeLogin={codeLoginOn()} />
          <p className="mt-6 text-center text-[14px] text-ink-muted">
            {signup ? "Already have an account? " : "New here? "}
            <Link href={`/signin?${signup ? "" : "mode=signup&"}next=${encodeURIComponent(next)}`} className="font-semibold text-ink underline underline-offset-2">
              {signup ? "Log in" : "Sign up"}
            </Link>
            {" · "}
            <Link href="/dashboard" className="font-semibold text-ink underline underline-offset-2">Browse without an account</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
