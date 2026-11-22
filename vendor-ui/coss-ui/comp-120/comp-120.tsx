import {
  RiFacebookFill,
  RiGithubFill,
  RiGoogleFill,
  RiTwitterXFill,
} from "@remixicon/react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        aria-label="Login with Google"
        className="flex-1"
        size="icon"
        variant="outline"
      >
        <RiGoogleFill
          aria-hidden="true"
          className="text-[#DB4437] dark:text-primary"
          size={16}
        />
      </Button>
      <Button
        aria-label="Login with Facebook"
        className="flex-1"
        size="icon"
        variant="outline"
      >
        <RiFacebookFill
          aria-hidden="true"
          className="text-[#1877f2] dark:text-primary"
          size={16}
        />
      </Button>
      <Button
        aria-label="Login with X"
        className="flex-1"
        size="icon"
        variant="outline"
      >
        <RiTwitterXFill
          aria-hidden="true"
          className="text-[#14171a] dark:text-primary"
          size={16}
        />
      </Button>
      <Button
        aria-label="Login with GitHub"
        className="flex-1"
        size="icon"
        variant="outline"
      >
        <RiGithubFill
          aria-hidden="true"
          className="text-black dark:text-primary"
          size={16}
        />
      </Button>
    </div>
  );
}
