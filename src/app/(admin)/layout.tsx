import { Barlow_Semi_Condensed } from "next/font/google";
import "../(organizer)/organizer.css";

const barlow = Barlow_Semi_Condensed({ subsets: ["latin"], weight: ["600"], variable: "--font-barlow", display: "swap" });

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`o-root ${barlow.variable}`}>
      <div className="o-main">{children}</div>
    </div>
  );
}
