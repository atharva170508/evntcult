import { LogoWordmark } from "./MissingE";

/** Giant footer sign-off: the logo itself, brushed-metal letters with the lime caret. */
export function Wordmark() {
  return (
    <div className="flex select-none justify-center">
      <LogoWordmark motion="type" className="text-metal text-[clamp(64px,17vw,250px)]" />
    </div>
  );
}
