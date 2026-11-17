import { AppShell } from "@/components/shell/AppShell";
import { getViewer } from "@/lib/rbac";
import "../(organizer)/organizer.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  return (
    <AppShell
      wide
      viewer={viewer ? { name: viewer.name, email: viewer.email, image: viewer.image, isOrganizer: viewer.verifiedOrganizer, isAdmin: viewer.role === "admin" } : null}
    >
      <div className="o-root">{children}</div>
    </AppShell>
  );
}
