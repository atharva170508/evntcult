import { redirect } from "next/navigation";
import { getViewer } from "@/lib/rbac";
import { OrganizerNav } from "@/components/organizer-ui/OrganizerNav";
import "./organizer.css";

/** The hosting side has its own quiet shell. Anyone logged in can host. */
export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  if (!(await getViewer())) redirect("/signin?next=/organizer");
  return (
    <div className="o-root">
      <OrganizerNav />
      <main id="main" tabIndex={-1} className="o-main">
        {children}
      </main>
    </div>
  );
}
