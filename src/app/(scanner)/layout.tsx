/** Full-screen layout for the gate scanner: no sidebar or tab bar, so the camera gets the whole phone.
 *  Deliberately dark (ink #0C0C0B): it's used at night, at arm's length, next to bright verdict fills. */
export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#0C0C0B] text-white [color-scheme:dark]">{children}</div>;
}
