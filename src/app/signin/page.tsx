import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, QrCode, ScanFace, ShieldCheck } from "lucide-react";
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
    <main id="main" className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Left half: Obsidian twilight editorial welcome canvas (desktop) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#121110] p-12 text-[#EDE3DA] lg:flex xl:p-16">
        <img
          src="/images/cinematic/hero-plate.jpg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-35"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#121110]/80 via-[#121110]/65 to-[#121110]/95"
        />
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/dashboard" aria-label="EvntCult home">
            <BrandLogo tone="white" className="text-[22px]" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-cream/65 transition-colors hover:text-cream"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to home
          </Link>
        </div>

        <div className="relative z-10 my-auto py-12">
          <h1 className="max-w-[13ch] font-display text-[clamp(48px,5vw,76px)] leading-[0.92] tracking-[-0.03em] text-cream">
            One pass for every night on <em>campus.</em>
          </h1>
          <p className="mt-6 max-w-[40ch] text-[16.5px] leading-relaxed text-cream/65">
            Sign in once to claim offline QR passes, receive automatic event photos in your Vault,
            and keep every campus plan on one calendar.
          </p>

          <dl className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {[
              { Icon: QrCode, title: "Offline QR passes", desc: "Works at the gate even without mobile signal." },
              { Icon: ScanFace, title: "Automatic Photo Vault", desc: "One on-device selfie gathers every photo of you." },
              { Icon: ShieldCheck, title: "Zero platform fees", desc: "Direct UPI to campus clubs, no gateway markup." },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 py-4">
                <Icon className="mt-0.5 size-4 shrink-0 text-lavender" aria-hidden />
                <div>
                  <dt className="text-[14.5px] font-semibold text-cream">{title}</dt>
                  <dd className="mt-0.5 text-[13.5px] text-cream/55">{desc}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <p className="relative z-10 text-[13px] text-cream/45">
          EvntCult · Synchronous Labs
        </p>
      </aside>

      {/* Right half: Warm cream paper sign-in form */}
      <section className="flex flex-col justify-between bg-canvas px-gutter py-6 lg:px-14 lg:py-12">
        <div className="flex items-center justify-between lg:hidden">
          <Link href="/dashboard" aria-label="EvntCult home">
            <BrandLogo className="text-[21px]" />
          </Link>
          <Link href="/dashboard" className="text-[13.5px] font-medium text-ink-muted hover:text-ink">
            Browse
          </Link>
        </div>

        <div className="mx-auto my-auto w-full max-w-[440px] py-10">
          <h2 className="font-display text-[42px] leading-[0.96] tracking-[-0.03em] text-ink">
            {signup ? (
              <>
                Get your <em>pass.</em>
              </>
            ) : (
              <>
                Welcome <em>back.</em>
              </>
            )}
          </h2>
          <p className="mt-2.5 text-[15px] text-ink-muted">
            {signup
              ? "Create your account in seconds. No passwords to remember."
              : "Sign in with your email to access your passes and Photo Vault."}
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
            <Link href="/dashboard" className="text-[13.5px] font-medium text-ink-muted hover:text-ink">
              Continue as guest
            </Link>
          </div>
        </div>

        <p className="text-center text-[12.5px] text-ink-subtle lg:text-left">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-ink">
            Terms &amp; User Rules
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
