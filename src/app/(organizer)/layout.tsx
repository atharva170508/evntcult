import { redirect } from "next/navigation";
import { getViewer } from "@/lib/rbac";
import { AppShell } from "@/components/shell/AppShell";
import "./organizer.css";

/** Hosting lives in the same frame as the rest of the app, in its own "Host" workspace. Anyone logged in can host. */
export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/organizer");
  return (
    <AppShell wide viewer={{ name: viewer.name, email: viewer.email, image: viewer.image, isOrganizer: viewer.verifiedOrganizer, isAdmin: viewer.role === "admin" }}>
      <div className="o-root">{children}</div>
    </AppShell>
  );
}
