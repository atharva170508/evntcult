import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck2, QrCode, Users } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { Aurora } from "@/components/brand/Aurora";
import { Marquee } from "@/components/brand/Marquee";
import { Logo } from "@/components/shell/Logo";
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
      <div className="relative isolate m-3 hidden flex-col justify-between overflow-hidden rounded-[36px] p-12 text-white lg:flex">
        <Aurora />
        <Marquee words={["Register", "Pass", "Scan", "Attend"]} className="absolute inset-x-0 top-[38%] text-[150px] text-white/[0.07]" />
        <div className="relative flex items-center gap-2.5">
          <Logo />
          <span className="font-serif text-[30px] leading-none tracking-[-0.02em]">EvntCult</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="font-serif text-[76px] leading-[0.92] tracking-[-0.025em]">Register. Pass. Scan. <em className="text-volt">Attend.</em></h2>
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
            <span className="font-serif text-[28px] leading-none tracking-[-0.02em]">EvntCult</span>
          </div>
          <h1 className="title-serif mt-8 text-[52px] lg:mt-0">{signup ? "Create your account" : "Log in"}</h1>
          <p className="mt-2 text-[15px] text-ink-muted">
            {signup ? "Sign up with your college email to register for events and get passes." : "Use your college email to see your events and passes."}
          </p>
          <SignInForm next={next} signup={signup} />
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
