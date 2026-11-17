import { AppShell } from "@/components/shell/AppShell";
import { getViewer } from "@/lib/rbac";
import { requireTermsAccepted } from "@/lib/terms-gate";

/** App pages: the homepage works signed-out; everything else is behind the login (middleware). */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  await requireTermsAccepted(viewer);
  return (
    <AppShell
      viewer={viewer ? { name: viewer.name, email: viewer.email, image: viewer.image, isOrganizer: viewer.verifiedOrganizer, isAdmin: viewer.role === "admin" } : null}
    >
      {children}
    </AppShell>
  );
}
