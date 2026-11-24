/** Re-mounted on every navigation: gentle 6px rise and fade. CSS only, stops under reduced motion. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
