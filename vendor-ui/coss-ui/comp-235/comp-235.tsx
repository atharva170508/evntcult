import { Label } from "@/registry/default/ui/label";
import MultipleSelector, {
  type Option,
} from "@/registry/default/ui/multiselect";

const frameworks: Option[] = [
  {
    label: "Next.js",
    value: "next.js",
  },
  {
    label: "SvelteKit",
    value: "sveltekit",
  },
  {
    label: "Nuxt.js",
    value: "nuxt.js",
  },
  {
    label: "Remix",
    value: "remix",
  },
  {
    label: "Astro",
    value: "astro",
  },
  {
    label: "Angular",
    value: "angular",
  },
  {
    label: "Vue.js",
    value: "vue",
  },
  {
    label: "React",
    value: "react",
  },
  {
    label: "Ember.js",
    value: "ember",
  },
  {
    label: "Gatsby",
    value: "gatsby",
  },
  {
    label: "Eleventy",
    value: "eleventy",
  },
  {
    label: "SolidJS",
    value: "solid",
  },
  {
    label: "Preact",
    value: "preact",
  },
  {
    label: "Qwik",
    value: "qwik",
  },
  {
    label: "Alpine.js",
    value: "alpine",
  },
  {
    label: "Lit",
    value: "lit",
  },
];

export default function Component() {
  return (
    <div className="*:not-first:mt-2">
      <Label>Multiselect with placeholder and clear</Label>
      <MultipleSelector
        commandProps={{
          label: "Select frameworks",
        }}
        defaultOptions={frameworks}
        emptyIndicator={<p className="text-center text-sm">No results found</p>}
        placeholder="Select frameworks"
      />
      <p
        aria-live="polite"
        className="mt-2 text-muted-foreground text-xs"
        role="region"
      >
        Inspired by{" "}
        <a
          className="underline hover:text-foreground"
          href="https://shadcnui-expansions.typeart.cc/docs/multiple-selector"
          rel="noreferrer noopener nofollow"
          target="_blank"
        >
          shadcn/ui expansions
        </a>
      </p>
    </div>
  );
}
