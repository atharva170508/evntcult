import { Label } from "@/registry/default/ui/label";
import { Slider } from "@/registry/default/ui/slider";

export default function Component() {
  return (
    <div className="*:not-first:mt-4">
      <Label>Slider with reference labels</Label>
      <div>
        <Slider
          aria-label="Slider with reference labels"
          defaultValue={[15]}
          max={35}
          min={5}
        />
        <span
          aria-hidden="true"
          className="mt-4 flex w-full items-center justify-between gap-1 font-medium text-muted-foreground text-xs"
        >
          <span>5 GB</span>
          <span>20 GB</span>
          <span>35 GB</span>
        </span>
      </div>
    </div>
  );
}
