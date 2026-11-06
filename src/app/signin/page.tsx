import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarCheck2, QrCode, Users } from "lucide-react";
import { auth, signIn } from "@/auth";
import { isDemoMode } from "@/lib/env";
import { EventArt } from "@/components/ui/EventArt";
import { Logo } from "@/components/shell/Logo";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  if (isDemoMode()) redirect("/dashboard");
  const session = await auth();
  const { callbackUrl, error } = await searchParams;
  const next = callbackUrl?.startsWith("/") ? callbackUrl : "/dashboard";
  if (session?.user) redirect(next);

  const emailEnabled = !!process.env.AUTH_RESEND_KEY;

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Poster side */}
      <div className="relative isolate hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <EventArt accent="violet" />
        <div className="relative flex items-center gap-2.5">
          <Logo />
          <span className="text-[20px] font-extrabold tracking-tighter">EvntCult</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-[48px] font-extrabold leading-[1.02] tracking-tightest">Every campus event, one place.</h2>
          <ul className="mt-8 space-y-3 text-[16px] font-semibold text-white/90">
            <li className="flex items-center gap-3">
              <CalendarCheck2 className="size-5" /> Discover fests, games, talks and parties
            </li>
            <li className="flex items-center gap-3">
              <QrCode className="size-5" /> One QR pass for entry
            </li>
            <li className="flex items-center gap-3">
              <Users className="size-5" /> See who&apos;s going and get live updates
            </li>
          </ul>
        </div>
      </div>

      {/* Form side */}
      <div className="grid place-items-center px-5 py-12">
        <div className="w-full max-w-[400px] animate-fade-up">
          <div className="flex items-center gap-2.5 lg:hidden">
            <Logo />
            <span className="text-[20px] font-extrabold tracking-tighter">EvntCult</span>
          </div>
          <h1 className="headline mt-8 text-[34px] leading-tight tracking-tightest lg:mt-0">Welcome back 👋</h1>
          <p className="mt-2 text-[15px] text-ink-muted">Use your college account to see your events, passes and photos.</p>

          {error && (
            <p className="mt-5 rounded-2xl bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger">
              {error === "AccessDenied" ? "Please use your college email address." : "Sign-in failed. Try again."}
            </p>
          )}

          <form
            className="mt-7"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: next });
            }}
          >
            <button className="flex w-full items-center justify-center gap-2.5 rounded-full border border-line bg-surface py-3.5 text-[15px] font-semibold text-ink shadow-card transition-all duration-200 hover:border-ink active:scale-[0.98]">
              <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
                <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.2z" />
                <path fill="#34A853" d="M12 23c3 0 5.5-1 7.4-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.9A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V7H2a11 11 0 0 0 0 9.9L5.7 14z" />
                <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2 7l3.7 2.9C6.6 7.3 9.1 5.4 12 5.4z" />
              </svg>
              Continue with Google
            </button>
          </form>

          {emailEnabled && (
            <>
              <div className="my-6 flex items-center gap-3 text-[12px] font-semibold text-ink-subtle">
                <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
              </div>
              <form
                action={async (fd: FormData) => {
                  "use server";
                  await signIn("resend", { email: String(fd.get("email") ?? ""), redirectTo: next });
                }}
                className="space-y-3"
              >
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@college.edu"
                  className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-[15px] placeholder:text-ink-subtle focus:border-brand focus:outline-none"
                />
                <button className="w-full rounded-full bg-ink py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-black">
                  Email me a sign-in link
                </button>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-[12.5px] text-ink-subtle">
            Hosting events? Sign in, then apply for organizer access from your profile. A developer verifies every organizer.
          </p>
        </div>
      </div>
    </main>
  );
}
