import { redirect } from "next/navigation";
import { getViewer } from "@/lib/rbac";
import { OrganizerNav } from "@/components/organizer-ui/OrganizerNav";
import "./organizer.css";

/** The hosting side has its own quiet shell. Approved organizers only; everyone else is sent to apply. */
export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/organizer");
  if (!viewer.verifiedOrganizer) redirect("/host");
  return (
    <div className="o-root">
      <OrganizerNav />
      <main id="main" tabIndex={-1} className="o-main">
        {children}
      </main>
    </div>
  );
}
