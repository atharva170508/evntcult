import { ArrowRightIcon } from "lucide-react";

export default function Component() {
  return (
    <div className="dark bg-muted px-4 py-3 text-foreground">
      <p className="flex justify-center text-sm">
        <a className="group" href="#">
          <span className="me-1 text-base leading-none">✨</span>
          Introducing transactional and marketing emails
          <ArrowRightIcon
            aria-hidden="true"
            className="-mt-0.5 ms-2 inline-flex opacity-60 transition-transform group-hover:translate-x-0.5"
            size={16}
          />
        </a>
      </p>
    </div>
  );
}
