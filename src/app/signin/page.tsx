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
    <main id="main" className="grid min-h-dvh bg-[#151412] text-[#EEE8DD] lg:grid-cols-[1.05fr_1fr]">
      {/* Left half: full-bleed warm tungsten auditorium photograph */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-[rgba(238,232,221,0.15)] bg-[#151412] p-12 text-[#EEE8DD] lg:flex xl:p-16">
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
              "linear-gradient(to top, rgba(21,20,18,0.94) 0%, rgba(21,20,18,0.5) 55%, rgba(21,20,18,0.72) 100%)",
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <Link href="/dashboard" aria-label="EvntCult home">
            <BrandLogo tone="white" className="text-[22px]" />
          </Link>
          <Link
            href="/dashboard"
            className="tr-meta tr-link inline-flex items-center gap-1.5 text-[#EEE8DD]/80 hover:text-[#C9A26B]"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back
          </Link>
        </div>

        <div className="relative z-10 my-auto py-12">
          <h1 className="max-w-[12ch] font-display text-[clamp(48px,5vw,76px)] leading-[0.96] tracking-[-0.02em] text-[#EEE8DD]">
            One pass for every night on <em className="italic text-[#C9A26B]">campus</em>.
          </h1>
          <dl className="mt-10 divide-y divide-[rgba(238,232,221,0.15)] border-y border-[rgba(238,232,221,0.15)]">
            {[
              ["Offline QR pass", "LOCAL"],
              ["On device Photo Vault", "PRIVATE"],
              ["Direct club UPI", "0% FEE"],
            ].map(([title, meta]) => (
              <div key={title} className="flex items-baseline justify-between gap-4 py-4">
                <dt className="text-[15px] font-light text-[#EEE8DD]">{title}</dt>
                <dd className="tr-meta text-[#C9A26B]">{meta}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="tr-meta relative z-10 text-[#9A9284]">
          EvntCult · Synchronous Labs
        </p>
      </aside>

      {/* Right half: calm dark-ink sign-in form */}
      <section className="flex flex-col justify-between bg-canvas px-5 py-6 md:px-10 lg:px-16 lg:py-12">
        <div className="flex items-center justify-between lg:hidden">
          <Link href="/dashboard" aria-label="EvntCult home">
            <BrandLogo className="text-[20px]" />
          </Link>
          <Link href="/dashboard" className="tr-meta text-ink-muted hover:text-ink">
            Home
          </Link>
        </div>

        <div className="mx-auto my-auto w-full max-w-[440px] py-10">
          <p className="tr-meta text-ink-muted">
            {signup ? "001/ Create account" : "001/ Sign in"}
          </p>
          <h2 className="mt-3 font-display text-[44px] leading-[0.98] tracking-[-0.02em] text-ink">
            {signup ? (
              <>
                Get your <em className="italic text-[#C9A26B]">pass</em>.
              </>
            ) : (
              <>
                Welcome <em className="italic text-[#C9A26B]">back</em>.
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
