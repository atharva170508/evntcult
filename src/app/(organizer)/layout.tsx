import { Barlow_Semi_Condensed } from "next/font/google";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/rbac";
import { OrganizerNav } from "@/components/organizer-ui/OrganizerNav";
import "./organizer.css";

const barlow = Barlow_Semi_Condensed({ subsets: ["latin"], weight: ["600"], variable: "--font-barlow", display: "swap" });

/** The hosting side has its own quiet shell. Anyone logged in can host. */
export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  if (!(await getViewer())) redirect("/signin?next=/organizer");
  return (
    <div className={`o-root ${barlow.variable}`}>
      <OrganizerNav />
      <div className="o-main">{children}</div>
    </div>
  );
}
