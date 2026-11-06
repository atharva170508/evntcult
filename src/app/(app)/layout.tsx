import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { getViewer } from "@/lib/rbac";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  return (
    <AppShell viewer={{ name: viewer.name, email: viewer.email, image: viewer.image, isOrganizer: viewer.verifiedOrganizer }}>
      {children}
    </AppShell>
  );
}
