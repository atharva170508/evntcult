export default function Component() {
  return (
    <div className="flex items-center rounded-full border bg-background p-1 shadow-sm">
      <div className="-space-x-1.5 flex">
        <img
          alt="Avatar 01"
          className="rounded-full ring-1 ring-background"
          height={20}
          src="/origin/avatar-80-03.jpg"
          width={20}
        />
        <img
          alt="Avatar 02"
          className="rounded-full ring-1 ring-background"
          height={20}
          src="/origin/avatar-80-04.jpg"
          width={20}
        />
        <img
          alt="Avatar 03"
          className="rounded-full ring-1 ring-background"
          height={20}
          src="/origin/avatar-80-05.jpg"
          width={20}
        />
        <img
          alt="Avatar 04"
          className="rounded-full ring-1 ring-background"
          height={20}
          src="/origin/avatar-80-06.jpg"
          width={20}
        />
      </div>
      <p className="px-2 text-muted-foreground text-xs">
        Trusted by <strong className="font-medium text-foreground">60K+</strong>{" "}
        developers.
      </p>
    </div>
  );
}
