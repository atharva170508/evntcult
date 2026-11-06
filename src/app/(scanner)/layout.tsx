/** Full-screen layout for the gate scanner: no sidebar or tab bar, so the camera gets the whole phone. */
export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#0b0b0f] text-white">{children}</div>;
}
