import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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

  return (
    <main id="main" className="flex min-h-dvh flex-col px-gutter py-5">
      <Link href="/dashboard" aria-label="EvntCult home" className="w-fit">
        <LogoWordmark className="text-[24px]" />
      </Link>
      <div className="flex flex-1 items-start justify-center py-8 sm:items-center">
        <div className="w-full max-w-[568px] overflow-hidden rounded-2xl border border-line-strong bg-white shadow-[0_8px_28px_rgba(0,0,0,0.08)]">
          <p className="border-b border-line px-6 py-4 text-center text-[16px] font-semibold text-ink">{signup ? "Sign up" : "Log in or sign up"}</p>
          <div className="px-6 pb-8 pt-6 sm:px-8">
            <h1 className="font-display text-[34px] leading-tight tracking-[-0.02em] text-ink">
              {signup ? (
                <>
                  Get your <em>pass.</em>
                </>
              ) : (
                <>
                  Welcome <em>back.</em>
                </>
              )}
            </h1>
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
    </main>
  );
}
