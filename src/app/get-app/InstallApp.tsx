"use client";

import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const stepCls = "rounded-md border border-line bg-surface px-4 py-3 text-body";

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return <p className={stepCls}>EvntCult is installed on this device.</p>;

  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <section aria-labelledby="android">
        <h2 id="android" className="text-title font-semibold">Android</h2>
        {prompt && (
          <button
            onClick={async () => {
              await prompt.prompt();
              setPrompt(null);
            }}
            className="press inline-flex items-center justify-center mt-3 w-full rounded-md bg-accent h-12 text-body font-semibold text-ink-inverse hover:bg-[color-mix(in_srgb,var(--accent)_90%,var(--text))]"
          >
            Install EvntCult
          </button>
        )}
        <ol className="mt-3 space-y-2">
          <li className={stepCls}>1. Open this page in Chrome</li>
          <li className={stepCls}>2. Tap the ⋮ menu</li>
          <li className={stepCls}>3. Tap Install app or Add to Home screen</li>
        </ol>
      </section>
      <section aria-labelledby="ios">
        <h2 id="ios" className="text-title font-semibold">iPhone and iPad</h2>
        <ol className="mt-3 space-y-2">
          <li className={stepCls}>1. Open this page in Safari</li>
          <li className={stepCls}>2. Tap the Share button</li>
          <li className={stepCls}>3. Tap Add to Home Screen</li>
        </ol>
      </section>
    </div>
  );
}
