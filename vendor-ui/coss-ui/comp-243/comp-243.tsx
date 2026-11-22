import { Label } from "@/registry/default/ui/label";
import { Slider } from "@/registry/default/ui/slider";

export default function Component() {
  return (
    <div className="*:not-first:mt-4">
      <Label>Slider with solid thumb</Label>
      <Slider
        aria-label="Slider with solid thumb"
        className="[&>:first-child>span]:opacity-70 [&>:last-child>span]:bg-primary"
        defaultValue={[25]}
      />
    </div>
  );
}
