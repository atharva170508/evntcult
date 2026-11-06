import { AppShell } from "@/components/shell/AppShell";
import { getViewer } from "@/lib/rbac";

/** App pages are browsable signed-out; personal pages check for a viewer themselves. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  return (
    <AppShell viewer={viewer ? { name: viewer.name, email: viewer.email, image: viewer.image, isOrganizer: viewer.verifiedOrganizer } : null}>
      {children}
    </AppShell>
  );
}
