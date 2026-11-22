"use client";

import EldoraUI from "@/registry/eldoraui/architecture-animation";

export default function ArchitectureAnimationDemo() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Default Props</h3>
        <div className="h-64 w-full rounded-lg border bg-background p-4">
          <EldoraUI />
        </div>
      </div>
    </div>
  );
}
