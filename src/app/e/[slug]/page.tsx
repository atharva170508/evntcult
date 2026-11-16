import { redirect } from "next/navigation";

/** Short share link: /e/<slug> → the event page. */
export default async function ShortEventLink({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/events/${encodeURIComponent(slug)}`);
}
