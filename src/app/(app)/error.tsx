"use client";

import { ErrorState } from "@/components/states/ErrorState";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="pt-8">
      <ErrorState reset={reset} home="/dashboard" />
    </div>
  );
}
