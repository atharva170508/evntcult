"use client";

import { ErrorState } from "@/components/states/ErrorState";

export default function OrganizerError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="o-page">
      <ErrorState reset={reset} home="/organizer" />
    </div>
  );
}
