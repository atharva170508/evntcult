import { Label } from "@/registry/default/ui/label";
import { Slider } from "@/registry/default/ui/slider";

export default function Component() {
  return (
    <div className="*:not-first:mt-4">
      <Label>Slider with square thumb</Label>
      <Slider
        aria-label="Slider with square thumb"
        className="[&>:last-child>span]:rounded"
        defaultValue={[25]}
        max={100}
        step={10}
      />
    </div>
  );
}
