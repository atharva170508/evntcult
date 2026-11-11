"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Log out from the profile page (on phones the top bar has no room for it). */
export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="secondary"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/auth/session", { method: "DELETE" });
        window.location.href = "/dashboard";
      }}
    >
      Log out
    </Button>
  );
}
