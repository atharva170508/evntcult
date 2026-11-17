import { redirect } from "next/navigation";
import { getViewer } from "@/lib/rbac";
import { requireTermsAccepted } from "@/lib/terms-gate";
import { AppShell } from "@/components/shell/AppShell";
import "./organizer.css";

/** Hosting lives in the same frame as the rest of the app, in its own "Host" workspace. Only approved organizers get in; everyone else is sent to apply. */
export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/organizer");
  await requireTermsAccepted(viewer);
  if (!viewer.verifiedOrganizer) redirect("/host");
  return (
    <AppShell wide viewer={{ name: viewer.name, email: viewer.email, image: viewer.image, isOrganizer: viewer.verifiedOrganizer, isAdmin: viewer.role === "admin" }}>
      <div className="o-root">{children}</div>
    </AppShell>
  );
}
