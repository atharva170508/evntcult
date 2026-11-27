import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { BrandLogo } from "@/components/site/Brand";
import { codeLoginOn } from "@/lib/email";
import { safeNextPath } from "@/lib/auth-shared";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mode?: string }>;
}) {
  const { next: nextParam, mode } = await searchParams;
  const signup = mode === "signup";
  const next = safeNextPath(nextParam);
  if (await getViewer()) redirect(next);

  return (
    <main id="main" className="grid min-h-dvh bg-[#161820] text-[#EFEAE0] lg:grid-cols-[1.05fr_1fr]">
      {/* Left half: full-bleed warm tungsten auditorium photograph */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-[#2E3342] bg-[#161820] p-12 text-[#EFEAE0] lg:flex xl:p-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-hall.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover opacity-55"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(22,24,32,0.6) 0%, rgba(22,24,32,0.32) 45%, rgba(22,24,32,0.92) 100%)",
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <Link href="/dashboard" aria-label="EvntCult home">
            <BrandLogo className="text-[30px]" />
          </Link>
          <Link
            href="/dashboard"
            className="tr-meta tr-link inline-flex items-center gap-1.5 text-[#EFEAE0]/80 hover:text-[#D4B87A]"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back
          </Link>
        </div>

        <div className="relative z-10 my-auto py-12">
          <h1 className="max-w-[12ch] font-display text-[clamp(48px,5vw,76px)] font-bold italic leading-[0.92] tracking-[-0.02em] text-[#EFEAE0]">
            One pass for every <span className="text-[#D4B87A]">event.</span>
          </h1>
          <dl className="mt-10 divide-y divide-[#EFEAE0]/15 border-y border-[#EFEAE0]/15">
            {[
              ["Offline QR passes", "Works at the gate without WiFi"],
              ["On device Photo Vault", "Automatic event photo matching"],
              ["Direct organizer UPI", "Zero platform fee on tickets"],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-baseline justify-between gap-4 py-4">
                <dt className="font-display text-[22px] font-semibold italic text-[#EFEAE0]">{title}</dt>
                <dd className="text-[13.5px] font-light text-[#EFEAE0]/70">{desc}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="tr-meta relative z-10 text-[#9D978C]">
          EvntCult · Synchronous Labs
        </p>
      </aside>

      {/* Right half: deep charcoal editorial sign-in form */}
      <section className="flex flex-col justify-between bg-canvas px-5 py-6 md:px-10 lg:px-16 lg:py-12">
        <div className="flex items-center justify-between lg:hidden">
          <Link href="/dashboard" aria-label="EvntCult home">
            <BrandLogo className="text-[28px]" />
          </Link>
          <Link href="/dashboard" className="tr-meta text-ink-muted hover:text-ink">
            Home
          </Link>
        </div>

        <div className="mx-auto my-auto w-full max-w-[440px] py-10">
          <p className="tr-meta text-[#D4B87A]">
            {signup ? "Create Account" : "Member Sign In"}
          </p>
          <h2 className="mt-3 font-display text-[48px] font-bold italic leading-[0.94] tracking-[-0.02em] text-ink">
            {signup ? (
              <>
                Get your <span className="text-[#D4B87A]">pass.</span>
              </>
            ) : (
              <>
                Welcome <span className="text-[#D4B87A]">back.</span>
              </>
            )}
          </h2>
          <p className="mt-3 text-[15px] font-light text-ink-muted">
            {signup
              ? "Sign up in seconds with your email. No password to remember."
              : "Sign in with your email to open your passes and Photo Vault."}
          </p>

          <SignInForm next={next} signup={signup} codeLogin={codeLoginOn()} />

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-[14px] text-ink-muted">
            <p>
              {signup ? "Already have an account? " : "New here? "}
              <Link
                href={`/signin?${signup ? "" : "mode=signup&"}next=${encodeURIComponent(next)}`}
                className="link"
              >
                {signup ? "Log in" : "Create an account"}
              </Link>
            </p>
            <Link href="/dashboard" className="tr-meta text-ink-muted hover:text-ink">
              Continue as guest
            </Link>
          </div>
        </div>

        <p className="text-center text-[12.5px] font-light text-ink-muted lg:text-left">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-ink">
            Terms
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
