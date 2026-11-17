"use client";

import { useEffect, useState } from "react";
import { Apple, CheckCircle2, Download, Smartphone } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };


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

  if (installed) {
    return (
      <p role="status" className="flex items-center gap-2.5 rounded-card bg-live-soft px-5 py-4 text-[15px] font-medium text-live">
        <CheckCircle2 className="size-5" aria-hidden /> EvntCult is installed on this device.
      </p>
    );
  }

  const Steps = ({ items }: { items: string[] }) => (
    <ol className="card mt-4 divide-y divide-line/70">
      {items.map((t, i) => (
        <li key={t} className="flex items-center gap-4 px-5 py-4 text-[15px]">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sunken font-mono text-[12px] text-ink-2">{i + 1}</span>
          {t}
        </li>
      ))}
    </ol>
  );

  return (
    <div className="grid gap-10 sm:grid-cols-2">
      <section aria-labelledby="android">
        <h2 id="android" className="flex items-center gap-2 text-h3 font-semibold">
          <Smartphone className="size-5 text-ink-subtle" aria-hidden /> Android
        </h2>
        {prompt && (
          <button
            onClick={async () => {
              await prompt.prompt();
              setPrompt(null);
            }}
            className={buttonClass("accent", "lg", "mt-4 w-full")}
          >
            <Download className="size-4" aria-hidden /> Install EvntCult
          </button>
        )}
        <Steps items={["Open this page in Chrome", "Tap the ⋮ menu", "Tap Install app or Add to Home screen"]} />
      </section>
      <section aria-labelledby="ios">
        <h2 id="ios" className="flex items-center gap-2 text-h3 font-semibold">
          <Apple className="size-5 text-ink-subtle" aria-hidden /> iPhone and iPad
        </h2>
        <Steps items={["Open this page in Safari", "Tap the Share button", "Tap Add to Home Screen"]} />
      </section>
    </div>
  );
}
