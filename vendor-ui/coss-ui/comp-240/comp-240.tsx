import { Label } from "@/registry/default/ui/label";
import { Slider } from "@/registry/default/ui/slider";

export default function Component() {
  return (
    <div className="*:not-first:mt-4">
      <Label>Simple slider</Label>
      <Slider aria-label="Simple slider" defaultValue={[25]} />
    </div>
  );
}
