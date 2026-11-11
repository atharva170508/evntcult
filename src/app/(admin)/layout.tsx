import "../(organizer)/organizer.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="o-root">
      <div className="o-main">{children}</div>
    </div>
  );
}
