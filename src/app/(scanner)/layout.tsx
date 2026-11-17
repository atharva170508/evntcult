import { getViewer } from "@/lib/rbac";
import { requireTermsAccepted } from "@/lib/terms-gate";

/** Full-screen layout for the gate scanner: no sidebar or tab bar, so the camera gets the whole phone.
 *  Deliberately dark (ink #0C0C0B): it's used at night, at arm's length, next to bright verdict fills. */
export default async function ScannerLayout({ children }: { children: React.ReactNode }) {
  await requireTermsAccepted(await getViewer());
  return <div className="min-h-dvh bg-[#0C0C0B] text-white [color-scheme:dark]">{children}</div>;
}
