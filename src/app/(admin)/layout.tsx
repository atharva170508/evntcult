import "../(organizer)/organizer.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="o-root">
      <main id="main" tabIndex={-1} className="o-main">
        {children}
      </main>
    </div>
  );
}
