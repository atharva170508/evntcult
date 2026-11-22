import { Label } from "@/registry/default/ui/label";
import { Slider } from "@/registry/default/ui/slider";

export default function Component() {
  return (
    <div className="space-y-4">
      <legend className="font-medium text-foreground text-sm">Equalizer</legend>
      <div className="flex h-48 justify-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <Slider
            aria-label="60 Hz"
            className="[&>:last-child>span]:h-6 [&>:last-child>span]:w-4 [&>:last-child>span]:rounded"
            defaultValue={[2]}
            max={5}
            min={-5}
            orientation="vertical"
            showTooltip
          />
          <Label className="flex w-0 justify-center text-muted-foreground text-xs">
            60
          </Label>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Slider
            aria-label="250 Hz"
            className="[&>:last-child>span]:h-6 [&>:last-child>span]:w-4 [&>:last-child>span]:rounded"
            defaultValue={[1]}
            max={5}
            min={-5}
            orientation="vertical"
            showTooltip
          />
          <Label className="flex w-0 justify-center text-muted-foreground text-xs">
            250
          </Label>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Slider
            aria-label="1k"
            className="[&>:last-child>span]:h-6 [&>:last-child>span]:w-4 [&>:last-child>span]:rounded"
            defaultValue={[-1]}
            max={5}
            min={-5}
            orientation="vertical"
            showTooltip
          />
          <Label className="flex w-0 justify-center text-muted-foreground text-xs">
            1k
          </Label>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Slider
            aria-label="4k"
            className="[&>:last-child>span]:h-6 [&>:last-child>span]:w-4 [&>:last-child>span]:rounded"
            defaultValue={[-3]}
            max={5}
            min={-5}
            orientation="vertical"
            showTooltip
          />
          <Label className="flex w-0 justify-center text-muted-foreground text-xs">
            4k
          </Label>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Slider
            aria-label="16k"
            className="[&>:last-child>span]:h-6 [&>:last-child>span]:w-4 [&>:last-child>span]:rounded"
            defaultValue={[2]}
            max={5}
            min={-5}
            orientation="vertical"
            showTooltip
          />
          <Label className="flex w-0 justify-center text-muted-foreground text-xs">
            16K
          </Label>
        </div>
      </div>
    </div>
  );
}
