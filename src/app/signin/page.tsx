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
    <main id="main" tabIndex={-1} className="grid min-h-dvh lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-line bg-surface p-12 lg:flex">
        <LogoWordmark className="text-heading text-ink" />
        <div className="max-w-md">
          <h2 className="font-display text-display">Every other tool tracks who said they&apos;d come. This one tracks who walked in.</h2>
          <ol className="mt-8 border-t border-line font-mono text-body-sm">
            {["Register", "Get your pass", "Get scanned at the gate", "Get your certificate"].map((s, i) => (
              <li key={s} className="flex gap-4 border-b border-line py-3">
                <span className="text-ink-subtle">0{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="grid place-items-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-[400px]">
          <LogoWordmark className="text-heading text-ink lg:hidden" />
          <h1 className="title-xl mt-8 lg:mt-0">{signup ? "Create your account" : "Log in"}</h1>
          <SignInForm next={next} signup={signup} codeLogin={codeLoginOn()} />
          <p className="mt-6 text-body text-ink-muted">
            {signup ? "Already have an account? " : "New here? "}
            <Link href={`/signin?${signup ? "" : "mode=signup&"}next=${encodeURIComponent(next)}`} className="font-semibold text-ink underline underline-offset-4">
              {signup ? "Log in" : "Sign up"}
            </Link>
          </p>
          <p className="mt-2 text-body text-ink-muted">
            <Link href="/dashboard" className="underline underline-offset-4 hover:text-ink">
              Look around first
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
