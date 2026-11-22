import { useId } from "react";

import { Label } from "@/registry/default/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select";

const countries = [
  {
    continent: "America",
    items: [
      { flag: "🇺🇸", label: "United States", value: "1" },
      { flag: "🇨🇦", label: "Canada", value: "2" },
      { flag: "🇲🇽", label: "Mexico", value: "3" },
    ],
  },
  {
    continent: "Africa",
    items: [
      { flag: "🇿🇦", label: "South Africa", value: "4" },
      { flag: "🇳🇬", label: "Nigeria", value: "5" },
      { flag: "🇲🇦", label: "Morocco", value: "6" },
    ],
  },
  {
    continent: "Asia",
    items: [
      { flag: "🇨🇳", label: "China", value: "7" },
      { flag: "🇯🇵", label: "Japan", value: "8" },
      { flag: "🇮🇳", label: "India", value: "9" },
    ],
  },
  {
    continent: "Europe",
    items: [
      { flag: "🇬🇧", label: "United Kingdom", value: "10" },
      { flag: "🇫🇷", label: "France", value: "11" },
      { flag: "🇩🇪", label: "Germany", value: "12" },
    ],
  },
  {
    continent: "Oceania",
    items: [
      { flag: "🇦🇺", label: "Australia", value: "13" },
      { flag: "🇳🇿", label: "New Zealand", value: "14" },
    ],
  },
];

export default function Component() {
  const id = useId();
  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>Options with flag</Label>
      <Select defaultValue="2">
        <SelectTrigger
          className="[&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0 [&>span_svg]:text-muted-foreground/80"
          id={id}
        >
          <SelectValue placeholder="Select framework" />
        </SelectTrigger>
        <SelectContent className="[&_*[role=option]>span>svg]:shrink-0 [&_*[role=option]>span>svg]:text-muted-foreground/80 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8">
          {countries.map((continent) => (
            <SelectGroup key={continent.continent}>
              <SelectLabel className="ps-2">{continent.continent}</SelectLabel>
              {continent.items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  <span className="text-lg leading-none">{item.flag}</span>{" "}
                  <span className="truncate">{item.label}</span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
