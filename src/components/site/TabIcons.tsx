/** Small illustrated icons for the header tabs. Flat colour with one shade each. */

export function EventsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M6 27 14.5 10.5 21.5 17.5Z" fill="#F4B740" />
      <path d="M6 27 10.4 18.5 15 23.2Z" fill="#E09A1F" />
      <path d="M14.5 10.5 21.5 17.5" stroke="#C97F10" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="22" cy="7" r="1.8" fill="#E3264F" />
      <circle cx="26.5" cy="12.5" r="1.5" fill="#3A7BF0" />
      <circle cx="17.5" cy="5" r="1.3" fill="#2DB37A" />
      <path d="M24 17.5c1.6-.4 3 .2 3.6 1.4" stroke="#E3264F" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M12 6.5c.2 1.6-.4 2.8-1.6 3.4" stroke="#3A7BF0" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="5" y="7" width="22" height="20" rx="4" fill="#fff" stroke="#D7D7D7" strokeWidth="1.2" />
      <path d="M5 11a4 4 0 0 1 4-4h14a4 4 0 0 1 4 4v2H5Z" fill="#E3264F" />
      <rect x="10" y="4.5" width="2.4" height="5" rx="1.2" fill="#9B1636" />
      <rect x="19.6" y="4.5" width="2.4" height="5" rx="1.2" fill="#9B1636" />
      <text x="16" y="24" textAnchor="middle" fontSize="9" fontWeight="700" fill="#222" fontFamily="system-ui, sans-serif">17</text>
    </svg>
  );
}

export function PassIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <g transform="rotate(-12 16 16)">
        <path d="M7 9h18a3 3 0 0 1 3 3v1.6a2.4 2.4 0 0 0 0 4.8V20a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1.6a2.4 2.4 0 0 0 0-4.8V12a3 3 0 0 1 3-3Z" fill="#E3264F" />
        <path d="M7 9h18a3 3 0 0 1 3 3v1H4v-1a3 3 0 0 1 3-3Z" fill="#F45A7B" />
        <path d="M21 10.5v11" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="0.1 2.6" />
        <rect x="8" y="15" width="8" height="1.8" rx=".9" fill="#fff" opacity=".9" />
        <rect x="8" y="18.4" width="5" height="1.8" rx=".9" fill="#fff" opacity=".6" />
      </g>
    </svg>
  );
}

export function PhotosIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <g transform="rotate(7 16 16)">
        <rect x="6" y="5" width="20" height="23" rx="2.5" fill="#fff" stroke="#D7D7D7" strokeWidth="1.2" />
        <rect x="8.5" y="7.5" width="15" height="13" rx="1.2" fill="#5AA7F5" />
        <circle cx="19.5" cy="11.5" r="2.2" fill="#FFD66B" />
        <path d="M8.5 20.5 13.5 14l3.6 4.3 2.2-2.4 4.2 4.6Z" fill="#2E8B57" />
      </g>
    </svg>
  );
}

export function HostIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M6 13 16 6l10 7v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1Z" fill="#F4B740" />
      <path d="M4.5 13.6 16 5.5l11.5 8.1" stroke="#C97F10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="13" y="18" width="6" height="9" rx="1" fill="#E3264F" />
      <rect x="9" y="15" width="3.5" height="3.5" rx=".6" fill="#fff" />
      <rect x="19.5" y="15" width="3.5" height="3.5" rx=".6" fill="#fff" />
    </svg>
  );
}

export function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M7 15 16 7.5l9 7.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 7 26Z" fill="#fff" stroke="#D7D7D7" strokeWidth="1.2" />
      <path d="M4.5 15.6 16 6l11.5 9.6" stroke="#E3264F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="13.2" y="18.5" width="5.6" height="9" rx="1.2" fill="#3A7BF0" />
      <circle cx="17.4" cy="23.2" r=".7" fill="#fff" />
      <rect x="21" y="7.5" width="2.6" height="5" rx=".6" fill="#9B1636" />
    </svg>
  );
}

export function CertificateIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <g transform="rotate(-6 16 16)">
        <rect x="4" y="6" width="24" height="17" rx="2" fill="#fff" stroke="#D7D7D7" strokeWidth="1.2" />
        <rect x="8" y="10" width="11" height="1.8" rx=".9" fill="#222" opacity=".8" />
        <rect x="8" y="13.6" width="8" height="1.6" rx=".8" fill="#222" opacity=".35" />
        <path d="m19.5 21 -1.6 6.2 3.1-1.6 3.1 1.6L22.5 21Z" fill="#E3264F" />
        <circle cx="21" cy="18.5" r="4.2" fill="#F4B740" />
        <circle cx="21" cy="18.5" r="2.4" fill="none" stroke="#C97F10" strokeWidth="1.2" />
      </g>
    </svg>
  );
}
