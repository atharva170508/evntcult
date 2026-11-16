import { LogoWordmark } from "./MissingE";

/** Oversized footer sign-off: the logo in ink fading into the paper. */
export function Wordmark() {
  return (
    <div className="flex select-none justify-center overflow-hidden">
      <LogoWordmark motion="type" className="text-metal text-[clamp(72px,19vw,280px)] leading-[0.85]" />
    </div>
  );
}
