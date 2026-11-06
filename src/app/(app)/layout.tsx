import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { DemoBar } from "@/components/shell/DemoBar";
import { getViewer } from "@/lib/rbac";
import { isDemoMode } from "@/lib/env";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  return (
    <AppShell
      viewer={{ name: viewer.name, email: viewer.email, image: viewer.image, isOrganizer: viewer.verifiedOrganizer }}
      demoBar={isDemoMode() ? <DemoBar persona={viewer.verifiedOrganizer ? "organizer" : "attendee"} /> : undefined}
    >
      {children}
    </AppShell>
  );
}
