import { ArrowRightIcon, MailIcon } from "lucide-react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    <Button className="group" variant="secondary">
      <MailIcon aria-hidden="true" className="-ms-1 opacity-60" size={16} />
      Email
      <ArrowRightIcon
        aria-hidden="true"
        className="-me-1 opacity-60 transition-transform group-hover:translate-x-0.5"
        size={16}
      />
    </Button>
  );
}
