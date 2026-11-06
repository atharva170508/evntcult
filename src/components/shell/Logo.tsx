/** EvntCult mark: a ticket with a cut-out, in brand violet. */
export function Logo({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden>
      <rect width="36" height="36" rx="11" fill="#1c1c22" />
      <path
        d="M9 12.5a2.5 2.5 0 0 1 2.5-2.5h13a2.5 2.5 0 0 1 2.5 2.5v2.2a3.3 3.3 0 0 0 0 6.6v2.2a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 9 23.5v-2.2a3.3 3.3 0 0 0 0-6.6z"
        fill="#d4ff3a"
      />
      <path d="M15 14.5h6M15 18h4M15 21.5h6" stroke="#0b0c10" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
